import React, { useMemo } from "react";
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
} from "recharts";
import responseData from "./response.json";

// Site name mapping
const SITE_NAMES = {
  site_296: "Rabindra Bharati University, Kolkata - WBPCB",
};

const Anomaly = () => {
  // Get site name from mapping or use site ID as fallback
  const siteName = SITE_NAMES[responseData.site] || responseData.site;

  const timeSeriesData = useMemo(() => {
    if (!responseData.records) return [];
    const step = 4;
    return responseData.records
      .filter((_, index) => index % step === 0)
      .map((record, index) => ({
        index,
        timestamp: record.timestamp,
        pm25: record.pm25,
        pm10: record.pm10,
        pm25Anomaly: record.pm25Anomaly,
        pm10Anomaly: record.pm10Anomaly,
      }));
  }, []);

  const pm25Anomalies = useMemo(() => {
    return timeSeriesData
      .filter((record) => record.pm25Anomaly !== "normal")
      .map((record) => ({
        index: record.index,
        value: record.pm25,
        type: record.pm25Anomaly,
      }));
  }, [timeSeriesData]);

  const pm10Anomalies = useMemo(() => {
    return timeSeriesData
      .filter((record) => record.pm10Anomaly !== "normal")
      .map((record) => ({
        index: record.index,
        value: record.pm10,
        type: record.pm10Anomaly,
      }));
  }, [timeSeriesData]);

  const stats = useMemo(() => {
    if (!timeSeriesData.length) return null;
    const pm25Values = timeSeriesData.map((r) => r.pm25);
    const pm10Values = timeSeriesData.map((r) => r.pm10);
    return {
      totalRecords: responseData.count,
      displayedRecords: timeSeriesData.length,
      pm25AnomalyCount: pm25Anomalies.length,
      pm10AnomalyCount: pm10Anomalies.length,
      avgPM25: (
        pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length
      ).toFixed(2),
      avgPM10: (
        pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length
      ).toFixed(2),
      maxPM25: Math.max(...pm25Values).toFixed(2),
      maxPM10: Math.max(...pm10Values).toFixed(2),
    };
  }, [timeSeriesData, pm25Anomalies, pm10Anomalies]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
    });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: "#132D46",
          border: "1px solid #01C38D",
          borderRadius: "8px",
          padding: "12px",
          color: "#FFFFFF",
          fontFamily: "TT Commons, sans-serif",
        }}
      >
        <p style={{ margin: "0 0 8px 0", color: "#01C38D", fontWeight: 600 }}>
          {new Date(data.timestamp).toLocaleString()}
        </p>
        <p style={{ margin: "4px 0" }}>
          PM2.5: <strong>{data.pm25.toFixed(2)} �g/m</strong>
          {data.pm25Anomaly !== "normal" && (
            <span style={{ color: "#FF0000", marginLeft: "8px" }}>
              {" "}
              {data.pm25Anomaly}
            </span>
          )}
        </p>
        <p style={{ margin: "4px 0" }}>
          PM10: <strong>{data.pm10.toFixed(2)} �g/m</strong>
          {data.pm10Anomaly !== "normal" && (
            <span style={{ color: "#FF0000", marginLeft: "8px" }}>
              {" "}
              {data.pm10Anomaly}
            </span>
          )}
        </p>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#191E29",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "TT Commons, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 600,
            color: "#FFFFFF",
            marginBottom: "12px",
          }}
        >
          Anomaly Detection Results
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#696E79" }}>
          Air Quality Monitoring Analysis
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          width: "100%",
          maxWidth: "1400px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            backgroundColor: "#132D46",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #01C38D20",
          }}
        >
          <div
            style={{
              fontSize: "0.9rem",
              color: "#01C38D",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            SITE & LOCATION
          </div>
          <div
            style={{ fontSize: "1.5rem", fontWeight: 600, color: "#FFFFFF" }}
          >
            {responseData.city}
          </div>
          <div
            style={{ fontSize: "0.95rem", color: "#696E79", marginTop: "4px" }}
          >
            {siteName}
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "#696E79",
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid #696E7930",
            }}
          >
            {new Date(responseData.start).toLocaleDateString()} -{" "}
            {new Date(responseData.end).toLocaleDateString()}
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#132D46",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #01C38D20",
          }}
        >
          <div
            style={{
              fontSize: "0.9rem",
              color: "#01C38D",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            DATA POINTS
          </div>
          <div
            style={{ fontSize: "1.5rem", fontWeight: 600, color: "#FFFFFF" }}
          >
            {stats?.displayedRecords.toLocaleString()}
          </div>
          <div
            style={{ fontSize: "0.95rem", color: "#696E79", marginTop: "4px" }}
          >
            of {stats?.totalRecords.toLocaleString()} total
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "#696E79",
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid #696E7930",
            }}
          >
            Sampled for visualization
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#132D46",
            borderRadius: "12px",
            padding: "24px",
            border: `1px solid ${
              stats?.pm25AnomalyCount > 0 ? "#FF000040" : "#01C38D20"
            }`,
          }}
        >
          <div
            style={{
              fontSize: "0.9rem",
              color: "#01C38D",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            PM2.5 ANOMALIES
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              color: stats?.pm25AnomalyCount > 0 ? "#FF0000" : "#00E400",
            }}
          >
            {stats?.pm25AnomalyCount}
          </div>
          <div
            style={{ fontSize: "0.95rem", color: "#696E79", marginTop: "4px" }}
          >
            Avg: {stats?.avgPM25} �g/m
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "#696E79",
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid #696E7930",
            }}
          >
            Max: {stats?.maxPM25} �g/m
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#132D46",
            borderRadius: "12px",
            padding: "24px",
            border: `1px solid ${
              stats?.pm10AnomalyCount > 0 ? "#FF000040" : "#01C38D20"
            }`,
          }}
        >
          <div
            style={{
              fontSize: "0.9rem",
              color: "#01C38D",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            PM10 ANOMALIES
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              color: stats?.pm10AnomalyCount > 0 ? "#FF0000" : "#00E400",
            }}
          >
            {stats?.pm10AnomalyCount}
          </div>
          <div
            style={{ fontSize: "0.95rem", color: "#696E79", marginTop: "4px" }}
          >
            Avg: {stats?.avgPM10} �g/m
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "#696E79",
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid #696E7930",
            }}
          >
            Max: {stats?.maxPM10} �g/m
          </div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "40px",
          width: "100%",
          maxWidth: "1400px",
        }}
      >
        <div
          style={{
            backgroundColor: "#132D46",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #01C38D20",
          }}
        >
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: 600,
              color: "#FFFFFF",
              marginBottom: "20px",
            }}
          >
            PM2.5 Time Series Analysis
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#696E7930" />
              <XAxis
                dataKey="index"
                tickFormatter={(index) => {
                  const record = timeSeriesData[index];
                  return record ? formatDate(record.timestamp) : "";
                }}
                stroke="#696E79"
                style={{
                  fontSize: "0.85rem",
                  fontFamily: "TT Commons, sans-serif",
                }}
              />
              <YAxis
                stroke="#696E79"
                style={{
                  fontSize: "0.85rem",
                  fontFamily: "TT Commons, sans-serif",
                }}
                label={{
                  value: "PM2.5 (�g/m)",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    fill: "#696E79",
                    fontFamily: "TT Commons, sans-serif",
                  },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  color: "#FFFFFF",
                  fontFamily: "TT Commons, sans-serif",
                }}
              />
              <Line
                type="monotone"
                dataKey="pm25"
                stroke="#01C38D"
                strokeWidth={2}
                dot={false}
                name="PM2.5 (�g/m)"
              />
              <Scatter
                data={pm25Anomalies}
                dataKey="value"
                fill="#FF0000"
                shape="circle"
                r={6}
                name="Anomaly"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            backgroundColor: "#132D46",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #01C38D20",
          }}
        >
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: 600,
              color: "#FFFFFF",
              marginBottom: "20px",
            }}
          >
            PM10 Time Series Analysis
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#696E7930" />
              <XAxis
                dataKey="index"
                tickFormatter={(index) => {
                  const record = timeSeriesData[index];
                  return record ? formatDate(record.timestamp) : "";
                }}
                stroke="#696E79"
                style={{
                  fontSize: "0.85rem",
                  fontFamily: "TT Commons, sans-serif",
                }}
              />
              <YAxis
                stroke="#696E79"
                style={{
                  fontSize: "0.85rem",
                  fontFamily: "TT Commons, sans-serif",
                }}
                label={{
                  value: "PM10 (�g/m)",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    fill: "#696E79",
                    fontFamily: "TT Commons, sans-serif",
                  },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  color: "#FFFFFF",
                  fontFamily: "TT Commons, sans-serif",
                }}
              />
              <Line
                type="monotone"
                dataKey="pm10"
                stroke="#01C38D"
                strokeWidth={2}
                dot={false}
                name="PM10 (�g/m)"
              />
              <Scatter
                data={pm10Anomalies}
                dataKey="value"
                fill="#FF0000"
                shape="circle"
                r={6}
                name="Anomaly"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div
        style={{
          backgroundColor: "#132D46",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #01C38D20",
          maxWidth: "1400px",
          width: "100%",
          marginTop: "40px",
        }}
      >
        <h4
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#01C38D",
            marginBottom: "12px",
          }}
        >
          About This Visualization
        </h4>
        <p style={{ color: "#696E79", lineHeight: "1.6", margin: 0 }}>
          This dashboard displays anomaly detection results from ML analysis of
          air quality data. The time series charts show PM2.5 and PM10
          measurements over time, with detected anomalies highlighted in red.
          Data points are sampled for performance (showing approximately every
          4th measurement). Anomalies indicate unusual patterns that may require
          investigation, such as sensor errors, pollution events, or data
          quality issues.
        </p>
      </div>
    </div>
  );
};

export default Anomaly;
