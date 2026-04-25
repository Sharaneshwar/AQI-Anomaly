"""History + anomaly endpoints, backed by Postgres (aqi_pm25, aqi_pm10)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text

from config import SITES_DATA
from db import KOLKATA_SITES, get_engine

router = APIRouter()

Pollutant = Literal["pm25", "pm10"]

POLLUTANT_TABLE = {
    "pm25": ("aqi_pm25", "pm2_5cnc"),
    "pm10": ("aqi_pm10", "pm10cnc"),
}


def _ensure_naive(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt.astimezone(timezone.utc).replace(tzinfo=None) if dt.tzinfo else dt


def _row_to_iso(value: object) -> Optional[str]:
    if isinstance(value, datetime):
        return value.isoformat()
    return None


def _query_history(
    site_id: str,
    pollutant: Pollutant,
    start: Optional[datetime],
    end: Optional[datetime],
    limit: Optional[int],
    include_anomaly: bool,
):
    table, value_col = POLLUTANT_TABLE[pollutant]
    cols = f"dt_time, {value_col}"
    if include_anomaly:
        cols += ", is_anomaly, severity, ensemble_score, scored_at"

    where = ["deviceid = :site"]
    params: Dict[str, object] = {"site": site_id}
    if start is not None:
        where.append("dt_time >= :start")
        params["start"] = start
    if end is not None:
        where.append("dt_time <= :end")
        params["end"] = end

    where_clause = " AND ".join(where)
    order = "DESC" if limit else "ASC"
    sql = f"SELECT {cols} FROM {table} WHERE {where_clause} ORDER BY dt_time {order}"
    if limit:
        sql += " LIMIT :limit"
        params["limit"] = limit

    with get_engine().begin() as conn:
        rows = conn.execute(text(sql), params).mappings().all()

    if limit:
        rows = list(reversed(rows))
    return rows, value_col


@router.get("/history")
def get_history(
    site_id: str = Query(..., description="Site identifier, e.g. site_296"),
    start: Optional[datetime] = Query(None, description="Inclusive ISO-8601 start."),
    end: Optional[datetime] = Query(None, description="Inclusive ISO-8601 end."),
    pollutant: Literal["pm25", "pm10", "both"] = Query("both"),
    limit: Optional[int] = Query(None, ge=1, le=100000),
):
    if site_id not in KOLKATA_SITES:
        raise HTTPException(
            status_code=404,
            detail=f"{site_id} is not in the Postgres cache. Only Kolkata sites are persisted.",
        )
    if start and end and start > end:
        raise HTTPException(status_code=400, detail="start must be <= end.")

    start = _ensure_naive(start)
    end = _ensure_naive(end)
    pollutants: List[Pollutant] = ["pm25", "pm10"] if pollutant == "both" else [pollutant]

    by_ts: Dict[datetime, dict] = {}
    for pol in pollutants:
        rows, value_col = _query_history(site_id, pol, start, end, limit, include_anomaly=False)
        for r in rows:
            ts = r["dt_time"]
            entry = by_ts.setdefault(ts, {"timestamp": ts.isoformat(), "site": site_id})
            entry[pol] = float(r[value_col]) if r[value_col] is not None else None

    records = sorted(by_ts.values(), key=lambda e: e["timestamp"])
    metadata = SITES_DATA.get(site_id, {})
    return {
        "site": site_id,
        "city": metadata.get("city"),
        "name": metadata.get("name"),
        "start": records[0]["timestamp"] if records else None,
        "end": records[-1]["timestamp"] if records else None,
        "count": len(records),
        "pollutants": pollutants,
        "records": records,
    }


@router.get("/anomalies")
def get_anomalies(
    site_id: str = Query(..., description="Site identifier, e.g. site_296"),
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    limit: Optional[int] = Query(500, ge=1, le=20000),
):
    if site_id not in KOLKATA_SITES:
        raise HTTPException(status_code=404, detail=f"{site_id} not in Postgres cache.")
    if start and end and start > end:
        raise HTTPException(status_code=400, detail="start must be <= end.")

    start = _ensure_naive(start)
    end = _ensure_naive(end)

    by_ts: Dict[datetime, dict] = {}
    for pol in ("pm25", "pm10"):
        rows, value_col = _query_history(site_id, pol, start, end, limit, include_anomaly=True)
        for r in rows:
            ts = r["dt_time"]
            entry = by_ts.setdefault(ts, {"timestamp": ts.isoformat(), "site": site_id})
            entry[pol] = float(r[value_col]) if r[value_col] is not None else None
            entry[f"{pol}Anomaly"] = r["is_anomaly"]
            entry[f"{pol}Severity"] = r["severity"]
            entry[f"{pol}Score"] = (
                float(r["ensemble_score"]) if r["ensemble_score"] is not None else None
            )

    records = sorted(by_ts.values(), key=lambda e: e["timestamp"])
    metadata = SITES_DATA.get(site_id, {})
    return {
        "site": site_id,
        "city": metadata.get("city"),
        "name": metadata.get("name"),
        "count": len(records),
        "records": records,
    }


@router.get("/sites")
def get_aqi_sites():
    """Return the sites currently backed by the Postgres cache."""
    return {
        "city": "Kolkata",
        "count": len(KOLKATA_SITES),
        "sites": [
            {"site_id": sid, **SITES_DATA.get(sid, {})}
            for sid in KOLKATA_SITES
        ],
    }
