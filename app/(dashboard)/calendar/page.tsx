"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/axiosInstance";
import { Service } from "@/lib/types";
import { ServiceStatus, ServiceStatusLabels } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
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
    return Number.isNaN(d.getTime()) ? null : d;
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

    const services = useMemo(() => servicesData?.data ?? [], [servicesData?.data]);

    const firstDay = useMemo(() => new Date(year, month, 1), [year, month]);
    const lastDay = useMemo(() => new Date(year, month + 1, 0), [year, month]);

    const servicesByDay = useMemo(() => {
        const map: Record<string, Service[]> = {};

        for (const s of services) {
            const raw = dateMode === "scheduled" ? s.scheduledAt : s.deliveryAt;
            const d = parseServiceDate(raw ?? null);
            if (!d) continue;

            const key = toDateKey(d);

            // Only include items in the current month view
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

    const today = useMemo(() => new Date(), []);
    const calendarPanelHeight = "clamp(420px, calc(100dvh - 230px), 920px)";

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
            {/* Barra superior: título + filtro + navegación del mes (estilo tipo Google Calendar) */}
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    Calendario de servicios
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={prevMonth}
                            aria-label="Mes anterior"
                            className="h-8 w-8 shrink-0 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="min-w-[140px] text-center text-base font-semibold sm:min-w-[180px] sm:text-lg">
                            {MONTHS[month]} {year}
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={nextMonth}
                            aria-label="Mes siguiente"
                            className="h-8 w-8 shrink-0 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-1 py-0.5">
                        <span className="hidden text-sm text-muted-foreground sm:inline">
                            Mostrar por:
                        </span>
                        <button
                            type="button"
                            onClick={() => setDateMode("scheduled")}
                            className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${dateMode === "scheduled"
                                ? "bg-background font-medium shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Fecha programada
                        </button>
                        <button
                            type="button"
                            onClick={() => setDateMode("delivery")}
                            className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${dateMode === "delivery"
                                ? "bg-background font-medium shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Fecha de entrega
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid del mes: misma estructura con o sin servicios */}
            {isLoading ? (
                <div
                    className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm"
                    style={{ height: calendarPanelHeight }}
                >
                    Cargando servicios...
                </div>
            ) : (
                <div
                    className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                    style={{ height: calendarPanelHeight }}
                >
                    <div className="h-full min-h-0 w-full overflow-x-auto">
                        <div className="flex h-full min-h-0 min-w-[320px] flex-col p-3 sm:p-4">
                            {/* Días de la semana (fila fija) */}
                            <div className="grid grid-cols-7 gap-px">
                                {WEEKDAYS.map((day) => (
                                    <div
                                        key={day}
                                        className="flex h-8 items-center justify-center text-center text-xs font-medium uppercase tracking-wider text-muted-foreground sm:h-9 sm:text-sm"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* 6 semanas x 7 días: siempre misma malla */}
                            <div className="mt-1 grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-px">
                                {calendarDays.map((cell, i) => {
                                    if (cell === null) {
                                        return <div key={`empty-${i}`} className="h-full min-h-0 rounded-md bg-muted/20" />;
                                    }

                                    const key = toDateKey(cell);
                                    const dayServicesList = servicesByDay[key] ?? [];
                                    const isToday =
                                        cell.getDate() === today.getDate() &&
                                        cell.getMonth() === today.getMonth() &&
                                        cell.getFullYear() === today.getFullYear();

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setSelectedDay(cell)}
                                            className={`flex h-full min-h-0 min-w-0 flex-col items-start justify-start gap-1 overflow-hidden rounded-md border border-border/40 bg-background/80 p-2 text-left transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isToday ? "ring-2 ring-primary bg-primary/5" : ""}`}
                                        >
                                            <span
                                                className={`shrink-0 text-sm font-medium ${isToday ? "text-primary" : "text-foreground"}`}
                                            >
                                                {cell.getDate()}
                                            </span>
                                            <div className="mt-0.5 flex min-h-0 min-w-0 flex-1 flex-col justify-start gap-0.5 overflow-hidden">
                                                {dayServicesList.slice(0, 3).map((s) => (
                                                    <div
                                                        key={s.id}
                                                        className={`truncate rounded px-1.5 py-0.5 text-xs ${statusStyles[s.status] ?? "bg-muted text-muted-foreground"}`}
                                                        title={s.description}
                                                    >
                                                        {s.description?.slice(0, 28) ?? "—"}
                                                    </div>
                                                ))}
                                                {dayServicesList.length > 3 && (
                                                    <span className="shrink-0 px-1.5 text-xs text-muted-foreground">
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
                </div>
            )}

            {/* Day dialog */}
            <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
                <DialogContent className="flex max-h-[85dvh] max-w-[min(95vw,32rem)] flex-col overflow-hidden sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDay
                                ? `Servicios — ${selectedDay.getDate()} ${MONTHS[selectedDay.getMonth()]} ${selectedDay.getFullYear()}`
                                : ""}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto space-y-3 pr-2">
                        {dayServices.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No hay servicios este día.</p>
                        ) : (
                            dayServices.map((s) => (
                                <div
                                    key={s.id}
                                    className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/30"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium line-clamp-2">{s.description}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {s.client?.name ?? "—"} ·{" "}
                                                {s.bicycle ? `${s.bicycle.brand} ${s.bicycle.model}` : "—"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {s.mechanic?.name ?? "—"} · {formatCurrency(s.price)}
                                            </p>
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full px-2 py-1 text-xs ${statusStyles[s.status] ?? "bg-muted"
                                                }`}
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