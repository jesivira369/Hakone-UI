import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
    return (
        <Card className="w-full p-4 shadow-md rounded-lg bg-white dark:bg-gray-800">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</CardTitle>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}