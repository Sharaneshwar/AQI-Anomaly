from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, AsyncIterator, Awaitable, Callable, Sequence

import asyncpg
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
from aqi_agent.retry import call_with_retry
from aqi_agent.sites import (
    all_cities as _all_cities,
    find_neighbours as _find_neighbours,
    list_city_sites as _list_city_sites,
)
from aqi_agent.tables import TableStore
from aqi_agent.tools import aqicn, web_search as ws

logger = logging.getLogger(__name__)

_RETRYABLE_DB: tuple[type[BaseException], ...] = (
    asyncio.TimeoutError,
    asyncpg.exceptions.ConnectionDoesNotExistError,
    asyncpg.exceptions.InterfaceError,
)


async def _run_bounded_tool(
    label: str,
    work_factory: Callable[[], Awaitable[dict]],
    *,
    timeout: float = 30.0,
) -> dict:
    """Run a DB tool body with timeout + 1 retry. Return error dict on failure.

    On timeout or transient asyncpg error: 1 retry. On final failure: a dict
    the LLM can read mid-conversation (`{"error": ..., "table": None}`),
    rather than raising and aborting the whole stream.
    """
    try:
        return await call_with_retry(
            work_factory,
            attempts=2,
            timeout=timeout,
            base_delay=0.5,
            retry_on=_RETRYABLE_DB,
            label=label,
        )
    except asyncio.TimeoutError:
        msg = (
            f"{label} timed out after {timeout:.0f}s — try a narrower "
            "filter (fewer sites or shorter window)."
        )
        logger.warning(msg)
        return {"error": msg, "table": None}
    except Exception as exc:  # noqa: BLE001
        logger.exception("%s failed", label)
        return {"error": f"{label} failed: {exc}", "table": None}


@dataclass
class AQIDeps:
    db: Database
    tables: TableStore


def _preview(
    tables: TableStore,
    prefix: str,
    rows: list[dict],
    preview_n: int = 5,
    chart_hint: str | None = None,
) -> dict:
    name = tables.add(prefix, rows)
    out: dict = {
        "table": name,
        "preview_rows": rows[:preview_n],
        "total_rows": len(rows),
        "columns": list(rows[0].keys()) if rows else [],
    }
    if chart_hint:
        out["chart_hint"] = chart_hint
    return out


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
            async def _work() -> dict:
                rows = await ctx.deps.db.get_historical_data(
                    pollutant, sites, start, end, limit
                )
                return _preview(
                    ctx.deps.tables, f"historical_{pollutant}", rows,
                    chart_hint="line",
                )
            return await _run_bounded_tool("get_historical_data", _work)

        @agent.tool
        async def get_average(
            ctx: RunContext[AQIDeps],
            pollutant: Pollutant,
            sites: list[str],
            start: datetime,
            end: datetime,
        ) -> dict:
            """Mean PM2.5 or PM10 per site over a window. Preview-only return."""
            async def _work() -> dict:
                rows = await ctx.deps.db.get_average(pollutant, sites, start, end)
                return _preview(
                    ctx.deps.tables, f"avg_{pollutant}", rows, chart_hint="bar"
                )
            return await _run_bounded_tool("get_average", _work)

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
            async def _work() -> dict:
                rows = await ctx.deps.db.get_rolling_average(
                    pollutant, sites, start, end, bucket, window_size
                )
                return _preview(
                    ctx.deps.tables, f"rolling_{pollutant}", rows,
                    chart_hint="line",
                )
            return await _run_bounded_tool("get_rolling_average", _work)

        @agent.tool
        async def get_percentiles(
            ctx: RunContext[AQIDeps],
            pollutant: Pollutant,
            sites: list[str],
            start: datetime,
            end: datetime,
        ) -> dict:
            """p50/p95/p99 of the pollutant per site over a window. Preview-only return."""
            async def _work() -> dict:
                rows = await ctx.deps.db.get_percentiles(pollutant, sites, start, end)
                return _preview(
                    ctx.deps.tables, f"percentiles_{pollutant}", rows,
                    chart_hint="grouped_bar",
                )
            return await _run_bounded_tool("get_percentiles", _work)

        @agent.tool
        async def get_anomalies(
            ctx: RunContext[AQIDeps],
            pollutant: Pollutant,
            sites: list[str],
            start: datetime,
            end: datetime,
            min_severity: str | None = None,
            min_score: float | None = None,
            limit: int = 1000,
        ) -> dict:
            """Historical anomalies for the given sites and time window.

            Filters to rows where is_anomaly = TRUE. Returns columns
            deviceid, dt_time, <pm2_5cnc|pm10cnc>, severity, ensemble_score,
            scored_at — ordered by ensemble_score desc.

            Args:
                pollutant: 'pm25' or 'pm10'.
                sites: list of deviceid values.
                start: inclusive lower bound on dt_time.
                end: inclusive upper bound on dt_time.
                min_severity: optional exact severity match (e.g. 'high').
                min_score: optional lower bound on ensemble_score (0..1).
                limit: max rows fetched (default 1000).
            """
            async def _work() -> dict:
                rows = await ctx.deps.db.get_anomalies(
                    pollutant, sites, start, end, min_severity, min_score, limit
                )
                return _preview(
                    ctx.deps.tables, f"anomalies_{pollutant}", rows,
                    # Default to scatter (concentration vs ensemble_score) — looks
                    # great visually. Use [[TABLE:…]] explicitly when the user
                    # asked for a list of anomalies.
                    chart_hint="scatter",
                )
            return await _run_bounded_tool("get_anomalies", _work)

        @agent.tool
        async def compare_sites(
            ctx: RunContext[AQIDeps],
            pollutant: Pollutant,
            sites: list[str],
            start: datetime,
            end: datetime,
            include_anomalies: bool = False,
        ) -> dict:
            """Per-site aggregates over a window: avg, min, max, q1, p50, q3, p95.

            Use this to compare sites side-by-side (avg / max / min / median).
            For comparing trends *over time*, call get_rolling_average with all
            sites instead — that returns one line per site. The two are
            complementary: a strong "compare" answer often emits BOTH a bar
            (compare_sites) AND a line (get_rolling_average).

            Args:
                pollutant: 'pm25' or 'pm10'.
                sites: list of deviceids to compare.
                start, end: inclusive bounds on dt_time.
                include_anomalies: if True, also includes anomaly_count per site.

            Default chart: grouped_bar. Variants the LLM may pick:
                bar (single metric), hbar (ranked), radar (site profile),
                bubble (avg vs p95 with anomaly_count as size),
                boxplot (whiskers from min/q1/median/q3/max).
            """
            async def _work() -> dict:
                rows = await ctx.deps.db.compare_sites(
                    pollutant, sites, start, end, include_anomalies
                )
                return _preview(
                    ctx.deps.tables, f"compare_{pollutant}", rows,
                    chart_hint="grouped_bar",
                )
            return await _run_bounded_tool("compare_sites", _work)

        @agent.tool
        async def get_distribution(
            ctx: RunContext[AQIDeps],
            pollutant: Pollutant,
            sites: list[str],
            start: datetime,
            end: datetime,
            bins: int = 20,
        ) -> dict:
            """Bucketed histogram of pollutant values, one row per (site, bucket).

            Each row carries bin_start / bin_end so the frontend can label the
            x-axis. Use to answer "how do the values distribute" questions.

            Args:
                pollutant: 'pm25' or 'pm10'.
                sites: list of deviceids.
                start, end: inclusive bounds on dt_time.
                bins: number of buckets (2..200, default 20).
            """
            async def _work() -> dict:
                rows = await ctx.deps.db.get_distribution(
                    pollutant, sites, start, end, bins
                )
                return _preview(
                    ctx.deps.tables, f"distribution_{pollutant}", rows,
                    chart_hint="histogram",
                )
            return await _run_bounded_tool("get_distribution", _work)

        @agent.tool
        async def get_hourly_profile(
            ctx: RunContext[AQIDeps],
            pollutant: Pollutant,
            sites: list[str],
            start: datetime,
            end: datetime,
        ) -> dict:
            """Average concentration per hour-of-day (0..23) per site.

            Use for diurnal-pattern questions ("at what time of day is PM
            highest?"). Default chart is line; the LLM may also pick heatmap
            (sites × hours) for multi-site comparisons.

            Args:
                pollutant: 'pm25' or 'pm10'.
                sites: list of deviceids.
                start, end: inclusive bounds on dt_time.
            """
            async def _work() -> dict:
                rows = await ctx.deps.db.get_hourly_profile(
                    pollutant, sites, start, end
                )
                return _preview(
                    ctx.deps.tables, f"hourly_{pollutant}", rows,
                    chart_hint="line",
                )
            return await _run_bounded_tool("get_hourly_profile", _work)

        @agent.tool
        async def get_anomaly_summary(
            ctx: RunContext[AQIDeps],
            pollutant: Pollutant,
            sites: list[str],
            start: datetime,
            end: datetime,
        ) -> dict:
            """Anomaly counts grouped by severity (rolled up across sites).

            Use for "what's the share of severities?" / "breakdown of
            anomalies" questions. Default chart is doughnut.

            Args:
                pollutant: 'pm25' or 'pm10'.
                sites: list of deviceids.
                start, end: inclusive bounds on dt_time.
            """
            async def _work() -> dict:
                rows = await ctx.deps.db.get_anomaly_summary(
                    pollutant, sites, start, end
                )
                return _preview(
                    ctx.deps.tables, f"anomaly_summary_{pollutant}", rows,
                    chart_hint="doughnut",
                )
            return await _run_bounded_tool("get_anomaly_summary", _work)

        # ---- Site-metadata tools (no DB; backed by sites.json + nearby_sites.pkl) ----
        @agent.tool
        async def list_city_sites(
            ctx: RunContext[AQIDeps],
            city: str,
        ) -> dict:
            """All monitoring sites in a city. Use this BEFORE a multi-site
            DB tool (compare_sites, get_average, ...) to discover the deviceids.
            Returns the FULL list — no preview truncation — so you can
            see every site_id for the MAP token.

            Args:
                city: case-insensitive city name. Supported: Delhi, Mumbai,
                    Hyderabad, Bengaluru, Kolkata.
            """
            async def _work() -> dict:
                rows = _list_city_sites(city)
                return _preview(
                    ctx.deps.tables, f"sites_{city.lower()}", rows,
                    preview_n=len(rows),
                    chart_hint="table",
                )
            return await _run_bounded_tool("list_city_sites", _work)

        @agent.tool
        async def find_neighbours(
            ctx: RunContext[AQIDeps],
            site_id: str,
        ) -> dict:
            """Every pre-computed haversine neighbour of `site_id` (no
            truncation). Returns site_id, name, city, lat, lon, distance_km.
            The full list goes to you in the tool result so you can include
            every neighbour in your MAP token if you choose.

            Args:
                site_id: e.g. 'site_5129'.
            """
            async def _work() -> dict:
                rows = _find_neighbours(site_id)
                return _preview(
                    ctx.deps.tables, f"neighbours_{site_id}", rows,
                    preview_n=len(rows),
                    chart_hint="table",
                )
            return await _run_bounded_tool("find_neighbours", _work)

        @agent.tool
        async def compare_city_sites(
            ctx: RunContext[AQIDeps],
            city: str,
            pollutant: Pollutant,
            start: datetime,
            end: datetime,
            include_anomalies: bool = False,
        ) -> dict:
            """Run compare_sites across EVERY monitoring site in a city.
            Wraps list_city_sites + compare_sites in one call so the LLM
            doesn't have to chain. Default chart is grouped_bar.

            Args:
                city: case-insensitive city name.
                pollutant: 'pm25' or 'pm10'.
                start, end: inclusive bounds on dt_time.
                include_anomalies: also include anomaly_count per site.
            """
            async def _work() -> dict:
                site_rows = _list_city_sites(city)
                site_ids = [r["site_id"] for r in site_rows]
                if not site_ids:
                    return {"error": f"no sites found for city {city!r}", "table": None}
                rows = await ctx.deps.db.compare_sites(
                    pollutant, site_ids, start, end, include_anomalies,
                )
                return _preview(
                    ctx.deps.tables,
                    f"compare_{city.lower()}_{pollutant}",
                    rows,
                    chart_hint="grouped_bar",
                )
            return await _run_bounded_tool("compare_city_sites", _work)

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
                                                chart_hint=content.get("chart_hint"),
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
