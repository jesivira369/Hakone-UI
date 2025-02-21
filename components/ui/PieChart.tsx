import { PieChartProps } from "@/lib/types";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";

export function CustomPieChart({ data }: PieChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie dataKey="value" data={data} fill="#FFBB28" label />
                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
    );
}