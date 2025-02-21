import { BarChartProps } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function CustomBarChart({ data }: BarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" />
            </BarChart>
        </ResponsiveContainer>
    );
}