"""Optional Langfuse observability via OpenTelemetry.

If LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY are set in the environment,
`setup_observability()` configures pydantic-ai to emit traces (LLM calls,
tool calls, token usage) to Langfuse. If creds are missing, logfire is not
installed, or any setup step fails, observability is silently disabled —
execution is never blocked.

Cost: Langfuse computes cost server-side from the model name and token
counts in the spans, so nothing extra is needed on the client.
"""

from __future__ import annotations

import base64
import os

_INITIALIZED = False
_DISABLED_REASON: str | None = None


def setup_observability() -> bool:
    """Wire pydantic-ai → OTel → Langfuse if creds exist. Idempotent.

    Returns True if observability is active, False otherwise.
    """
    global _INITIALIZED, _DISABLED_REASON
    if _INITIALIZED:
        return True
    if _DISABLED_REASON is not None:
        return False

    pk = os.getenv("LANGFUSE_PUBLIC_KEY")
    sk = os.getenv("LANGFUSE_SECRET_KEY")
    host = os.getenv("LANGFUSE_HOST") or "https://cloud.langfuse.com"

    if not pk or not sk:
        _DISABLED_REASON = "Langfuse keys not set"
        return False

    try:
        import logfire
    except ImportError:
        _DISABLED_REASON = (
            "logfire not installed (pip install 'pydantic-ai-slim[logfire]')"
        )
        return False

    try:
        auth = base64.b64encode(f"{pk}:{sk}".encode()).decode()
        os.environ["OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"] = (
            f"{host.rstrip('/')}/api/public/otel/v1/traces"
        )
        os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {auth}"
        logfire.configure(service_name="aqi-agent", send_to_logfire=False)
    except Exception as exc:
        _DISABLED_REASON = f"setup failed: {exc!r}"
        return False

    _INITIALIZED = True
    return True


def is_active() -> bool:
    return _INITIALIZED


def disabled_reason() -> str | None:
    return _DISABLED_REASON
