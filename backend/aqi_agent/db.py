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
            min_size=1,
            max_size=5,
            ssl="require",
            statement_cache_size=0,
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
        table, col = _resolve(pollutant)
        sql = f"""
            SELECT deviceid, dt_time, {col}
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
