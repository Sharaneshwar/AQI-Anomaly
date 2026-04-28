import { Bar } from "react-chartjs-2";
import "./chartTheme";
import {
  cartesianScales,
  colorAt,
  commonOptions,
  hexToRgba,
} from "./chartTheme";
import { detectCategoryAxes } from "../chatUtils";

/**
 * Categorical bar chart. One bar per row's category column (deviceid by
 * default). When `variant` is:
 *   "single"   — show only the first numeric y column (e.g. avg_value)
 *   "grouped"  — one group of bars per row, each y series side-by-side
 *   "stacked"  — y series stacked on top of each other
 *   "horizontal" — orient bars horizontally (good for ranked sites)
 */
export default function BarChart({
  rows,
  variant = "single",
  yCols: yColsOverride,
}) {
  const axes = detectCategoryAxes(rows);
  if (!axes || !axes.categoryCol) return null;
  const categoryCol = axes.categoryCol;
  let yCols = yColsOverride || axes.yCols;
  if (!yCols.length) return null;

  if (variant === "single") {
    // Pick the most informative single metric: prefer avg_value > p50 > first
    const pick =
      yCols.find((c) => c === "avg_value") ||
      yCols.find((c) => c === "p50") ||
      yCols.find((c) => c === "n") ||
      yCols.find((c) => c === "freq") ||
      yCols[0];
    yCols = [pick];
  }

  const labels = rows.map((r) => String(r[categoryCol]));

  const datasets = yCols.map((yCol, i) => ({
    label: yCol,
    data: rows.map((r) => r[yCol]),
    backgroundColor: hexToRgba(colorAt(i), 0.7),
    borderColor: colorAt(i),
    borderWidth: 1.5,
    borderRadius: variant === "horizontal" ? 4 : { topLeft: 6, topRight: 6 },
    borderSkipped: false,
    barPercentage: 0.85,
    categoryPercentage: 0.8,
  }));

  const stacked = variant === "stacked";
  const horizontal = variant === "horizontal";

  const options = commonOptions({
    indexAxis: horizontal ? "y" : "x",
    scales: {
      ...cartesianScales({ xType: "category" }),
      x: {
        ...cartesianScales().x,
        type: horizontal ? "linear" : "category",
        stacked,
        ticks: {
          ...cartesianScales().x.ticks,
          autoSkip: false,
          maxRotation: horizontal ? 0 : 30,
          minRotation: horizontal ? 0 : 0,
        },
      },
      y: {
        ...cartesianScales().y,
        type: horizontal ? "category" : "linear",
        stacked,
      },
    },
    plugins: {
      legend: {
        display: yCols.length > 1,
        position: "bottom",
      },
    },
  });

  return <Bar data={{ labels, datasets }} options={options} />;
}
