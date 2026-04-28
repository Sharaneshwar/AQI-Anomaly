from __future__ import annotations

import asyncio
import logging
from typing import Any, Awaitable, Callable, TypeVar

import aiohttp
import httpx

logger = logging.getLogger(__name__)

T = TypeVar("T")

RETRYABLE_HTTP: tuple[type[BaseException], ...] = (
    httpx.TransportError,
    httpx.TimeoutException,
    asyncio.TimeoutError,
)

RETRYABLE_AIOHTTP: tuple[type[BaseException], ...] = (
    aiohttp.ClientConnectionError,
    aiohttp.ServerTimeoutError,
    asyncio.TimeoutError,
)


def is_retryable_status(status: int) -> bool:
    return status == 429 or 500 <= status < 600


async def call_with_retry(
    coro_factory: Callable[[], Awaitable[T]],
    *,
    attempts: int,
    timeout: float,
    base_delay: float = 0.5,
    retry_on: tuple[type[BaseException], ...] = (asyncio.TimeoutError,),
    label: str = "call",
) -> T:
    """Run `coro_factory()` with `timeout`, retrying on `retry_on` exceptions.

    Each attempt is wrapped in `asyncio.wait_for(..., timeout)`. Between
    attempts we sleep `base_delay * 2**i`. Re-raises the last exception when
    `attempts` is exhausted. The factory is called fresh each attempt so the
    underlying coroutine is recreated (httpx/aiohttp clients are usually
    single-use).
    """
    last: BaseException | None = None
    for i in range(attempts):
        try:
            return await asyncio.wait_for(coro_factory(), timeout=timeout)
        except retry_on as exc:
            last = exc
            if i == attempts - 1:
                break
            delay = base_delay * (2 ** i)
            logger.warning(
                "%s attempt %d/%d failed with %s; retrying in %.2fs",
                label, i + 1, attempts, type(exc).__name__, delay,
            )
            await asyncio.sleep(delay)
    assert last is not None
    raise last
