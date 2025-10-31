from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Database configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "backend_db")
MONGODB_REQUIRED = os.getenv("MONGODB_REQUIRED", "false").lower() == "true"

# Global database client
client: Optional[AsyncIOMotorClient] = None
database = None

async def init_db():
    """Initialize database connection"""
    global client, database
    
    try:
        client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000  # 5 second timeout
        )
        # Test the connection
        await client.admin.command('ping')
        
        database = client[DATABASE_NAME]
        
        # Create indexes
        await create_indexes()
        
        logger.info(f"✅ Connected to MongoDB: {DATABASE_NAME}")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        
        if MONGODB_REQUIRED:
            raise
        else:
            logger.warning("⚠️  Running without MongoDB - some features will be disabled")
            database = None

async def create_indexes():
    """Create database indexes"""
    if database is None:
        return
        
    try:
        # Index for data collection
        await database.sensor_data.create_index([("site", ASCENDING), ("timestamp", DESCENDING)])
        await database.sensor_data.create_index([("timestamp", DESCENDING)])
        
        # Index for ML predictions
        await database.predictions.create_index([("site", ASCENDING), ("created_at", DESCENDING)])
        
        logger.info("✅ Database indexes created")
    except Exception as e:
        logger.error(f"❌ Error creating indexes: {e}")

async def close_db():
    """Close database connection"""
    global client
    if client:
        client.close()
        logger.info("Database connection closed")

def get_database():
    """Get database instance"""
    if database is None:
        raise Exception("Database not connected. Please check MongoDB connection.")
    return database

def is_db_connected():
    """Check if database is connected"""
    return database is not None