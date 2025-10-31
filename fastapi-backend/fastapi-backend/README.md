# FastAPI Backend

A comprehensive FastAPI backend for data retrieval, real-time synchronization, and ML model invocation.

## Features

- **Data Retrieval API**: RESTful endpoints for accessing sensor data with filtering, pagination, and statistics
- **Real-time Data Sync**: Automated background task that fetches data from Respirer API every 15 minutes
- **ML Model Integration**: Routes to invoke ML models for different sites and timescales
- **Database Management**: MongoDB integration with proper indexing and async operations
- **CORS Support**: Configured for frontend integration

## Setup

### Prerequisites

- Python 3.9+
- MongoDB
- pip

### Installation

1. Clone the repository and navigate to the backend directory

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
   - MongoDB connection string
   - Respirer API URL and key
   - Other environment variables

### Running the Application

Development mode:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Production mode:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Data Endpoints

- `GET /api/data/` - Get sensor data with filtering and pagination
- `GET /api/data/sites` - Get list of all sites
- `GET /api/data/latest/{site}` - Get latest data for a site
- `GET /api/data/statistics/{site}` - Get statistical summary

### ML Model Endpoints

- `POST /api/ml/predict` - Invoke ML model for predictions
- `GET /api/ml/predictions/{site}` - Get recent predictions for a site
- `GET /api/ml/models` - Get list of available models

### Health Check

- `GET /` - Root endpoint
- `GET /health` - Health check

## Data Sync

The background task automatically syncs data from the Respirer API every 15 minutes. The sync process:

1. Fetches data from the configured API endpoint
2. Transforms and validates the data
3. Appends new records to MongoDB
4. Logs the sync status

## ML Model Integration

The ML routes support:

- Multiple models per site
- Different timescales (1h, 6h, 24h, 7d)
- Historical data retrieval
- Prediction storage and retrieval

Replace the placeholder `run_ml_model` function in `routes/ml_routes.py` with your actual ML model implementation.

## Development

### Project Structure

```
.
├── main.py                 # Application entry point
├── database.py             # Database configuration
├── routes/
│   ├── data_routes.py     # Data retrieval endpoints
│   └── ml_routes.py       # ML model endpoints
├── tasks/
│   └── data_sync.py       # Background sync task
├── models/
│   └── schemas.py         # Pydantic models
├── requirements.txt       # Dependencies
└── .env.example          # Environment variables template
```

### Adding New Models

1. Add model configuration in `routes/ml_routes.py`
2. Implement model logic in `run_ml_model` function
3. Update the `/models` endpoint to list your new model

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc