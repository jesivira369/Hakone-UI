import { useTheme } from "next-themes";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, type ChartOptions } from "chart.js";
import { ChartCard } from "./ChartCard";
import { BarChartProps } from "@/lib/types";
import { BRAND_BAR_DARK, BRAND_BAR_LIGHT } from "@/lib/chartColors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AXIS_TEXT_LIGHT = "#14181F";
const AXIS_TEXT_DARK = "#FAFAFA";

export function CustomBarChart({
    data,
    title = "Distribución de Valores",
    label = "Valor",
    color,
    colors,
    barRadius = 0,
    formatValue,
}: BarChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const textColor = isDark ? AXIS_TEXT_DARK : AXIS_TEXT_LIGHT;
    const barColor = color ?? (isDark ? BRAND_BAR_DARK : BRAND_BAR_LIGHT);
    const backgroundColor = colors && colors.length > 0
        ? data.map((_, i) => colors[i % colors.length])
        : barColor;

    const chartData = {
        labels: data.map((d) => d.name),
        datasets: [
            {
                label,
                data: data.map((d) => d.value),
                backgroundColor,
                borderRadius: barRadius,
            },
        ],
    };

    const options: ChartOptions<"bar"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: textColor },
            },
            tooltip: formatValue
                ? {
                      callbacks: {
                          label: (ctx) => `${ctx.dataset.label}: ${formatValue(Number(ctx.parsed.y))}`,
                      },
                  }
                : undefined,
        },
        scales: {
            x: { ticks: { color: textColor } },
            y: {
                ticks: {
                    color: textColor,
                    callback: (value) => (formatValue ? formatValue(Number(value)) : value),
                },
            },
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
