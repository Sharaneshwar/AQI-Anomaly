"""Typed events yielded by AQIAgent.stream().

Plain dataclasses so they're trivial to JSON-serialize for SSE:
    json.dumps({"kind": ev.__class__.__name__, **dataclasses.asdict(ev)})
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

IterationKind = Literal["user_prompt", "model_request", "call_tools", "end"]


@dataclass
class RunStarted:
    pass


@dataclass
class Iteration:
    n: int
    kind: IterationKind


@dataclass
class ToolStart:
    iteration: int
    name: str
    args: Any  # str or dict — whatever pydantic-ai gave us


@dataclass
class ToolEnd:
    iteration: int
    name: str
    summary: str  # short string; full content goes via Table when applicable


@dataclass
class Table:
    name: str
    rows: list[dict]
    source_tool: str
    iteration: int
    columns: list[str] = field(default_factory=list)
    chart_hint: str | None = None  # tool's recommended chart type


@dataclass
class TextDelta:
    content: str


@dataclass
class RunCompleted:
    output: str


Event = (
    RunStarted
    | Iteration
    | ToolStart
    | ToolEnd
    | Table
    | TextDelta
    | RunCompleted
)
