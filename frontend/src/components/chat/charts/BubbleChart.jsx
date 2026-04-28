import { Bubble } from "react-chartjs-2";
import "./chartTheme";
import {
  AQI_BANDS,
  cartesianScales,
  colorAt,
  commonOptions,
  hexToRgba,
} from "./chartTheme";

/**
 * Bubble chart — three numeric dimensions in one view.
 *
 * Mapping (when compare_sites-shaped rows are present):
 *   x = avg_value, y = p95, r (size) ∝ anomaly_count or sample_count
 * One bubble per row, colored by AQI band of its avg_value.
 *
 * Falls back to using the first three numeric columns if those names
 * aren't present.
 */
const PM_BANDS = [
  { upTo: 12, color: AQI_BANDS.good },
  { upTo: 35, color: AQI_BANDS.moderate },
  { upTo: 55, color: AQI_BANDS.unhealthy_sensitive },
  { upTo: 150, color: AQI_BANDS.unhealthy },
  { upTo: 250, color: AQI_BANDS.very_unhealthy },
  { upTo: Infinity, color: AQI_BANDS.hazardous },
];

function bandColor(value) {
  for (const b of PM_BANDS) {
    if (value <= b.upTo) return b.color;
  }
  return AQI_BANDS.hazardous;
}

export default function BubbleChart({ rows }) {
  if (!rows || !rows.length) return null;

  const xCol = "avg_value" in rows[0] ? "avg_value" : null;
  const yCol = "p95" in rows[0] ? "p95" : null;
  const rCol =
    "anomaly_count" in rows[0]
      ? "anomaly_count"
      : "sample_count" in rows[0]
        ? "sample_count"
        : null;
  if (!xCol || !yCol || !rCol) return null;

  // size scaling — map rCol to 4..22 px radius
  let lo = Infinity;
  let hi = -Infinity;
  for (const r of rows) {
    if (typeof r[rCol] !== "number") continue;
    if (r[rCol] < lo) lo = r[rCol];
    if (r[rCol] > hi) hi = r[rCol];
  }
  const span = hi === lo ? 1 : hi - lo;

  const datasets = rows.map((r, i) => {
    const fill = bandColor(r[xCol]);
    return {
      label: String(r.deviceid ?? `row_${i}`),
      data: [
        {
          x: r[xCol],
          y: r[yCol],
          r: 4 + ((r[rCol] - lo) / span) * 18,
        },
      ],
      backgroundColor: hexToRgba(fill, 0.55),
      borderColor: fill,
      borderWidth: 2,
    };
  });

  const options = commonOptions({
    scales: cartesianScales({ xType: "linear", xTitle: xCol, yTitle: yCol }),
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const r = rows[ctx.datasetIndex];
            return [
              `${ctx.dataset.label}`,
              `${xCol}: ${r[xCol]?.toFixed?.(1) ?? r[xCol]}`,
              `${yCol}: ${r[yCol]?.toFixed?.(1) ?? r[yCol]}`,
              `${rCol}: ${r[rCol]}`,
            ];
          },
        },
      },
    },
  });

  return <Bubble data={{ datasets }} options={options} />;
}
