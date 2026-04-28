from __future__ import annotations

import httpx

from aqi_agent.config import get_tavily_key
from aqi_agent.retry import RETRYABLE_HTTP, call_with_retry, is_retryable_status


class WebSearchError(RuntimeError):
    pass


class _RetryableHTTPStatus(Exception):
    pass


async def _post(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post("https://api.tavily.com/search", json=payload)
        if is_retryable_status(resp.status_code):
            raise _RetryableHTTPStatus(f"HTTP {resp.status_code}")
        resp.raise_for_status()
        return resp.json()


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
    body = await call_with_retry(
        lambda: _post(payload),
        attempts=3,
        timeout=20,
        base_delay=0.5,
        retry_on=RETRYABLE_HTTP + (_RetryableHTTPStatus,),
        label="tavily web_search",
    )
    return [
        {"title": r.get("title"), "url": r.get("url"), "content": r.get("content")}
        for r in body.get("results", [])
    ]
