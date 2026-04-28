import { Chart } from "react-chartjs-2";
import "./chartTheme";
import {
  cartesianScales,
  colorAt,
  commonOptions,
  hexToRgba,
} from "./chartTheme";

/**
 * Box plot — distribution per category. Expects compare_sites rows that
 * carry { deviceid, min_value, q1, p50, q3, max_value }. Outliers are not
 * computed — we show a clean min/q1/median/q3/max box.
 */
export default function BoxPlotChart({ rows }) {
  if (!rows || !rows.length) return null;
  const required = ["min_value", "q1", "p50", "q3", "max_value"];
  if (!required.every((k) => k in rows[0])) return null;

  const labels = rows.map((r) => String(r.deviceid));
  const dataset = {
    label: "distribution",
    data: rows.map((r) => ({
      min: r.min_value,
      q1: r.q1,
      median: r.p50,
      q3: r.q3,
      max: r.max_value,
      mean: r.avg_value,
      // outliers list is required by the plugin — pass empty
      items: [],
    })),
    backgroundColor: rows.map((_, i) => hexToRgba(colorAt(i), 0.4)),
    borderColor: rows.map((_, i) => colorAt(i)),
    borderWidth: 1.5,
    outlierBackgroundColor: "#ef4444",
    medianColor: "#fff",
    itemRadius: 0,
  };

  const options = commonOptions({
    scales: cartesianScales({ xType: "category", yTitle: "value" }),
    plugins: { legend: { display: false } },
  });

  return (
    <Chart
      type="boxplot"
      data={{ labels, datasets: [dataset] }}
      options={options}
    />
  );
}
