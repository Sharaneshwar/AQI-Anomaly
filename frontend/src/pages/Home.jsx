import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="dashboard-container p-4 md:p-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <header className="dashboard-header mb-6">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🌍 Air Quality Monitoring System
          </h1>
          <p className="text-lg md:text-xl text-white/90">
            Real-time air quality data analysis across major Indian cities
          </p>
        </div>
      </header>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/raw-data"
          className="dashboard-card hover:scale-105 transition-transform"
        >
          <div className="text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              Raw Data Dashboard
            </h3>
            <p className="text-gray-600">
              Interactive maps and charts showing PM2.5 and PM10 levels across
              monitoring sites
            </p>
          </div>
        </Link>

        <Link
          to="/aqi-info"
          className="dashboard-card hover:scale-105 transition-transform"
        >
          <div className="text-center">
            <div className="text-5xl mb-4">ℹ️</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              AQI Information
            </h3>
            <p className="text-gray-600">
              Learn about Air Quality Index, pollutants, and health implications
            </p>
          </div>
        </Link>

        <div className="dashboard-card">
          <div className="text-center">
            <div className="text-5xl mb-4">🔮</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              ML Predictions
            </h3>
            <p className="text-gray-600">
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
        <div className="space-y-4 text-gray-700">
          <p>
            Our Air Quality Monitoring System provides comprehensive real-time
            data from monitoring stations across{" "}
            <strong>Delhi, Mumbai, Bengaluru, Hyderabad, and Kolkata</strong>.
          </p>
          <p>
            Track PM2.5 and PM10 particulate matter levels, visualize trends,
            and understand the air quality in your city through interactive
            dashboards and detailed analytics.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">🎯 Features</h3>
              <ul className="text-sm space-y-1 text-blue-800">
                <li>• Interactive city-wide maps</li>
                <li>• Real-time pollution charts</li>
                <li>• Historical data analysis</li>
                <li>• Multiple monitoring sites</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">
                📡 Data Sources
              </h3>
              <ul className="text-sm space-y-1 text-green-800">
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
          className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          🚀 Explore Dashboard Now
        </Link>
      </div>
    </div>
  );
};

export default Home;
