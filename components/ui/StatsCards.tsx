import { Card } from "@/components/ui/card";
import { StatsCardProps } from "@/lib/types";
import Link from "next/link";

export function StatsCard({ title, value, icon, link }: StatsCardProps) {
    return (
        <Card className="flex w-full flex-col rounded-xl border border-border bg-card p-4 shadow-md transition-shadow hover:shadow-lg">
            <Link
                href={link}
                className="text-center text-sm font-bold text-foreground hover:underline sm:text-base"
            >
                {title}
            </Link>
            <div className="mt-3 flex w-full min-w-0 flex-1 items-center justify-between gap-3 px-1 sm:gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground sm:h-10 sm:w-10 [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-7 sm:[&_svg]:w-7">
                    {icon}
                </div>
                <p
                    className="min-w-0 flex-1 overflow-visible text-right text-lg font-extrabold tabular-nums text-foreground sm:text-xl md:text-2xl"
                    title={typeof value === "string" ? value : String(value)}
                >
                    {value}
                </p>
            </div>
        </Card>
    );
}