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
                color: "#FFFFFF",
              }}
            >
              101-200
            </div>
            <div className="flex-1">
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  color: "#FFFFFF",
                }}
              >
                Unhealthy for Sensitive Groups
              </h3>
              <p
                style={{ ...textStyle, fontSize: "0.875rem", color: "#FFFFFF" }}
              >
                Members of sensitive groups may experience health effects. The
                general public is less likely to be affected.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-4 p-4 rounded-lg text-white"
            style={{ backgroundColor: "#FF0000" }}
          >
            <div
              className="shrink-0 w-24 text-center font-bold"
              style={{
                fontFamily: "TT Commons, sans-serif",
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              201-300
            </div>
            <div className="flex-1">
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  color: "#FFFFFF",
                }}
              >
                Unhealthy
              </h3>
              <p
                style={{ ...textStyle, fontSize: "0.875rem", color: "#FFFFFF" }}
              >
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
            <div
              className="shrink-0 w-24 text-center font-bold"
              style={{
                fontFamily: "TT Commons, sans-serif",
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              301-400
            </div>
            <div className="flex-1">
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  color: "#FFFFFF",
                }}
              >
                Very Unhealthy
              </h3>
              <p
                style={{ ...textStyle, fontSize: "0.875rem", color: "#FFFFFF" }}
              >
                Health alert: The risk of health effects is increased for
                everyone.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-4 p-4 rounded-lg text-white"
            style={{ backgroundColor: "#7E0023" }}
          >
            <div
              className="shrink-0 w-24 text-center font-bold"
              style={{
                fontFamily: "TT Commons, sans-serif",
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              401-500
            </div>
            <div className="flex-1">
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  color: "#FFFFFF",
                }}
              >
                Hazardous
              </h3>
              <p
                style={{ ...textStyle, fontSize: "0.875rem", color: "#FFFFFF" }}
              >
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  marginBottom: "0.5rem",
                }}
              >
                What is PM2.5?
              </h3>
              <p style={{ ...textStyle, fontSize: "0.875rem" }}>
                Fine particulate matter with diameter less than 2.5 micrometers.
                These particles can penetrate deep into the lungs and
                bloodstream.
              </p>
            </div>
            <div>
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  marginBottom: "0.5rem",
                }}
              >
                Health Effects:
              </h3>
              <ul
                style={{
                  ...textStyle,
                  fontSize: "0.875rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  listStyleType: "disc",
                  paddingLeft: "1.5rem",
                }}
              >
                <li>Respiratory problems</li>
                <li>Cardiovascular issues</li>
                <li>Reduced lung function</li>
                <li>Increased risk of heart attacks</li>
              </ul>
            </div>
            <div>
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  marginBottom: "0.5rem",
                }}
              >
                Sources:
              </h3>
              <ul
                style={{
                  ...textStyle,
                  fontSize: "0.875rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  listStyleType: "disc",
                  paddingLeft: "1.5rem",
                }}
              >
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  marginBottom: "0.5rem",
                }}
              >
                What is PM10?
              </h3>
              <p style={{ ...textStyle, fontSize: "0.875rem" }}>
                Coarse particulate matter with diameter less than 10
                micrometers. Can be inhaled into the lungs but generally doesn't
                reach the bloodstream.
              </p>
            </div>
            <div>
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  marginBottom: "0.5rem",
                }}
              >
                Health Effects:
              </h3>
              <ul
                style={{
                  ...textStyle,
                  fontSize: "0.875rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  listStyleType: "disc",
                  paddingLeft: "1.5rem",
                }}
              >
                <li>Eye and throat irritation</li>
                <li>Coughing and difficulty breathing</li>
                <li>Asthma aggravation</li>
                <li>Chronic bronchitis</li>
              </ul>
            </div>
            <div>
              <h3
                style={{
                  ...headingStyle,
                  fontSize: "1.125rem",
                  marginBottom: "0.5rem",
                }}
              >
                Sources:
              </h3>
              <ul
                style={{
                  ...textStyle,
                  fontSize: "0.875rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  listStyleType: "disc",
                  paddingLeft: "1.5rem",
                }}
              >
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
            <h3
              style={{
                ...headingStyle,
                fontSize: "1.125rem",
                marginBottom: "0.75rem",
                color: "#00E400",
              }}
            >
              Good Days (0-100)
            </h3>
            <ul
              style={{
                ...textStyle,
                fontSize: "0.875rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <li>✅ Outdoor activities are safe</li>
              <li>✅ Windows can be kept open</li>
              <li>✅ Normal outdoor exercise</li>
            </ul>
          </div>
          <div>
            <h3
              style={{
                ...headingStyle,
                fontSize: "1.125rem",
                marginBottom: "0.75rem",
                color: "#FF7E00",
              }}
            >
              Moderate Days (101-200)
            </h3>
            <ul
              style={{
                ...textStyle,
                fontSize: "0.875rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <li>⚠️ Limit prolonged outdoor activities</li>
              <li>⚠️ Close windows during peak hours</li>
              <li>⚠️ Sensitive groups take precautions</li>
            </ul>
          </div>
          <div>
            <h3
              style={{
                ...headingStyle,
                fontSize: "1.125rem",
                marginBottom: "0.75rem",
                color: "#FF0000",
              }}
            >
              Unhealthy Days (200+)
            </h3>
            <ul
              style={{
                ...textStyle,
                fontSize: "0.875rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <li>🚫 Avoid outdoor activities</li>
              <li>🚫 Use air purifiers indoors</li>
              <li>🚫 Wear N95 masks if going out</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="info-box mt-6">
        <div style={{ ...headingStyle, marginBottom: "0.5rem" }}>
          💡 Did you know?
        </div>
        <p style={{ ...textStyle }}>
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
