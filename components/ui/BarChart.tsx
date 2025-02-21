import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
    data: { name: string; value: number }[];
}

export function CustomBarChart({ data }: BarChartProps) {
    const chartData = {
        labels: data.map(d => d.name),
        datasets: [
            {
                label: "Valor",
                data: data.map(d => d.value),
                backgroundColor: "#0088FE",
            },
        ],
    };

    return <Bar data={chartData} />;
}