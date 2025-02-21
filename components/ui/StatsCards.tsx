import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCardProps } from "@/lib/types";



export function StatsCard({ title, value, icon }: StatsCardProps) {
    return (
        <Card className="w-full p-4">
            <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{value}</p>
            </CardContent>
        </Card>
    );
}