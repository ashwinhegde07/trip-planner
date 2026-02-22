"""
Route service — handles geocoding and routing for trip planning.

Uses:
  - Nominatim (OpenStreetMap) for geocoding — free, no API key
  - OSRM (Open Source Routing Machine) for routing — free, no API key

Both services use public demo servers. No signup required.
"""
import requests
import math

# ---------------------------------------------------------------------------
# Fallback coordinates for popular Indian cities (lat, lng)
# ---------------------------------------------------------------------------
INDIAN_CITY_COORDS = {
    "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946),
    "chennai": (13.0827, 80.2707),
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "hyderabad": (17.3850, 78.4867),
    "kolkata": (22.5726, 88.3639),
    "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714),
    "jaipur": (26.9124, 75.7873),
    "lucknow": (26.8467, 80.9462),
    "kochi": (9.9312, 76.2673),
    "nagpur": (21.1458, 79.0882),
    "indore": (22.7196, 75.8577),
    "bhopal": (23.2599, 77.4126),
    "visakhapatnam": (17.6868, 83.2185),
    "surat": (21.1702, 72.8311),
    "coimbatore": (11.0168, 76.9558),
    "thiruvananthapuram": (8.5241, 76.9366),
    "goa": (15.2993, 74.1240),
    "chandigarh": (30.7333, 76.7794),
    "patna": (25.6093, 85.1376),
    "ranchi": (23.3441, 85.3096),
    "guwahati": (26.1445, 91.7362),
    "mysuru": (12.2958, 76.6394),
    "mysore": (12.2958, 76.6394),
    "mangaluru": (12.9141, 74.8560),
    "mangalore": (12.9141, 74.8560),
    "vijayawada": (16.5062, 80.6480),
    "madurai": (9.9252, 78.1198),
    "varanasi": (25.3176, 82.9739),
}

# ---------------------------------------------------------------------------
# Nominatim (OSM) geocoding — free, no key
# ---------------------------------------------------------------------------
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# ---------------------------------------------------------------------------
# OSRM public demo server — free, no key
# ---------------------------------------------------------------------------
OSRM_URL = "https://router.project-osrm.org"


def geocode(city_name: str) -> tuple[float, float]:
    """
    Convert a city name to (latitude, longitude).

    Tries Nominatim (OpenStreetMap) first, then falls back to the
    hardcoded Indian city lookup table.
    """
    # Try local lookup first (fast, no network)
    key = city_name.strip().lower()
    if key in INDIAN_CITY_COORDS:
        return INDIAN_CITY_COORDS[key]

    # Try Nominatim geocoding
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={
                "q": f"{city_name}, India",
                "format": "json",
                "limit": 1,
                "countrycodes": "in",
            },
            headers={"User-Agent": "TripPlannerApp/1.0"},
            timeout=10,
        )
        resp.raise_for_status()
        results = resp.json()
        if results:
            return (float(results[0]["lat"]), float(results[0]["lon"]))
    except Exception:
        pass

    raise ValueError(f"Could not geocode city: {city_name}")


def get_route(coords_list: list[tuple[float, float]]) -> dict:
    """
    Get a driving route through the given coordinate waypoints.

    Uses the OSRM public demo server (no API key needed).

    Returns:
        {
            "distance_km": float,
            "duration_hours": float,
            "geometry": [[lat, lng], ...],
        }
    """
    try:
        # OSRM expects coordinates as lng,lat pairs separated by semicolons
        coords_str = ";".join(
            f"{lng},{lat}" for lat, lng in coords_list
        )

        resp = requests.get(
            f"{OSRM_URL}/route/v1/driving/{coords_str}",
            params={
                "overview": "full",
                "geometries": "geojson",
                "steps": "false",
            },
            headers={"User-Agent": "TripPlannerApp/1.0"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") == "Ok" and data.get("routes"):
            route = data["routes"][0]
            distance_km = route["distance"] / 1000
            duration_hours = route["duration"] / 3600

            # GeoJSON coordinates are [lng, lat] — convert to [lat, lng]
            geojson_coords = route["geometry"]["coordinates"]
            geometry = [[coord[1], coord[0]] for coord in geojson_coords]

            return {
                "distance_km": round(distance_km, 1),
                "duration_hours": round(duration_hours, 2),
                "geometry": geometry,
            }
    except Exception:
        pass

    # Fallback: straight-line estimate with 1.4× road factor
    return _estimate_route(coords_list)


def _estimate_route(coords_list: list[tuple[float, float]]) -> dict:
    """
    Estimate route distance using the Haversine formula with a 1.4× road
    factor. Creates a simple straight-line geometry.
    """
    total_km = 0
    geometry = []

    for i in range(len(coords_list)):
        geometry.append([coords_list[i][0], coords_list[i][1]])
        if i > 0:
            total_km += _haversine(coords_list[i - 1], coords_list[i])

    # Apply road factor (roads are ~1.4× straight-line distance)
    total_km *= 1.4

    return {
        "distance_km": round(total_km, 1),
        "duration_hours": round(total_km / 60, 2),  # 60 km/h average
        "geometry": geometry,
    }


def _haversine(coord1: tuple[float, float], coord2: tuple[float, float]) -> float:
    """Calculate the Haversine distance (km) between two (lat, lng) points."""
    R = 6371  # Earth's radius in km
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))

    return R * c


def interpolate_point_on_route(
    geometry: list[list[float]], total_distance_km: float, target_distance_km: float
) -> tuple[float, float]:
    """
    Find the approximate (lat, lng) at a given distance along the route geometry.
    Uses linear interpolation between geometry segments.
    """
    if not geometry or target_distance_km <= 0:
        return (geometry[0][0], geometry[0][1]) if geometry else (0, 0)

    if target_distance_km >= total_distance_km:
        return (geometry[-1][0], geometry[-1][1])

    cumulative = 0
    for i in range(1, len(geometry)):
        seg_dist = _haversine(
            (geometry[i - 1][0], geometry[i - 1][1]),
            (geometry[i][0], geometry[i][1]),
        )
        if cumulative + seg_dist >= target_distance_km:
            remaining = target_distance_km - cumulative
            fraction = remaining / seg_dist if seg_dist > 0 else 0
            lat = geometry[i - 1][0] + fraction * (geometry[i][0] - geometry[i - 1][0])
            lng = geometry[i - 1][1] + fraction * (geometry[i][1] - geometry[i - 1][1])
            return (lat, lng)
        cumulative += seg_dist

    return (geometry[-1][0], geometry[-1][1])
