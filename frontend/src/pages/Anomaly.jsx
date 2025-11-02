import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
  Legend,
} from "recharts";

// -----------------------------------------------------
// 🧠 Simulated AQI dataset (multi-city, multi-site, multi-anomaly)
// -----------------------------------------------------
const cities = ["Pune", "Mumbai", "Delhi"];
const citySites = {
  Pune: ["Site A1", "Site A2", "Site A3"],
  Mumbai: ["Site B1", "Site B2"],
  Delhi: ["Site C1", "Site C2", "Site C3"],
};
const anomalyTypes = ["none", "spike", "drop", "sensorError"];

const generateData = () => {
  const data = [];
  let time = new Date("2025-11-02T10:00:00");

  for (let i = 0; i < 300; i++) {
    const timestamp = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    Object.entries(citySites).forEach(([city, sites]) => {
      sites.forEach((site) => {
        const pm25 = Math.max(30, Math.min(150, 60 + Math.random() * 40 + (Math.random() > 0.98 ? 50 : 0)));
        const pm10 = Math.max(40, Math.min(200, 80 + Math.random() * 60 + (Math.random() > 0.97 ? 80 : 0)));

        const pm25AnomalyType =
          Math.random() > 0.96
            ? anomalyTypes[Math.floor(Math.random() * (anomalyTypes.length - 1)) + 1]
            : "none";

        const pm10AnomalyType =
          Math.random() > 0.95
            ? anomalyTypes[Math.floor(Math.random() * (anomalyTypes.length - 1)) + 1]
            : "none";

        data.push({
          timestamp,
          city,
          site,
          pm25: Math.round(pm25),
          pm10: Math.round(pm10),
          pm25Anomaly: pm25AnomalyType,
          pm10Anomaly: pm10AnomalyType,
        });
      });
    });

    time.setMinutes(time.getMinutes() + 5);
  }

  return data;
};

const data = generateData();

// -----------------------------------------------------
// 🎨 Color scheme for each site
// -----------------------------------------------------
const siteColors = {
  "Site A1": "#60a5fa",
  "Site A2": "#34d399",
  "Site A3": "#f59e0b",
  "Site B1": "#a78bfa",
  "Site B2": "#f87171",
  "Site C1": "#22d3ee",
  "Site C2": "#4ade80",
  "Site C3": "#fb923c",
};

// -----------------------------------------------------
// 🧩 Component
// -----------------------------------------------------
const Anomaly = () => {
  const [selectedCity, setSelectedCity] = useState("Pune");
  const [selectedSite, setSelectedSite] = useState("Site A1");

  const filteredData = data.filter(
    (d) => d.city === selectedCity && d.site === selectedSite
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white px-6 py-10 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-blue-400 mb-10 tracking-wide">
        AQI Anomaly Dashboard
      </h1>

      {/* ---------------- CITY AND SITE SELECTION ---------------- */}
      <div className="flex flex-col sm:flex-row gap-6 mb-10">
        <div>
          <label className="block text-sm text-gray-300 mb-2 text-center sm:text-left">
            Select City
          </label>
          <select
            value={selectedCity}
            onChange={(e) => {
              const newCity = e.target.value;
              setSelectedCity(newCity);
              setSelectedSite(citySites[newCity][0]);
            }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2 text-center sm:text-left">
            Select Site ID
          </label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {citySites[selectedCity].map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------------- CHARTS SECTION ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full max-w-7xl">
        {/* PM2.5 CHART */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 hover:shadow-blue-500/40 transition duration-300">
          <h2 className="text-xl font-semibold mb-4 text-blue-400 text-center">
            PM2.5 Concentration — {selectedCity} ({selectedSite})
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="timestamp" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#93c5fd" }}
              />
              <Legend wrapperStyle={{ color: "white" }} />
              <Line
                type="monotone"
                dataKey="pm25"
                stroke={siteColors[selectedSite]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
              {filteredData
                .filter((d) => d.pm25Anomaly !== "none")
                .map((entry, index) => (
                  <ReferenceDot
                    key={`pm25-dot-${index}`}
                    x={entry.timestamp}
                    y={entry.pm25}
                    r={5}
                    fill={
                      entry.pm25Anomaly === "spike"
                        ? "#ef4444"
                        : entry.pm25Anomaly === "drop"
                        ? "#3b82f6"
                        : "#eab308"
                    }
                    stroke="none"
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="text-gray-400 text-sm text-center mt-3">
            Red dots = spike, Blue = drop, Yellow = sensor error.
          </p>
        </div>

        {/* PM10 CHART */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 hover:shadow-amber-500/40 transition duration-300">
          <h2 className="text-xl font-semibold mb-4 text-amber-400 text-center">
            PM10 Concentration — {selectedCity} ({selectedSite})
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="timestamp" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fcd34d" }}
              />
              <Legend wrapperStyle={{ color: "white" }} />
              <Line
                type="monotone"
                dataKey="pm10"
                stroke={siteColors[selectedSite]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
              {filteredData
                .filter((d) => d.pm10Anomaly !== "none")
                .map((entry, index) => (
                  <ReferenceDot
                    key={`pm10-dot-${index}`}
                    x={entry.timestamp}
                    y={entry.pm10}
                    r={5}
                    fill={
                      entry.pm10Anomaly === "spike"
                        ? "#f97316"
                        : entry.pm10Anomaly === "drop"
                        ? "#22d3ee"
                        : "#facc15"
                    }
                    stroke="none"
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="text-gray-400 text-sm text-center mt-3">
            Orange dots = spike, Cyan = drop, Yellow = sensor error.
          </p>
        </div>
      </div>

      <div className="text-gray-500 text-xs mt-10">
        Data displayed is simulated for demonstration only — 300+ readings across multiple sites.
      </div>
    </div>
  );
};

export default Anomaly;
