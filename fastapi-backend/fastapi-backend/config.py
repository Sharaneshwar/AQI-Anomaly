"""
Configuration file for site IDs and city mappings
Air Quality Monitoring Sites across Indian Cities
"""

# Complete site data with coordinates and names
SITES_DATA = {
    "site_104": {"name": "Burari Crossing, Delhi - IMD", "city": "Delhi", "lat": 28.7256504, "lon": 77.2011573},
    "site_106": {"name": "IGI Airport (T3), Delhi - IMD", "city": "Delhi", "lat": 28.5627763, "lon": 77.1180053},
    "site_113": {"name": "Shadipur, Delhi - CPCB", "city": "Delhi", "lat": 28.6514781, "lon": 77.1473105},
    "site_114": {"name": "IHBAS, Dilshad Garden, Delhi - CPCB", "city": "Delhi", "lat": 28.6811736, "lon": 77.3025234},
    "site_115": {"name": "NSIT Dwarka, Delhi - CPCB", "city": "Delhi", "lat": 28.60909, "lon": 77.0325413},
    "site_117": {"name": "ITO, Delhi - CPCB", "city": "Delhi", "lat": 28.628624, "lon": 77.24106},
    "site_118": {"name": "DTU, Delhi - CPCB", "city": "Delhi", "lat": 28.7500499, "lon": 77.1112615},
    "site_119": {"name": "Sirifort, Delhi - CPCB", "city": "Delhi", "lat": 28.5504249, "lon": 77.2159377},
    "site_122": {"name": "Mandir Marg, Delhi - DPCC", "city": "Delhi", "lat": 28.636429, "lon": 77.201067},
    "site_124": {"name": "R K Puram, Delhi - DPCC", "city": "Delhi", "lat": 28.563262, "lon": 77.186937},
    "site_1420": {"name": "Ashok Vihar, Delhi - DPCC", "city": "Delhi", "lat": 28.695381, "lon": 77.181665},
    "site_1421": {"name": "Dr. Karni Singh Shooting Range, Delhi - DPCC", "city": "Delhi", "lat": 28.498571, "lon": 77.26484},
    "site_1423": {"name": "Jahangirpuri, Delhi - DPCC", "city": "Delhi", "lat": 28.73282, "lon": 77.170633},
    "site_1424": {"name": "Jawaharlal Nehru Stadium, Delhi - DPCC", "city": "Delhi", "lat": 28.58028, "lon": 77.233829},
    "site_1425": {"name": "Major Dhyan Chand National Stadium, Delhi - DPCC", "city": "Delhi", "lat": 28.611281, "lon": 77.237738},
    "site_1426": {"name": "Narela, Delhi - DPCC", "city": "Delhi", "lat": 28.822836, "lon": 77.101981},
    "site_1427": {"name": "Najafgarh, Delhi - DPCC", "city": "Delhi", "lat": 28.570173, "lon": 76.933762},
    "site_1428": {"name": "Okhla Phase-2, Delhi - DPCC", "city": "Delhi", "lat": 28.530785, "lon": 77.271255},
    "site_1429": {"name": "Nehru Nagar, Delhi - DPCC", "city": "Delhi", "lat": 28.56789, "lon": 77.250515},
    "site_1430": {"name": "Rohini, Delhi - DPCC", "city": "Delhi", "lat": 28.732528, "lon": 77.11992},
    "site_1431": {"name": "Patparganj, Delhi - DPCC", "city": "Delhi", "lat": 28.623763, "lon": 77.287209},
    "site_1432": {"name": "Sonia Vihar, Delhi - DPCC", "city": "Delhi", "lat": 28.710508, "lon": 77.249485},
    "site_1434": {"name": "Wazirpur, Delhi - DPCC", "city": "Delhi", "lat": 28.699793, "lon": 77.165453},
    "site_1435": {"name": "Vivek Vihar, Delhi - DPCC", "city": "Delhi", "lat": 28.672342, "lon": 77.31526},
    "site_1560": {"name": "Bawana, Delhi - DPCC", "city": "Delhi", "lat": 28.7762, "lon": 77.051074},
    "site_1561": {"name": "Mundka, Delhi - DPCC", "city": "Delhi", "lat": 28.684678, "lon": 77.076574},
    "site_1562": {"name": "Sri Aurobindo Marg, Delhi - DPCC", "city": "Delhi", "lat": 28.531346, "lon": 77.190156},
    "site_1563": {"name": "Pusa, Delhi - DPCC", "city": "Delhi", "lat": 28.639652, "lon": 77.146275},
    "site_301": {"name": "Anand Vihar, Delhi - DPCC", "city": "Delhi", "lat": 28.647622, "lon": 77.315809},
    "site_5024": {"name": "Alipur, Delhi - DPCC", "city": "Delhi", "lat": 28.815329, "lon": 77.15301},
    "site_5393": {"name": "Chandni Chowk, Delhi - IITM", "city": "Delhi", "lat": 28.656756, "lon": 77.227234},
    "site_5395": {"name": "Lodhi Road, Delhi - IITM", "city": "Delhi", "lat": 28.588333, "lon": 77.221667},
    "site_5852": {"name": "New Moti Bagh, Delhi - MHUA", "city": "Delhi", "lat": 28.57834, "lon": 77.184},
    
    # Bengaluru sites
    "site_1553": {"name": "Bapuji Nagar, Bengaluru - KSPCB", "city": "Bengaluru", "lat": 12.951913, "lon": 77.539784},
    "site_1554": {"name": "Hebbal, Bengaluru - KSPCB", "city": "Bengaluru", "lat": 13.029152, "lon": 77.585901},
    "site_1555": {"name": "Hombegowda Nagar, Bengaluru - KSPCB", "city": "Bengaluru", "lat": 12.938539, "lon": 77.5901},
    "site_1556": {"name": "Jayanagar 5th Block, Bengaluru - KSPCB", "city": "Bengaluru", "lat": 12.920984, "lon": 77.584908},
    "site_1558": {"name": "Silk Board, Bengaluru - KSPCB", "city": "Bengaluru", "lat": 12.917348, "lon": 77.622813},
    "site_162": {"name": "BTM Layout, Bengaluru - CPCB", "city": "Bengaluru", "lat": 12.9135218, "lon": 77.5950804},
    "site_163": {"name": "Peenya, Bengaluru - CPCB", "city": "Bengaluru", "lat": 13.0270199, "lon": 77.494094},
    "site_165": {"name": "City Railway Station, Bengaluru - KSPCB", "city": "Bengaluru", "lat": 12.9756843, "lon": 77.5660749},
    "site_166": {"name": "Sanegurava Halli, Bengaluru - KSPCB", "city": "Bengaluru", "lat": 12.990328, "lon": 77.5431385},
    "site_5678": {"name": "RVCE-Mailasandra, Bengaluru - KSPCB", "city": "Bengaluru", "lat": 12.921418, "lon": 77.502466},
    "site_5681": {"name": "Kasturi Nagar, Bengaluru - KSPCB", "city": "Bengaluru", "lat": 13.003872, "lon": 77.664217},
    "site_5686": {"name": "Shivapura_Peenya, Bengaluru - KSPCB", "city": "Bengaluru", "lat": 13.0246342, "lon": 77.5080115},
    "site_5729": {"name": "Jigani, Bengaluru - KSPCB", "city": "Bengaluru", "lat": 12.7816279, "lon": 77.6299145},
    
    # Hyderabad sites
    "site_199": {"name": "Bollaram Industrial Area, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.540891, "lon": 78.358528},
    "site_251": {"name": "ICRISAT Patancheru, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.5184, "lon": 78.278777},
    "site_262": {"name": "Central University, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.460103, "lon": 78.334361},
    "site_275": {"name": "IDA Pashamylaram, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.5316895, "lon": 78.218939},
    "site_294": {"name": "Sanathnagar, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.4559458, "lon": 78.4332152},
    "site_298": {"name": "Zoo Park, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.349694, "lon": 78.451437},
    "site_5595": {"name": "New Malakpet, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.37206, "lon": 78.50864},
    "site_5596": {"name": "ECIL Kapra, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.470431, "lon": 78.566959},
    "site_5597": {"name": "IITH Kandi, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.585705, "lon": 78.126199},
    "site_5598": {"name": "Somajiguda, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.417094, "lon": 78.457437},
    "site_5599": {"name": "Kompally Municipal Office, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.544899, "lon": 78.486949},
    "site_5600": {"name": "Nacharam_TSIIC IALA, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.429398, "lon": 78.569354},
    "site_5602": {"name": "Ramachandrapuram, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.528544, "lon": 78.286195},
    "site_5604": {"name": "Kokapet, Hyderabad - TSPCB", "city": "Hyderabad", "lat": 17.393559, "lon": 78.339194},
    
    # Kolkata sites
    "site_296": {"name": "Rabindra Bharati University, Kolkata - WBPCB", "city": "Kolkata", "lat": 22.627847, "lon": 88.380669},
    "site_309": {"name": "Victoria, Kolkata - WBPCB", "city": "Kolkata", "lat": 22.5448082, "lon": 88.3403691},
    "site_5110": {"name": "Fort William, Kolkata - WBPCB", "city": "Kolkata", "lat": 22.55664, "lon": 88.342674},
    "site_5111": {"name": "Jadavpur, Kolkata - WBPCB", "city": "Kolkata", "lat": 22.49929, "lon": 88.36917},
    "site_5126": {"name": "Rabindra Sarobar, Kolkata - WBPCB", "city": "Kolkata", "lat": 22.51106, "lon": 88.35142},
    "site_5129": {"name": "Bidhannagar, Kolkata - WBPCB", "city": "Kolkata", "lat": 22.58157048, "lon": 88.41002457},
    "site_5238": {"name": "Ballygunge, Kolkata - WBPCB", "city": "Kolkata", "lat": 22.5367507, "lon": 88.3638022},
    
    # Mumbai sites
    "site_5102": {"name": "Vasai West, Mumbai - MPCB", "city": "Mumbai", "lat": 19.3832, "lon": 72.8204},
    "site_5104": {"name": "Kurla, Mumbai - MPCB", "city": "Mumbai", "lat": 19.0863, "lon": 72.8888},
    "site_5106": {"name": "Vile Parle West, Mumbai - MPCB", "city": "Mumbai", "lat": 19.10861, "lon": 72.83622},
    "site_5107": {"name": "Chhatrapati Shivaji Intl. Airport (T2), Mumbai - MPCB", "city": "Mumbai", "lat": 19.10078, "lon": 72.87462},
    "site_5112": {"name": "Powai, Mumbai - MPCB", "city": "Mumbai", "lat": 19.1375, "lon": 72.915056},
    "site_5113": {"name": "Borivali East, Mumbai - MPCB", "city": "Mumbai", "lat": 19.2243333, "lon": 72.8658113},
    "site_5115": {"name": "Worli, Mumbai - MPCB", "city": "Mumbai", "lat": 18.9936162, "lon": 72.8128113},
    "site_5119": {"name": "Sion, Mumbai - MPCB", "city": "Mumbai", "lat": 19.047, "lon": 72.8746},
    "site_5120": {"name": "Colaba, Mumbai - MPCB", "city": "Mumbai", "lat": 18.91, "lon": 72.82},
    "site_5394": {"name": "Mazgaon, Mumbai - IITM", "city": "Mumbai", "lat": 18.96702, "lon": 72.84214},
    "site_5396": {"name": "Deonar, Mumbai - IITM", "city": "Mumbai", "lat": 19.04946, "lon": 72.923},
    "site_5397": {"name": "Khindipada-Bhandup West, Mumbai - IITM", "city": "Mumbai", "lat": 19.1653323, "lon": 72.922099},
    "site_5398": {"name": "Navy Nagar-Colaba, Mumbai - IITM", "city": "Mumbai", "lat": 18.897756, "lon": 72.81332},
    "site_5399": {"name": "Chakala-Andheri East, Mumbai - IITM", "city": "Mumbai", "lat": 19.11074, "lon": 72.86084},
    "site_5400": {"name": "Borivali East, Mumbai - IITM", "city": "Mumbai", "lat": 19.23241, "lon": 72.86895},
    "site_5402": {"name": "Malad West, Mumbai - IITM", "city": "Mumbai", "lat": 19.19709, "lon": 72.82204},
    "site_5403": {"name": "Siddharth Nagar-Worli, Mumbai - IITM", "city": "Mumbai", "lat": 19.000083, "lon": 72.813993},
    "site_5412": {"name": "Kandivali East, Mumbai - MPCB", "city": "Mumbai", "lat": 19.2058, "lon": 72.8682},
    "site_5413": {"name": "Mulund West, Mumbai - MPCB", "city": "Mumbai", "lat": 19.175, "lon": 72.9419},
    "site_5807": {"name": "Mindspace-Malad West, Mumbai - MPCB", "city": "Mumbai", "lat": 19.1878657, "lon": 72.8304069},
    "site_5810": {"name": "Bandra Kurla Complex, Mumbai - MPCB", "city": "Mumbai", "lat": 19.065931, "lon": 72.862131},
    "site_5811": {"name": "Chembur, Mumbai - MPCB", "city": "Mumbai", "lat": 19.0364585, "lon": 72.8954371},
    "site_5814": {"name": "Kherwadi_Bandra East, Mumbai - MPCB", "city": "Mumbai", "lat": 19.0632143, "lon": 72.8456324},
    "site_5960": {"name": "Byculla, Mumbai - BMC", "city": "Mumbai", "lat": 18.9767, "lon": 72.838},
    "site_5961": {"name": "Shivaji Nagar, Mumbai - BMC", "city": "Mumbai", "lat": 19.060498, "lon": 72.923356},
    "site_5962": {"name": "Kandivali West, Mumbai - BMC", "city": "Mumbai", "lat": 19.215859, "lon": 72.831718},
    "site_5963": {"name": "Sewri, Mumbai - BMC", "city": "Mumbai", "lat": 19.000084, "lon": 72.85673},
    "site_5964": {"name": "Ghatkopar, Mumbai - BMC", "city": "Mumbai", "lat": 19.083694, "lon": 72.920967},
}

# City to Site ID mapping (organized by city)
CITY_SITES = {
    "delhi": [
        "site_104", "site_106", "site_113", "site_114", "site_115", "site_117", 
        "site_118", "site_119", "site_122", "site_124", "site_1420", "site_1421",
        "site_1423", "site_1424", "site_1425", "site_1426", "site_1427", "site_1428",
        "site_1429", "site_1430", "site_1431", "site_1432", "site_1434", "site_1435",
        "site_1560", "site_1561", "site_1562", "site_1563", "site_301", "site_5024",
        "site_5393", "site_5395", "site_5852"
    ],
    "bengaluru": [
        "site_1553", "site_1554", "site_1555", "site_1556", "site_1558", "site_162",
        "site_163", "site_165", "site_166", "site_5678", "site_5681", "site_5686",
        "site_5729"
    ],
    "hyderabad": [
        "site_199", "site_251", "site_262", "site_275", "site_294", "site_298",
        "site_5595", "site_5596", "site_5597", "site_5598", "site_5599", "site_5600",
        "site_5602", "site_5604"
    ],
    "kolkata": [
        "site_296", "site_309", "site_5110", "site_5111", "site_5126", "site_5129",
        "site_5238"
    ],
    "mumbai": [
        "site_5102", "site_5104", "site_5106", "site_5107", "site_5112", "site_5113",
        "site_5115", "site_5119", "site_5120", "site_5394", "site_5396", "site_5397",
        "site_5398", "site_5399", "site_5400", "site_5402", "site_5403", "site_5412",
        "site_5413", "site_5807", "site_5810", "site_5811", "site_5814", "site_5960",
        "site_5961", "site_5962", "site_5963", "site_5964"
    ]
}

# API Configuration
API_BASE_URL = "http://atmos.urbansciences.in/adp/v4/getDeviceDataParam"
API_KEY = "63h3AckbgtY"

# Data sync configuration
SYNC_INTERVAL_MINUTES = 15

# City statistics
CITY_STATS = {
    "delhi": {"sites_count": 33, "region": "North India"},
    "bengaluru": {"sites_count": 13, "region": "South India"},
    "hyderabad": {"sites_count": 14, "region": "South India"},
    "kolkata": {"sites_count": 7, "region": "East India"},
    "mumbai": {"sites_count": 28, "region": "West India"}
}

def get_site_info(site_id: str):
    """Get complete information for a site"""
    return SITES_DATA.get(site_id)

def get_city_sites(city: str):
    """Get all site IDs for a city"""
    return CITY_SITES.get(city.lower(), [])

def get_all_cities():
    """Get list of all available cities"""
    return list(CITY_SITES.keys())

def get_total_sites():
    """Get total number of sites across all cities"""
    return len(SITES_DATA)