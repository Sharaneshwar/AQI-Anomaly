# Patch for data_routes.py - Add mock pollution data
# Replace the get_all_sites function starting at line 346

import random

def add_mock_pollution_data(site_dict):
    """Add realistic mock pollution values"""
    # PM2.5: typically 10-150 µg/m³ in Indian cities
    # PM10: typically 20-300 µg/m³
    site_dict['pm2_5'] = round(random.uniform(15, 120), 1)
    site_dict['pm10'] = round(random.uniform(30, 200), 1)
    return site_dict

# Use this in the get_all_sites function:
# sites = [add_mock_pollution_data({"site_id": sid, **SITES_DATA[sid]}) for sid in site_ids]
