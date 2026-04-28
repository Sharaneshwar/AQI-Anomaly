import { Doughnut } from "react-chartjs-2";
import "./chartTheme";
import { commonOptions, COLORS, SEVERITY_COLORS, colorAt } from "./chartTheme";
import { detectShareAxes } from "../chatUtils";

/**
 * Doughnut chart — shares of a single value column across rows of a label
 * column. Default mapping for severity rows uses AQI severity colors.
 */
export default function DoughnutChart({ rows }) {
  const axes = detectShareAxes(rows);
  if (!axes || !axes.labelCol || !axes.valueCol) return null;
  const { labelCol, valueCol } = axes;

  const labels = rows.map((r) => String(r[labelCol]));
  const values = rows.map((r) => r[valueCol]);

  const isSeverity = labelCol === "severity";
  const colors = labels.map((l, i) =>
    isSeverity ? SEVERITY_COLORS[l] || colorAt(i) : colorAt(i),
  );

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: COLORS.bg,
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = commonOptions({
    cutout: "62%",
    plugins: {
      legend: { position: "bottom" },
    },
  });

  return <Doughnut data={data} options={options} />;
}
