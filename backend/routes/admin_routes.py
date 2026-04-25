"""Manual-trigger admin endpoint — ingests from Respirer into Postgres.

Anomaly scoring is intentionally NOT done here: training and scoring run on
the user's laptop via AQI-Anomaly-ML/score_history.py. After hitting this
endpoint, run `python score_history.py --only-unscored` locally to label the
freshly-ingested rows.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta
from io import StringIO
from typing import Dict, List

import aiohttp
import pandas as pd
from fastapi import APIRouter, Header, HTTPException
from psycopg2.extras import execute_values

from config import API_BASE_URL, API_KEY
from db import KOLKATA_SITES, get_engine

router = APIRouter()
logger = logging.getLogger(__name__)

UPSERT_BATCH = 1000


def _check_admin(token: str | None) -> None:
    expected = os.environ.get("ADMIN_TOKEN")
    if not expected:
        raise HTTPException(status_code=503, detail="ADMIN_TOKEN not configured.")
    if token != expected:
        raise HTTPException(status_code=401, detail="Bad or missing X-Admin-Token.")


async def _fetch_csv(session: aiohttp.ClientSession, site_id: str, start: datetime, end: datetime) -> str:
    s = start.strftime("%Y-%m-%dT%H:%M")
    e = end.strftime("%Y-%m-%dT%H:%M")
    url = (
        f"{API_BASE_URL}/imei/{site_id}/params/pm2.5cnc,pm10cnc/"
        f"startdate/{s}/enddate/{e}/ts/mm/avg/15/api/{API_KEY}?gaps=1&gap_value=NaN"
    )
    async with session.get(url, timeout=aiohttp.ClientTimeout(total=60)) as resp:
        resp.raise_for_status()
        return await resp.text()


def _parse_and_split(csv_text: str, site_id: str):
    if not csv_text or not csv_text.strip():
        return [], []
    try:
        df = pd.read_csv(StringIO(csv_text))
    except Exception as exc:  # noqa: BLE001
        logger.warning("CSV parse failed for %s: %s", site_id, exc)
        return [], []

    df.columns = df.columns.str.strip()
    if "dt_time" not in df.columns:
        return [], []
    df["dt_time"] = pd.to_datetime(df["dt_time"], errors="coerce")
    df = df.dropna(subset=["dt_time"]).copy()
    if "deviceid" not in df.columns:
        df["deviceid"] = site_id
    df = df[df["deviceid"] == site_id]

    pm25_rows: List[tuple] = []
    pm10_rows: List[tuple] = []

    if "pm2.5cnc" in df.columns:
        sub = df.dropna(subset=["pm2.5cnc"])
        for ts, val, dev in zip(sub["dt_time"], sub["pm2.5cnc"], sub["deviceid"]):
            try:
                pm25_rows.append((ts.to_pydatetime(), int(round(float(val))), dev))
            except (ValueError, TypeError):
                continue
    if "pm10cnc" in df.columns:
        sub = df.dropna(subset=["pm10cnc"])
        for ts, val, dev in zip(sub["dt_time"], sub["pm10cnc"], sub["deviceid"]):
            try:
                pm10_rows.append((ts.to_pydatetime(), int(round(float(val))), dev))
            except (ValueError, TypeError):
                continue
    return pm25_rows, pm10_rows


def _upsert(table: str, value_col: str, rows: List[tuple]) -> int:
    if not rows:
        return 0
    sql = (
        f"INSERT INTO {table} (dt_time, {value_col}, deviceid) "
        f"VALUES %s ON CONFLICT (deviceid, dt_time) DO NOTHING"
    )
    raw = get_engine().raw_connection()
    try:
        with raw.cursor() as cur:
            execute_values(cur, sql, rows, page_size=UPSERT_BATCH)
        raw.commit()
    finally:
        raw.close()
    return len(rows)


@router.post("/ingest")
async def ingest_kolkata(
    minutes: int = 60,
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
) -> Dict[str, object]:
    """Fetch the last N minutes from Respirer for all Kolkata sites and upsert into Postgres."""
    _check_admin(x_admin_token)

    if minutes <= 0 or minutes > 60 * 24 * 7:
        raise HTTPException(status_code=400, detail="minutes must be in (0, 10080].")

    end = datetime.utcnow()
    start = end - timedelta(minutes=minutes)
    logger.info("Admin ingest %s -> %s for %d Kolkata sites", start, end, len(KOLKATA_SITES))

    per_site: Dict[str, Dict[str, object]] = {}
    total_pm25 = total_pm10 = 0
    errors: List[str] = []

    async with aiohttp.ClientSession() as session:
        for site_id in KOLKATA_SITES:
            try:
                csv_text = await _fetch_csv(session, site_id, start, end)
                pm25_rows, pm10_rows = _parse_and_split(csv_text, site_id)
                n25 = _upsert("aqi_pm25", "pm2_5cnc", pm25_rows)
                n10 = _upsert("aqi_pm10", "pm10cnc", pm10_rows)
                per_site[site_id] = {"pm25_rows": n25, "pm10_rows": n10}
                total_pm25 += n25
                total_pm10 += n10
            except Exception as exc:  # noqa: BLE001
                err = f"{site_id}: {exc!r}"
                errors.append(err)
                logger.warning("ingest error %s", err)
                per_site[site_id] = {"pm25_rows": 0, "pm10_rows": 0, "error": str(exc)}

    return {
        "window_start": start.isoformat() + "Z",
        "window_end": end.isoformat() + "Z",
        "sites_processed": len(KOLKATA_SITES),
        "pm25_rows_upserted": total_pm25,
        "pm10_rows_upserted": total_pm10,
        "errors": errors,
        "per_site": per_site,
        "scoring_hint": "Run `python score_history.py --only-unscored` locally to label new rows.",
    }
