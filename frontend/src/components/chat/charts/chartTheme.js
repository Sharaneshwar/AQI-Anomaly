// Shared Chart.js setup + theme tokens for chat charts.
// Importing this module registers every Chart.js element / scale / plugin
// the chat charts need. Components just `import "./chartTheme"` for the
// side effects, and pull options/palette helpers as named exports.

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  TimeScale,
  Title,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import annotationPlugin from "chartjs-plugin-annotation";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import {
  BoxPlotController,
  BoxAndWiskers,
} from "@sgratzl/chartjs-chart-boxplot";

ChartJS.register(
  // core
  CategoryScale,
  LinearScale,
  TimeScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  // plugins
  annotationPlugin,
  // matrix (heatmap)
  MatrixController,
  MatrixElement,
  // boxplot
  BoxPlotController,
  BoxAndWiskers,
);

// Color tokens — mirror the navy/teal/slate palette in src/index.css.
export const COLORS = {
  bg: "#191E29",
  card: "#132D46",
  cardSoft: "rgba(19,45,70,0.55)",
  border: "rgba(148,163,184,0.20)",
  grid: "rgba(148,163,184,0.12)",
  text: "#cbd5e1", // slate-300
  muted: "#94a3b8", // slate-400
  primary: "#01C38D", // teal accent (--primary)
  primarySoft: "rgba(1,195,141,0.20)",
};

// 8-color cycle for series. Pulled from the existing PALETTE in ChatChart.
export const PALETTE = [
  "#60a5fa", // blue-400
  "#f472b6", // pink-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#a78bfa", // violet-400
  "#fb7185", // rose-400
  "#22d3ee", // cyan-400
  "#facc15", // yellow-400
];

// AQI severity colors (also defined as CSS vars in src/index.css)
export const AQI_BANDS = {
  good: "#00E400",
  moderate: "#FFFF00",
  unhealthy_sensitive: "#FF7E00",
  unhealthy: "#FF0000",
  very_unhealthy: "#8F3F97",
  hazardous: "#7E0023",
};

export const SEVERITY_COLORS = {
  normal: COLORS.muted,
  low: AQI_BANDS.good,
  moderate: AQI_BANDS.moderate,
  medium: AQI_BANDS.unhealthy_sensitive,
  high: AQI_BANDS.unhealthy,
  severe: AQI_BANDS.very_unhealthy,
  critical: AQI_BANDS.hazardous,
  unknown: COLORS.muted,
};

export const FONTS = {
  base: 11,
  family:
    "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

// Reusable Chart.js options skeleton. Call commonOptions() and merge in
// per-chart specifics — keeps tooltip, legend, animation consistent.
export function commonOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest", axis: "x", intersect: false },
    animation: { duration: 750, easing: "easeOutQuart" },
    layout: { padding: { top: 4, right: 8, bottom: 4, left: 4 } },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: COLORS.text,
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          padding: 14,
          font: { family: FONTS.family, size: FONTS.base },
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: COLORS.card,
        titleColor: COLORS.text,
        bodyColor: COLORS.text,
        borderColor: COLORS.border,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        usePointStyle: true,
        titleFont: { family: FONTS.family, size: 12, weight: "600" },
        bodyFont: { family: FONTS.family, size: 11 },
      },
      ...extra.plugins,
    },
    ...Object.fromEntries(
      Object.entries(extra).filter(([k]) => k !== "plugins"),
    ),
  };
}

// Default cartesian scales (light grid, slate ticks). Override per chart.
export function cartesianScales({ xType = "linear", xTitle, yTitle } = {}) {
  return {
    x: {
      type: xType,
      title: xTitle
        ? {
            display: true,
            text: xTitle,
            color: COLORS.muted,
            font: { family: FONTS.family, size: FONTS.base },
          }
        : { display: false },
      ticks: {
        color: COLORS.muted,
        font: { family: FONTS.family, size: FONTS.base },
      },
      grid: { color: COLORS.grid, drawBorder: false },
    },
    y: {
      beginAtZero: false,
      title: yTitle
        ? {
            display: true,
            text: yTitle,
            color: COLORS.muted,
            font: { family: FONTS.family, size: FONTS.base },
          }
        : { display: false },
      ticks: {
        color: COLORS.muted,
        font: { family: FONTS.family, size: FONTS.base },
      },
      grid: { color: COLORS.grid, drawBorder: false },
    },
  };
}

// Build a vertical gradient for a Chart.js area fill. Returns a function
// suitable for `backgroundColor` so Chart.js evaluates it lazily once the
// chart area is known. `topColor` is the series color; we tint it down
// to transparent.
export function makeAreaGradient(topColor, alpha = 0.35) {
  return (ctx) => {
    const { chart } = ctx;
    const { ctx: c, chartArea } = chart;
    if (!chartArea) return topColor; // initial render, no area yet
    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, hexToRgba(topColor, alpha));
    g.addColorStop(1, hexToRgba(topColor, 0));
    return g;
  };
}

export function hexToRgba(hex, alpha = 1) {
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
  const h = hex.replace("#", "");
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(v, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function colorAt(i) {
  return PALETTE[i % PALETTE.length];
}
