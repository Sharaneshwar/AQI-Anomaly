from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SiteModel(BaseModel):
    site_id: str
    name: str
    location: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None
    active: bool = True

class SensorDataModel(BaseModel):
    site: str
    timestamp: datetime
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    pressure: Optional[float] = None
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    co2: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class MLModelConfig(BaseModel):
    model_name: str
    version: str
    parameters: Dict[str, Any]
    trained_date: Optional[datetime] = None

class PredictionModel(BaseModel):
    site: str
    timescale: str
    model_used: str
    predictions: List[Dict[str, Any]]
    confidence_score: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)