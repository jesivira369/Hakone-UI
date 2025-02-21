import { Line } from "react-chartjs-2";
import { Chart as ChartJS, PointElement, LineElement, CategoryScale, Legend, LinearScale, Tooltip } from "chart.js";
import { BarChartProps } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export function CustomLineChart({ data }: BarChartProps) {
    const chartData = {
        labels: data.map(d => d.name),
        datasets: [
            {
                label: "Valor",
                data: data.map(d => d.value),
                borderColor: "#82ca9d",
                fill: false,
            },
        ],
    };

    return <Line data={chartData} />;
}