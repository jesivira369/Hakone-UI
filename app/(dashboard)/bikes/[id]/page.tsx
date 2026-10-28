"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Bike, Service } from "@/lib/types";
import api from "@/lib/axiosInstance";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Edit, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getServiceStatusLabel, getServiceStatusStyle } from "@/lib/enums";
import { BicycleModal } from "@/components/ui/BikeModal";
import { ServiceModal } from "@/components/ui/ServiceModal";
import { DetailsSkeleton } from "@/components/ui/Skeleton/DetailsSkeleton";
import { RowActionsMenu, type RowAction } from "@/components/ui/RowActionsMenu";

export default function BikeDetailPage() {
    const { id: bikeId } = useParams();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const router = useRouter();

    const { data: bikeData, isLoading, error } = useQuery<Bike>({
        queryKey: ["bike", bikeId],
        queryFn: async () => {
            const { data } = await api.get(`/bicycles/${bikeId}`);
            return data;
        },
        enabled: !!bikeId,
    });

    const { data: servicesData, isLoading: isServiceLoading, error: isServiceError } = useQuery({
        queryKey: ["services", page, limit, bikeId],
        queryFn: async () => {
            const { data } = await api.get(`/services?page=${page}&limit=${limit}&bicycleId=${bikeId}`);
            return data;
        },
        enabled: !!bikeId
    });

    // Memoizadas y antes de los returns tempranos (regla de hooks). Si cambian en cada render,
    // el menú ⋮ abierto se cierra solo.
    const serviceColumns = useMemo<ColumnDef<Service>[]>(() => [
        {
            accessorKey: "description",
            header: "Descripción",
            cell: ({ row }) => row.original.description.length > 50
                ? `${row.original.description.substring(0, 50)}...`
                : row.original.description,
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${getServiceStatusStyle(row.original.status).badge}`}>
                    {getServiceStatusLabel(row.original.status)}
                </span>
            ),
        },
        {
            accessorKey: "price",
            header: "Costo",
            cell: ({ row }) => formatCurrency(row.original.price),
        },
        {
            accessorKey: "createdAt",
            header: "Fecha de Creación",
            cell: ({ row }) => formatDate(row.original.createdAt),
        },
        {
            accessorKey: "completedAt",
            header: "Fecha de Finalización",
            cell: ({ row }) => row.original.completedAt ? formatDate(row.original.completedAt) : "N/A",
        },
        {
            id: "actions",
            header: "Acciones",
            enableSorting: false,
            cell: ({ row }) => {
                const service = row.original;
                const items: RowAction[] = [
                    { label: "Ver servicio", icon: <Eye size={14} />, onSelect: () => router.push(`/services/${service.id}`) },
                    { label: "Editar", icon: <Edit size={14} />, onSelect: () => { setSelectedService(service); setServiceModalOpen(true); } },
                ];
                return <RowActionsMenu ariaLabel="Acciones del servicio" items={items} />;
            },
        },
    ], [router]);

    if (isLoading) {
        return <DetailsSkeleton />;
    }

    if (error || !bikeData) return <p className="p-6 text-red-500">Error al cargar la bicicleta.</p>;

    return (
        <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="truncate text-xl font-bold sm:text-2xl">Bicicleta: {bikeData.brand} {bikeData.model}</h1>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditModalOpen(true)}>
                    <Edit size={16} className="mr-2" /> Editar Bicicleta
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Información de la Bicicleta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Marca:</strong> {bikeData.brand}</p>
                        <p><strong>Modelo:</strong> {bikeData.model}</p>
                        <p><strong>Registrada el:</strong> {formatDate(bikeData.createdAt)}</p>
                        <p><strong>Última actualización:</strong> {formatDate(bikeData.updatedAt)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Nombre:</strong> {bikeData.client?.name || "Sin cliente"}</p>
                        <p><strong>Email:</strong> {bikeData.client?.email || "No disponible"}</p>
                        <p><strong>Teléfono:</strong> {bikeData.client?.phone || "No disponible"}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="min-w-0">
                <h2 className="mb-4 text-xl font-semibold">Servicios de la Bicicleta</h2>
                {isServiceLoading ? <p className="text-sm text-muted-foreground">Cargando servicios...</p> : isServiceError ? <p className="text-sm text-destructive">Error al cargar los servicios.</p> : (
                    <DataTable
                        columns={serviceColumns}
                        data={servicesData.data ?? []}
                        page={page}
                        limit={limit}
                        total={servicesData?.totalItems}
                        setPage={setPage}
                        setLimit={setLimit}
                        totalPage={servicesData?.totalPages}
                        onRowClick={(service) => router.push(`/services/${service.id}`)}
                        stickyLastColumn
                    />
                )}
            </div>

            {editModalOpen && (
                <BicycleModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    bicycle={bikeData}
                />
            )}
            {serviceModalOpen && (
                <ServiceModal
                    isOpen={serviceModalOpen}
                    onClose={() => setServiceModalOpen(false)}
                    service={selectedService}
                />
            )}
        </div>
    );
}
