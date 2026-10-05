import { Card } from "@/components/ui/card";
import { StatsCardProps } from "@/lib/types";
import Link from "next/link";

export function StatsCard({ title, value, icon, link }: StatsCardProps) {
    const text = typeof value === "string" ? value : String(value);
    return (
        // Título e ícono arriba, cifra debajo y a todo el ancho: así los montos largos no se cortan
        // ni cambian de tamaño la tarjeta (antes ícono y cifra competían por el mismo renglón).
        <Card className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-md transition-shadow hover:shadow-lg">
            <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <span className="flex shrink-0 items-center [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
                <Link href={link} className="min-w-0 truncate text-sm font-semibold text-foreground hover:underline" title={title}>
                    {title}
                </Link>
            </div>
            <p
                className="min-w-0 truncate text-xl font-extrabold tabular-nums text-foreground sm:text-2xl"
                title={text}
            >
                {value}
            </p>
        </Card>
    );
}
