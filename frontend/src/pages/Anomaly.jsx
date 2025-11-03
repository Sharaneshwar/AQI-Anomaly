import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Scatter,
  ComposedChart,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// -----------------------------------------------------
// 🤖 ML Route Response (Dummy Data for Demonstration)
// Each represents a different timestamp/scenario
// -----------------------------------------------------
const DUMMY_ML_RESPONSE = {
  site_104: [
    // Normal scenario - early morning
    {
      site_id: "site_104",
      pollutant: "pm2.5cnc",
      last_timestamp: "2025-11-02 06:00:00",
      current_value: 35.2,
      anomaly_detector: {
        methods: {
          extreme_value: 0.0,
          seasonal_deviation: 0.0,
          spatial_divergence: 0.0,
          dynamic_change: 0.0,
          isolation_forest: 0.0,
          statistical_outlier: 0.0,
        },
        scores: {
          isolation_score: -0.42,
        },
        ensemble_score: 0.0,
        is_anomaly: false,
        severity: "normal",
        confidence: 0.98,
      },
      risk_evaluator: {
        anomaly_probability: 0.008,
        risk_level: "low",
        horizon_hours: 6,
      },
      predictor: [
        { step: 1, minutes_ahead: 15, predicted_value: 38.5 },
        { step: 2, minutes_ahead: 30, predicted_value: 42.3 },
        { step: 3, minutes_ahead: 45, predicted_value: 45.8 },
        { step: 4, minutes_ahead: 60, predicted_value: 48.2 },
      ],
    },
    // Moderate increase
    {
      site_id: "site_104",
      pollutant: "pm2.5cnc",
      last_timestamp: "2025-11-02 09:00:00",
      current_value: 68.5,
      anomaly_detector: {
        methods: {
          extreme_value: 0.0,
          seasonal_deviation: 0.2,
          spatial_divergence: 0.1,
          dynamic_change: 0.3,
          isolation_forest: 0.0,
          statistical_outlier: 0.0,
        },
        scores: {
          isolation_score: -0.15,
        },
        ensemble_score: 0.15,
        is_anomaly: false,
        severity: "normal",
        confidence: 0.92,
      },
      risk_evaluator: {
        anomaly_probability: 0.12,
        risk_level: "low",
        horizon_hours: 6,
      },
      predictor: [
        { step: 1, minutes_ahead: 15, predicted_value: 72.1 },
        { step: 2, minutes_ahead: 30, predicted_value: 75.8 },
        { step: 3, minutes_ahead: 45, predicted_value: 78.9 },
        { step: 4, minutes_ahead: 60, predicted_value: 81.5 },
      ],
    },
    // High pollution - potential anomaly
    {
      site_id: "site_104",
      pollutant: "pm2.5cnc",
      last_timestamp: "2025-11-02 12:00:00",
      current_value: 125.3,
      anomaly_detector: {
        methods: {
          extreme_value: 0.8,
          seasonal_deviation: 0.6,
          spatial_divergence: 0.7,
          dynamic_change: 0.9,
          isolation_forest: 0.75,
          statistical_outlier: 0.85,
        },
        scores: {
          isolation_score: 0.68,
        },
        ensemble_score: 0.76,
        is_anomaly: true,
        severity: "high",
        confidence: 0.88,
      },
      risk_evaluator: {
        anomaly_probability: 0.78,
        risk_level: "high",
        horizon_hours: 6,
      },
      predictor: [
        { step: 1, minutes_ahead: 15, predicted_value: 132.5 },
        { step: 2, minutes_ahead: 30, predicted_value: 138.2 },
        { step: 3, minutes_ahead: 45, predicted_value: 142.8 },
        { step: 4, minutes_ahead: 60, predicted_value: 145.6 },
      ],
    },
    // Anomaly detected - spike event
    {
      site_id: "site_104",
      pollutant: "pm2.5cnc",
      last_timestamp: "2025-11-02 15:00:00",
      current_value: 185.7,
      anomaly_detector: {
        methods: {
          extreme_value: 1.0,
          seasonal_deviation: 0.95,
          spatial_divergence: 0.88,
          dynamic_change: 1.0,
          isolation_forest: 0.92,
          statistical_outlier: 0.98,
        },
        scores: {
          isolation_score: 0.89,
        },
        ensemble_score: 0.95,
        is_anomaly: true,
        severity: "critical",
        confidence: 0.96,
      },
      risk_evaluator: {
        anomaly_probability: 0.95,
        risk_level: "critical",
        horizon_hours: 6,
      },
      predictor: [
        { step: 1, minutes_ahead: 15, predicted_value: 178.2 },
        { step: 2, minutes_ahead: 30, predicted_value: 165.4 },
        { step: 3, minutes_ahead: 45, predicted_value: 152.8 },
        { step: 4, minutes_ahead: 60, predicted_value: 140.5 },
      ],
    },
    // Recovery phase
    {
      site_id: "site_104",
      pollutant: "pm2.5cnc",
      last_timestamp: "2025-11-02 18:00:00",
      current_value: 92.4,
      anomaly_detector: {
        methods: {
          extreme_value: 0.3,
          seasonal_deviation: 0.4,
          spatial_divergence: 0.2,
          dynamic_change: 0.5,
          isolation_forest: 0.25,
          statistical_outlier: 0.3,
        },
        scores: {
          isolation_score: 0.15,
        },
        ensemble_score: 0.33,
        is_anomaly: false,
        severity: "moderate",
        confidence: 0.85,
      },
      risk_evaluator: {
        anomaly_probability: 0.28,
        risk_level: "moderate",
        horizon_hours: 6,
      },
      predictor: [
        { step: 1, minutes_ahead: 15, predicted_value: 85.6 },
        { step: 2, minutes_ahead: 30, predicted_value: 78.2 },
        { step: 3, minutes_ahead: 45, predicted_value: 72.5 },
        { step: 4, minutes_ahead: 60, predicted_value: 68.3 },
      ],
    },
    // Evening - back to normal
    {
      site_id: "site_104",
      pollutant: "pm2.5cnc",
      last_timestamp: "2025-11-02 21:00:00",
      current_value: 45.8,
      anomaly_detector: {
        methods: {
          extreme_value: 0.0,
          seasonal_deviation: 0.0,
          spatial_divergence: 0.0,
          dynamic_change: 0.0,
          isolation_forest: 0.0,
          statistical_outlier: 0.0,
        },
        scores: {
          isolation_score: -0.38,
        },
        ensemble_score: 0.0,
        is_anomaly: false,
        severity: "normal",
        confidence: 0.97,
      },
      risk_evaluator: {
        anomaly_probability: 0.015,
        risk_level: "low",
        horizon_hours: 6,
      },
      predictor: [
        { step: 1, minutes_ahead: 15, predicted_value: 42.5 },
        { step: 2, minutes_ahead: 30, predicted_value: 39.8 },
        { step: 3, minutes_ahead: 45, predicted_value: 37.2 },
        { step: 4, minutes_ahead: 60, predicted_value: 35.6 },
      ],
    },
  ],
  // Add more sites as needed
};

// -----------------------------------------------------
// 🧠 Dummy data matching your actual city/site structure
// -----------------------------------------------------
const DUMMY_CITIES_DATA = {
  cities: [
    {
      city: "Delhi",
      sites: [
        {
          site_id: "site_104",
          name: "Burari Crossing, Delhi - IMD",
          pm2_5: 85,
          pm10: 120,
        },
        {
          site_id: "site_106",
          name: "IGI Airport (T3), Delhi - IMD",
          pm2_5: 65,
          pm10: 95,
        },
        {
          site_id: "site_113",
          name: "Shadipur, Delhi - CPCB",
          pm2_5: 95,
          pm10: 145,
        },
        {
          site_id: "site_301",
          name: "Anand Vihar, Delhi - DPCC",
          pm2_5: 125,
          pm10: 180,
        },
        {
          site_id: "site_1420",
          name: "Ashok Vihar, Delhi - DPCC",
          pm2_5: 88,
          pm10: 130,
        },
      ],
    },
    {
      city: "Mumbai",
      sites: [
        {
          site_id: "site_5102",
          name: "Vasai West, Mumbai - MPCB",
          pm2_5: 55,
          pm10: 85,
        },
        {
          site_id: "site_5104",
          name: "Kurla, Mumbai - MPCB",
          pm2_5: 72,
          pm10: 110,
        },
        {
          site_id: "site_5106",
          name: "Vile Parle West, Mumbai - MPCB",
          pm2_5: 68,
          pm10: 95,
        },
        {
          site_id: "site_5115",
          name: "Worli, Mumbai - MPCB",
          pm2_5: 60,
          pm10: 88,
        },
        {
          site_id: "site_5120",
          name: "Colaba, Mumbai - MPCB",
          pm2_5: 52,
          pm10: 78,
        },
      ],
    },
    {
      city: "Bengaluru",
      sites: [
        {
          site_id: "site_162",
          name: "BTM Layout, Bengaluru - CPCB",
          pm2_5: 48,
          pm10: 72,
        },
        {
          site_id: "site_163",
          name: "Peenya, Bengaluru - CPCB",
          pm2_5: 62,
          pm10: 95,
        },
        {
          site_id: "site_1553",
          name: "Bapuji Nagar, Bengaluru - KSPCB",
          pm2_5: 55,
          pm10: 82,
        },
        {
          site_id: "site_1554",
          name: "Hebbal, Bengaluru - KSPCB",
          pm2_5: 58,
          pm10: 88,
        },
        {
          site_id: "site_1558",
          name: "Silk Board, Bengaluru - KSPCB",
          pm2_5: 70,
          pm10: 105,
        },
      ],
    },
    {
      city: "Hyderabad",
      sites: [
        {
          site_id: "site_199",
          name: "Bollaram Industrial Area, Hyderabad - TSPCB",
          pm2_5: 75,
          pm10: 115,
        },
        {
          site_id: "site_262",
          name: "Central University, Hyderabad - TSPCB",
          pm2_5: 52,
          pm10: 78,
        },
        {
          site_id: "site_294",
          name: "Sanathnagar, Hyderabad - TSPCB",
          pm2_5: 68,
          pm10: 102,
        },
        {
          site_id: "site_298",
          name: "Zoo Park, Hyderabad - TSPCB",
          pm2_5: 58,
          pm10: 85,
        },
        {
          site_id: "site_5598",
          name: "Somajiguda, Hyderabad - TSPCB",
          pm2_5: 65,
          pm10: 95,
        },
      ],
    },
    {
      city: "Kolkata",
      sites: [
        {
          site_id: "site_296",
          name: "Rabindra Bharati University, Kolkata - WBPCB",
          pm2_5: 78,
          pm10: 118,
        },
        {
          site_id: "site_309",
          name: "Victoria, Kolkata - WBPCB",
          pm2_5: 82,
          pm10: 125,
        },
        {
          site_id: "site_5110",
          name: "Fort William, Kolkata - WBPCB",
          pm2_5: 72,
          pm10: 108,
        },
        {
          site_id: "site_5111",
          name: "Jadavpur, Kolkata - WBPCB",
          pm2_5: 88,
          pm10: 135,
        },
        {
          site_id: "site_5126",
          name: "Rabindra Sarobar, Kolkata - WBPCB",
          pm2_5: 65,
          pm10: 98,
        },
      ],
    },
  ],
};

// -----------------------------------------------------
// 🎨 Color scheme for sites
// -----------------------------------------------------
const getColorForSite = (index) => {
  const colors = [
    "#60a5fa",
    "#34d399",
    "#f59e0b",
    "#a78bfa",
    "#f87171",
    "#22d3ee",
    "#4ade80",
    "#fb923c",
    "#c084fc",
    "#fbbf24",
    "#38bdf8",
    "#86efac",
    "#fb7185",
    "#a3e635",
    "#facc15",
  ];
  return colors[index % colors.length];
};

// -----------------------------------------------------
// 🧩 Component
// -----------------------------------------------------
const Anomaly = () => {
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [selectedSite, setSelectedSite] = useState("site_104");

  // Get current city's sites
  const currentCitySites = useMemo(() => {
    const city = DUMMY_CITIES_DATA.cities.find((c) => c.city === selectedCity);
    return city?.sites || [];
  }, [selectedCity]);

  // Handle city change
  const handleCityChange = (e) => {
    const newCity = e.target.value;
    setSelectedCity(newCity);
    // Set first site of new city as selected
    const city = DUMMY_CITIES_DATA.cities.find((c) => c.city === newCity);
    if (city?.sites?.length > 0) {
      setSelectedSite(city.sites[0].site_id);
    }
  };

  // Get ML data for selected site
  const mlDataArray = useMemo(() => {
    return DUMMY_ML_RESPONSE[selectedSite] || [];
  }, [selectedSite]);

  // Currently selected data point (start with latest)
  const [selectedDataIndex, setSelectedDataIndex] = useState(0);

  // Get currently selected ML data point
  const mlData = useMemo(() => {
    if (!mlDataArray.length) return null;
    return mlDataArray[selectedDataIndex];
  }, [mlDataArray, selectedDataIndex]);

  // Create timeline data for visualization
  const timelineData = useMemo(() => {
    return mlDataArray.map((data, index) => ({
      time: new Date(data.last_timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: data.last_timestamp,
      value: data.current_value,
      isAnomaly: data.anomaly_detector.is_anomaly,
      severity: data.anomaly_detector.severity,
      ensembleScore: data.anomaly_detector.ensemble_score,
      riskLevel: data.risk_evaluator.risk_level,
      index: index,
    }));
  }, [mlDataArray]);

  // Prepare prediction chart data
  const predictionData = useMemo(() => {
    if (!mlData) return [];

    const currentTime = new Date(mlData.last_timestamp);
    const data = [
      {
        time: "Current",
        value: mlData.current_value,
        type: "current",
      },
    ];

    mlData.predictor.forEach((pred) => {
      const futureTime = new Date(
        currentTime.getTime() + pred.minutes_ahead * 60000
      );
      data.push({
        time: `+${pred.minutes_ahead}m`,
        value: parseFloat(pred.predicted_value.toFixed(2)),
        type: "predicted",
      });
    });

    return data;
  }, [mlData]);

  // Prepare anomaly detection methods data
  const anomalyMethodsData = useMemo(() => {
    if (!mlData) return [];

    return Object.entries(mlData.anomaly_detector.methods).map(
      ([method, score]) => ({
        method: method
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        score: score,
      })
    );
  }, [mlData]);

  // Get current site name
  const currentSiteName = useMemo(() => {
    const site = currentCitySites.find((s) => s.site_id === selectedSite);
    return site?.name || selectedSite;
  }, [currentCitySites, selectedSite]);

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "normal":
        return "#00E400";
      case "moderate":
        return "#FFFF00";
      case "high":
        return "#FF7E00";
      case "critical":
        return "#FF0000";
      default:
        return "#696E79";
    }
  };

  // Get risk level color
  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case "low":
        return "#00E400";
      case "moderate":
        return "#FFFF00";
      case "high":
        return "#FF7E00";
      case "critical":
        return "#FF0000";
      default:
        return "#696E79";
    }
  };

  // Generate simulated anomaly data for selected site (OLD - keeping for reference)
  const generateData = useMemo(() => {
    if (!currentCitySites.length || !selectedSite) return [];

    const site = currentCitySites.find((s) => s.site_id === selectedSite);
    if (!site) return [];

    const data = [];
    let time = new Date();
    time.setHours(time.getHours() - 25); // Start 25 hours ago

    for (let i = 0; i < 300; i++) {
      const timestamp = time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // Use site's actual PM values as baseline, with variation
      const basePM25 = site.pm2_5 || 60;
      const basePM10 = site.pm10 || 80;

      const pm25 = Math.max(
        20,
        Math.min(
          200,
          basePM25 +
            (Math.random() - 0.5) * 40 +
            (Math.random() > 0.98 ? 60 : 0)
        )
      );
      const pm10 = Math.max(
        30,
        Math.min(
          300,
          basePM10 +
            (Math.random() - 0.5) * 60 +
            (Math.random() > 0.97 ? 80 : 0)
        )
      );

      const pm25AnomalyType =
        Math.random() > 0.96
          ? ["spike", "drop", "sensorError"][Math.floor(Math.random() * 3)]
          : "none";

      const pm10AnomalyType =
        Math.random() > 0.95
          ? ["spike", "drop", "sensorError"][Math.floor(Math.random() * 3)]
          : "none";

      data.push({
        timestamp,
        pm25: Math.round(pm25),
        pm10: Math.round(pm10),
        pm25Anomaly: pm25AnomalyType,
        pm10Anomaly: pm10AnomalyType,
      });

      time.setMinutes(time.getMinutes() + 5);
    }

    return data;
  }, [currentCitySites, selectedSite]);

  // Extract anomaly points for PM2.5
  const pm25Anomalies = useMemo(() => {
    return generateData
      .map((d, idx) => ({
        timestamp: d.timestamp,
        value: d.pm25,
        type: d.pm25Anomaly,
        index: idx,
      }))
      .filter((d) => d.type !== "none");
  }, [generateData]);

  // Extract anomaly points for PM10
  const pm10Anomalies = useMemo(() => {
    return generateData
      .map((d, idx) => ({
        timestamp: d.timestamp,
        value: d.pm10,
        type: d.pm10Anomaly,
        index: idx,
      }))
      .filter((d) => d.type !== "none");
  }, [generateData]);

  // Get color for current site
  const currentSiteColor = useMemo(() => {
    const siteIndex = currentCitySites.findIndex(
      (s) => s.site_id === selectedSite
    );
    return getColorForSite(siteIndex);
  }, [currentCitySites, selectedSite]);

  return (
    <div className="min-h-screen dashboard-container px-6 py-10 flex flex-col items-center">
      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: "600",
          fontFamily: "TT Commons, sans-serif",
          color: "#01C38D",
          marginBottom: "2.5rem",
          letterSpacing: "0.5px",
        }}
      >
        🔍 AQI Anomaly Detection Dashboard
      </h1>

      {/* ---------------- CITY AND SITE SELECTION ---------------- */}
      <div className="flex flex-col sm:flex-row gap-6 mb-10">
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              color: "#696E79",
              marginBottom: "0.5rem",
              textAlign: "center",
              fontFamily: "TT Commons, sans-serif",
            }}
          >
            Select City
          </label>
          <select
            value={selectedCity}
            onChange={handleCityChange}
            className="custom-select"
          >
            {DUMMY_CITIES_DATA.cities.map((cityObj) => (
              <option key={cityObj.city} value={cityObj.city}>
                {cityObj.city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              color: "#696E79",
              marginBottom: "0.5rem",
              textAlign: "center",
              fontFamily: "TT Commons, sans-serif",
            }}
          >
            Select Monitoring Site
          </label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="custom-select"
          >
            {currentCitySites.map((site) => (
              <option key={site.site_id} value={site.site_id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------------- TIMELINE CHART ---------------- */}
      {timelineData.length > 0 && (
        <div className="dashboard-card w-full max-w-7xl mb-10">
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#01C38D",
              textAlign: "center",
              fontFamily: "TT Commons, sans-serif",
            }}
          >
            PM2.5 Timeline — {currentSiteName}
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#696E79",
              textAlign: "center",
              marginBottom: "1.5rem",
              fontFamily: "TT Commons, sans-serif",
            }}
          >
            Click on any point to view detailed analysis
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={timelineData}
              onClick={(data) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  setSelectedDataIndex(data.activePayload[0].payload.index);
                }
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#01C38D"
                opacity={0.2}
              />
              <XAxis
                dataKey="time"
                stroke="#FFFFFF"
                style={{
                  fontSize: "12px",
                  fontFamily: "TT Commons, sans-serif",
                }}
              />
              <YAxis
                stroke="#FFFFFF"
                label={{
                  value: "PM2.5 (µg/m³)",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    fill: "#FFFFFF",
                    fontFamily: "TT Commons, sans-serif",
                  },
                }}
                style={{
                  fontSize: "12px",
                  fontFamily: "TT Commons, sans-serif",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#132D46",
                  border: "1px solid #01C38D",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontFamily: "TT Commons, sans-serif",
                }}
                labelStyle={{ color: "#01C38D" }}
                formatter={(value, name, props) => {
                  if (typeof value === "number") {
                    return [
                      `${value.toFixed(2)} µg/m³`,
                      props.payload.isAnomaly ? "⚠️ ANOMALY" : "Normal",
                    ];
                  }
                  return [value, name];
                }}
              />
              <Legend
                wrapperStyle={{
                  color: "#FFFFFF",
                  fontFamily: "TT Commons, sans-serif",
                }}
              />
              {/* Line for PM2.5 values */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#01C38D"
                strokeWidth={3}
                dot={false}
                name="PM2.5 Concentration"
              />
              {/* Scatter for Normal points */}
              <Scatter
                data={timelineData.filter((d) => !d.isAnomaly)}
                dataKey="value"
                fill="#00E400"
                shape="circle"
                r={6}
                name="Normal"
              />
              {/* Scatter for Anomaly points */}
              <Scatter
                data={timelineData.filter((d) => d.isAnomaly)}
                dataKey="value"
                fill="#FF0000"
                shape="diamond"
                r={10}
                name="Anomaly Detected"
              />
              {/* Highlight selected point */}
              <Scatter
                data={[timelineData[selectedDataIndex]]}
                dataKey="value"
                fill="#FFFF00"
                shape="star"
                r={12}
                name="Selected"
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Navigation Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            <button
              onClick={() =>
                setSelectedDataIndex(Math.max(0, selectedDataIndex - 1))
              }
              disabled={selectedDataIndex === 0}
              style={{
                backgroundColor:
                  selectedDataIndex === 0 ? "#696E79" : "#01C38D",
                color: "#FFFFFF",
                padding: "0.5rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                cursor: selectedDataIndex === 0 ? "not-allowed" : "pointer",
                fontFamily: "TT Commons, sans-serif",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              ← Previous
            </button>
            <span
              style={{
                color: "#FFFFFF",
                fontFamily: "TT Commons, sans-serif",
                fontSize: "0.875rem",
              }}
            >
              {selectedDataIndex + 1} / {timelineData.length}
            </span>
            <button
              onClick={() =>
                setSelectedDataIndex(
                  Math.min(timelineData.length - 1, selectedDataIndex + 1)
                )
              }
              disabled={selectedDataIndex === timelineData.length - 1}
              style={{
                backgroundColor:
                  selectedDataIndex === timelineData.length - 1
                    ? "#696E79"
                    : "#01C38D",
                color: "#FFFFFF",
                padding: "0.5rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                cursor:
                  selectedDataIndex === timelineData.length - 1
                    ? "not-allowed"
                    : "pointer",
                fontFamily: "TT Commons, sans-serif",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ---------------- ML ANALYSIS CARDS ---------------- */}
      {mlData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl mb-10">
          {/* Current Status Card */}
          <div className="dashboard-card">
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#01C38D",
                marginBottom: "1rem",
                fontFamily: "TT Commons, sans-serif",
                textAlign: "center",
              }}
            >
              Current Status
            </h3>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "600",
                  color: getSeverityColor(mlData.anomaly_detector.severity),
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                {mlData.current_value.toFixed(1)}
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#696E79",
                  marginTop: "0.5rem",
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                µg/m³ PM2.5
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#FFFFFF",
                  marginTop: "1rem",
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                Last Updated: {new Date(mlData.last_timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Anomaly Detection Card */}
          <div className="dashboard-card">
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#01C38D",
                marginBottom: "1rem",
                fontFamily: "TT Commons, sans-serif",
                textAlign: "center",
              }}
            >
              Anomaly Detection
            </h3>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: mlData.anomaly_detector.is_anomaly
                    ? "#FF0000"
                    : "#00E400",
                  fontFamily: "TT Commons, sans-serif",
                  marginBottom: "0.5rem",
                }}
              >
                {mlData.anomaly_detector.is_anomaly
                  ? "⚠️ ANOMALY DETECTED"
                  : "✓ NORMAL"}
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#FFFFFF",
                  marginTop: "0.5rem",
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                Severity:{" "}
                <span
                  style={{
                    color: getSeverityColor(mlData.anomaly_detector.severity),
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  {mlData.anomaly_detector.severity}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#FFFFFF",
                  marginTop: "0.25rem",
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                Confidence:{" "}
                {(mlData.anomaly_detector.confidence * 100).toFixed(1)}%
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#FFFFFF",
                  marginTop: "0.25rem",
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                Ensemble Score:{" "}
                {mlData.anomaly_detector.ensemble_score.toFixed(3)}
              </div>
            </div>
          </div>

          {/* Risk Evaluation Card */}
          <div className="dashboard-card">
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#01C38D",
                marginBottom: "1rem",
                fontFamily: "TT Commons, sans-serif",
                textAlign: "center",
              }}
            >
              Risk Assessment
            </h3>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: getRiskColor(mlData.risk_evaluator.risk_level),
                  fontFamily: "TT Commons, sans-serif",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem",
                }}
              >
                {mlData.risk_evaluator.risk_level} RISK
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#FFFFFF",
                  marginTop: "0.5rem",
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                Anomaly Probability:{" "}
                {(mlData.risk_evaluator.anomaly_probability * 100).toFixed(2)}%
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#696E79",
                  marginTop: "0.25rem",
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                Forecast Horizon: {mlData.risk_evaluator.horizon_hours} hours
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- CHARTS SECTION ---------------- */}
      {mlData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full max-w-7xl mb-10">
          {/* Prediction Chart */}
          <div className="dashboard-card">
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#01C38D",
                textAlign: "center",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              PM2.5 Predictions — Next Hour
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#696E79",
                textAlign: "center",
                marginBottom: "1rem",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              {currentSiteName}
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={predictionData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#01C38D"
                  opacity={0.2}
                />
                <XAxis
                  dataKey="time"
                  stroke="#FFFFFF"
                  style={{
                    fontSize: "12px",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                />
                <YAxis
                  stroke="#FFFFFF"
                  label={{
                    value: "PM2.5 (µg/m³)",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fill: "#FFFFFF",
                      fontFamily: "TT Commons, sans-serif",
                    },
                  }}
                  style={{
                    fontSize: "12px",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#132D46",
                    border: "1px solid #01C38D",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                  labelStyle={{ color: "#01C38D" }}
                />
                <Legend
                  wrapperStyle={{
                    color: "#FFFFFF",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#01C38D"
                  strokeWidth={3}
                  dot={{ fill: "#01C38D", r: 6 }}
                  activeDot={{ r: 8 }}
                  name="PM2.5 Value"
                />
                <Scatter
                  data={predictionData.filter((d) => d.type === "current")}
                  dataKey="value"
                  fill="#FF7E00"
                  shape="circle"
                  r={10}
                  name="Current Value"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <p
              style={{
                color: "#696E79",
                fontSize: "0.75rem",
                textAlign: "center",
                marginTop: "0.75rem",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              🟠 Orange = Current Value | 🔵 Teal = Predicted Values
            </p>
          </div>

          {/* Anomaly Detection Methods Chart */}
          <div className="dashboard-card">
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#01C38D",
                textAlign: "center",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              Detection Method Scores
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#696E79",
                textAlign: "center",
                marginBottom: "1rem",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              Anomaly Detection Analysis
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={anomalyMethodsData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#01C38D"
                  opacity={0.2}
                />
                <XAxis
                  type="number"
                  stroke="#FFFFFF"
                  style={{
                    fontSize: "12px",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="method"
                  stroke="#FFFFFF"
                  width={150}
                  style={{
                    fontSize: "11px",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#132D46",
                    border: "1px solid #01C38D",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                  cursor={{ fill: "rgba(1, 195, 141, 0.1)" }}
                />
                <Bar dataKey="score" name="Anomaly Score">
                  {anomalyMethodsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.score > 0.5 ? "#FF0000" : "#01C38D"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p
              style={{
                color: "#696E79",
                fontSize: "0.75rem",
                textAlign: "center",
                marginTop: "0.75rem",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              🔵 Teal = Normal | 🔴 Red = Anomaly Detected
            </p>
          </div>
        </div>
      )}

      {/* ---------------- OLD SIMULATED CHARTS (Hidden for now) ---------------- */}
      <div style={{ display: "none" }}>
        {/* Keep old chart code below for reference, hidden */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full max-w-7xl">
          {/* PM2.5 CHART */}
          <div className="dashboard-card">
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#01C38D",
                textAlign: "center",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              PM2.5 Concentration — {selectedCity}
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#696E79",
                textAlign: "center",
                marginBottom: "1rem",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              {currentSiteName}
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={generateData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#01C38D"
                  opacity={0.2}
                />
                <XAxis
                  dataKey="timestamp"
                  stroke="#FFFFFF"
                  style={{
                    fontSize: "12px",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                />
                <YAxis
                  stroke="#FFFFFF"
                  style={{
                    fontSize: "12px",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#132D46",
                    border: "1px solid #01C38D",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                  labelStyle={{ color: "#01C38D" }}
                />
                <Legend
                  wrapperStyle={{
                    color: "#FFFFFF",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pm25"
                  stroke={currentSiteColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  name="PM2.5 (µg/m³)"
                />
                {/* Spike Anomalies - Red */}
                <Scatter
                  data={pm25Anomalies.filter((a) => a.type === "spike")}
                  dataKey="value"
                  fill="#FF0000"
                  shape="circle"
                  r={8}
                  name="Spike"
                />
                {/* Drop Anomalies - Green */}
                <Scatter
                  data={pm25Anomalies.filter((a) => a.type === "drop")}
                  dataKey="value"
                  fill="#00E400"
                  shape="circle"
                  r={8}
                  name="Drop"
                />
                {/* Sensor Error - Yellow */}
                <Scatter
                  data={pm25Anomalies.filter((a) => a.type === "sensorError")}
                  dataKey="value"
                  fill="#FFFF00"
                  shape="circle"
                  r={8}
                  name="Sensor Error"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <p
              style={{
                color: "#696E79",
                fontSize: "0.75rem",
                textAlign: "center",
                marginTop: "0.75rem",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              🔴 Red = spike anomaly | 🟢 Green = drop anomaly | 🟡 Yellow =
              sensor error
            </p>
          </div>

          {/* PM10 CHART */}
          <div className="dashboard-card">
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#01C38D",
                textAlign: "center",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              PM10 Concentration — {selectedCity}
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#696E79",
                textAlign: "center",
                marginBottom: "1rem",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              {currentSiteName}
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={generateData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#01C38D"
                  opacity={0.2}
                />
                <XAxis
                  dataKey="timestamp"
                  stroke="#FFFFFF"
                  style={{
                    fontSize: "12px",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                />
                <YAxis
                  stroke="#FFFFFF"
                  style={{
                    fontSize: "12px",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#132D46",
                    border: "1px solid #01C38D",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                  labelStyle={{ color: "#01C38D" }}
                />
                <Legend
                  wrapperStyle={{
                    color: "#FFFFFF",
                    fontFamily: "TT Commons, sans-serif",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pm10"
                  stroke={currentSiteColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  name="PM10 (µg/m³)"
                />
                {/* Spike Anomalies - Orange */}
                <Scatter
                  data={pm10Anomalies.filter((a) => a.type === "spike")}
                  dataKey="value"
                  fill="#FF7E00"
                  shape="circle"
                  r={8}
                  name="Spike"
                />
                {/* Drop Anomalies - Cyan */}
                <Scatter
                  data={pm10Anomalies.filter((a) => a.type === "drop")}
                  dataKey="value"
                  fill="#01C38D"
                  shape="circle"
                  r={8}
                  name="Drop"
                />
                {/* Sensor Error - Yellow */}
                <Scatter
                  data={pm10Anomalies.filter((a) => a.type === "sensorError")}
                  dataKey="value"
                  fill="#FFFF00"
                  shape="circle"
                  r={8}
                  name="Sensor Error"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <p
              style={{
                color: "#696E79",
                fontSize: "0.75rem",
                textAlign: "center",
                marginTop: "0.75rem",
                fontFamily: "TT Commons, sans-serif",
              }}
            >
              🟠 Orange = spike anomaly | 🔵 Cyan = drop anomaly | 🟡 Yellow =
              sensor error
            </p>
          </div>
        </div>
      </div>
      {/* End of hidden old charts */}

      {/* ---------------- INFO BOX ---------------- */}
      <div className="info-box mt-10" style={{ maxWidth: "900px" }}>
        <div
          style={{
            fontWeight: "600",
            marginBottom: "0.5rem",
            fontFamily: "TT Commons, sans-serif",
            color: "#01C38D",
          }}
        >
          ℹ️ About ML-Based Anomaly Detection
        </div>
        <p
          style={{
            fontFamily: "TT Commons, sans-serif",
            color: "#FFFFFF",
            fontSize: "0.875rem",
          }}
        >
          This dashboard uses machine learning to detect anomalies in real-time
          air quality data from {currentCitySites.length} monitoring sites in{" "}
          {selectedCity}. The system employs{" "}
          <strong style={{ color: "#01C38D" }}>6 detection methods</strong>{" "}
          (Extreme Value, Seasonal Deviation, Spatial Divergence, Dynamic
          Change, Isolation Forest, Statistical Outlier) combined into an
          ensemble score. The{" "}
          <strong style={{ color: "#01C38D" }}>risk evaluator</strong> forecasts
          anomaly probability over the next{" "}
          {mlData?.risk_evaluator.horizon_hours || 6} hours, while the{" "}
          <strong style={{ color: "#01C38D" }}>predictor</strong> provides PM2.5
          concentration forecasts in 15-minute intervals.
        </p>
      </div>
    </div>
  );
};

export default Anomaly;
