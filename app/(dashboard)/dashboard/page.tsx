"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { StatsCard } from "@/components/ui/StatsCards";
import { CustomBarChart } from "@/components/ui/BarChart";
import { CustomLineChart } from "@/components/ui/LineChart";
import { Users, Bike, Wrench, DollarSign, Download } from "lucide-react";
import { DashboardSkeleton } from "@/components/ui/Skeleton/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-toastify";
import { StatsOverview, RevenueStats, ServicesByStatus, TopClientItem } from "@/lib/types";

export default function DashboardOverview() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [appliedFrom, setAppliedFrom] = useState("");
    const [appliedTo, setAppliedTo] = useState("");

    const { data: overview, isLoading: overviewLoading } = useQuery<StatsOverview>({
        queryKey: ["stats-overview"],
        queryFn: async () => {
            const { data } = await api.get("/statistics/overview");
            return data;
        },
    });

    const { data: revenue, isLoading: revenueLoading } = useQuery<RevenueStats>({
        queryKey: ["stats-revenue", appliedFrom, appliedTo],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (appliedFrom) params.set("dateFrom", appliedFrom);
            if (appliedTo) params.set("dateTo", appliedTo);
            const query = params.toString() ? `?${params.toString()}` : "";
            const { data } = await api.get(`/statistics/revenue${query}`);
            return data;
        },
    });

    const { data: byStatus, isLoading: statusLoading } = useQuery<ServicesByStatus>({
        queryKey: ["stats-by-status", appliedFrom, appliedTo],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (appliedFrom) params.set("dateFrom", appliedFrom);
            if (appliedTo) params.set("dateTo", appliedTo);
            const query = params.toString() ? `?${params.toString()}` : "";
            const { data } = await api.get(`/statistics/services-by-status${query}`);
            return data;
        },
    });

    const { data: topClients, isLoading: topClientsLoading } = useQuery<TopClientItem[]>({
        queryKey: ["stats-top-clients", appliedFrom, appliedTo],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: "5" });
            if (appliedFrom) params.set("dateFrom", appliedFrom);
            if (appliedTo) params.set("dateTo", appliedTo);
            const { data } = await api.get(`/statistics/top-clients?${params.toString()}`);
            return data;
        },
    });

    const handleApplyFilters = () => {
        setAppliedFrom(dateFrom);
        setAppliedTo(dateTo);
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (appliedFrom) params.set("dateFrom", appliedFrom);
            if (appliedTo) params.set("dateTo", appliedTo);
            const query = params.toString() ? `?${params.toString()}` : "";
            const response = await api.get(`/statistics/export${query}`, {
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
        ? [
              { name: "En progreso", value: byStatus.IN_PROGRESS ?? 0 },
              { name: "Completados", value: byStatus.COMPLETED ?? 0 },
              { name: "Cancelados", value: byStatus.CANCELED ?? 0 },
          ]
        : [];

    return (
        <div className="grid gap-6">
            {/* Stats Cards */}
            <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

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
                <Button onClick={handleApplyFilters}>Aplicar filtros</Button>
                <Button variant="outline" onClick={handleExport} className="inline-flex items-center gap-2">
                    <Download size={16} aria-hidden /> Exportar Excel
                </Button>
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
                        label="Ingresos (USD)"
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
                                        <td className="px-4 py-2">{item.client.email}</td>
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
