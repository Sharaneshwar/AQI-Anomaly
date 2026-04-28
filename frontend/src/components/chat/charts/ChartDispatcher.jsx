import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy-load each chart so chart.js + its plugins don't ship in the main
// bundle. The first chart of any kind triggers a single chart.js fetch
// (shared by all chart modules); subsequent charts of new kinds add
// only their tiny renderer module.
const LineChart = lazy(() => import("./LineChart"));
const AreaChart = lazy(() => import("./AreaChart"));
const BarChart = lazy(() => import("./BarChart"));
const HBarChart = lazy(() => import("./HBarChart"));
const GroupedBarChart = lazy(() => import("./GroupedBarChart"));
const StackedBarChart = lazy(() => import("./StackedBarChart"));
const ScatterChart = lazy(() => import("./ScatterChart"));
const DoughnutChart = lazy(() => import("./DoughnutChart"));
const HistogramChart = lazy(() => import("./HistogramChart"));
const RadarChart = lazy(() => import("./RadarChart"));
const BubbleChart = lazy(() => import("./BubbleChart"));
const BoxPlotChart = lazy(() => import("./BoxPlotChart"));
const HeatmapChart = lazy(() => import("./HeatmapChart"));

const REGISTRY = {
  line: LineChart,
  area: AreaChart,
  bar: BarChart,
  hbar: HBarChart,
  grouped_bar: GroupedBarChart,
  stacked_bar: StackedBarChart,
  scatter: ScatterChart,
  doughnut: DoughnutChart,
  pie: DoughnutChart,
  histogram: HistogramChart,
  radar: RadarChart,
  bubble: BubbleChart,
  boxplot: BoxPlotChart,
  heatmap: HeatmapChart,
};

function ChartFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
      rendering chart…
    </div>
  );
}

export default function ChartDispatcher({
  type = "line",
  rows,
  columns,
  pollutant,
}) {
  if (!rows || !rows.length) {
    return (
      <div className="text-xs text-muted-foreground italic">empty</div>
    );
  }
  const Component = REGISTRY[type] || LineChart;
  return (
    <Suspense fallback={<ChartFallback />}>
      <Component rows={rows} columns={columns} pollutant={pollutant} />
    </Suspense>
  );
}

export const SUPPORTED_TYPES = Object.keys(REGISTRY);
