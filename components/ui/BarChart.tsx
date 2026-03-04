import { useTheme } from "next-themes";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { ChartCard } from "./ChartCard";
import { BarChartProps } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


export function CustomBarChart({ data, title = "Distribución de Valores", label = "Valor" }: BarChartProps) {
    const { theme } = useTheme();
    const textColor = theme === "dark" ? "#FFFFFF" : "#000000";

    const chartData = {
        labels: data.map(d => d.name),
        datasets: [
            {
                label,
                data: data.map(d => d.value),
                backgroundColor: "#0088FE",
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: textColor },
            },
        },
        scales: {
            x: { ticks: { color: textColor } },
            y: { ticks: { color: textColor } },
        },
    };

    return (
        <ChartCard title={title}>
            <div className="w-full h-64">
                <Bar data={chartData} options={options} />
            </div>
        </ChartCard>
    );
}
