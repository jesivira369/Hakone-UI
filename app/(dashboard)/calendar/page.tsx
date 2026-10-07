"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/axiosInstance";
import { Service } from "@/lib/types";
import {
    ServiceStatus,
    ServiceStatusLabels,
    ServiceStatusStyles,
    URGENT_STYLE,
    getServiceDisplayStyle,
    isUrgentActive,
    getServiceStatusLabel,
} from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, serviceTotal } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
type ViewMode = "month" | "week" | "day";

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

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Lunes de la semana de `date`. */
function startOfWeek(date: Date): Date {
    return addDays(startOfDay(date), -((date.getDay() + 6) % 7));
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

/** Rango [from, to] (inclusive) que cubre la vista, para pedir solo eso a la API. */
function getRange(view: ViewMode, anchor: Date): { from: Date; to: Date } {
    if (view === "month") {
        return {
            from: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
            to: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999),
        };
    }
    if (view === "week") {
        const monday = startOfWeek(anchor);
        const sunday = addDays(monday, 6);
        return { from: monday, to: new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59, 999) };
    }
    const day = startOfDay(anchor);
    return { from: day, to: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999) };
}

function rangeTitle(view: ViewMode, anchor: Date): string {
    if (view === "month") return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
    if (view === "day") {
        return `${WEEKDAYS[(anchor.getDay() + 6) % 7]} ${anchor.getDate()} de ${MONTHS[anchor.getMonth()].toLowerCase()}`;
    }
    const monday = startOfWeek(anchor);
    const sunday = addDays(monday, 6);
    const sameMonth = monday.getMonth() === sunday.getMonth();
    return sameMonth
        ? `${monday.getDate()} – ${sunday.getDate()} de ${MONTHS[sunday.getMonth()].toLowerCase()}`
        : `${monday.getDate()} ${MONTHS[monday.getMonth()].slice(0, 3).toLowerCase()} – ${sunday.getDate()} ${MONTHS[sunday.getMonth()].slice(0, 3).toLowerCase()}`;
}

function bikeLabel(s: Service): string {
    return s.bicycle ? `${s.bicycle.brand} ${s.bicycle.model}` : "Bici ocasional";
}

function ServiceCard({ service, onOpen }: { service: Service; onOpen: () => void }) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className="flex w-full items-start justify-between gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{service.description}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {service.client?.name ?? "—"} · {bikeLabel(service)}
                </p>
                <p className="text-xs text-muted-foreground">
                    {service.mechanic?.name ?? "—"} · {formatCurrency(serviceTotal(service))}
                </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={`rounded-full px-2 py-0.5 text-xs ${getServiceDisplayStyle(service).badge}`}>
                    {getServiceStatusLabel(service.status)}
                </span>
                {service.isUrgent && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${URGENT_STYLE.badge}`}>Urgente</span>
                )}
            </div>
        </button>
    );
}

export default function CalendarPage() {
    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
    const [dateMode, setDateMode] = useState<DateMode>("scheduled");
    const [chosenView, setChosenView] = useState<ViewMode | null>(null);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    // Estados ocultos por los chips de filtro (todo visible por defecto).
    const [hiddenStatuses, setHiddenStatuses] = useState<Set<ServiceStatus>>(new Set());

    // PC: mes. Teléfono: semana (con opción de día). La grilla mensual es ilegible en pantallas chicas.
    const view: ViewMode = chosenView ?? (isDesktop ? "month" : "week");
    useEffect(() => {
        if (!isDesktop && chosenView === "month") setChosenView("week");
    }, [isDesktop, chosenView]);

    const { from, to } = useMemo(() => getRange(view, anchor), [view, anchor]);

    const { data: fetched, isLoading } = useQuery({
        queryKey: ["services-calendar", dateMode, from.toISOString(), to.toISOString()],
        queryFn: async () => {
            const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString(), mode: dateMode });
            const { data } = await api.get(`/services/calendar?${params.toString()}`);
            return data as Service[];
        },
    });

    const services = useMemo(
        () => (fetched ?? []).filter((s) => !hiddenStatuses.has(s.status as ServiceStatus)),
        [fetched, hiddenStatuses],
    );

    const servicesByDay = useMemo(() => {
        const map: Record<string, Service[]> = {};
        for (const s of services) {
            const d = parseServiceDate(dateMode === "scheduled" ? s.scheduledAt : s.deliveryAt);
            if (!d) continue;
            const key = toDateKey(d);
            (map[key] ??= []).push(s);
        }
        return map;
    }, [services, dateMode]);

    const shift = (direction: 1 | -1) => {
        if (view === "month") setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1));
        else setAnchor(addDays(anchor, (view === "week" ? 7 : 1) * direction));
    };

    const toggleStatus = (st: ServiceStatus) =>
        setHiddenStatuses((prev) => {
            const next = new Set(prev);
            if (next.has(st)) next.delete(st);
            else next.add(st);
            return next;
        });

    const today = useMemo(() => new Date(), []);
    const isToday = (d: Date) => toDateKey(d) === toDateKey(today);
    const calendarDays = useMemo(() => getCalendarDays(anchor.getFullYear(), anchor.getMonth()), [anchor]);
    const weekDays = useMemo(() => {
        const monday = startOfWeek(anchor);
        return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    }, [anchor]);
    const dayServices = selectedDay ? servicesByDay[toDateKey(selectedDay)] ?? [] : [];
    const calendarPanelHeight = "clamp(560px, calc(100dvh - 220px), 1040px)";

    const viewOptions: { id: ViewMode; label: string; desktopOnly?: boolean }[] = [
        { id: "month", label: "Mes", desktopOnly: true },
        { id: "week", label: "Semana" },
        { id: "day", label: "Día" },
    ];

    const segmented = (active: boolean) =>
        `rounded-md px-2.5 py-1.5 text-sm transition-colors ${active ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`;

    const renderAgendaDay = (day: Date) => {
        const list = servicesByDay[toDateKey(day)] ?? [];
        return (
            <section key={toDateKey(day)} aria-label={toDateKey(day)}>
                <h3 className={`mb-2 flex items-baseline gap-2 text-sm font-semibold ${isToday(day) ? "text-primary" : ""}`}>
                    <span className="uppercase tracking-wide">{WEEKDAYS[(day.getDay() + 6) % 7]}</span>
                    <span>{day.getDate()}</span>
                    {list.length > 0 && <span className="text-xs font-normal text-muted-foreground">{list.length}</span>}
                </h3>
                {list.length === 0 ? (
                    <p className="pb-2 text-xs text-muted-foreground">Sin servicios</p>
                ) : (
                    <div className="space-y-2 pb-2">
                        {list.map((s) => (
                            <ServiceCard key={s.id} service={s} onOpen={() => router.push(`/services/${s.id}`)} />
                        ))}
                    </div>
                )}
            </section>
        );
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
            <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Calendario</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => shift(-1)} aria-label="Anterior" className="h-8 w-8 shrink-0 p-0">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="min-w-[150px] text-center text-base font-semibold sm:min-w-[190px]">{rangeTitle(view, anchor)}</h2>
                        <Button variant="outline" size="sm" onClick={() => shift(1)} aria-label="Siguiente" className="h-8 w-8 shrink-0 p-0">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setAnchor(startOfDay(new Date()))}>
                            Hoy
                        </Button>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 px-1 py-0.5" role="group" aria-label="Vista">
                        {viewOptions
                            .filter((o) => !o.desktopOnly || isDesktop)
                            .map((o) => (
                                <button key={o.id} type="button" onClick={() => setChosenView(o.id)} className={segmented(view === o.id)}>
                                    {o.label}
                                </button>
                            ))}
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 px-1 py-0.5" role="group" aria-label="Mostrar por">
                        <button type="button" onClick={() => setDateMode("scheduled")} className={segmented(dateMode === "scheduled")}>
                            Programada
                        </button>
                        <button type="button" onClick={() => setDateMode("delivery")} className={segmented(dateMode === "delivery")}>
                            Entrega
                        </button>
                    </div>
                </div>
            </div>

            {/* Filtros por estado: cada chip muestra u oculta ese estado */}
            <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-1" aria-label="Filtrar por estado">
                {Object.values(ServiceStatus).map((st) => {
                    const hidden = hiddenStatuses.has(st);
                    return (
                        <button
                            key={st}
                            type="button"
                            onClick={() => toggleStatus(st)}
                            aria-pressed={!hidden}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${hidden ? "border-dashed text-muted-foreground line-through opacity-60" : "bg-card"}`}
                        >
                            <span className={`h-2 w-2 rounded-full ${ServiceStatusStyles[st].dot}`} aria-hidden />
                            {ServiceStatusLabels[st]}
                        </button>
                    );
                })}
                <span className="inline-flex shrink-0 items-center gap-1.5 px-1 text-xs text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${URGENT_STYLE.dot}`} aria-hidden /> Urgente (activo)
                </span>
                {hiddenStatuses.size > 0 && (
                    <button type="button" className="shrink-0 text-xs text-primary hover:underline" onClick={() => setHiddenStatuses(new Set())}>
                        Mostrar todos
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
                    Cargando servicios...
                </div>
            ) : view === "month" ? (
                <div
                    className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card"
                    style={{ height: calendarPanelHeight }}
                >
                    <div className="flex h-full min-h-0 w-full flex-col p-3 lg:p-5">
                        <div className="grid grid-cols-7 gap-px">
                            {WEEKDAYS.map((day) => (
                                <div key={day} className="flex h-8 items-center justify-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1.5">
                            {calendarDays.map((cell, i) => {
                                if (cell === null) return <div key={`empty-${i}`} className="rounded-md bg-muted/20" />;
                                const list = servicesByDay[toDateKey(cell)] ?? [];
                                return (
                                    <button
                                        key={toDateKey(cell)}
                                        type="button"
                                        onClick={() => setSelectedDay(cell)}
                                        className={`flex h-full min-h-0 min-w-0 flex-col items-start gap-1 overflow-hidden rounded-lg border border-border/50 bg-background/90 p-2 text-left transition-colors hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isToday(cell) ? "bg-primary/5 ring-2 ring-primary" : ""}`}
                                    >
                                        <div className="flex w-full items-center justify-between gap-2">
                                            <span className={`text-sm font-semibold ${isToday(cell) ? "text-primary" : ""}`}>{cell.getDate()}</span>
                                            {list.length > 0 && (
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{list.length}</span>
                                            )}
                                        </div>
                                        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
                                            {list.slice(0, 2).map((s) => (
                                                <div
                                                    key={s.id}
                                                    title={s.description}
                                                    className={`flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs leading-tight ${getServiceDisplayStyle(s).badge}`}
                                                >
                                                    <span className={`h-2 w-2 shrink-0 rounded-full ${isUrgentActive(s) ? "bg-white" : getServiceDisplayStyle(s).dot}`} aria-hidden />
                                                    <span className="min-w-0 flex-1 truncate">{s.description ?? "—"}</span>
                                                </div>
                                            ))}
                                            {list.length > 2 && <span className="px-1.5 text-[11px] text-muted-foreground">+{list.length - 2} más</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : view === "week" ? (
                <div className="min-w-0 flex-1 space-y-1">
                    {/* Tira de la semana: tocar un día salta a su vista diaria */}
                    <div className="mb-3 grid grid-cols-7 gap-1">
                        {weekDays.map((d) => {
                            const count = servicesByDay[toDateKey(d)]?.length ?? 0;
                            return (
                                <button
                                    key={toDateKey(d)}
                                    type="button"
                                    onClick={() => {
                                        setAnchor(d);
                                        setChosenView("day");
                                    }}
                                    className={`flex flex-col items-center rounded-lg border py-1.5 text-xs transition-colors hover:bg-accent/30 ${isToday(d) ? "border-primary bg-primary/5" : "border-border/60"}`}
                                >
                                    <span className="uppercase text-muted-foreground">{WEEKDAYS[(d.getDay() + 6) % 7]}</span>
                                    <span className={`text-sm font-semibold ${isToday(d) ? "text-primary" : ""}`}>{d.getDate()}</span>
                                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${count > 0 ? "bg-primary" : "bg-transparent"}`} aria-hidden />
                                </button>
                            );
                        })}
                    </div>
                    {weekDays.map(renderAgendaDay)}
                </div>
            ) : (
                <div className="min-w-0 flex-1 space-y-1">{renderAgendaDay(anchor)}</div>
            )}

            <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
                <DialogContent className="flex max-h-[85dvh] max-w-[min(95vw,32rem)] flex-col overflow-hidden sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDay ? `Servicios — ${selectedDay.getDate()} ${MONTHS[selectedDay.getMonth()]} ${selectedDay.getFullYear()}` : ""}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
                        {dayServices.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay servicios este día.</p>
                        ) : (
                            dayServices.map((s) => (
                                <ServiceCard
                                    key={s.id}
                                    service={s}
                                    onOpen={() => {
                                        setSelectedDay(null);
                                        router.push(`/services/${s.id}`);
                                    }}
                                />
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
