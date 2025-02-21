// components/LineChart.tsx
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import { useTheme } from "next-themes";
import { ChartCard } from "./ChartCard";
import { LineChartProps } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export function CustomLineChart({ data }: LineChartProps) {
    const { theme } = useTheme();
    const textColor = theme === "dark" ? "#FFFFFF" : "#000000";

    const chartData = {
        labels: data.map((d) => d.name),
        datasets: [
            {
                label: "Servicios",
                data: data.map((d) => d.value),
                borderColor: "#82ca9d",
                backgroundColor: "rgba(130, 202, 157, 0.2)",
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    color: textColor,
                },
            },
            y: {
                ticks: {
                    color: textColor,
                },
            },
        },
    };

    return (
        <ChartCard title="Servicios Anuales">
            <div className="w-full h-64">
                <Line data={chartData} options={options} />
            </div>
        </ChartCard>
    );
}
