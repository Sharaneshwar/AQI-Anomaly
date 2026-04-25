"""AQI Anomaly Backend — single FastAPI app behind atmos-iq.vercel.app.

Mounts data, admin, and chat routes. The chat router uses pydantic-ai via the
local `aqi_agent` package. The backend does not import any model-training code:
training and historical scoring run locally from the AQI-Anomaly-ML repo.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from aqi_agent.db import Database
from aqi_agent.observability import setup_observability
from routes import admin_routes, aqi_routes, chat_routes, data_routes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AQI backend...")
    setup_observability()
    app.state.shared_db = Database()
    await app.state.shared_db.connect()
    try:
        yield
    finally:
        await app.state.shared_db.close()
        logger.info("Backend stopped.")


app = FastAPI(
    title="AQI Anomaly Backend",
    description="Unified backend: data, ingest+score, conversational chat agent.",
    version="2.1.0",
    lifespan=lifespan,
)

# CORS — locked to the deployed Vercel origin and local dev. Preview URLs are
# matched via regex (Vercel's atmos-iq-* subdomain pattern).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://atmos-iq.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://atmos-iq.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data_routes.router,  prefix="/api",       tags=["Data (Respirer proxy)"])
app.include_router(aqi_routes.router,   prefix="/api/aqi",   tags=["History & Anomalies (Postgres)"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["Admin"])
app.include_router(chat_routes.router,  prefix="/api/chat",  tags=["Chat (AQI Agent)"])


@app.get("/")
async def root():
    return {
        "service": "aqi-anomaly-backend",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "data":          ["/api/site-data", "/api/city-data"],
            "history":       "/api/aqi/history?site_id=site_296",
            "anomalies":     "/api/aqi/anomalies?site_id=site_296",
            "kolkata_sites": "/api/aqi/sites",
            "admin_ingest":  "POST /api/admin/ingest (X-Admin-Token header)",
            "chat_session":  "POST /api/chat/conversations",
            "chat_stream":   "GET /api/chat/stream?session_id=&prompt= (SSE)",
        },
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
