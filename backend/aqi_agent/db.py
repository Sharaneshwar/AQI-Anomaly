from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

import asyncpg

from aqi_agent.config import get_postgres_dsn

ALLOWED_BUCKETS = {"hour", "day", "week", "month"}

Pollutant = Literal["pm25", "pm10"]

_TABLE_COL: dict[str, tuple[str, str]] = {
    "pm25": ("aqi_pm25", "pm2_5cnc"),
    "pm10": ("aqi_pm10", "pm10cnc"),
}


def _resolve(pollutant: str) -> tuple[str, str]:
    try:
        return _TABLE_COL[pollutant]
    except KeyError:
        raise ValueError(
            f"pollutant must be one of {sorted(_TABLE_COL)}; got {pollutant!r}"
        )


def _strip_tz(dt: datetime) -> datetime:
    # dt_time columns are `timestamp without time zone` — asyncpg won't bind tz-aware values.
    return dt.replace(tzinfo=None) if dt.tzinfo is not None else dt


class Database:
    def __init__(self, dsn: str | None = None) -> None:
        self._dsn = dsn or get_postgres_dsn()
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        if self._pool is not None:
            return
        self._pool = await asyncpg.create_pool(
            self._dsn,
            min_size=2,
            max_size=20,
            ssl="require",
            # Session-mode pooler (port 5432) supports prepared statements,
            # so we leave the asyncpg statement cache at its default (100).
            command_timeout=45,
            # Recycle idle connections before the pooler's idle timeout so
            # we don't hand out a half-dead connection to a tool call.
            max_inactive_connection_lifetime=60.0,
        )

    async def close(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None

    # --- Chat persistence (Langfuse-style: sessions → traces → observations) --

    async def _ensure_pool(self):
        if self._pool is None:
            await self.connect()
        assert self._pool is not None
        return self._pool

    async def chat_create_session(self, session_id: str) -> None:
        pool = await self._ensure_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO chat_sessions (id) VALUES ($1::uuid) "
                "ON CONFLICT (id) DO NOTHING",
                session_id,
            )

    async def chat_list_sessions(self, limit: int = 100) -> list[dict]:
        pool = await self._ensure_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id::text AS id, title, message_count, created_at, updated_at
                FROM chat_sessions
                ORDER BY updated_at DESC
                LIMIT $1
                """,
                limit,
            )
        return [dict(r) for r in rows]

    async def chat_delete_session(self, session_id: str) -> None:
        pool = await self._ensure_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM chat_sessions WHERE id = $1::uuid", session_id
            )

    async def chat_load_history(self, session_id: str) -> bytes | None:
        """Return the JSONB blob from the most recent completed trace, or None."""
        pool = await self._ensure_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT pydantic_history::text AS history
                FROM chat_traces
                WHERE session_id = $1::uuid AND status = 'completed'
                ORDER BY started_at DESC
                LIMIT 1
                """,
                session_id,
            )
        if row is None or row["history"] is None:
            return None
        return row["history"].encode("utf-8")

    async def chat_load_session_turns(self, session_id: str) -> list[dict]:
        """Reconstruct the (prompt, response) turn list for a session, oldest first."""
        pool = await self._ensure_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id::text AS trace_id, prompt, response, status, error,
                       latency_ms, total_tokens, started_at, completed_at
                FROM chat_traces
                WHERE session_id = $1::uuid
                ORDER BY started_at ASC
                """,
                session_id,
            )
        return [dict(r) for r in rows]

    async def chat_load_trace_observations(self, trace_id: str) -> list[dict]:
        pool = await self._ensure_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, iteration, kind, name, payload, created_at
                FROM chat_observations
                WHERE trace_id = $1::uuid
                ORDER BY id ASC
                """,
                trace_id,
            )
        return [dict(r) for r in rows]

    async def chat_start_trace(
        self, trace_id: str, session_id: str, prompt: str
    ) -> None:
        pool = await self._ensure_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO chat_traces (id, session_id, prompt, status)
                VALUES ($1::uuid, $2::uuid, $3, 'running')
                """,
                trace_id,
                session_id,
                prompt,
            )

    async def chat_complete_trace(
        self,
        trace_id: str,
        response: str,
        pydantic_history_json: bytes | None,
        latency_ms: int,
        session_id: str,
        is_first_turn: bool,
        title_seed: str | None,
    ) -> None:
        pool = await self._ensure_pool()
        history_str = pydantic_history_json.decode("utf-8") if pydantic_history_json else None
        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    """
                    UPDATE chat_traces
                    SET response = $2,
                        pydantic_history = $3::jsonb,
                        latency_ms = $4,
                        status = 'completed',
                        completed_at = now()
                    WHERE id = $1::uuid
                    """,
                    trace_id,
                    response,
                    history_str,
                    latency_ms,
                )
                if is_first_turn and title_seed:
                    await conn.execute(
                        """
                        UPDATE chat_sessions
                        SET title = COALESCE(title, $2),
                            message_count = message_count + 1,
                            updated_at = now()
                        WHERE id = $1::uuid
                        """,
                        session_id,
                        title_seed[:80],
                    )
                else:
                    await conn.execute(
                        """
                        UPDATE chat_sessions
                        SET message_count = message_count + 1,
                            updated_at = now()
                        WHERE id = $1::uuid
                        """,
                        session_id,
                    )

    async def chat_error_trace(self, trace_id: str, error: str) -> None:
        pool = await self._ensure_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE chat_traces
                SET status = 'error', error = $2, completed_at = now()
                WHERE id = $1::uuid
                """,
                trace_id,
                error,
            )

    async def chat_record_observation(
        self,
        trace_id: str,
        iteration: int | None,
        kind: str,
        name: str | None,
        payload: dict | None,
    ) -> None:
        pool = await self._ensure_pool()
        import json
        payload_json = json.dumps(payload, default=str) if payload is not None else None
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO chat_observations (trace_id, iteration, kind, name, payload)
                VALUES ($1::uuid, $2, $3, $4, $5::jsonb)
                """,
                trace_id,
                iteration,
                kind,
                name,
                payload_json,
            )

    async def _fetch_dicts(self, sql: str, *args: Any) -> list[dict]:
        if self._pool is None:
            await self.connect()
        assert self._pool is not None
        async with self._pool.acquire() as conn:
            async with conn.transaction(readonly=True):
                rows = await conn.fetch(sql, *args)
                return [dict(r) for r in rows]

    async def get_historical_data(
        self,
        pollutant: Pollutant,
        sites: list[str],
        start: datetime,
        end: datetime,
        limit: int = 1000,
    ) -> list[dict]:
        """Raw 15-min readings, including the per-row anomaly flag + severity.

        is_anomaly / severity travel with each row so the line chart can
        overlay anomaly markers (severity-coloured dots) on the time axis
        without a second tool call.
        """
        table, col = _resolve(pollutant)
        sql = f"""
            SELECT deviceid, dt_time, {col}, is_anomaly, severity
            FROM {table}
            WHERE deviceid = ANY($1::text[])
              AND dt_time >= $2
              AND dt_time <= $3
            ORDER BY dt_time ASC
            LIMIT $4
        """
        return await self._fetch_dicts(
            sql, sites, _strip_tz(start), _strip_tz(end), limit
        )

    async def get_anomalies(
        self,
        pollutant: Pollutant,
        sites: list[str],
        start: datetime,
        end: datetime,
        min_severity: str | None = None,
        min_score: float | None = None,
        limit: int = 1000,
    ) -> list[dict]:
        """Rows where is_anomaly = TRUE, ordered by ensemble_score desc."""
        table, col = _resolve(pollutant)
        conds = [
            "deviceid = ANY($1::text[])",
            "dt_time >= $2",
            "dt_time <= $3",
            "is_anomaly = TRUE",
        ]
        args: list[Any] = [sites, _strip_tz(start), _strip_tz(end)]
        if min_score is not None:
            args.append(float(min_score))
            conds.append(f"ensemble_score >= ${len(args)}")
        if min_severity is not None:
            args.append(min_severity)
            conds.append(f"severity = ${len(args)}")
        args.append(limit)
        sql = f"""
            SELECT deviceid, dt_time, {col},
                   severity, ensemble_score, scored_at
            FROM {table}
            WHERE {" AND ".join(conds)}
            ORDER BY ensemble_score DESC NULLS LAST, dt_time ASC
            LIMIT ${len(args)}
        """
        return await self._fetch_dicts(sql, *args)

    async def get_average(
        self,
        pollutant: Pollutant,
        sites: list[str],
        start: datetime,
        end: datetime,
    ) -> list[dict]:
        """Mean concentration per site over the window."""
        table, col = _resolve(pollutant)
        sql = f"""
            SELECT
                deviceid,
                AVG({col})::float AS avg_value,
                COUNT(*) AS sample_count
            FROM {table}
            WHERE deviceid = ANY($1::text[])
              AND dt_time >= $2 AND dt_time <= $3
            GROUP BY deviceid
            ORDER BY deviceid
        """
        return await self._fetch_dicts(
            sql, sites, _strip_tz(start), _strip_tz(end)
        )

    async def get_rolling_average(
        self,
        pollutant: Pollutant,
        sites: list[str],
        start: datetime,
        end: datetime,
        bucket: str = "day",
        window_size: int = 7,
    ) -> list[dict]:
        """Bucketed series with a trailing moving average over `window_size` buckets."""
        if bucket not in ALLOWED_BUCKETS:
            raise ValueError(f"bucket must be one of {sorted(ALLOWED_BUCKETS)}")
        if window_size < 1:
            raise ValueError("window_size must be >= 1")

        table, col = _resolve(pollutant)
        sql = f"""
            WITH bucketed AS (
                SELECT
                    deviceid,
                    date_trunc($4, dt_time) AS bucket,
                    AVG({col})::float AS bucket_avg
                FROM {table}
                WHERE deviceid = ANY($1::text[])
                  AND dt_time >= $2 AND dt_time <= $3
                GROUP BY deviceid, bucket
            )
            SELECT
                deviceid,
                bucket,
                bucket_avg,
                AVG(bucket_avg) OVER (
                    PARTITION BY deviceid ORDER BY bucket
                    ROWS BETWEEN $5 PRECEDING AND CURRENT ROW
                ) AS rolling_avg
            FROM bucketed
            ORDER BY deviceid, bucket
        """
        return await self._fetch_dicts(
            sql,
            sites,
            _strip_tz(start),
            _strip_tz(end),
            bucket,
            window_size - 1,
        )

    async def get_percentiles(
        self,
        pollutant: Pollutant,
        sites: list[str],
        start: datetime,
        end: datetime,
    ) -> list[dict]:
        """p50, p95, p99 of the pollutant per site."""
        table, col = _resolve(pollutant)
        sql = f"""
            SELECT
                deviceid,
                PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY {col}) AS p50,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY {col}) AS p95,
                PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY {col}) AS p99,
                COUNT(*) AS sample_count
            FROM {table}
            WHERE deviceid = ANY($1::text[])
              AND dt_time >= $2 AND dt_time <= $3
            GROUP BY deviceid
            ORDER BY deviceid
        """
        return await self._fetch_dicts(
            sql, sites, _strip_tz(start), _strip_tz(end)
        )

    async def compare_sites(
        self,
        pollutant: Pollutant,
        sites: list[str],
        start: datetime,
        end: datetime,
        include_anomalies: bool = False,
    ) -> list[dict]:
        """One row per site with avg / p25 / p50 / p75 / p95 / max / sample_count.

        Optionally includes anomaly_count (rows where is_anomaly=TRUE).
        Drives bar / grouped_bar / radar / bubble / boxplot charts.
        """
        table, col = _resolve(pollutant)
        anomaly_select = (
            ", COUNT(*) FILTER (WHERE is_anomaly) AS anomaly_count"
            if include_anomalies
            else ""
        )
        sql = f"""
            SELECT
                deviceid,
                AVG({col})::float AS avg_value,
                MIN({col})::float AS min_value,
                MAX({col})::float AS max_value,
                PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY {col}) AS q1,
                PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY {col}) AS p50,
                PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY {col}) AS q3,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY {col}) AS p95,
                COUNT(*) AS sample_count
                {anomaly_select}
            FROM {table}
            WHERE deviceid = ANY($1::text[])
              AND dt_time >= $2 AND dt_time <= $3
            GROUP BY deviceid
            ORDER BY avg_value DESC NULLS LAST
        """
        return await self._fetch_dicts(
            sql, sites, _strip_tz(start), _strip_tz(end)
        )

    async def get_distribution(
        self,
        pollutant: Pollutant,
        sites: list[str],
        start: datetime,
        end: datetime,
        bins: int = 20,
    ) -> list[dict]:
        """Bucketed histogram: counts per (site, bucket) over the [min, max] range.

        Each row carries bin_start / bin_end so the frontend can label
        the x-axis without a second query.
        """
        if bins < 2 or bins > 200:
            raise ValueError("bins must be between 2 and 200")
        table, col = _resolve(pollutant)
        sql = f"""
            WITH bounds AS (
                SELECT
                    MIN({col})::float AS lo,
                    MAX({col})::float AS hi
                FROM {table}
                WHERE deviceid = ANY($1::text[])
                  AND dt_time >= $2 AND dt_time <= $3
            ),
            bucketed AS (
                SELECT
                    t.deviceid,
                    width_bucket(
                        t.{col}::float,
                        b.lo,
                        b.hi + 1e-9,  -- avoid landing on the upper bound exactly
                        $4
                    ) AS bucket,
                    b.lo, b.hi
                FROM {table} t, bounds b
                WHERE t.deviceid = ANY($1::text[])
                  AND t.dt_time >= $2 AND t.dt_time <= $3
                  AND t.{col} IS NOT NULL
            )
            SELECT
                deviceid,
                bucket,
                COUNT(*) AS freq,
                MIN(lo) + (bucket - 1) * (MIN(hi) - MIN(lo)) / $4 AS bin_start,
                MIN(lo) + bucket * (MIN(hi) - MIN(lo)) / $4 AS bin_end
            FROM bucketed
            GROUP BY deviceid, bucket
            ORDER BY deviceid, bucket
        """
        return await self._fetch_dicts(
            sql, sites, _strip_tz(start), _strip_tz(end), bins
        )

    async def get_hourly_profile(
        self,
        pollutant: Pollutant,
        sites: list[str],
        start: datetime,
        end: datetime,
    ) -> list[dict]:
        """Average concentration per (site, hour-of-day 0..23).

        Drives a diurnal-pattern line chart, or a heatmap when pivoted.
        """
        table, col = _resolve(pollutant)
        sql = f"""
            SELECT
                deviceid,
                EXTRACT(HOUR FROM dt_time)::int AS hour,
                AVG({col})::float AS avg_value,
                COUNT(*) AS sample_count
            FROM {table}
            WHERE deviceid = ANY($1::text[])
              AND dt_time >= $2 AND dt_time <= $3
            GROUP BY deviceid, hour
            ORDER BY deviceid, hour
        """
        return await self._fetch_dicts(
            sql, sites, _strip_tz(start), _strip_tz(end)
        )

    async def get_anomaly_summary(
        self,
        pollutant: Pollutant,
        sites: list[str],
        start: datetime,
        end: datetime,
    ) -> list[dict]:
        """Anomaly counts grouped by severity (rolled up across the given sites).

        Drives a doughnut chart of severity share. Returns rows where
        is_anomaly = TRUE only.
        """
        table, _col = _resolve(pollutant)
        sql = f"""
            SELECT
                COALESCE(severity, 'unknown') AS severity,
                COUNT(*) AS n
            FROM {table}
            WHERE deviceid = ANY($1::text[])
              AND dt_time >= $2 AND dt_time <= $3
              AND is_anomaly = TRUE
            GROUP BY severity
            ORDER BY n DESC
        """
        return await self._fetch_dicts(
            sql, sites, _strip_tz(start), _strip_tz(end)
        )
