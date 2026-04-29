"""Site metadata + neighbour lookups.

Two artefacts at the project root:
- `backend/sites.json` — list of {lat, lon, id, name, city} for 95 sites.
- `backend/nearby_sites.pkl` — dict[site_id, list[site_id]] sorted by
  haversine distance ascending. Distances themselves are not stored;
  we recompute from lat/lon on access.

Loaded once at import time. Pure-Python — no DB, no I/O on each call.
"""
from __future__ import annotations

import json
import math
import pickle
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_SITES_JSON = _BACKEND_DIR / "sites.json"
_NEARBY_PKL = _BACKEND_DIR / "nearby_sites.pkl"


def _load() -> tuple[dict[str, dict], dict[str, list[str]]]:
    with _SITES_JSON.open() as f:
        rows = json.load(f)
    by_id = {r["id"]: r for r in rows}
    with _NEARBY_PKL.open("rb") as f:
        nearby = pickle.load(f)
    return by_id, nearby


_BY_ID, _NEARBY = _load()


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def get_site(site_id: str) -> dict | None:
    return _BY_ID.get(site_id)


def all_cities() -> list[str]:
    return sorted({r["city"] for r in _BY_ID.values() if r.get("city")})


def list_city_sites(city: str) -> list[dict]:
    """Sites for a city. City match is case-insensitive."""
    needle = (city or "").strip().lower()
    out = [
        {
            "site_id": r["id"],
            "name": r["name"],
            "city": r["city"],
            "lat": r["lat"],
            "lon": r["lon"],
        }
        for r in _BY_ID.values()
        if (r.get("city") or "").lower() == needle
    ]
    out.sort(key=lambda r: r["site_id"])
    return out


def find_neighbours(site_id: str, limit: int | None = None) -> list[dict]:
    """Pre-computed haversine ranking joined with metadata. Distance
    recomputed on the fly so the LLM has it for prose answers.
    `limit=None` returns every neighbour stored in nearby_sites.pkl."""
    origin = _BY_ID.get(site_id)
    if origin is None:
        raise ValueError(f"unknown site_id {site_id!r}")
    ranked = _NEARBY.get(site_id) or []
    if limit is not None:
        ranked = ranked[: max(0, int(limit))]
    out: list[dict] = []
    for nid in ranked:
        n = _BY_ID.get(nid)
        if n is None:
            continue
        out.append({
            "site_id": n["id"],
            "name": n["name"],
            "city": n.get("city"),
            "lat": n["lat"],
            "lon": n["lon"],
            "distance_km": round(
                _haversine_km(origin["lat"], origin["lon"], n["lat"], n["lon"]), 3
            ),
        })
    return out
