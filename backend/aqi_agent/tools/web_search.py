from __future__ import annotations

import httpx

from aqi_agent.config import get_tavily_key


class WebSearchError(RuntimeError):
    pass


async def web_search(query: str, max_results: int = 5) -> list[dict]:
    """Tavily-backed web search. Returns [{title, url, content}, ...]."""
    key = get_tavily_key()
    if not key:
        raise WebSearchError("TAVILY_API_KEY is not set")
    payload = {
        "api_key": key,
        "query": query,
        "max_results": max_results,
        "search_depth": "basic",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post("https://api.tavily.com/search", json=payload)
        resp.raise_for_status()
        body = resp.json()
    return [
        {"title": r.get("title"), "url": r.get("url"), "content": r.get("content")}
        for r in body.get("results", [])
    ]
