import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta

from config import CITY_SITES, API_BASE_URL, API_KEY, SITES_DATA

logger = logging.getLogger(__name__)

# Configuration
SYNC_INTERVAL = 15 * 60  # 15 minutes in seconds

async def fetch_latest_data(site_id: str):
    """
    Fetch latest 15 minutes of data for a site
    """
    now = datetime.utcnow()
    start = (now - timedelta(minutes=30)).strftime("%Y-%m-%dT%H:%M")
    end = now.strftime("%Y-%m-%dT%H:%M")
    
    url = (
        f"{API_BASE_URL}/imei/{site_id}/params/pm2.5cnc,pm10cnc/"
        f"startdate/{start}/enddate/{end}/ts/mm/avg/15/api/{API_KEY}?gaps=1&gap_value=NaN"
    )
    
    site_name = SITES_DATA.get(site_id, {}).get('name', site_id)
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=30) as response:
                if response.status == 200:
                    # Get CSV data
                    csv_data = await response.text()
                    logger.info(f"✅ Synced: {site_name}")
                    return csv_data
                else:
                    logger.error(f"❌ Failed {site_name}: Status {response.status}")
                    return None
    except Exception as e:
        logger.error(f"❌ Error {site_name}: {str(e)}")
        return None

async def sync_all_sites():
    """
    Sync data for all sites across all cities
    """
    logger.info("=" * 60)
    logger.info("🔄 Starting data sync for all sites...")
    logger.info("=" * 60)
    
    # Get all unique site IDs
    all_site_ids = set()
    for city, sites in CITY_SITES.items():
        all_site_ids.update(sites)
    
    logger.info(f"📊 Total sites to sync: {len(all_site_ids)}")
    
    # Show breakdown by city
    for city, sites in CITY_SITES.items():
        logger.info(f"   {city.title()}: {len(sites)} sites")
    
    # Fetch data for all sites
    success_count = 0
    fail_count = 0
    
    for i, site_id in enumerate(all_site_ids, 1):
        logger.info(f"[{i}/{len(all_site_ids)}] Fetching {site_id}...")
        result = await fetch_latest_data(site_id)
        
        if result:
            success_count += 1
        else:
            fail_count += 1
        
        # Small delay to avoid overwhelming the API
        await asyncio.sleep(2)
    
    logger.info("=" * 60)
    logger.info(f"✅ Sync completed: {success_count} successful, {fail_count} failed")
    logger.info("=" * 60)

async def start_data_sync_scheduler():
    """
    Start the periodic data sync scheduler
    Runs every 15 minutes
    """
    logger.info("🚀 Data sync scheduler started")
    logger.info(f"⏱️  Sync interval: {SYNC_INTERVAL // 60} minutes")
    
    while True:
        try:
            await sync_all_sites()
        except Exception as e:
            logger.error(f"❌ Error in sync task: {str(e)}")
        
        # Wait for next sync interval
        next_sync = datetime.utcnow() + timedelta(seconds=SYNC_INTERVAL)
        logger.info(f"⏰ Next sync at: {next_sync.strftime('%Y-%m-%d %H:%M:%S')} UTC")
        await asyncio.sleep(SYNC_INTERVAL)