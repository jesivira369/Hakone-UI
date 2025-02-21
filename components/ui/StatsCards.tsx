import { Card } from "@/components/ui/card";
import { StatsCardProps } from "@/lib/types";
import Link from "next/link";


export function StatsCard({ title, value, icon, link }: StatsCardProps) {
    return (
        <Card className="w-full p-4 shadow-lg rounded-xl bg-white dark:bg-gray-800 flex flex-col items-center justify-center hover:shadow-xl transition-shadow">
            <Link href={link} className="text-2xl font-bold text-gray-900 dark:text-gray-100 hover:underline mb-4">
                {title}
            </Link>
            <div className="flex items-center justify-evenly w-full px-4">
                <div className="text-5xl text-gray-900 dark:text-gray-100">{icon}</div>
                <p className="text-5xl font-extrabold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
        </Card>
    );
}