from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime
import logging

from routes import data_routes, ml_routes
from tasks.data_sync import start_data_sync_scheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Background task reference
scheduler_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting FastAPI application...")
    
    # Start the data sync scheduler
    global scheduler_task
    scheduler_task = asyncio.create_task(start_data_sync_scheduler())
    logger.info("Data sync scheduler started")
    
    yield
    
    # Shutdown
    logger.info("Shutting down FastAPI application...")
    if scheduler_task:
        scheduler_task.cancel()
        try:
            await scheduler_task
        except asyncio.CancelledError:
            logger.info("Scheduler task cancelled successfully")

app = FastAPI(
    title="Air Quality Backend API",
    description="FastAPI backend for air quality data retrieval and ML predictions",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this based on your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(data_routes.router, prefix="/api", tags=["Data"])
app.include_router(ml_routes.router, prefix="/api/ml", tags=["ML Models"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Air Quality Backend API",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "site_data": "/api/site-data",
            "city_data": "/api/city-data",
            "ml_predict": "/api/ml/predict"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)