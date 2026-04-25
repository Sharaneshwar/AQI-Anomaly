"""In-memory store for the full result of fetch tools.

The LLM only sees a small preview returned from the tool; the full rows live
here, keyed by an auto-generated short name. The agent emits a Table event
with the full rows over the stream, and the LLM can embed the table in its
text answer with a `[[TABLE:<name>]]` token.
"""

from __future__ import annotations


class TableStore:
    def __init__(self) -> None:
        self._t: dict[str, list[dict]] = {}
        self._counter = 0

    def add(self, prefix: str, rows: list[dict]) -> str:
        """Store rows under a fresh auto-generated name and return the name."""
        self._counter += 1
        name = f"{prefix}_{self._counter}"
        self._t[name] = rows
        return name

    def get(self, name: str) -> list[dict] | None:
        return self._t.get(name)

    def clear(self) -> None:
        self._t.clear()
        self._counter = 0

    def as_dict(self) -> dict[str, list[dict]]:
        # shallow copy of the mapping; rows themselves are not deep-copied
        return dict(self._t)

    def __len__(self) -> int:
        return len(self._t)

    def __contains__(self, name: str) -> bool:
        return name in self._t
