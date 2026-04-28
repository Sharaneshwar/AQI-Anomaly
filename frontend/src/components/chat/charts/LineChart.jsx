import { Line } from "react-chartjs-2";
import "./chartTheme";
import {
  cartesianScales,
  colorAt,
  commonOptions,
  hexToRgba,
  makeAreaGradient,
  SEVERITY_COLORS,
} from "./chartTheme";
import { buildAnnotations } from "./chartAnnotations";
import { detectAxes } from "../chatUtils";

/**
 * Multi-series line chart with optional gradient fill and anomaly overlay.
 *
 * Props:
 *   rows       — array of row objects from the agent
 *   columns    — explicit column order (optional)
 *   variant    — "line" (default) or "area" (filled)
 *   pollutant  — "pm25" | "pm10" — drives WHO threshold annotation + gradient color
 */
export default function LineChart({ rows, variant = "line", pollutant }) {
  const axes = detectAxes(rows);
  if (!axes || !axes.xCol || !axes.yCols.length) return null;
  const { xCol, yCols, groupCol } = axes;

  // Group rows by `deviceid` if present; else single series.
  const groups = new Map();
  for (const r of rows) {
    const key = groupCol ? r[groupCol] : "all";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  const datasets = [];
  let gi = 0;
  for (const [name, gRows] of groups) {
    for (const yCol of yCols) {
      // Skip score-like / categorical-but-numeric columns when irrelevant
      if (yCol === "ensemble_score" && yCols.length > 1) continue;
      const color = colorAt(gi++);
      datasets.push({
        label: yCols.length > 1 ? `${name} · ${yCol}` : String(name),
        data: gRows.map((r) => ({ x: r[xCol], y: r[yCol] })),
        borderColor: color,
        backgroundColor:
          variant === "area" ? makeAreaGradient(color, 0.32) : "transparent",
        fill: variant === "area",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: gRows.length > 80 ? 0 : 2,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
        pointBorderColor: color,
      });
    }
    // Anomaly overlay: scatter on top using severity colors
    if (groupCol && gRows.some((r) => r.is_anomaly)) {
      const yCol = yCols[0];
      datasets.push({
        type: "scatter",
        label: `${name} · anomaly`,
        data: gRows
          .filter((r) => r.is_anomaly)
          .map((r) => ({ x: r[xCol], y: r[yCol] })),
        backgroundColor: gRows
          .filter((r) => r.is_anomaly)
          .map((r) => SEVERITY_COLORS[r.severity] || "#FF0000"),
        borderColor: "#0d2236",
        borderWidth: 1.5,
        pointRadius: 5,
        pointHoverRadius: 7,
        showLine: false,
      });
    }
  }

  const data = { datasets };

  const options = commonOptions({
    plugins: {
      annotation: { annotations: buildAnnotations({ pollutant }) },
    },
    scales: {
      ...cartesianScales({ xType: "time", xTitle: xCol }),
    },
  });

  return <Line data={data} options={options} />;
}
