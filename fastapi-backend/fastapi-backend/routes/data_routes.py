from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import aiohttp
import logging
from statistics import mean
import csv
from io import StringIO

# Import configuration
from config import CITY_SITES, SITES_DATA, API_BASE_URL, API_KEY, get_site_info, get_city_sites, get_all_cities

router = APIRouter()
logger = logging.getLogger(__name__)

class SiteDataResponse(BaseModel):
    site_id: str
    site_name: str
    city: str
    coordinates: dict
    start: str
    end: str
    pm25_data: List[dict]
    pm10_data: List[dict]
    data_points: int
    timestamp: datetime

class CityDataResponse(BaseModel):
    city: str
    start: str
    end: str
    sites_count: int
    sites_included: List[str]
    pm25_aggregated: List[dict]
    pm10_aggregated: List[dict]
    total_data_points: int
    timestamp: datetime

async def fetch_air_quality_data(site_id: str, start: str, end: str):
    """
    Fetch air quality data from the API for a specific site
    
    Args:
        site_id: Site identifier (e.g., site_104)
        start: Start date and time (format: YYYY-MM-DDTHH:MM)
        end: End date and time (format: YYYY-MM-DDTHH:MM)
    
    Returns:
        CSV text data from the API
    """
    # Construct the API URL
    url = (
        f"{API_BASE_URL}/imei/{site_id}/params/pm2.5cnc,pm10cnc/"
        f"startdate/{start}/enddate/{end}/ts/mm/avg/15/api/{API_KEY}?gaps=1&gap_value=NaN"
    )
    
    logger.info(f"Fetching data for {site_id} from {start} to {end}")
    logger.debug(f"API URL: {url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=60)) as response:
                if response.status == 200:
                    # Get the response as text (CSV format)
                    csv_data = await response.text()
                    logger.info(f"✅ Successfully fetched data for {site_id}")
                    logger.debug(f"First 200 chars: {csv_data[:200]}")
                    return csv_data
                else:
                    logger.error(f"❌ API request failed for {site_id} with status {response.status}")
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"Failed to fetch data from external API: {response.status}"
                    )
    except aiohttp.ClientError as e:
        logger.error(f"❌ Network error fetching data for {site_id}: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Error connecting to air quality API: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error for {site_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

def process_csv_response(csv_data: str):
    """
    Process CSV response and separate PM2.5 and PM10 data
    
    Expected CSV format:
    timestamp,pm2.5cnc,pm10cnc
    2024-03-10 00:00:00,45.2,78.5
    2024-03-10 00:15:00,46.1,79.2
    ...
    """
    pm25_data = []
    pm10_data = []
    
    try:
        # Parse CSV data
        csv_file = StringIO(csv_data)
        csv_reader = csv.DictReader(csv_file)
        
        for row in csv_reader:
            timestamp = row.get('timestamp', '').strip()
            pm25_value = row.get('pm2.5cnc', '').strip()
            pm10_value = row.get('pm10cnc', '').strip()
            
            # Process PM2.5 data
            if pm25_value and pm25_value.lower() not in ['nan', 'null', '']:
                try:
                    value = float(pm25_value)
                    pm25_data.append({
                        "timestamp": timestamp,
                        "value": round(value, 2)
                    })
                except (ValueError, TypeError):
                    pass
            
            # Process PM10 data
            if pm10_value and pm10_value.lower() not in ['nan', 'null', '']:
                try:
                    value = float(pm10_value)
                    pm10_data.append({
                        "timestamp": timestamp,
                        "value": round(value, 2)
                    })
                except (ValueError, TypeError):
                    pass
        
        logger.info(f"Processed CSV: {len(pm25_data)} PM2.5 points, {len(pm10_data)} PM10 points")
        
    except Exception as e:
        logger.error(f"Error processing CSV: {str(e)}")
        logger.debug(f"CSV data preview: {csv_data[:500]}")
    
    return pm25_data, pm10_data

@router.get("/site-data", response_model=SiteDataResponse)
async def get_site_data(
    site_id: str = Query(..., description="Site identifier (e.g., site_104)"),
    start: str = Query(..., description="Start date-time (YYYY-MM-DDTHH:MM)", example="2024-03-10T00:00"),
    end: str = Query(..., description="End date-time (YYYY-MM-DDTHH:MM)", example="2024-03-15T23:59")
):
    """
    **Route 1: Get air quality data for a specific site**
    
    Fetches PM2.5 and PM10 readings for graphing.
    
    **Example:**
    ```
    GET /api/site-data?site_id=site_104&start=2024-03-10T00:00&end=2024-03-15T23:59
    ```
    
    **Returns:**
    - site_id: The site identifier
    - site_name: Full name of the monitoring station
    - city: City where the site is located
    - coordinates: Latitude and longitude
    - pm25_data: Array of {timestamp, value} for PM2.5
    - pm10_data: Array of {timestamp, value} for PM10
    - data_points: Total number of data points returned
    """
    logger.info(f"📊 Site data request: {site_id} from {start} to {end}")
    
    # Get site information
    site_info = get_site_info(site_id)
    if not site_info:
        raise HTTPException(
            status_code=404,
            detail=f"Site '{site_id}' not found. Use /api/sites to see available sites."
        )
    
    # Fetch data from API
    csv_data = await fetch_air_quality_data(site_id, start, end)
    
    # Process the CSV response
    pm25_data, pm10_data = process_csv_response(csv_data)
    
    if not pm25_data and not pm10_data:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for {site_id} ({site_info['name']}) in the specified time range"
        )
    
    return SiteDataResponse(
        site_id=site_id,
        site_name=site_info['name'],
        city=site_info['city'],
        coordinates={"lat": site_info['lat'], "lon": site_info['lon']},
        start=start,
        end=end,
        pm25_data=pm25_data,
        pm10_data=pm10_data,
        data_points=len(pm25_data) + len(pm10_data),
        timestamp=datetime.utcnow()
    )

@router.get("/city-data", response_model=CityDataResponse)
async def get_city_data(
    city: str = Query(..., description="City name (delhi, mumbai, bengaluru, hyderabad, kolkata)"),
    start: str = Query(..., description="Start date-time (YYYY-MM-DDTHH:MM)", example="2024-03-10T00:00"),
    end: str = Query(..., description="End date-time (YYYY-MM-DDTHH:MM)", example="2024-03-15T23:59")
):
    """
    **Route 2: Get aggregated air quality data for all sites in a city**
    
    Fetches data from all monitoring stations in a city and combines/averages the readings.
    
    **Example:**
    ```
    GET /api/city-data?city=delhi&start=2024-03-10T00:00&end=2024-03-15T23:59
    ```
    
    **Returns:**
    - city: The city name
    - sites_count: Number of sites in the city
    - sites_included: List of site IDs that provided data
    - pm25_aggregated: Combined PM2.5 data with mean, min, max
    - pm10_aggregated: Combined PM10 data with mean, min, max
    """
    logger.info(f"🏙️  City data request: {city} from {start} to {end}")
    
    # Get site IDs for the city
    city_lower = city.lower()
    site_ids = get_city_sites(city_lower)
    
    if not site_ids:
        available_cities = get_all_cities()
        raise HTTPException(
            status_code=404,
            detail=f"City '{city}' not found. Available cities: {', '.join(available_cities)}"
        )
    
    logger.info(f"Found {len(site_ids)} sites for {city}")
    
    # Fetch data for all sites (with error handling per site)
    all_pm25_data = {}  # {timestamp: [values]}
    all_pm10_data = {}  # {timestamp: [values]}
    successful_sites = []
    
    for site_id in site_ids:
        try:
            csv_data = await fetch_air_quality_data(site_id, start, end)
            pm25_data, pm10_data = process_csv_response(csv_data)
            
            if pm25_data or pm10_data:
                successful_sites.append(site_id)
            
            # Aggregate PM2.5 data
            for entry in pm25_data:
                ts = entry["timestamp"]
                if ts not in all_pm25_data:
                    all_pm25_data[ts] = []
                all_pm25_data[ts].append(entry["value"])
            
            # Aggregate PM10 data
            for entry in pm10_data:
                ts = entry["timestamp"]
                if ts not in all_pm10_data:
                    all_pm10_data[ts] = []
                all_pm10_data[ts].append(entry["value"])
                
        except Exception as e:
            logger.warning(f"⚠️  Failed to fetch data for {site_id}: {str(e)}")
            continue
    
    if not successful_sites:
        raise HTTPException(
            status_code=404,
            detail=f"No data available from any site in {city} for the specified time range"
        )
    
    # Calculate averages for each timestamp
    pm25_aggregated = [
        {
            "timestamp": ts,
            "mean": round(mean(values), 2),
            "min": round(min(values), 2),
            "max": round(max(values), 2),
            "sites_reporting": len(values)
        }
        for ts, values in sorted(all_pm25_data.items())
    ]
    
    pm10_aggregated = [
        {
            "timestamp": ts,
            "mean": round(mean(values), 2),
            "min": round(min(values), 2),
            "max": round(max(values), 2),
            "sites_reporting": len(values)
        }
        for ts, values in sorted(all_pm10_data.items())
    ]
    
    logger.info(f"✅ Aggregated data from {len(successful_sites)}/{len(site_ids)} sites")
    
    return CityDataResponse(
        city=city.title(),
        start=start,
        end=end,
        sites_count=len(site_ids),
        sites_included=successful_sites,
        pm25_aggregated=pm25_aggregated,
        pm10_aggregated=pm10_aggregated,
        total_data_points=len(pm25_aggregated) + len(pm10_aggregated),
        timestamp=datetime.utcnow()
    )

@router.get("/cities")
async def get_available_cities():
    """
    Get list of available cities with site information
    """
    cities = []
    for city in get_all_cities():
        site_ids = get_city_sites(city)
        sites_info = [
            {
                "site_id": sid,
                "name": SITES_DATA[sid]["name"],
                "coordinates": {
                    "lat": SITES_DATA[sid]["lat"],
                    "lon": SITES_DATA[sid]["lon"]
                }
            }
            for sid in site_ids
        ]
        
        cities.append({
            "city": city.title(),
            "sites_count": len(site_ids),
            "sites": sites_info
        })
    
    return {
        "cities": cities,
        "total_cities": len(cities),
        "total_sites": sum(len(get_city_sites(c)) for c in get_all_cities())
    }

@router.get("/sites")
async def get_all_sites(city: Optional[str] = None):
    """
    Get all monitoring sites, optionally filtered by city
    """
    if city:
        city_lower = city.lower()
        site_ids = get_city_sites(city_lower)
        if not site_ids:
            raise HTTPException(status_code=404, detail=f"City '{city}' not found")
        
        sites = [
            {
                "site_id": sid,
                **SITES_DATA[sid]
            }
            for sid in site_ids
        ]
        
        return {
            "city": city.title(),
            "sites": sites,
            "count": len(sites)
        }
    else:
        sites = [
            {
                "site_id": sid,
                **info
            }
            for sid, info in SITES_DATA.items()
        ]
        
        return {
            "sites": sites,
            "count": len(sites)
        }