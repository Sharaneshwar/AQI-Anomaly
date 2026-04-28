import BarChart from "./BarChart";

// Horizontal bar chart — best for ranking/leaderboards (top-N sites).
export default function HBarChart(props) {
  return <BarChart {...props} variant="horizontal" />;
}
