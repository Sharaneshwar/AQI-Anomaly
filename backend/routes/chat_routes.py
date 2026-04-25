"""Chat routes — Langfuse-style persistence (sessions / traces / observations).

Mounted at /api/chat/* by main.py.

Tables:
- chat_sessions       one row per conversation (sidebar list, title, counts)
- chat_traces         one row per user→assistant turn
- chat_observations   one row per SSE event from the agent run
"""

from __future__ import annotations

import dataclasses
import json
import time
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic_ai.messages import ModelMessagesTypeAdapter
from sse_starlette.sse import EventSourceResponse

from aqi_agent import AQIAgent
from aqi_agent.events import (
    Iteration,
    RunCompleted,
    RunStarted,
    Table,
    TextDelta,
    ToolEnd,
    ToolStart,
)

router = APIRouter()

EVENT_NAME: dict[type, str] = {
    RunStarted: "run_started",
    Iteration: "iteration",
    ToolStart: "tool_start",
    ToolEnd: "tool_end",
    Table: "table",
    TextDelta: "text_delta",
    RunCompleted: "run_completed",
}


def _event_payload(ev: Any) -> dict:
    return dataclasses.asdict(ev)


def _event_to_sse(ev: Any) -> dict[str, str]:
    name = EVENT_NAME.get(type(ev), type(ev).__name__.lower())
    return {"event": name, "data": json.dumps(_event_payload(ev), default=str)}


# ---- Session / sidebar endpoints --------------------------------------------

@router.post("/conversations")
async def create_conversation(request: Request) -> dict:
    db = request.app.state.shared_db
    session_id = str(uuid.uuid4())
    await db.chat_create_session(session_id)
    return {"session_id": session_id}


@router.get("/sessions")
async def list_sessions(request: Request, limit: int = 100) -> list[dict]:
    db = request.app.state.shared_db
    rows = await db.chat_list_sessions(limit=limit)
    for r in rows:
        for k in ("created_at", "updated_at"):
            if r.get(k) is not None:
                r[k] = r[k].isoformat()
    return rows


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, request: Request) -> dict:
    """Full conversation transcript for resuming the UI."""
    db = request.app.state.shared_db
    turns = await db.chat_load_session_turns(session_id)
    out = []
    for t in turns:
        observations = await db.chat_load_trace_observations(t["trace_id"])
        out.append({
            "trace_id": t["trace_id"],
            "prompt": t["prompt"],
            "response": t.get("response"),
            "status": t["status"],
            "error": t.get("error"),
            "latency_ms": t.get("latency_ms"),
            "total_tokens": t.get("total_tokens"),
            "started_at": t["started_at"].isoformat() if t.get("started_at") else None,
            "completed_at": t["completed_at"].isoformat() if t.get("completed_at") else None,
            "observations": [
                {
                    "id": o["id"],
                    "iteration": o.get("iteration"),
                    "kind": o["kind"],
                    "name": o.get("name"),
                    "payload": json.loads(o["payload"]) if isinstance(o.get("payload"), str) else o.get("payload"),
                }
                for o in observations
            ],
        })
    return {"session_id": session_id, "turns": out}


@router.delete("/conversations/{session_id}")
async def delete_conversation(session_id: str, request: Request) -> dict:
    db = request.app.state.shared_db
    await db.chat_delete_session(session_id)
    return {"ok": True}


# ---- The streaming endpoint --------------------------------------------------

@router.get("/stream")
async def chat_stream(session_id: str, prompt: str, request: Request):
    db = request.app.state.shared_db

    if not prompt or not prompt.strip():
        raise HTTPException(status_code=400, detail="prompt is required")

    # Load prior history from the most recent completed trace in this session.
    raw = await db.chat_load_history(session_id)
    history = ModelMessagesTypeAdapter.validate_json(raw) if raw is not None else None
    is_first_turn = history is None

    trace_id = str(uuid.uuid4())
    await db.chat_start_trace(trace_id, session_id, prompt)

    agent = AQIAgent(db=db)
    started = time.perf_counter()

    async def gen():
        # Send trace_id so the frontend can correlate the stream with the row.
        yield {"event": "trace_started", "data": json.dumps({"trace_id": trace_id})}

        accumulated_text: list[str] = []
        client_disconnected = False
        try:
            async for ev in agent.stream(prompt, message_history=history):
                # Re-check on every event but DO NOT abort the iterator — letting
                # `agent.stream` finish naturally avoids cancelling in-flight LLM
                # requests, which causes "client has been closed" errors when
                # the underlying httpx pool is torn down mid-call.
                if not client_disconnected and await request.is_disconnected():
                    client_disconnected = True

                payload = _event_payload(ev)
                kind = EVENT_NAME.get(type(ev), type(ev).__name__.lower())
                name = payload.get("name") if kind in ("tool_start", "tool_end", "table") else None
                iteration = payload.get("iteration") if "iteration" in payload else payload.get("n")

                await db.chat_record_observation(trace_id, iteration, kind, name, payload)

                if isinstance(ev, TextDelta):
                    accumulated_text.append(payload.get("content", ""))

                if not client_disconnected:
                    yield _event_to_sse(ev)

            # Finalize the trace — runs regardless of disconnect so the row
            # is consistent even when the user navigates away mid-stream.
            response_text = "".join(accumulated_text)
            new_history = agent.last_history
            history_json = ModelMessagesTypeAdapter.dump_json(new_history) if new_history else None
            latency_ms = int((time.perf_counter() - started) * 1000)
            await db.chat_complete_trace(
                trace_id=trace_id,
                response=response_text,
                pydantic_history_json=history_json,
                latency_ms=latency_ms,
                session_id=session_id,
                is_first_turn=is_first_turn,
                title_seed=prompt if is_first_turn else None,
            )

        except Exception as exc:  # noqa: BLE001
            await db.chat_error_trace(trace_id, repr(exc))
            if not client_disconnected:
                yield {"event": "agent_error", "data": json.dumps({"error": repr(exc)})}

    return EventSourceResponse(gen())
