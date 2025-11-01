import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="dashboard-container p-4 md:p-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <header className="dashboard-header mb-6">
        <div className="text-center">
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "600",
              fontFamily: "TT Commons, sans-serif",
              marginBottom: "1rem",
              color: "#FFFFFF",
            }}
          >
            🌍 AtmosIQ Air Quality Monitoring
          </h1>
          <p
            style={{
              fontSize: "1.25rem",
              fontFamily: "TT Commons, sans-serif",
              fontWeight: "400",
              color: "#FFFFFF",
            }}
          >
            Real-time air quality data analysis across major Indian cities
          </p>
        </div>
      </header>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/raw-data"
          className="dashboard-card hover:scale-105 transition-transform"
          style={{ textDecoration: "none" }}
        >
          <div className="text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                fontFamily: "TT Commons, sans-serif",
                marginBottom: "0.5rem",
                color: "#FFFFFF",
              }}
            >
              Raw Data Dashboard
            </h3>
            <p
              style={{
                color: "#696E79",
                fontFamily: "TT Commons, sans-serif",
                fontWeight: "400",
              }}
            >
              Interactive maps and charts showing PM2.5 and PM10 levels across
              monitoring sites
            </p>
          </div>
        </Link>

        <Link
          to="/aqi-info"
          className="dashboard-card hover:scale-105 transition-transform"
          style={{ textDecoration: "none" }}
        >
          <div className="text-center">
            <div className="text-5xl mb-4">ℹ️</div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                fontFamily: "TT Commons, sans-serif",
                marginBottom: "0.5rem",
                color: "#FFFFFF",
              }}
            >
              AQI Information
            </h3>
            <p
              style={{
                color: "#696E79",
                fontFamily: "TT Commons, sans-serif",
                fontWeight: "400",
              }}
            >
              Learn about Air Quality Index, pollutants, and health implications
            </p>
          </div>
        </Link>

        <div className="dashboard-card">
          <div className="text-center">
            <div className="text-5xl mb-4">🔮</div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                fontFamily: "TT Commons, sans-serif",
                marginBottom: "0.5rem",
                color: "#FFFFFF",
              }}
            >
              ML Predictions
            </h3>
            <p
              style={{
                color: "#696E79",
                fontFamily: "TT Commons, sans-serif",
                fontWeight: "400",
              }}
            >
              Coming soon: AI-powered air quality forecasting and trend analysis
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card text-center">
          <div className="stat-value text-3xl">5</div>
          <div className="stat-label">Cities Monitored</div>
        </div>
        <div className="stat-card text-center">
          <div className="stat-value text-3xl">95</div>
          <div className="stat-label">Active Sites</div>
        </div>
        <div className="stat-card text-center">
          <div className="stat-value text-3xl">24/7</div>
          <div className="stat-label">Real-time Data</div>
        </div>
        <div className="stat-card text-center">
          <div className="stat-value text-3xl">15min</div>
          <div className="stat-label">Update Interval</div>
        </div>
      </div>

      {/* About Section */}
      <div className="dashboard-card">
        <h2 className="card-header">About This Platform</h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            color: "#FFFFFF",
            fontFamily: "TT Commons, sans-serif",
            fontWeight: "400",
          }}
        >
          <p>
            Our Air Quality Monitoring System provides comprehensive real-time
            data from monitoring stations across{" "}
            <strong style={{ color: "#01C38D" }}>
              Delhi, Mumbai, Bengaluru, Hyderabad, and Kolkata
            </strong>
            .
          </p>
          <p>
            Track PM2.5 and PM10 particulate matter levels, visualize trends,
            and understand the air quality in your city through interactive
            dashboards and detailed analytics.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div
              style={{
                padding: "1rem",
                background: "#132D46",
                borderRadius: "0.5rem",
                border: "1px solid #01C38D",
              }}
            >
              <h3
                style={{
                  fontWeight: "600",
                  fontFamily: "TT Commons, sans-serif",
                  color: "#01C38D",
                  marginBottom: "0.5rem",
                }}
              >
                🎯 Features
              </h3>
              <ul
                style={{
                  fontSize: "0.875rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  color: "#FFFFFF",
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                <li>• Interactive city-wide maps</li>
                <li>• Real-time pollution charts</li>
                <li>• Historical data analysis</li>
                <li>• Multiple monitoring sites</li>
              </ul>
            </div>
            <div
              style={{
                padding: "1rem",
                background: "#132D46",
                borderRadius: "0.5rem",
                border: "1px solid #01C38D",
              }}
            >
              <h3
                style={{
                  fontWeight: "600",
                  fontFamily: "TT Commons, sans-serif",
                  color: "#01C38D",
                  marginBottom: "0.5rem",
                }}
              >
                📡 Data Sources
              </h3>
              <ul
                style={{
                  fontSize: "0.875rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  color: "#FFFFFF",
                  fontFamily: "TT Commons, sans-serif",
                }}
              >
                <li>• CPCB monitoring stations</li>
                <li>• State pollution boards</li>
                <li>• 15-minute data intervals</li>
                <li>• Validated measurements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-8 text-center">
        <Link
          to="/raw-data"
          style={{
            display: "inline-block",
            padding: "1rem 2rem",
            background: "#01C38D",
            color: "#132D46",
            fontFamily: "TT Commons, sans-serif",
            fontWeight: "600",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 12px rgba(1, 195, 141, 0.3)",
            textDecoration: "none",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05)";
            e.target.style.boxShadow = "0 6px 16px rgba(1, 195, 141, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 4px 12px rgba(1, 195, 141, 0.3)";
          }}
        >
          🚀 Explore Dashboard Now
        </Link>
      </div>
    </div>
  );
};

export default Home;
