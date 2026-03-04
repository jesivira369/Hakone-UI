"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/axiosInstance";
import { Service } from "@/lib/types";
import { ServiceStatus, ServiceStatusLabels } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type DateMode = "scheduled" | "delivery";

function toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parseServiceDate(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
}

/** Returns 42 cells (6 weeks × 7 days), Monday first. Null = empty cell. */
function getCalendarDays(year: number, month: number): (Date | null)[] {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const firstWeekday = (first.getDay() + 6) % 7; // 0 = Monday
    const daysInMonth = last.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length < 42) cells.push(null);
    return cells;
}

const statusStyles: Record<string, string> = {
    [ServiceStatus.SCHEDULED]: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    [ServiceStatus.IN_PROGRESS]: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    [ServiceStatus.COMPLETED]: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    [ServiceStatus.CANCELED]: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function CalendarPage() {
    const router = useRouter();
    const [viewDate, setViewDate] = useState(() => new Date());
    const [dateMode, setDateMode] = useState<DateMode>("scheduled");
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const { data: servicesData, isLoading } = useQuery({
        queryKey: ["services-calendar", year, month],
        queryFn: async () => {
            const { data } = await api.get("/services?page=1&limit=500");
            return data as { data: Service[] };
        },
    });

    const services = servicesData?.data ?? [];

    const firstDay = useMemo(() => new Date(year, month, 1), [year, month]);
    const lastDay = useMemo(() => new Date(year, month + 1, 0), [year, month]);

    const servicesByDay = useMemo(() => {
        const map: Record<string, Service[]> = {};
        const field = dateMode === "scheduled" ? "scheduledAt" : "deliveryAt";
        for (const s of services) {
            const raw = s[field];
            const d = parseServiceDate(raw ?? null);
            if (!d) continue;
            const key = toDateKey(d);
            if (d >= firstDay && d <= lastDay) {
                if (!map[key]) map[key] = [];
                map[key].push(s);
            }
        }
        return map;
    }, [services, dateMode, firstDay, lastDay]);

    const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const dayServices = selectedDay ? servicesByDay[toDateKey(selectedDay)] ?? [] : [];

    return (
        <div className="flex flex-col h-full p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h1 className="text-2xl font-bold">Calendario de servicios</h1>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-muted-foreground">Mostrar por:</span>
                    <div className="flex rounded-lg border p-0.5 bg-muted/50">
                        <button
                            type="button"
                            onClick={() => setDateMode("scheduled")}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${dateMode === "scheduled" ? "bg-background shadow font-medium" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Fecha programada
                        </button>
                        <button
                            type="button"
                            onClick={() => setDateMode("delivery")}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${dateMode === "delivery" ? "bg-background shadow font-medium" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Fecha de entrega
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 mb-4">
                <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Mes anterior">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-semibold min-w-[200px] text-center">
                    {MONTHS[month]} {year}
                </h2>
                <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Mes siguiente">
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {isLoading ? (
                <div className="flex-1 grid place-items-center text-muted-foreground">
                    Cargando servicios...
                </div>
            ) : (
                <div className="flex-1 min-h-0 rounded-lg border bg-card overflow-auto">
                    <div className="p-4 h-full min-h-[400px] flex flex-col">
                        <div className="grid grid-cols-7 gap-px mb-1">
                            {WEEKDAYS.map((day) => (
                                <div
                                    key={day}
                                    className="py-2 text-center text-sm font-medium text-muted-foreground"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-px flex-1 auto-rows-fr">
                            {calendarDays.map((cell, i) => {
                                if (cell === null) {
                                    return <div key={`empty-${i}`} className="bg-muted/30 min-h-[80px]" />;
                                }
                                const key = toDateKey(cell);
                                const dayServicesList = servicesByDay[key] ?? [];
                                const isToday =
                                    cell.getDate() === new Date().getDate() &&
                                    cell.getMonth() === new Date().getMonth() &&
                                    cell.getFullYear() === new Date().getFullYear();
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedDay(cell)}
                                        className={`min-h-[80px] p-2 text-left border rounded-md hover:bg-accent/50 transition-colors flex flex-col items-start gap-1 ${isToday ? "ring-2 ring-primary" : ""}`}
                                    >
                                        <span
                                            className={`text-sm font-medium ${isToday ? "text-primary" : "text-foreground"}`}
                                        >
                                            {cell.getDate()}
                                        </span>
                                        <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                                            {dayServicesList.slice(0, 3).map((s) => (
                                                <div
                                                    key={s.id}
                                                    className={`text-xs truncate px-1.5 py-0.5 rounded ${statusStyles[s.status] ?? "bg-muted text-muted-foreground"}`}
                                                    title={s.description}
                                                >
                                                    {s.description?.slice(0, 20) ?? "—"}
                                                </div>
                                            ))}
                                            {dayServicesList.length > 3 && (
                                                <span className="text-xs text-muted-foreground px-1">
                                                    +{dayServicesList.length - 3} más
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDay
                                ? `Servicios — ${selectedDay.getDate()} ${MONTHS[selectedDay.getMonth()]} ${selectedDay.getFullYear()}`
                                : ""}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1 min-h-0 space-y-3 pr-2">
                        {dayServices.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No hay servicios este día.</p>
                        ) : (
                            dayServices.map((s) => (
                                <div
                                    key={s.id}
                                    className="p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-sm line-clamp-2">{s.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {s.client?.name ?? "—"} · {s.bicycle ? `${s.bicycle.brand} ${s.bicycle.model}` : "—"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {s.mechanic?.name ?? "—"} · {formatCurrency(s.price)}
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 text-xs px-2 py-1 rounded-full ${statusStyles[s.status] ?? "bg-muted"}`}
                                        >
                                            {ServiceStatusLabels[s.status as ServiceStatus] ?? s.status}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 text-xs"
                                        onClick={() => {
                                            setSelectedDay(null);
                                            router.push(`/services/${s.id}`);
                                        }}
                                    >
                                        Ver detalle
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
