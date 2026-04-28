import BarChart from "./BarChart";

// Grouped (clustered) bar chart — multiple metrics side-by-side per category.
// Used by compare_sites + get_percentiles to compare avg/p50/p95/max etc.
// across sites.
export default function GroupedBarChart(props) {
  return <BarChart {...props} variant="grouped" />;
}
