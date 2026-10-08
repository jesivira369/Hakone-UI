"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { StatsCard } from "@/components/ui/StatsCards";
import { CustomBarChart } from "@/components/ui/BarChart";
import { CustomLineChart } from "@/components/ui/LineChart";
import { Users, Bike, Wrench, DollarSign, Download, TrendingDown, TrendingUp } from "lucide-react";
import { DashboardSkeleton } from "@/components/ui/Skeleton/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-toastify";
import { DashboardStats, InShopSummary } from "@/lib/types/stats";
import { ExpenseCategoryLabels, PaymentMethod, PaymentMethodLabels, ServiceStatus, ServiceStatusLabels } from "@/lib/enums";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

type UpcomingService = {
    id: number;
    description: string;
    scheduledAt?: string;
    deliveryAt?: string;
    eventType: "inicio" | "entrega";
    eventDate: string;
    client?: { id: number; name: string } | null;
    bicycle?: { id: number; brand: string; model: string } | null;
};

type UpcomingReminder = {
    id: number;
    category: string;
    scheduledReminderDate?: string | null;
    reminderContactedAt?: string | null;
    client?: { id: number; name: string; phone: string } | null;
    bicycle?: { id: number; brand: string; model: string } | null;
};

type UpcomingTab = "todos" | "inicio" | "entrega";

function ReminderContactButton({ serviceId, contacted }: { serviceId: number; contacted: boolean }) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: () => api.patch(`/services/${serviceId}/reminder-contacted`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services-reminders-upcoming"] });
            toast.success("Recordatorio marcado como contactado");
        },
        onError: () => {
            toast.error("Error al marcar el recordatorio");
        },
    });

    if (contacted) {
        return (
            <span className="inline-flex items-center rounded-md border border-green-600/30 bg-green-600/10 px-2 py-1 text-[11px] font-medium text-green-700 dark:text-green-400">
                ✓ Ya contactado
            </span>
        );
    }

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                mutation.mutate();
            }}
            disabled={mutation.isPending}
            title="Marcar como contactado"
            className="inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
        >
            {mutation.isPending ? "..." : "✓ Contactado"}
        </button>
    );
}

function ReminderDeleteButton({ serviceId, itemName }: { serviceId: number; itemName: string }) {
    const queryClient = useQueryClient();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const mutation = useMutation({
        mutationFn: () => api.delete(`/services/${serviceId}/reminder`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services-reminders-upcoming"] });
            toast.success("Recordatorio eliminado");
        },
        onError: () => {
            toast.error("Error al eliminar el recordatorio");
        },
    });

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmOpen(true);
                }}
                title="Borrar recordatorio"
                className="inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
            >
                Borrar
            </button>
            <DeleteModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onDelete={() => mutation.mutateAsync()}
                itemName={`el recordatorio de ${itemName}`}
            />
        </>
    );
}

/**
 * Los filtros de fecha son días del calendario del taller, no instantes UTC.
 * Se manda el offset del browser para que el backend recorte el rango en la
 * zona horaria correcta (en Argentina, sin esto, los cierres de la tarde caían
 * en el día siguiente).
 */
function buildStatsQuery(from: string, to: string, extra: Record<string, string> = {}): string {
    const params = new URLSearchParams(extra);
    if (from) params.set("dateFrom", from);
    if (to) params.set("dateTo", to);
    params.set("tzOffset", String(new Date().getTimezoneOffset()));
    return `?${params.toString()}`;
}

export default function DashboardOverview() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [upcomingTab, setUpcomingTab] = useState<UpcomingTab>("todos");
    const [appliedFrom, setAppliedFrom] = useState("");
    const [appliedTo, setAppliedTo] = useState("");
    // Filtro por método de pago ("ALL" = todos); igual que las fechas, se aplica con "Aplicar filtros".
    const [method, setMethod] = useState("ALL");
    const [appliedMethod, setAppliedMethod] = useState("ALL");
    const methodExtra: Record<string, string> = appliedMethod === "ALL" ? {} : { paymentMethod: appliedMethod };

    // Una sola request trae overview, ingresos, gastos, estados, top clientes y métodos de pago.
    // Las estadísticas cambian solo cuando se modifica/cobra un servicio, y esas mutaciones invalidan
    // `stats-*` (lib/invalidateServiceQueries.ts), así que se pueden mantener frescas 5 minutos.
    const { data: dashboard, isLoading: dashboardLoading } = useQuery<DashboardStats>({
        // Las tarjetas comparten el filtro con los gráficos; si no, arriba se ve
        // el histórico y abajo el período, y parece que los números no cierran.
        queryKey: ["stats-dashboard", appliedFrom, appliedTo, appliedMethod],
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
            const { data } = await api.get(
                `/statistics/dashboard${buildStatsQuery(appliedFrom, appliedTo, { topClientsLimit: "5", ...methodExtra })}`,
            );
            return data;
        },
    });
    const overview = dashboard?.overview;
    const revenue = dashboard?.revenue;
    const expenses = dashboard?.expenses;
    const byStatus = dashboard?.byStatus;
    const topClients = dashboard?.topClients;
    const byMethod = dashboard?.revenueByMethod;
    const overviewLoading = dashboardLoading;
    const revenueLoading = dashboardLoading;
    const expensesLoading = dashboardLoading;
    const statusLoading = dashboardLoading;
    const topClientsLoading = dashboardLoading;
    const byMethodLoading = dashboardLoading;

    const { data: inShop } = useQuery<InShopSummary>({
        queryKey: ["services-in-shop"],
        queryFn: async () => {
            const { data } = await api.get("/services/in-shop?limit=5");
            return data;
        },
    });

    const { data: upcoming, isLoading: upcomingLoading } = useQuery<UpcomingService[]>({
        queryKey: ["services-upcoming", "7d"],
        queryFn: async () => {
            const { data } = await api.get("/services/upcoming?days=7");
            return data as UpcomingService[];
        },
    });

    const { data: reminders, isLoading: remindersLoading } = useQuery<UpcomingReminder[]>({
        queryKey: ["services-reminders-upcoming", "30d"],
        queryFn: async () => {
            const { data } = await api.get("/services/reminders/upcoming?days=30");
            return data as UpcomingReminder[];
        },
    });

    const handleApplyFilters = () => {
        setAppliedFrom(dateFrom);
        setAppliedTo(dateTo);
        setAppliedMethod(method);
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/statistics/export${buildStatsQuery(appliedFrom, appliedTo, methodExtra)}`, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `hakone-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error("Error al exportar el reporte", {
                className: "bg-red-600 text-white border border-red-700",
            });
        }
    };

    if (overviewLoading) return <DashboardSkeleton />;

    const stats = [
        {
            title: "Clientes",
            value: overview?.totalClients ?? 0,
            icon: <Users />,
            link: "/clients",
        },
        {
            title: "Bicicletas",
            value: overview?.totalBicycles ?? 0,
            icon: <Bike />,
            link: "/bikes",
        },
        {
            title: "Servicios Completados",
            value: overview?.totalServicesDone ?? 0,
            icon: <Wrench />,
            link: "/services",
        },
        {
            title: "Ingresos Totales",
            value: formatCurrency(overview?.totalRevenue ?? 0),
            icon: <DollarSign />,
            link: "/dashboard",
        },
        {
            title: "Egresos Totales",
            value: formatCurrency(overview?.totalExpenses ?? 0),
            icon: <TrendingDown />,
            link: "/gastos",
        },
        {
            title: "Ingresos Netos",
            value: formatCurrency(overview?.netIncome ?? 0),
            icon: <TrendingUp />,
            link: "/dashboard",
        },
    ];

    // Agrupar puntos diarios por mes (YYYY-MM → nombre legible)
    const revenueChartData = (() => {
        const monthly: Record<string, number> = {};
        for (const s of revenue?.series ?? []) {
            const month = s.date.slice(0, 7); // "YYYY-MM"
            monthly[month] = (monthly[month] ?? 0) + s.total;
        }
        return Object.entries(monthly)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, total]) => {
                const [year, m] = month.split("-");
                const label = new Date(Number(year), Number(m) - 1, 1).toLocaleString("es", {
                    month: "short",
                    year: "2-digit",
                });
                return { name: label, value: total };
            });
    })();

    const statusChartData = byStatus
        ? Object.values(ServiceStatus).map((st) => ({
              name: ServiceStatusLabels[st],
              value: byStatus[st] ?? 0,
          }))
        : [];

    const methodChartData = (byMethod?.methods ?? []).map((m) => ({
        name: PaymentMethodLabels[m.method as PaymentMethod] ?? m.method,
        value: m.total,
    }));

    const expensesByCategoryChartData = expenses
        ? Object.entries(expenses.byCategory).map(([key, value]) => ({
              name: ExpenseCategoryLabels[key as keyof typeof ExpenseCategoryLabels] ?? key,
              value,
          }))
        : [];

    return (
        <div className="grid gap-6">
            {/* Stats Cards */}
            <div className="grid w-full grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 gap-y-3 sm:gap-4 2xl:grid-cols-6">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Bicis que siguen en el taller */}
            {inShop && inShop.total > 0 && (
                <div className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold">
                            En el taller <span className="text-muted-foreground">({inShop.total})</span>
                        </h2>
                        <Link href="/services?pickedUp=false" className="text-sm text-primary hover:underline">
                            Ver todas
                        </Link>
                    </div>
                    <p className="text-xs text-muted-foreground">Bicis sin retirar, las más antiguas primero.</p>
                    <ul className="mt-3 divide-y">
                        {inShop.items.map((item) => {
                            const days = Math.max(0, Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 86_400_000));
                            return (
                                <li key={item.id}>
                                    <Link href={`/services/${item.id}`} className="flex items-center justify-between gap-3 py-2 hover:bg-muted/40">
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium">{item.client?.name ?? "—"}</span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {item.bicycle ? `${item.bicycle.brand} ${item.bicycle.model}` : "Bici ocasional"}
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                            {days === 0 ? "hoy" : `hace ${days} ${days === 1 ? "día" : "días"}`}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Filtros de fecha + Export */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="w-full min-w-0 sm:w-auto">
                    <label className="mb-1 block text-sm font-medium">Desde</label>
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full sm:w-40"
                    />
                </div>
                <div className="w-full min-w-0 sm:w-auto">
                    <label className="mb-1 block text-sm font-medium">Hasta</label>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full sm:w-40"
                    />
                </div>
                <div className="w-full min-w-0 sm:w-auto">
                    <label className="mb-1 block text-sm font-medium">Método de pago</label>
                    <Select value={method} onValueChange={setMethod}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos los métodos</SelectItem>
                            {Object.values(PaymentMethod).map((m) => (
                                <SelectItem key={m} value={m}>{PaymentMethodLabels[m]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleApplyFilters}>Aplicar filtros</Button>
                <Button variant="outline" onClick={handleExport} className="inline-flex items-center gap-2">
                    <Download size={16} aria-hidden /> Exportar Excel
                </Button>
            </div>

            {/* Ingresos por método de pago */}
            <div className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
                <h2 className="text-lg font-semibold">Ingresos por método de pago</h2>
                {byMethodLoading ? (
                    <div className="mt-3 text-sm text-muted-foreground">Cargando...</div>
                ) : (
                    <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {(byMethod?.methods ?? []).map((m) => (
                            <div key={m.method} className="rounded-lg border bg-background/70 p-3">
                                <p className="text-sm text-muted-foreground">
                                    {PaymentMethodLabels[m.method as PaymentMethod] ?? m.method}
                                </p>
                                <p className="text-lg font-bold">{formatCurrency(m.total)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {m.count} {m.count === 1 ? "servicio" : "servicios"}
                                    {byMethod && byMethod.totalRevenue > 0
                                        ? ` · ${Math.round((m.total / byMethod.totalRevenue) * 100)}%`
                                        : ""}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {revenueLoading ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Cargando ingresos...
                    </div>
                ) : (
                    <CustomBarChart
                        data={revenueChartData}
                        title="Ingresos mensuales"
                        label="Ingresos"
                    />
                )}
                {statusLoading ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Cargando estados...
                    </div>
                ) : (
                    <CustomLineChart
                        data={statusChartData}
                        title="Servicios por estado"
                        label="Cantidad"
                    />
                )}
                {byMethodLoading ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Cargando métodos de pago...
                    </div>
                ) : (
                    <CustomBarChart
                        data={methodChartData}
                        title="Ingresos por método de pago"
                        label="Ingresos"
                    />
                )}
                {expensesLoading ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Cargando egresos...
                    </div>
                ) : (
                    <CustomBarChart
                        data={expensesByCategoryChartData}
                        title="Egresos por categoría"
                        label="Egresos"
                    />
                )}
            </div>

            {/* Próximos servicios */}
            <div className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Próximos 7 días</h2>
                    <Link href="/calendar" className="text-sm text-primary hover:underline underline-offset-4">
                        Ver calendario
                    </Link>
                </div>

                {/* Tabs Todos / Inicio / Entrega */}
                <div className="mt-3 flex gap-1 rounded-lg bg-muted p-1 w-fit">
                    {(["todos", "inicio", "entrega"] as UpcomingTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setUpcomingTab(tab)}
                            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize ${
                                upcomingTab === tab
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {upcomingLoading ? (
                    <div className="mt-3 text-sm text-muted-foreground">Cargando...</div>
                ) : !upcoming || upcoming.length === 0 ? (
                    <div className="mt-3 text-sm text-muted-foreground">No tienes servicios próximos.</div>
                ) : (() => {
                    const filtered = upcomingTab === "todos"
                        ? upcoming
                        : upcoming.filter((s) => s.eventType === upcomingTab);
                    if (filtered.length === 0)
                        return <div className="mt-3 text-sm text-muted-foreground">Sin eventos de este tipo esta semana.</div>;
                    return (
                        <div className="mt-3 grid grid-cols-1 gap-2">
                            {filtered.slice(0, 5).map((s, i) => (
                                <Link
                                    key={`${s.id}-${s.eventType}-${i}`}
                                    href={`/services/${s.id}`}
                                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg border bg-background/70 px-3 py-2 hover:bg-accent/20"
                                >
                                    <div className="min-w-0 flex items-center gap-2">
                                        <span
                                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                                s.eventType === "inicio"
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                            }`}
                                        >
                                            {s.eventType}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium">{s.description}</div>
                                            <div className="truncate text-xs text-muted-foreground">
                                                {s.client?.name ?? "—"} · {s.bicycle ? `${s.bicycle.brand} ${s.bicycle.model}` : "—"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-xs text-muted-foreground">
                                        {s.eventDate ? String(s.eventDate).slice(0, 10) : ""}
                                    </div>
                                </Link>
                            ))}
                            {filtered.length > 5 && (
                                <div className="text-xs text-muted-foreground">
                                    +{filtered.length - 5} más…
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* Recordatorios próximos */}
            <div className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Recordatorios (próximos 30 días)</h2>
                    <Link href="/services" className="text-sm text-primary hover:underline underline-offset-4">
                        Ver servicios
                    </Link>
                </div>
                {remindersLoading ? (
                    <div className="mt-3 text-sm text-muted-foreground">Cargando...</div>
                ) : !reminders || reminders.length === 0 ? (
                    <div className="mt-3 text-sm text-muted-foreground">No hay recordatorios próximos.</div>
                ) : (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                        {reminders.slice(0, 5).map((r) => {
                            const phone = r.client?.phone?.replace(/\D/g, "") ?? "";
                            const bikeLabel = r.bicycle ? `${r.bicycle.brand} ${r.bicycle.model}` : "";
                            const waText = encodeURIComponent(
                                `Hola ${r.client?.name ?? ""}, te contactamos para recordarte el mantenimiento de tu bicicleta ${bikeLabel}. ¿Cuándo podemos agendarte?`
                            );
                            const waHref = phone ? `https://wa.me/${phone}?text=${waText}` : undefined;

                            return (
                                <div
                                    key={r.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border bg-background/70 px-3 py-2"
                                >
                                    <Link href={`/services/${r.id}`} className="min-w-0 flex-1 hover:opacity-80">
                                        <div className="truncate text-sm font-medium">
                                            {r.client?.name ?? "—"} · {bikeLabel || "—"}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground">
                                                Aviso: {r.scheduledReminderDate ? String(r.scheduledReminderDate).slice(0, 10) : "—"}
                                            </span>
                                            {r.client?.phone && (
                                                <span className="text-xs text-muted-foreground">· {r.client.phone}</span>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="shrink-0 flex items-center gap-2">
                                        {waHref && (
                                            <a
                                                href={waHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                title="Contactar por WhatsApp"
                                                className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-green-700 transition-colors"
                                            >
                                                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden>
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                </svg>
                                                WhatsApp
                                            </a>
                                        )}
                                        <ReminderContactButton serviceId={r.id} contacted={!!r.reminderContactedAt} />
                                        <ReminderDeleteButton
                                            serviceId={r.id}
                                            itemName={`${r.client?.name ?? "este cliente"} · ${bikeLabel || "—"}`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {reminders.length > 5 && (
                            <div className="text-xs text-muted-foreground">
                                +{reminders.length - 5} más…
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Top Clientes */}
            {!topClientsLoading && topClients && topClients.length > 0 && (
                <div className="min-w-0">
                    <h2 className="mb-3 text-lg font-semibold">Top Clientes</h2>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[500px] text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium">Cliente</th>
                                    <th className="px-4 py-2 text-left font-medium">Email</th>
                                    <th className="px-4 py-2 text-right font-medium">Servicios</th>
                                    <th className="px-4 py-2 text-right font-medium">Total gastado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topClients.map((item, i) => (
                                    <tr
                                        key={item.client.id}
                                        className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}
                                    >
                                        <td className="px-4 py-2">{item.client.name}</td>
                                        <td className="px-4 py-2">{item.client.email ?? "—"}</td>
                                        <td className="px-4 py-2 text-right">{item.totalServices}</td>
                                        <td className="px-4 py-2 text-right">
                                            {formatCurrency(item.totalSpent)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
