import { Chart } from "react-chartjs-2";
import "./chartTheme";
import { COLORS, FONTS, commonOptions, hexToRgba } from "./chartTheme";

/**
 * Heatmap — site × hour-of-day intensity grid.
 * Expects rows from get_hourly_profile: { deviceid, hour, avg_value }.
 * Cell color is interpolated from teal (low) → red (high) via avg_value.
 */
export default function HeatmapChart({ rows }) {
  if (!rows || !rows.length) return null;
  if (!("hour" in rows[0]) || !("avg_value" in rows[0])) return null;

  const sites = [...new Set(rows.map((r) => r.deviceid))];

  // value range for color scaling
  let lo = Infinity;
  let hi = -Infinity;
  for (const r of rows) {
    if (typeof r.avg_value !== "number") continue;
    if (r.avg_value < lo) lo = r.avg_value;
    if (r.avg_value > hi) hi = r.avg_value;
  }
  if (!isFinite(lo)) {
    lo = 0;
    hi = 1;
  }
  const span = hi === lo ? 1 : hi - lo;

  // Heatmap palette: teal (cool) → amber → red (hot). Simple piecewise.
  function heatColor(t) {
    // t is 0..1
    if (t < 0.5) {
      const k = t / 0.5;
      // teal → amber
      const r = Math.round(1 + (251 - 1) * k);
      const g = Math.round(195 + (191 - 195) * k);
      const b = Math.round(141 + (36 - 141) * k);
      return `rgb(${r},${g},${b})`;
    }
    const k = (t - 0.5) / 0.5;
    // amber → red
    const r = Math.round(251 + (239 - 251) * k);
    const g = Math.round(191 + (68 - 191) * k);
    const b = Math.round(36 + (68 - 36) * k);
    return `rgb(${r},${g},${b})`;
  }

  const data = {
    datasets: [
      {
        label: "avg_value",
        data: rows.map((r) => ({
          x: r.hour,
          y: r.deviceid,
          v: r.avg_value,
        })),
        backgroundColor: (ctx) =>
          heatColor((ctx.raw.v - lo) / span),
        borderColor: COLORS.bg,
        borderWidth: 1,
        width: ({ chart }) =>
          (chart.chartArea?.width || 1) / 24 - 2,
        height: ({ chart }) =>
          (chart.chartArea?.height || 1) / Math.max(sites.length, 1) - 2,
      },
    ],
  };

  const options = commonOptions({
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        min: -0.5,
        max: 23.5,
        ticks: {
          stepSize: 1,
          color: COLORS.muted,
          font: { family: FONTS.family, size: FONTS.base },
        },
        grid: { display: false },
        title: {
          display: true,
          text: "hour of day",
          color: COLORS.muted,
          font: { family: FONTS.family, size: FONTS.base },
        },
      },
      y: {
        type: "category",
        labels: sites,
        offset: true,
        ticks: {
          color: COLORS.muted,
          font: { family: FONTS.family, size: FONTS.base },
        },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            const it = items[0];
            const v = it.raw.v;
            return `${it.raw.y} · ${it.raw.x.toString().padStart(2, "0")}:00`;
          },
          label: (item) => `avg: ${item.raw.v?.toFixed?.(1) ?? item.raw.v}`,
        },
      },
    },
  });

  return <Chart type="matrix" data={data} options={options} />;
}
