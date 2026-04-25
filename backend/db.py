"""SQLAlchemy engine and helpers for the merged Postgres backend."""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

load_dotenv()


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    url = os.environ.get("AQ_DB_URL_POOL") or os.environ.get("AQ_DB_URL")
    if not url:
        raise RuntimeError("AQ_DB_URL_POOL or AQ_DB_URL must be set in environment.")
    return create_engine(url, future=True, pool_pre_ping=True)


# Sites we hold full historical data for in Postgres.
KOLKATA_SITES = [
    "site_296", "site_309", "site_5110", "site_5111",
    "site_5126", "site_5129", "site_5238",
]


def has_db_history(site_id: str) -> bool:
    """True if the site is one we've migrated into Postgres."""
    return site_id in KOLKATA_SITES
