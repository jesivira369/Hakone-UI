import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Legend, Tooltip } from "chart.js";
import { BarChartProps } from "@/lib/types";
import { ChartCard } from "./ChartCard";

ChartJS.register(ArcElement, Tooltip, Legend);

export function CustomPieChart({ data }: BarChartProps) {
    const chartData = {
        labels: data.map(d => d.name),
        datasets: [
            {
                data: data.map(d => d.value),
                backgroundColor: ["#FFBB28", "#0088FE", "#82ca9d", "#FF8042"],
            },
        ],
    };

    return <ChartCard title="Proporción de Datos"><div className="w-full h-64"><Pie data={chartData} /></div></ChartCard>;
}