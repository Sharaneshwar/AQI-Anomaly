import { Radar } from "react-chartjs-2";
import "./chartTheme";
import { COLORS, FONTS, colorAt, commonOptions, hexToRgba } from "./chartTheme";

const PROFILE_METRICS = ["avg_value", "p50", "p95", "max_value", "anomaly_count"];

/**
 * Radar / spider chart — site profile across multiple metrics.
 *
 * Expects compare_sites rows: { deviceid, avg_value, p50, p95, max_value,
 * sample_count, anomaly_count? }. Plots a polygon per site over the metrics
 * available. Values are min-max scaled across sites so different magnitudes
 * coexist on the same axes.
 */
export default function RadarChart({ rows }) {
  if (!rows || !rows.length) return null;
  const metrics = PROFILE_METRICS.filter((m) =>
    rows.some((r) => typeof r[m] === "number"),
  );
  if (!metrics.length) return null;

  // min-max normalise per metric so the radar isn't dominated by one axis
  const ranges = {};
  for (const m of metrics) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const r of rows) {
      const v = r[m];
      if (typeof v !== "number") continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    ranges[m] = { lo, hi: hi === lo ? lo + 1 : hi };
  }
  const scale = (val, m) => {
    const { lo, hi } = ranges[m];
    return ((val - lo) / (hi - lo)) * 100;
  };

  const datasets = rows.map((r, i) => {
    const color = colorAt(i);
    return {
      label: String(r.deviceid ?? `series_${i}`),
      data: metrics.map((m) =>
        typeof r[m] === "number" ? scale(r[m], m) : 0,
      ),
      borderColor: color,
      backgroundColor: hexToRgba(color, 0.18),
      borderWidth: 2,
      pointBackgroundColor: color,
      pointRadius: 3,
    };
  });

  const options = commonOptions({
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        angleLines: { color: COLORS.grid },
        grid: { color: COLORS.grid },
        pointLabels: {
          color: COLORS.text,
          font: { family: FONTS.family, size: FONTS.base },
        },
        ticks: {
          display: false,
          color: COLORS.muted,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          // Show the original (un-scaled) value, not the 0..100 projection
          label: (ctx) => {
            const m = metrics[ctx.dataIndex];
            const r = rows[ctx.datasetIndex];
            const raw = r?.[m];
            return `${ctx.dataset.label} · ${m}: ${
              typeof raw === "number" ? raw.toFixed(2) : raw
            }`;
          },
        },
      },
    },
  });

  return (
    <Radar
      data={{ labels: metrics, datasets }}
      options={options}
    />
  );
}
