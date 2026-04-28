import BarChart from "./BarChart";

// Stacked bar — useful when y-series compose a whole (severity counts).
export default function StackedBarChart(props) {
  return <BarChart {...props} variant="stacked" />;
}
