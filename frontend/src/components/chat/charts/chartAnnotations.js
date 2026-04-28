// Reusable Chart.js annotation configs — WHO threshold lines for PM
// charts. Returned from a builder so each chart can compose the ones it
// wants.

import { COLORS } from "./chartTheme";

// WHO 24-hour AQ guidelines (2021):
//   PM2.5: 15 µg/m³
//   PM10:  45 µg/m³
const THRESHOLDS = {
  pm25: { value: 15, label: "WHO 24h · PM2.5" },
  pm10: { value: 45, label: "WHO 24h · PM10" },
};

export function whoLine(pollutant) {
  const t = THRESHOLDS[pollutant];
  if (!t) return null;
  return {
    type: "line",
    yMin: t.value,
    yMax: t.value,
    borderColor: COLORS.muted,
    borderWidth: 1,
    borderDash: [5, 4],
    label: {
      display: true,
      content: t.label,
      position: "end",
      color: COLORS.muted,
      backgroundColor: "rgba(19,45,70,0.8)",
      font: { size: 10, weight: "500" },
      padding: { top: 2, bottom: 2, left: 6, right: 6 },
      borderRadius: 4,
    },
  };
}

export function buildAnnotations({ pollutant } = {}) {
  const out = {};
  const w = whoLine(pollutant);
  if (w) out.whoLine = w;
  return out;
}
