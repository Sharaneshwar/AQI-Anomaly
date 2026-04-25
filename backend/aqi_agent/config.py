import os

from dotenv import load_dotenv

load_dotenv()

DEFAULT_MODEL = "groq:openai/gpt-oss-120b"

SCHEMA_DESCRIPTION = """\
Two tables, each holding 15-minute interval readings per monitoring site:

  aqi_pm25(deviceid text, dt_time timestamp, pm2_5cnc integer, ...)
  aqi_pm10(deviceid text, dt_time timestamp, pm10cnc integer, ...)

  - deviceid: site identifier (e.g. 'site_5129').
  - dt_time:  when the reading was taken (timestamp without time zone, UTC-naive).
  - pm2_5cnc: PM2.5 concentration in µg/m³ (in aqi_pm25 only).
  - pm10cnc:  PM10 concentration in µg/m³ (in aqi_pm10 only).

Other columns exist on both tables (is_anomaly, severity, ensemble_score,
scored_at) but are not yet populated and the tools below do not surface them.
"""

DEFAULT_SYSTEM_PROMPT = f"""You are an air-quality (AQI) analyst.

{SCHEMA_DESCRIPTION}

## Database tools

All four take `pollutant: 'pm25' | 'pm10'`, a `sites: list[str]` of deviceids,
and `start: datetime` / `end: datetime`. They return a small preview, not the
full result. The full result is stored on the agent under a short table name
(e.g. `historical_pm25_1`, `avg_pm10_2`) which appears as the `table` field
of the preview.

- get_historical_data(pollutant, sites, start, end, limit=1000): raw readings.
- get_average(pollutant, sites, start, end): mean per site.
- get_rolling_average(pollutant, sites, start, end, bucket='day', window_size=7):
  bucketed series with a trailing moving average. bucket ∈ {{'hour','day','week','month'}}.
- get_percentiles(pollutant, sites, start, end): p50/p95/p99 per site.

## How to use the tables you fetched

You see only `preview_rows` (first ~5 rows) and `total_rows`. Don't try to
compute aggregates from the preview — call the matching tool instead.

To embed a fetched table in your reply, write one of these literal tokens
on its own line where the rendered output should appear:

- `[[TABLE:<name>]]` — renders as a markdown table. Use for one-row
  aggregates (avg, percentiles) or small categorical comparisons.
- `[[CHART:<name>]]` — renders as a line chart. Use for time-series with
  a continuous x-axis (rolling averages, raw historical readings over a
  window). The frontend auto-detects axes: a datetime-like column becomes
  x; numeric columns become y; a `deviceid` column splits into one line
  per site.

Example:

> The 7-day PM2.5 rolling average at site_5129 trended downward through May.
>
> [[CHART:rolling_pm25_1]]

Only reference table names that actually came back from a tool you called
in this turn or earlier in the conversation. If a chart wouldn't make
sense for the data shape, use TABLE instead.

## Other tools

- aqicn_*: live AQI from the AQICN network (current readings, station search).
- web_search: general context the other tools don't cover.

Answer concisely. Show units. Briefly note which tool you used.
"""


def get_model():
    """Resolve the model for `pydantic_ai.Agent`.

    Provider-specific quirks handled here:

    * ``groq:*`` — return a ``GroqModel`` whose AsyncGroq client has
      ``max_retries=0``. The SDK's default (2) schedules retry coroutines that
      can fire *after* the per-request httpx client has been closed,
      producing ``Cannot send a request, as the client has been closed.``
      errors and dangling tasks. Disabling retries surfaces transient
      failures immediately instead.
    * ``google-gla:*`` — accept either ``GEMINI_API_KEY`` (the name shown in
      Google AI Studio) or ``GOOGLE_API_KEY`` (pydantic-ai's default lookup).

    Other providers fall through as plain model strings.
    """
    model_str = os.getenv("AQI_AGENT_MODEL", DEFAULT_MODEL)

    if model_str.startswith("groq:"):
        try:
            import groq
            from pydantic_ai.models.groq import GroqModel
            from pydantic_ai.providers.groq import GroqProvider
        except ImportError:
            return model_str
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return model_str
        client = groq.AsyncGroq(api_key=api_key, max_retries=0, timeout=60.0)
        return GroqModel(
            model_str.removeprefix("groq:"),
            provider=GroqProvider(groq_client=client),
        )

    if model_str.startswith("google-gla:"):
        try:
            from pydantic_ai.models.google import GoogleModel
            from pydantic_ai.providers.google import GoogleProvider
        except ImportError:
            return model_str
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return model_str
        return GoogleModel(
            model_str.removeprefix("google-gla:"),
            provider=GoogleProvider(api_key=api_key),
        )

    return model_str


def get_postgres_dsn() -> str:
    dsn = os.getenv("AQ_DB_URL_POOL")
    if not dsn:
        raise RuntimeError("AQ_DB_URL_POOL is not set")
    return dsn


def get_aqicn_token() -> str | None:
    return os.getenv("AQICN_API_TOKEN") or None


def get_tavily_key() -> str | None:
    return os.getenv("TAVILY_API_KEY") or None
