"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Client, Bike } from "@/lib/types";
import api from "@/lib/axiosInstance";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { CalendarDays, DollarSign, Edit, Eye, Receipt, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ClientModal } from "@/components/ui/ClientModal";
import { BicycleModal } from "@/components/ui/BikeModal";
import { RowActionsMenu, type RowAction } from "@/components/ui/RowActionsMenu";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DetailsSkeleton } from "@/components/ui/Skeleton/DetailsSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/StatsCards";
import { CustomBarChart } from "@/components/ui/BarChart";
import { ChartCard } from "@/components/ui/ChartCard";
import { ClientStats } from "@/lib/types";

// Azul de marca (primary del tema), mismo tono que el resto de la app en cada modo.
const BRAND_BAR_LIGHT = "#1FA2AD";
const BRAND_BAR_DARK = "#26CAD9";

/** "2026-03" -> "mar 26", con el mismo formato corto que el dashboard. */
function monthLabel(ym: string): string {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString("es", { month: "short", year: "2-digit" });
}

export default function ClientDetailPage() {
    const { id: clientId } = useParams();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
    const [bikeModalOpen, setBikeModalOpen] = useState(false);
    const router = useRouter();
    const { resolvedTheme } = useTheme();

    const { data: clientData, isLoading, error } = useQuery<Client>({
        queryKey: ["client", clientId],
        queryFn: async () => {
            const { data } = await api.get(`/clients/${clientId}`);
            return data;
        },
    });

    const { data: bikesData, isLoading: isBikeLoading, error: isBikeError } = useQuery({
        queryKey: ["bicycles", page, limit, clientId],
        queryFn: async () => {
            const { data } = await api.get(`/bicycles?page=${page}&limit=${limit}&clientId=${clientId}`);
            return data;
        },
        enabled: !!clientId
    });

    // Estadísticas del cliente (spec 010). La key empieza con "stats-" para que
    // invalidateServiceQueries() la refresque al cambiar un servicio. El cliente
    // genérico no tiene estadísticas (la API responde 404), así que no se consulta.
    const isGenericClient = clientData?.isGeneric === true;
    const { data: stats, error: statsError } = useQuery<ClientStats>({
        queryKey: ["stats-client", clientId],
        queryFn: async () => {
            const { data } = await api.get(`/clients/${clientId}/stats?tzOffset=${new Date().getTimezoneOffset()}`);
            return data;
        },
        enabled: !!clientId && !!clientData && !isGenericClient,
    });

    // Memoizadas y antes de los returns tempranos (regla de hooks). Si cambian en cada render,
    // el menú ⋮ abierto se cierra solo.
    const bicycleColumns = useMemo<ColumnDef<Bike>[]>(() => [
        { accessorKey: "brand", header: "Marca" },
        { accessorKey: "model", header: "Modelo" },
        {
            accessorKey: "createdAt",
            header: "Fecha de Registro",
            cell: ({ row }) => formatDate(row.original.createdAt),
        },
        {
            accessorKey: "lastServiceDate",
            header: "Último Servicio",
            cell: ({ row }) => row.original.lastServiceDate ? formatDate(row.original.lastServiceDate) : "Sin registro"
        },
        {
            id: "actions",
            header: "Acciones",
            enableSorting: false,
            cell: ({ row }) => {
                const bike = row.original;
                const items: RowAction[] = [
                    { label: "Ver bicicleta", icon: <Eye size={14} />, onSelect: () => router.push(`/bikes/${bike.id}`) },
                    { label: "Editar", icon: <Edit size={14} />, onSelect: () => { setSelectedBike(bike); setBikeModalOpen(true); } },
                ];
                return <RowActionsMenu ariaLabel="Acciones de la bicicleta" items={items} />;
            },
        },
    ], [router]);

    if (isLoading) {
        return <DetailsSkeleton />;
    }
    if (error || !clientData) return <p className="p-6 text-red-500">Error al cargar el cliente.</p>;

    return (
        <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold truncate sm:text-2xl">Cliente: {clientData.name}</h1>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditModalOpen(true)}>
                    <Edit size={16} className="mr-2" /> Editar Cliente
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Información de Contacto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Teléfono:</strong> {clientData.phone}</p>
                        <p><strong>Email:</strong> {clientData.email || "No disponible"}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Datos Generales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Registrado el:</strong> {formatDate(clientData.createdAt)}</p>
                        <p><strong>Última actualización:</strong> {formatDate(clientData.updatedAt)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Resumen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Bicicletas asociadas:</strong> {clientData.bicycles?.length || 0}</p>
                        <p><strong>Servicios realizados:</strong> {isGenericClient ? "—" : stats?.servicesCount ?? "—"}</p>
                    </CardContent>
                </Card>
            </div>

            {isBikeLoading && <p className="text-sm text-muted-foreground">Cargando bicicletas...</p>}
            {isBikeError && <p className="text-sm text-destructive">Error al cargar las bicicletas.</p>}
            <div className="min-w-0">
                <h2 className="mb-4 text-xl font-semibold">Bicicletas del Cliente</h2>
                <DataTable
                    columns={bicycleColumns}
                    data={bikesData?.data || []}
                    page={page}
                    limit={limit}
                    total={bikesData?.totalItems}
                    setPage={setPage}
                    setLimit={setLimit}
                    totalPage={bikesData?.totalPages}
                    onRowClick={(bike) => router.push(`/bikes/${bike.id}`)}
                    stickyLastColumn
                />
            </div>

            {!isGenericClient && (
                <section className="min-w-0 space-y-4">
                    <h2 className="text-xl font-semibold">Estadísticas del cliente</h2>
                    {statsError ? (
                        <p className="text-sm text-destructive">No se pudieron cargar las estadísticas.</p>
                    ) : !stats ? (
                        <>
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                {[0, 1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-24 rounded-xl" />
                                ))}
                            </div>
                            <Skeleton className="h-72 rounded-xl" />
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                <StatsCard title="Total gastado" value={formatCurrency(stats.totalSpent)} icon={<DollarSign />} />
                                <StatsCard title="Servicios" value={stats.servicesCount} icon={<Wrench />} />
                                <StatsCard
                                    title="Ticket promedio"
                                    value={stats.averageTicket === null ? "—" : formatCurrency(stats.averageTicket)}
                                    icon={<Receipt />}
                                />
                                <StatsCard
                                    title="Última visita"
                                    value={stats.lastServiceAt ? formatDate(stats.lastServiceAt) : "Sin servicios"}
                                    icon={<CalendarDays />}
                                />
                            </div>

                            {stats.paidCount === 0 ? (
                                <ChartCard title="Gasto mensual (últimos 12 meses)">
                                    <p className="py-12 text-center text-sm text-muted-foreground">Aún no hay servicios pagados</p>
                                </ChartCard>
                            ) : (
                                <CustomBarChart
                                    title="Gasto mensual (últimos 12 meses)"
                                    label="Gasto cobrado"
                                    color={resolvedTheme === "dark" ? BRAND_BAR_DARK : BRAND_BAR_LIGHT}
                                    formatValue={formatCurrency}
                                    data={stats.spendByMonth.map((m) => ({ name: monthLabel(m.month), value: m.total }))}
                                />
                            )}
                        </>
                    )}
                </section>
            )}
            {editModalOpen && (
                <ClientModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    client={clientData}
                />
            )}
            {bikeModalOpen && selectedBike && (
                <BicycleModal
                    isOpen={bikeModalOpen}
                    onClose={() => setBikeModalOpen(false)}
                    bicycle={selectedBike}
                />
            )}
        </div>

    );
}
