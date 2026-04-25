from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Any, AsyncIterator, Sequence

from pydantic_ai import Agent, RunContext
from pydantic_ai.messages import (
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    ModelMessage,
)

try:
    from pydantic_ai.messages import PartStartEvent as _PartStartEvent
    from pydantic_ai.messages import TextPart as _TextPart
    from pydantic_ai.messages import TextPartDelta as _TextPartDelta
except ImportError:  # pragma: no cover — older pydantic-ai layout
    _PartStartEvent = None  # type: ignore[assignment]
    _TextPart = None  # type: ignore[assignment]
    _TextPartDelta = None  # type: ignore[assignment]

from aqi_agent.config import (
    DEFAULT_SYSTEM_PROMPT,
    get_aqicn_token,
    get_model,
    get_tavily_key,
)
from aqi_agent.db import Database, Pollutant
from aqi_agent.events import (
    Iteration,
    RunCompleted,
    RunStarted,
    Table,
    TextDelta,
    ToolEnd,
    ToolStart,
)
from aqi_agent.observability import setup_observability
from aqi_agent.tables import TableStore
from aqi_agent.tools import aqicn, web_search as ws


@dataclass
class AQIDeps:
    db: Database
    tables: TableStore


def _preview(
    tables: TableStore, prefix: str, rows: list[dict], preview_n: int = 5
) -> dict:
    name = tables.add(prefix, rows)
    return {
        "table": name,
        "preview_rows": rows[:preview_n],
        "total_rows": len(rows),
        "columns": list(rows[0].keys()) if rows else [],
    }


class AQIAgent:
    """Importable AQI analyst agent.

    Stream events with `async for ev in agent.stream(prompt)`, or use the
    convenience wrappers `chat()` (multi-turn) / `run()` (one-shot). Full
    fetched rows live on the agent in `agent.tables`; the LLM only sees a
    short preview from each fetch tool and references full tables in its
    output via `[[TABLE:<name>]]` tokens.
    """

    def __init__(
        self,
        model: str | None = None,
        system_prompt: str | None = None,
        mcp_servers: Sequence[Any] | None = None,
        db: Database | None = None,
    ) -> None:
        self._db = db or Database()
        self._tables = TableStore()
        self._last_history: list[ModelMessage] = []
        observability_on = setup_observability()
        self._agent = Agent[AQIDeps, str](
            model or get_model(),
            deps_type=AQIDeps,
            output_type=str,
            system_prompt=system_prompt or DEFAULT_SYSTEM_PROMPT,
            mcp_servers=list(mcp_servers) if mcp_servers else [],
            instrument=observability_on,
        )
        self._register_tools()

    @property
    def tables(self) -> dict[str, list[dict]]:
        """Snapshot of the table store. Rows are not deep-copied."""
        return self._tables.as_dict()

    @property
    def last_history(self) -> list[ModelMessage]:
        """Pydantic-ai message history captured at the end of the most recent run.

        Empty until the first stream() / chat() / run() completes.
        """
        return self._last_history

    def _register_tools(self) -> None:
        agent = self._agent

        @agent.tool
        async def get_historical_data(
            ctx: RunContext[AQIDeps],
            pollutant: Pollutant,
            sites: list[str],
            start: datetime,
            end: datetime,
            limit: int = 1000,
        ) -> dict:
            """Raw PM2.5 or PM10 readings for the given sites and time window.

            Returns a preview only ({table, preview_rows, total_rows, columns}).
            Embed the full table in your answer with `[[TABLE:<table>]]`.

            Args:
                pollutant: 'pm25' or 'pm10'.
                sites: list of deviceid values to fetch.
                start: inclusive lower bound on dt_time (ISO 8601).
                end: inclusive upper bound on dt_time (ISO 8601).
                limit: max rows fetched (default 1000). Reduce if total_rows
                    is at the limit and you suspect there's more relevant data.
            """
            rows = await ctx.deps.db.get_historical_data(
                pollutant, sites, start, end, limit
            )
            return _preview(ctx.deps.tables, f"historical_{pollutant}", rows)

        @agent.tool
        async def get_average(
            ctx: RunContext[AQIDeps],
            pollutant: Pollutant,
            sites: list[str],
            start: datetime,
            end: datetime,
        ) -> dict:
            """Mean PM2.5 or PM10 per site over a window. Preview-only return."""
            rows = await ctx.deps.db.get_average(pollutant, sites, start, end)
            return _preview(ctx.deps.tables, f"avg_{pollutant}", rows)

        @agent.tool
        async def get_rolling_average(
            ctx: RunContext[AQIDeps],
            pollutant: Pollutant,
            sites: list[str],
            start: datetime,
            end: datetime,
            bucket: str = "day",
            window_size: int = 7,
        ) -> dict:
            """Bucketed series with a trailing moving average over `window_size` buckets.

            Args:
                bucket: 'hour' | 'day' | 'week' | 'month'.
                window_size: number of buckets in the trailing window (default 7).
            """
            rows = await ctx.deps.db.get_rolling_average(
                pollutant, sites, start, end, bucket, window_size
            )
            return _preview(ctx.deps.tables, f"rolling_{pollutant}", rows)

        @agent.tool
        async def get_percentiles(
            ctx: RunContext[AQIDeps],
            pollutant: Pollutant,
            sites: list[str],
            start: datetime,
            end: datetime,
        ) -> dict:
            """p50/p95/p99 of the pollutant per site over a window. Preview-only return."""
            rows = await ctx.deps.db.get_percentiles(pollutant, sites, start, end)
            return _preview(ctx.deps.tables, f"percentiles_{pollutant}", rows)

        if get_aqicn_token():

            @agent.tool_plain
            async def aqicn_current_by_city(city: str) -> dict:
                """Live AQI for a city or named station from AQICN."""
                return await aqicn.aqicn_current_by_city(city)

            @agent.tool_plain
            async def aqicn_current_by_geo(lat: float, lon: float) -> dict:
                """Live AQI nearest to a lat/lon from AQICN."""
                return await aqicn.aqicn_current_by_geo(lat, lon)

            @agent.tool_plain
            async def aqicn_search_station(keyword: str) -> list[dict]:
                """Search AQICN stations by keyword."""
                return await aqicn.aqicn_search_station(keyword)

        if get_tavily_key():

            @agent.tool_plain
            async def web_search(query: str, max_results: int = 5) -> list[dict]:
                """General web search via Tavily."""
                return await ws.web_search(query, max_results)

    @staticmethod
    def _truncate(s: str, n: int = 300) -> str:
        return s if len(s) <= n else s[:n] + f"... [+{len(s) - n} chars]"

    @staticmethod
    def _extract_text_delta(event: Any) -> str | None:
        # Forward visible-text only. Two pydantic-ai event shapes carry text:
        # PartStartEvent.part = TextPart(content=...) for the first chunk of a
        # new text part, and PartDeltaEvent.delta = TextPartDelta(content_delta=...)
        # for subsequent chunks. PartEndEvent also has a `.part` with the full
        # assembled content — must NOT forward that or the text doubles. Same
        # for ThinkingPart events: filtered out so reasoning-model chain-of-
        # thought doesn't leak to the frontend.
        if _PartStartEvent is not None and isinstance(event, _PartStartEvent):
            part = event.part
            if _TextPart is not None and not isinstance(part, _TextPart):
                return None
            content = getattr(part, "content", None)
            if isinstance(content, str) and content:
                return content
            return None
        delta = getattr(event, "delta", None)
        if delta is not None:
            if _TextPartDelta is not None and not isinstance(delta, _TextPartDelta):
                return None
            content_delta = getattr(delta, "content_delta", None)
            if isinstance(content_delta, str) and content_delta:
                return content_delta
        return None

    async def stream(
        self,
        prompt: str,
        message_history: list[ModelMessage] | None = None,
    ) -> AsyncIterator[Any]:
        """Yield events as the run progresses. See aqi_agent.events for the types."""
        yield RunStarted()
        async with self._agent.run_mcp_servers():
            async with self._agent.iter(
                prompt,
                deps=AQIDeps(db=self._db, tables=self._tables),
                message_history=message_history,
            ) as agent_run:
                iteration = 0
                async for node in agent_run:
                    iteration += 1
                    if Agent.is_user_prompt_node(node):
                        yield Iteration(n=iteration, kind="user_prompt")
                    elif Agent.is_model_request_node(node):
                        yield Iteration(n=iteration, kind="model_request")
                        async with node.stream(agent_run.ctx) as event_stream:
                            async for event in event_stream:
                                delta = self._extract_text_delta(event)
                                if delta:
                                    yield TextDelta(content=delta)
                    elif Agent.is_call_tools_node(node):
                        yield Iteration(n=iteration, kind="call_tools")
                        async with node.stream(agent_run.ctx) as event_stream:
                            async for event in event_stream:
                                if isinstance(event, FunctionToolCallEvent):
                                    yield ToolStart(
                                        iteration=iteration,
                                        name=event.part.tool_name,
                                        args=event.part.args,
                                    )
                                elif isinstance(event, FunctionToolResultEvent):
                                    tool_name = getattr(
                                        event, "tool_name", None
                                    ) or getattr(event.result, "tool_name", "?")
                                    content = event.result.content
                                    yield ToolEnd(
                                        iteration=iteration,
                                        name=tool_name,
                                        summary=self._truncate(repr(content), 200),
                                    )
                                    if isinstance(content, dict) and "table" in content:
                                        tname = content["table"]
                                        rows = self._tables.get(tname)
                                        if rows is not None:
                                            yield Table(
                                                name=tname,
                                                rows=rows,
                                                source_tool=tool_name,
                                                iteration=iteration,
                                                columns=content.get("columns") or [],
                                            )
                    elif Agent.is_end_node(node):
                        yield Iteration(n=iteration, kind="end")
                self._last_history = agent_run.result.all_messages()
                output = agent_run.result.output
        yield RunCompleted(output=output)

    async def chat(
        self,
        prompt: str,
        message_history: list[ModelMessage] | None = None,
    ) -> tuple[str, list[ModelMessage]]:
        """Drain stream() and return (output, full_message_history)."""
        output = ""
        async for ev in self.stream(prompt, message_history=message_history):
            if isinstance(ev, RunCompleted):
                output = ev.output
        return output, self._last_history

    async def run(self, prompt: str) -> str:
        output, _ = await self.chat(prompt)
        return output

    def run_sync(self, prompt: str) -> str:
        return asyncio.run(self.run(prompt))

    async def aclose(self) -> None:
        await self._db.close()
