import LineChart from "./LineChart";

// Area chart = LineChart with variant="area" (gradient fill below the line).
export default function AreaChart(props) {
  return <LineChart {...props} variant="area" />;
}
