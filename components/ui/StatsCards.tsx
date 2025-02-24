import { Card } from "@/components/ui/card";
import { StatsCardProps } from "@/lib/types";
import Link from "next/link";


export function StatsCard({ title, value, icon, link }: StatsCardProps) {
    return (
        <Card className="w-full p-2 md:p-4 shadow-lg rounded-xl bg-white dark:bg-gray-800 flex flex-col items-center justify-center hover:shadow-xl transition-shadow">
            <Link href={link} className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 hover:underline text-center">
                {title}
            </Link>
            <div className="flex items-center justify-center w-full px-6 mt-4 gap-4 md:gap-8">
                <div className="text-[clamp(2.5rem, 7vw, 6rem)] text-gray-900 dark:text-gray-100 flex-shrink-0">
                    {icon}
                </div>
                <p className="text-[clamp(2.5rem, 8vw, 6.5rem)] font-extrabold text-gray-900 dark:text-gray-100 min-w-0 truncate text-nowrap">
                    {value}
                </p>
            </div>
        </Card>
    );
}