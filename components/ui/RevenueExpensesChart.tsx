import { useTheme } from "next-themes";
import { Chart } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarController,
    BarElement,
    LineController,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    type ChartData,
    type ChartOptions,
} from "chart.js";
import { ChartCard } from "./ChartCard";
import { BRAND_BAR_DARK, BRAND_BAR_LIGHT, CHART_PALETTE } from "@/lib/chartColors";

// Las series "line" (neto) dentro de un gráfico mixto necesitan su controlador.
// Sin LineController, Chart.js lanza "line is not a registered controller".
ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, LineController, LineElement, PointElement, Title, Tooltip, Legend);

const AXIS_TEXT_LIGHT = "#14181F";
const AXIS_TEXT_DARK = "#FAFAFA";

export interface MonthlyFlowPoint {
    name: string;
    revenue: number;
    expenses: number;
    net: number;
}

/**
 * Ingresos y egresos por mes en barras, con la línea del neto (ingresos - egresos).
 * El neto puede ser negativo: la línea cruza el cero y se ve el mes que dio pérdida.
 */
export function RevenueExpensesChart({
    data,
    title = "Ingresos y egresos por mes",
    formatValue,
}: {
    data: MonthlyFlowPoint[];
    title?: string;
    formatValue?: (value: number) => string;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const textColor = isDark ? AXIS_TEXT_DARK : AXIS_TEXT_LIGHT;
    const revenueColor = isDark ? BRAND_BAR_DARK : BRAND_BAR_LIGHT;
    const expensesColor = CHART_PALETTE[0];
    // Sobre fondo oscuro el azul pizarra de la paleta no se distingue: se usa el amarillo de la paleta.
    const netColor = isDark ? CHART_PALETTE[3] : CHART_PALETTE[2];

    const chartData: ChartData<"bar" | "line", number[], string> = {
        labels: data.map((d) => d.name),
        datasets: [
            { type: "bar", label: "Ingresos", data: data.map((d) => d.revenue), backgroundColor: revenueColor, borderRadius: 6 },
            { type: "bar", label: "Egresos", data: data.map((d) => d.expenses), backgroundColor: expensesColor, borderRadius: 6 },
            {
                type: "line",
                label: "Neto",
                data: data.map((d) => d.net),
                borderColor: netColor,
                backgroundColor: netColor,
                pointRadius: 4,
                tension: 0.3,
            },
        ],
    };

    const options: ChartOptions<"bar" | "line"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: textColor } },
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
                <Chart type="bar" data={chartData} options={options} />
            </div>
        </ChartCard>
    );
}
