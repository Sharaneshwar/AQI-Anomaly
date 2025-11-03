import React, { useEffect, useState, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import "./Raw_data_dashboard.css";
import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { API_BASE_URL } from "../config";

/*
File: Raw_data_dashboard.jsx
Description:
- Two-tab air quality dashboard:
    Tab 1: City Map View (/cities)
    Tab 2: Site Data View (/sites)
- Built with React, uses Leaflet and Recharts.
- Styling uses Tailwind CSS classes (assumes Tailwind is configured).
- Fetches data from /cities and /sites endpoints.
*/

/* Fix default marker icon path for leaflet + Vite */
const DefaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

/* Helper component to focus map to bounds or a center */
function MapFitter({ bounds, center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid && bounds.isValid()) {
      try {
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch (e) {
        // ignore
      }
    } else if (center) {
      map.setView(center, zoom || 12);
    }
  }, [map, bounds, center, zoom]);
  return null;
}

export default function RawDataDashboard() {
  const [tab, setTab] = useState("map"); // 'map' | 'sites'
  const [citiesData, setCitiesData] = useState(null);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState(null);

  const [sitesData, setSitesData] = useState(null); // for /sites endpoint (current city)
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState(null);

  const [selectedCity, setSelectedCity] = useState(null);
  const mapRef = useRef();

  // Date range states for real data fetching
  const [startDate, setStartDate] = useState("2024-03-10T00:00");
  const [endDate, setEndDate] = useState("2024-03-15T23:59");
  const [useRealData, setUseRealData] = useState(false);

  // Fetch /cities once and cache
  useEffect(() => {
    let mounted = true;
    async function loadCities() {
      setCitiesLoading(true);
      setCitiesError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/cities`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (mounted) {
          setCitiesData(json);
          // if no selected city yet, pick first for site view dropdown
          if (!selectedCity && json?.cities?.length) {
            setSelectedCity(json.cities[0].city);
          }
        }
      } catch (err) {
        if (mounted) setCitiesError(err.message || "Failed to load cities");
      } finally {
        if (mounted) setCitiesLoading(false);
      }
    }
    loadCities();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch /sites whenever selectedCity changes and tab is 'sites'
  useEffect(() => {
    let mounted = true;
    if (!selectedCity) {
      setSitesData(null);
      return;
    }
    async function loadSites() {
      setSitesLoading(true);
      setSitesError(null);
      try {
        let url;
        if (useRealData) {
          // Fetch REAL data from /api/city-data
          url = `${API_BASE_URL}/city-data?city=${encodeURIComponent(
            selectedCity
          )}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(
            endDate
          )}`;
          console.log("Fetching REAL city data from:", url);
        } else {
          // Fetch MOCK data from /sites
          url = `${API_BASE_URL}/sites?city=${encodeURIComponent(
            selectedCity
          )}`;
          console.log("Fetching MOCK sites data from:", url);
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        console.log("Sites data received:", json);

        if (useRealData) {
          // Transform city-data response to match sites structure
          // city-data returns aggregated data, we'll convert it to site format
          if (mounted) {
            setSitesData({
              city: json.city,
              sites:
                json.sites_included?.map((siteName) => ({
                  name: siteName,
                  pm2_5:
                    json.pm25_aggregated?.length > 0
                      ? json.pm25_aggregated[json.pm25_aggregated.length - 1]
                          ?.mean
                      : null,
                  pm10:
                    json.pm10_aggregated?.length > 0
                      ? json.pm10_aggregated[json.pm10_aggregated.length - 1]
                          ?.mean
                      : null,
                })) || [],
            });
          }
        } else {
          if (mounted) setSitesData(json);
        }
      } catch (err) {
        console.error("Error loading sites:", err);
        if (mounted) setSitesError(err.message || "Failed to load sites");
      } finally {
        if (mounted) setSitesLoading(false);
      }
    }
    loadSites();
    return () => {
      mounted = false;
    };
  }, [selectedCity, useRealData, startDate, endDate]);

  // Compute all site coordinates for map initial bounds
  const allSites = useMemo(() => {
    const arr = [];
    if (citiesData?.cities) {
      for (const c of citiesData.cities) {
        for (const s of c.sites || []) {
          arr.push({
            city: c.city,
            ...s,
            lat: s.coordinates?.lat ?? s.lat,
            lon: s.coordinates?.lon ?? s.lon,
          });
        }
      }
    }
    return arr;
  }, [citiesData]);

  // Compute Leaflet bounds from list of sites
  const mapBounds = useMemo(() => {
    if (!allSites.length) return null;
    const bounds = L.latLngBounds(
      allSites.map((s) => [s.lat || 0, s.lon || 0])
    );
    return bounds;
  }, [allSites]);

  // Compute city centroids (simple average)
  const cityCentroids = useMemo(() => {
    if (!citiesData?.cities) return [];
    return citiesData.cities.map((c) => {
      const pts = (c.sites || []).map((s) => [
        s.coordinates?.lat ?? s.lat,
        s.coordinates?.lon ?? s.lon,
      ]);
      let lat = 0,
        lon = 0;
      if (pts.length) {
        pts.forEach((p) => {
          lat += p[0];
          lon += p[1];
        });
        lat /= pts.length;
        lon /= pts.length;
      }
      return {
        city: c.city,
        lat,
        lon,
        sites_count: c.sites_count ?? c.sites?.length ?? 0,
      };
    });
  }, [citiesData]);

  // When clicking a city in sidebar, focus map on city centroid
  function focusOnCity(cityName) {
    const city = cityCentroids.find((c) => c.city === cityName);
    if (!city || !city.lat || !city.lon) return;
    // Use mapRef to flyTo
    if (mapRef.current && mapRef.current.flyTo) {
      mapRef.current.flyTo([city.lat, city.lon], 12, { duration: 0.8 });
    } else {
      // fallback: set selectedCity so MapFitter centers map (mapRef not ready)
      // We can set a fake bounds via useState if needed; for simplicity, just do nothing
    }
  }

  // Prepare data for chart
  const chartData = useMemo(() => {
    if (!sitesData?.sites) {
      console.log("No sites data for chart");
      return [];
    }
    console.log("Processing chart data from sites:", sitesData.sites);
    const data = sitesData.sites.map((s) => ({
      name: s.name,
      pm2_5: s.pm2_5 ?? s.pm25 ?? null,
      pm10: s.pm10 ?? null,
    }));
    console.log("Chart data prepared:", data);
    return data;
  }, [sitesData]);

  const averages = useMemo(() => {
    if (!sitesData?.sites || !sitesData.sites.length)
      return { pm2_5: null, pm10: null };
    let sum2 = 0,
      sum10 = 0,
      count = 0;
    sitesData.sites.forEach((s) => {
      if (typeof s.pm2_5 === "number") sum2 += s.pm2_5;
      if (typeof s.pm10 === "number") sum10 += s.pm10;
      count++;
    });
    return {
      pm2_5: +(sum2 / count).toFixed(2),
      pm10: +(sum10 / count).toFixed(2),
    };
  }, [sitesData]);

  return (
    <div className="dashboard-container p-4 md:p-6 max-w-7xl mx-auto">
      <header className="dashboard-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1>🌍 Air Quality — Raw Data Dashboard</h1>
          <nav className="tab-nav">
            <button
              className={`tab-button ${tab === "map" ? "active" : ""}`}
              onClick={() => setTab("map")}
              aria-pressed={tab === "map"}
            >
              🗺️ City Map View
            </button>
            <button
              className={`tab-button ${tab === "sites" ? "active" : ""}`}
              onClick={() => setTab("sites")}
              aria-pressed={tab === "sites"}
            >
              📊 Site Data View
            </button>
          </nav>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Left / Top region: Map or Chart */}
        <section className="md:col-span-2 space-y-4">
          {/* Card */}
          <div className="dashboard-card">
            {tab === "map" ? (
              <>
                <h2 className="card-header">City Map</h2>
                {citiesLoading ? (
                  <div className="loading-text">
                    <span className="loading-spinner"></span>
                    Loading cities…
                  </div>
                ) : citiesError ? (
                  <div className="error-message">Error: {citiesError}</div>
                ) : !citiesData ? (
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#696E79",
                      fontFamily: "TT Commons, sans-serif",
                    }}
                  >
                    No city data available.
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="stat-card">
                          <div className="stat-label">Cities</div>
                          <div className="stat-value">
                            {citiesData.total_cities ??
                              (citiesData.cities?.length || 0)}
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-label">Sites</div>
                          <div className="stat-value">
                            {citiesData.total_sites ?? allSites.length}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "#696E79",
                          fontStyle: "italic",
                          fontFamily: "TT Commons, sans-serif",
                        }}
                      >
                        💡 Click city circles to focus, markers for details
                      </div>
                    </div>

                    <div className="map-wrapper h-96 md:h-[600px]">
                      <MapContainer
                        center={[20, 78]}
                        zoom={5}
                        style={{ height: "100%", width: "100%" }}
                        whenCreated={(mapInstance) => {
                          mapRef.current = mapInstance;
                        }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Fit to all bounds initially */}
                        {mapBounds && <MapFitter bounds={mapBounds} />}

                        {/* City centroid circles (representing clusters) */}
                        {cityCentroids.map((c) => (
                          <CircleMarker
                            key={`city-${c.city}`}
                            center={[c.lat, c.lon]}
                            radius={8 + Math.min(c.sites_count, 20)}
                            pathOptions={{
                              color: "#667eea",
                              fillColor: "#a78bfa",
                              fillOpacity: 0.6,
                              weight: 2,
                            }}
                            eventHandlers={{
                              click: () => focusOnCity(c.city),
                            }}
                          >
                            <Popup>
                              <div
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#132D46",
                                  fontFamily: "TT Commons, sans-serif",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "600",
                                    fontSize: "1rem",
                                    color: "#132D46",
                                  }}
                                >
                                  {c.city}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#696E79",
                                    marginTop: "0.25rem",
                                  }}
                                >
                                  📍 {c.sites_count} monitoring sites
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    marginTop: "0.5rem",
                                    color: "#01C38D",
                                    fontWeight: "600",
                                  }}
                                >
                                  Click to focus map
                                </div>
                              </div>
                            </Popup>
                          </CircleMarker>
                        ))}

                        {/* Individual site markers */}
                        {allSites.map((s) => (
                          <Marker
                            key={s.site_id}
                            position={[s.lat, s.lon]}
                            title={`${s.name}`}
                          >
                            <Popup>
                              <div
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#132D46",
                                  fontFamily: "TT Commons, sans-serif",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "600",
                                    color: "#132D46",
                                  }}
                                >
                                  {s.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#696E79",
                                    marginTop: "0.25rem",
                                  }}
                                >
                                  📍 {s.city}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#696E79",
                                    marginTop: "0.5rem",
                                  }}
                                >
                                  Lat: {s.lat?.toFixed(5)}, Lon:{" "}
                                  {s.lon?.toFixed(5)}
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <h2 className="card-header">Site Data Analysis</h2>

                {/* Data Source Toggle and Date Pickers */}
                <div
                  className="mb-4 p-4 rounded-lg"
                  style={{
                    background: "#132D46",
                    border: "1px solid #01C38D",
                  }}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useRealData}
                          onChange={(e) => setUseRealData(e.target.checked)}
                          style={{
                            width: "1rem",
                            height: "1rem",
                            accentColor: "#01C38D",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            color: "#FFFFFF",
                            fontFamily: "TT Commons, sans-serif",
                          }}
                        >
                          {useRealData
                            ? "📡 Using Real API Data"
                            : "🎲 Using Mock Data"}
                        </span>
                      </label>
                    </div>

                    {useRealData && (
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                          <label
                            style={{
                              fontSize: "0.75rem",
                              color: "#696E79",
                              display: "block",
                              marginBottom: "0.25rem",
                              fontFamily: "TT Commons, sans-serif",
                            }}
                          >
                            Start Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={startDate.replace("T", "T")}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "0.5rem 0.75rem",
                              border: "1px solid #01C38D",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              background: "#191E29",
                              color: "#FFFFFF",
                              fontFamily: "TT Commons, sans-serif",
                              colorScheme: "dark",
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <label
                            style={{
                              fontSize: "0.75rem",
                              color: "#696E79",
                              display: "block",
                              marginBottom: "0.25rem",
                              fontFamily: "TT Commons, sans-serif",
                            }}
                          >
                            End Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={endDate.replace("T", "T")}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "0.5rem 0.75rem",
                              border: "1px solid #01C38D",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              background: "#191E29",
                              color: "#FFFFFF",
                              fontFamily: "TT Commons, sans-serif",
                              colorScheme: "dark",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <label
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#FFFFFF",
                        fontFamily: "TT Commons, sans-serif",
                      }}
                    >
                      Select City:
                    </label>
                    <select
                      className="custom-select"
                      value={selectedCity ?? ""}
                      onChange={(e) => setSelectedCity(e.target.value)}
                    >
                      {citiesData?.cities?.map((c) => (
                        <option key={c.city} value={c.city}>
                          {c.city} ({c.sites_count ?? (c.sites?.length || 0)}{" "}
                          sites)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <div className="stat-card">
                      <div className="stat-label">Avg PM2.5</div>
                      <div className="stat-value" style={{ color: "#01C38D" }}>
                        {averages.pm2_5 ?? "-"}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Avg PM10</div>
                      <div className="stat-value" style={{ color: "#01C38D" }}>
                        {averages.pm10 ?? "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="chart-container">
                  {sitesLoading ? (
                    <div className="loading-text">
                      <span className="loading-spinner"></span>
                      Loading sites…
                    </div>
                  ) : sitesError ? (
                    <div className="error-message">Error: {sitesError}</div>
                  ) : !sitesData?.sites || !sitesData.sites.length ? (
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "#696E79",
                        textAlign: "center",
                        padding: "2rem 0",
                        fontFamily: "TT Commons, sans-serif",
                      }}
                    >
                      No site data available.
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: 360 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 20, left: 10, bottom: 60 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#01C38D"
                            opacity={0.2}
                          />
                          <XAxis
                            dataKey="name"
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                            height={80}
                            tick={{
                              fill: "#FFFFFF",
                              fontSize: 12,
                              fontFamily: "TT Commons, sans-serif",
                            }}
                          />
                          <YAxis
                            tick={{
                              fill: "#FFFFFF",
                              fontSize: 12,
                              fontFamily: "TT Commons, sans-serif",
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#132D46",
                              border: "1px solid #01C38D",
                              borderRadius: "0.5rem",
                              boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                              color: "#FFFFFF",
                              fontFamily: "TT Commons, sans-serif",
                            }}
                          />
                          <Legend
                            wrapperStyle={{
                              paddingTop: "1rem",
                              color: "#FFFFFF",
                            }}
                            iconType="circle"
                          />
                          <Bar
                            dataKey="pm2_5"
                            fill="#FF7E00"
                            name="PM2.5 (µg/m³)"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="pm10"
                            fill="#01C38D"
                            name="PM10 (µg/m³)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Right / Bottom region: Summary & City list */}
        <aside className="space-y-4">
          <div className="dashboard-card">
            <h3 className="card-header text-base">📊 Summary</h3>
            {citiesLoading ? (
              <div className="loading-text">
                <span className="loading-spinner"></span>
                Loading…
              </div>
            ) : citiesError ? (
              <div className="error-message">Error: {citiesError}</div>
            ) : citiesData ? (
              <div className="space-y-2">
                <div className="summary-item">
                  <span className="font-medium">Total cities:</span>{" "}
                  {citiesData.total_cities ?? (citiesData.cities?.length || 0)}
                </div>
                <div className="summary-item">
                  <span className="font-medium">Total sites:</span>{" "}
                  {citiesData.total_sites ?? allSites.length}
                </div>
                <div className="summary-item">
                  <span className="font-medium">Data source:</span>{" "}
                  <code
                    style={{
                      fontSize: "0.75rem",
                      background: "#191E29",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      color: "#01C38D",
                      fontFamily: "monospace",
                    }}
                  >
                    /cities
                  </code>
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#696E79",
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                No data
              </div>
            )}
          </div>

          <div className="dashboard-card">
            <h3 className="card-header text-base">🏙️ Cities</h3>
            {citiesLoading ? (
              <div className="loading-text">
                <span className="loading-spinner"></span>
                Loading…
              </div>
            ) : citiesError ? (
              <div className="error-message">Error: {citiesError}</div>
            ) : !citiesData?.cities?.length ? (
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#696E79",
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                No cities
              </div>
            ) : (
              <ul className="city-list space-y-2">
                {citiesData.cities.map((c) => (
                  <li key={c.city} className="city-item">
                    <button
                      className="text-left w-full"
                      onClick={() => {
                        // switch to map tab and focus
                        setTab("map");
                        setSelectedCity((prev) => prev); // keep site selection unchanged
                        setTimeout(() => focusOnCity(c.city), 150); // slight delay to allow map tab render
                      }}
                    >
                      <div className="city-name">{c.city}</div>
                      <div className="city-meta">
                        📍 {c.sites_count ?? (c.sites?.length || 0)} monitoring
                        sites
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="info-box">
            <div className="font-semibold mb-1">ℹ️ Quick Guide</div>
            <ul className="list-disc">
              <li>Markers show site locations & details</li>
              <li>City circles represent clusters</li>
              <li>Click circles to focus on a city</li>
              <li>Switch tabs to view different data</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
