import { Line } from "react-chartjs-2";
import { Chart as ChartJS, PointElement, LineElement, CategoryScale, Legend, LinearScale, Tooltip } from "chart.js";
import { BarChartProps } from "@/lib/types";
import { ChartCard } from "./ChartCard";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export function CustomLineChart({ data }: BarChartProps) {
    const chartData = {
        labels: data.map(d => d.name),
        datasets: [
            {
                label: "Tendencia",
                data: data.map(d => d.value),
                borderColor: "#82ca9d",
                fill: false,
            },
        ],
    };

    return <ChartCard title="Tendencia de Datos"><div className="w-full h-64"><Line data={chartData} /></div></ChartCard>;
}