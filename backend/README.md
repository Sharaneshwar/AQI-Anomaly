# AQI Anomaly Backend

Single FastAPI process serving the AtmosIQ frontend (`atmos-iq.vercel.app`).
Deployed on Render at **`https://aqi-anomaly.onrender.com`**.

## What lives here

```
backend/
├── main.py              # FastAPI app, CORS, lifespan (shared async DB pool)
├── config.py            # site metadata, Respirer API config
├── db.py                # SQLAlchemy engine + KOLKATA_SITES list
├── routes/
│   ├── data_routes.py   # /api/site-data, /api/city-data  (Respirer proxy, all cities)
│   ├── aqi_routes.py    # /api/aqi/{history,anomalies,sites}  (Postgres, Kolkata)
│   ├── admin_routes.py  # POST /api/admin/ingest             (token-gated)
│   └── chat_routes.py   # /api/chat/{conversations,stream}   (SSE → aqi_agent)
├── aqi_agent/           # pydantic-ai agent + tools (Postgres, AQICN, Tavily)
├── requirements.txt
├── render.yaml          # Render IaC
└── .env                 # local secrets (gitignored)
```

The backend does **not** import any model-training code. Training, scoring, and
the historical ingest live in the `AQI-Anomaly-ML` repo and run locally on the
developer's laptop. See that repo for the offline pipeline.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/aqi/sites`              | The 7 Kolkata sites cached in Postgres |
| `GET`  | `/api/aqi/history?site_id=…&start=…&end=…&pollutant=both\|pm25\|pm10` | Time series from `aqi_pm25`/`aqi_pm10` |
| `GET`  | `/api/aqi/anomalies?site_id=…` | Same series with `is_anomaly` / `severity` / `ensemble_score` |
| `POST` | `/api/admin/ingest?minutes=N` (header `X-Admin-Token`) | Pull last N min from Respirer for Kolkata sites and upsert |
| `GET`  | `/api/site-data` / `/api/city-data` | Live Respirer proxy (any city) |
| `POST` | `/api/chat/conversations` | Create a new chat session, returns `{session_id}` |
| `GET`  | `/api/chat/sessions?limit=N` | List past sessions (id, title, message_count, updated_at) |
| `GET`  | `/api/chat/sessions/{id}` | Full conversation transcript (turns + observations) |
| `DELETE` | `/api/chat/conversations/{id}` | Wipes a session (cascade: traces + observations) |
| `GET`  | `/api/chat/stream?session_id=…&prompt=…` | SSE stream — see chat schema below |

### Chat persistence (Langfuse-style)

Three tables in Supabase, populated by the SSE handler:

| Table | Purpose |
|---|---|
| `chat_sessions` | One row per conversation. Holds title, message_count, timestamps. |
| `chat_traces` | One row per user→assistant turn — `prompt`, `response`, `status`, `latency_ms`, `pydantic_history` (JSONB for replay), `started_at` / `completed_at`. |
| `chat_observations` | One row per SSE event (`run_started`, `iteration`, `tool_start`, `tool_end`, `table`, `text_delta`, `run_completed`). Audit trail for the entire agent run. |

The stream emits a `trace_started` event with the new `trace_id` so the
frontend can correlate SSE events with the persisted record.

## Local development

```bash
cd AQI-Anomaly/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env .env.local        # edit if you want a local override
uvicorn main:app --reload --port 8000
```

Smoke test:

```bash
curl http://localhost:8000/health
curl 'http://localhost:8000/api/aqi/history?site_id=site_296&limit=5'
```

## Deployment (Render)

The service runs at `https://aqi-anomaly.onrender.com`. The deploy config is
declared in [`render.yaml`](./render.yaml) — point Render at this file and it
will read `rootDir`, `buildCommand`, `startCommand`, and the list of
expected env vars. Build is a plain `pip install -r requirements.txt`; start
command is `uvicorn main:app --host 0.0.0.0 --port $PORT`. No submodules, no
clones, no model downloads — the backend is fully self-contained.

Required env vars (set in Render's dashboard):

| Key | Notes |
|---|---|
| `AQ_DB_URL` / `AQ_DB_URL_POOL` | Supabase Postgres URLs |
| `ADMIN_TOKEN` | Gates `/api/admin/*` |
| `AQI_AGENT_MODEL` | Default: `google-gla:gemini-2.5-flash`. Other examples: `groq:llama-3.3-70b-versatile`, `groq:openai/gpt-oss-120b`. |
| `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) | Required when using a `google-gla:*` model |
| `GROQ_API_KEY` | Required when using a `groq:*` model |
| `AQICN_API_TOKEN` | Optional — enables AQICN tool |
| `TAVILY_API_KEY` | Optional — enables web search tool |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` / `LANGFUSE_HOST` | Optional — observability |

CORS is locked to `https://atmos-iq.vercel.app` plus its preview URLs and
`localhost:5173/3000`.

## Day-to-day workflow

```bash
# 1. Pull latest data into Postgres (manual trigger).
curl -X POST -H "X-Admin-Token: $ADMIN_TOKEN" \
  'https://aqi-anomaly.onrender.com/api/admin/ingest?minutes=120'

# 2. Run anomaly scoring locally on the freshly-ingested rows.
cd ../../AQI-Anomaly-ML && source .venv/bin/activate
python score_history.py --only-unscored
```

## Switching LLM provider

Change one line in `.env` (or Render env vars) and restart:

```
AQI_AGENT_MODEL=google-gla:gemini-2.5-flash       # default — Gemini Flash
AQI_AGENT_MODEL=google-gla:gemini-2.5-pro         # higher quality, slower
AQI_AGENT_MODEL=groq:llama-3.3-70b-versatile      # Groq, 12K TPM
AQI_AGENT_MODEL=groq:openai/gpt-oss-120b          # Groq, 8K TPM (low headroom)
```

`config.py::get_model()` configures provider-specific quirks (Groq uses
`max_retries=0` to avoid orphaned-task errors; Google reads either
`GEMINI_API_KEY` or `GOOGLE_API_KEY`).

## Architecture diagram

`AQI-Anomaly-Docs/architecture.png` (regenerate from
`architecture_diagram.py` if it drifts).
