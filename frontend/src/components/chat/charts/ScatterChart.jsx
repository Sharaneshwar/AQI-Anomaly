import { Scatter } from "react-chartjs-2";
import "./chartTheme";
import { cartesianScales, colorAt, commonOptions } from "./chartTheme";
import { detectScatterAxes } from "../chatUtils";

/**
 * Scatter plot — first two numeric columns are x/y, optional grouping by
 * deviceid produces one colored point series per site.
 *
 * Good for "ensemble_score vs concentration", "p95 vs avg", etc.
 */
export default function ScatterChart({ rows }) {
  const axes = detectScatterAxes(rows);
  if (!axes || !axes.xCol || !axes.yCol) return null;
  const { xCol, yCol, groupCol } = axes;

  const groups = new Map();
  for (const r of rows) {
    const key = groupCol ? r[groupCol] : "all";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  const datasets = [];
  let i = 0;
  for (const [name, gRows] of groups) {
    const color = colorAt(i++);
    datasets.push({
      label: String(name),
      data: gRows.map((r) => ({ x: r[xCol], y: r[yCol] })),
      backgroundColor: color,
      borderColor: color,
      pointRadius: 4,
      pointHoverRadius: 6,
    });
  }

  const options = commonOptions({
    interaction: { mode: "nearest", axis: "xy", intersect: true },
    scales: cartesianScales({ xType: "linear", xTitle: xCol, yTitle: yCol }),
  });

  return <Scatter data={{ datasets }} options={options} />;
}
