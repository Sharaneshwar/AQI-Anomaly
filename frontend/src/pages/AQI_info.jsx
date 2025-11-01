import React from "react";

const AQI_info = () => {
  const textStyle = {
    fontFamily: "TT Commons, sans-serif",
    fontWeight: "400",
    color: "#FFFFFF",
  };

  const headingStyle = {
    fontFamily: "TT Commons, sans-serif",
    fontWeight: "600",
    color: "#FFFFFF",
  };

  return (
    <div className="dashboard-container p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="dashboard-header mb-6">
        <h1
          style={{
            fontSize: "2rem",
            fontFamily: "TT Commons, sans-serif",
            fontWeight: "600",
            color: "#FFFFFF",
          }}
        >
          ℹ️ Air Quality Index Information
        </h1>
        <p
          style={{
            ...textStyle,
            marginTop: "0.5rem",
            fontSize: "1.1rem",
          }}
        >
          Understanding air pollution and its health impacts
        </p>
      </header>

      {/* AQI Scale */}
      <div className="dashboard-card mb-6">
        <h2 className="card-header">AQI Categories & Health Implications</h2>
        <div className="space-y-3">
          <div
            className="flex items-center gap-4 p-4 rounded-lg"
            style={{ backgroundColor: "#00E400", color: "#132D46" }}
          >
            <div
              className="shrink-0 w-24 text-center font-bold"
              style={{
                fontFamily: "TT Commons, sans-serif",
                fontWeight: "600",
              }}
            >
              0-50
            </div>
            <div className="flex-1">
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  color: "#132D46",
                }}
              >
                Good
              </h3>
              <p
                style={{ ...textStyle, fontSize: "0.875rem", color: "#132D46" }}
              >
                Air quality is satisfactory, and air pollution poses little or
                no risk.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-4 p-4 rounded-lg"
            style={{ backgroundColor: "#FFFF00", color: "#132D46" }}
          >
            <div
              className="shrink-0 w-24 text-center font-bold"
              style={{
                fontFamily: "TT Commons, sans-serif",
                fontWeight: "600",
              }}
            >
              51-100
            </div>
            <div className="flex-1">
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  color: "#132D46",
                }}
              >
                Moderate
              </h3>
              <p
                style={{ ...textStyle, fontSize: "0.875rem", color: "#132D46" }}
              >
                Air quality is acceptable. However, there may be a risk for some
                people, particularly those who are unusually sensitive to air
                pollution.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-4 p-4 rounded-lg text-white"
            style={{ backgroundColor: "#FF7E00" }}
          >
            <div
              className="shrink-0 w-24 text-center font-bold"
              style={{
                fontFamily: "TT Commons, sans-serif",
                fontWeight: "600",
              }}
            >
              101-200
            </div>
            <div className="flex-1">
              <h3 style={{ ...headingStyle, fontSize: "1.125rem" }}>
                Unhealthy for Sensitive Groups
              </h3>
              <p className="text-sm">
                Members of sensitive groups may experience health effects. The
                general public is less likely to be affected.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-4 p-4 rounded-lg text-white"
            style={{ backgroundColor: "#FF0000" }}
          >
            <div className="flex-shrink-0 w-24 text-center font-bold">
              201-300
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Unhealthy</h3>
              <p className="text-sm">
                Some members of the general public may experience health
                effects; members of sensitive groups may experience more serious
                health effects.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-4 p-4 rounded-lg text-white"
            style={{ backgroundColor: "#8F3F97" }}
          >
            <div className="flex-shrink-0 w-24 text-center font-bold">
              301-400
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Very Unhealthy</h3>
              <p className="text-sm">
                Health alert: The risk of health effects is increased for
                everyone.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-4 p-4 rounded-lg text-white"
            style={{ backgroundColor: "#7E0023" }}
          >
            <div className="flex-shrink-0 w-24 text-center font-bold">
              401-500
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Hazardous</h3>
              <p className="text-sm">
                Health warning of emergency conditions: everyone is more likely
                to be affected.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pollutants Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="dashboard-card">
          <h2 className="card-header">PM2.5 Particulate Matter</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">What is PM2.5?</h3>
              <p className="text-sm">
                Fine particulate matter with diameter less than 2.5 micrometers.
                These particles can penetrate deep into the lungs and
                bloodstream.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Health Effects:</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Respiratory problems</li>
                <li>Cardiovascular issues</li>
                <li>Reduced lung function</li>
                <li>Increased risk of heart attacks</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Sources:</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Vehicle emissions</li>
                <li>Industrial processes</li>
                <li>Construction activities</li>
                <li>Biomass burning</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h2 className="card-header">PM10 Particulate Matter</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">What is PM10?</h3>
              <p className="text-sm">
                Coarse particulate matter with diameter less than 10
                micrometers. Can be inhaled into the lungs but generally doesn't
                reach the bloodstream.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Health Effects:</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Eye and throat irritation</li>
                <li>Coughing and difficulty breathing</li>
                <li>Asthma aggravation</li>
                <li>Chronic bronchitis</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Sources:</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Road dust</li>
                <li>Crushing and grinding operations</li>
                <li>Agricultural activities</li>
                <li>Windblown soil</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Protection Tips */}
      <div className="dashboard-card">
        <h2 className="card-header">🛡️ Protection & Safety Tips</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-3 text-green-700">
              Good Days (0-100)
            </h3>
            <ul className="text-sm space-y-2 text-gray-700">
              <li>✅ Outdoor activities are safe</li>
              <li>✅ Windows can be kept open</li>
              <li>✅ Normal outdoor exercise</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3 text-orange-700">
              Moderate Days (101-200)
            </h3>
            <ul className="text-sm space-y-2 text-gray-700">
              <li>⚠️ Limit prolonged outdoor activities</li>
              <li>⚠️ Close windows during peak hours</li>
              <li>⚠️ Sensitive groups take precautions</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3 text-red-700">
              Unhealthy Days (200+)
            </h3>
            <ul className="text-sm space-y-2 text-gray-700">
              <li>🚫 Avoid outdoor activities</li>
              <li>🚫 Use air purifiers indoors</li>
              <li>🚫 Wear N95 masks if going out</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="info-box mt-6">
        <div className="font-semibold mb-2">💡 Did you know?</div>
        <p>
          According to WHO, air pollution is responsible for millions of
          premature deaths worldwide each year. Monitoring and understanding air
          quality is the first step toward protecting your health and the
          environment.
        </p>
      </div>
    </div>
  );
};

export default AQI_info;
