import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { detectAxes } from "./chatUtils";
import ChatTable from "./ChatTable";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
);

const PALETTE = [
  "#60a5fa", "#f472b6", "#34d399", "#fbbf24",
  "#a78bfa", "#fb7185", "#22d3ee", "#facc15",
];

export default function ChatChart({ rows, columns }) {
  const axes = detectAxes(rows);
  if (!axes || !axes.xCol || axes.yCols.length === 0) {
    return <ChatTable rows={rows} columns={columns} />;
  }
  const { xCol, yCols, groupCol } = axes;

  const datasets = [];
  let colorIdx = 0;
  const nextColor = () => PALETTE[colorIdx++ % PALETTE.length];

  if (groupCol) {
    const groups = new Map();
    for (const r of rows) {
      const key = r[groupCol];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }
    for (const [groupKey, gRows] of groups) {
      for (const yCol of yCols) {
        datasets.push({
          label: groups.size > 1 ? `${groupKey} · ${yCol}` : yCol,
          data: gRows.map((r) => ({ x: r[xCol], y: r[yCol] })),
          borderColor: nextColor(),
          backgroundColor: "transparent",
          tension: 0.2,
          pointRadius: gRows.length > 60 ? 0 : 2,
        });
      }
    }
  } else {
    for (const yCol of yCols) {
      datasets.push({
        label: yCol,
        data: rows.map((r) => ({ x: r[xCol], y: r[yCol] })),
        borderColor: nextColor(),
        backgroundColor: "transparent",
        tension: 0.2,
        pointRadius: rows.length > 60 ? 0 : 2,
      });
    }
  }

  const data = { datasets };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: "#cbd5e1" } },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        type: "time",
        title: { display: true, text: xCol, color: "#94a3b8" },
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148,163,184,0.15)" },
      },
      y: {
        beginAtZero: false,
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148,163,184,0.15)" },
      },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
  };

  return (
    <div className="chart-wrap" style={{ height: 300 }}>
      <Line data={data} options={options} />
    </div>
  );
}
