import { Bar } from "react-chartjs-2";
import "./chartTheme";
import {
  cartesianScales,
  colorAt,
  commonOptions,
  hexToRgba,
} from "./chartTheme";

/**
 * Histogram — expects rows shaped like get_distribution() output:
 *   { deviceid, bucket, freq, bin_start, bin_end }
 *
 * X labels are bin midpoints ("[bin_start..bin_end)"). Multiple sites get
 * stacked side-by-side.
 */
export default function HistogramChart({ rows }) {
  if (!rows || !rows.length) return null;

  // Discover all bin labels in order
  const bucketsByLabel = new Map();
  for (const r of rows) {
    const label =
      r.bin_start != null && r.bin_end != null
        ? `${Number(r.bin_start).toFixed(0)}–${Number(r.bin_end).toFixed(0)}`
        : `bucket ${r.bucket}`;
    bucketsByLabel.set(r.bucket, label);
  }
  const sortedBuckets = [...bucketsByLabel.keys()].sort((a, b) => a - b);
  const labels = sortedBuckets.map((b) => bucketsByLabel.get(b));

  // Group rows by deviceid
  const byDevice = new Map();
  for (const r of rows) {
    if (!byDevice.has(r.deviceid)) byDevice.set(r.deviceid, new Map());
    byDevice.get(r.deviceid).set(r.bucket, r.freq);
  }

  const datasets = [];
  let i = 0;
  for (const [device, bucketMap] of byDevice) {
    const color = colorAt(i++);
    datasets.push({
      label: String(device),
      data: sortedBuckets.map((b) => bucketMap.get(b) || 0),
      backgroundColor: hexToRgba(color, 0.7),
      borderColor: color,
      borderWidth: 1.5,
      borderRadius: { topLeft: 4, topRight: 4 },
      borderSkipped: false,
      barPercentage: 1,
      categoryPercentage: 0.95,
    });
  }

  const options = commonOptions({
    scales: {
      ...cartesianScales({ xType: "category", xTitle: "value (µg/m³)", yTitle: "count" }),
      x: {
        ...cartesianScales().x,
        type: "category",
        ticks: {
          ...cartesianScales().x.ticks,
          autoSkip: true,
          maxRotation: 45,
        },
      },
    },
  });

  return <Bar data={{ labels, datasets }} options={options} />;
}
