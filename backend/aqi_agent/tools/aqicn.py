from __future__ import annotations

from typing import Any

import httpx

from aqi_agent.config import get_aqicn_token

_BASE = "https://api.waqi.info"


class AQICNError(RuntimeError):
    pass


async def _get(path: str, params: dict[str, Any] | None = None) -> Any:
    token = get_aqicn_token()
    if not token:
        raise AQICNError("AQICN_API_TOKEN is not set")
    params = {**(params or {}), "token": token}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{_BASE}{path}", params=params)
        resp.raise_for_status()
        body = resp.json()
    if body.get("status") != "ok":
        raise AQICNError(f"AQICN error: {body!r}")
    return body["data"]


async def aqicn_current_by_city(city: str) -> dict:
    """Live AQI for a city or named station (e.g. 'delhi', 'beijing/us-embassy')."""
    return await _get(f"/feed/{city}/")


async def aqicn_current_by_geo(lat: float, lon: float) -> dict:
    """Live AQI from the AQICN station nearest to a lat/lon."""
    return await _get(f"/feed/geo:{lat};{lon}/")


async def aqicn_search_station(keyword: str) -> list[dict]:
    """Search AQICN stations by keyword."""
    return await _get("/search/", params={"keyword": keyword})
