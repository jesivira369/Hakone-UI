"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Bike, Service } from "@/lib/types";
import api from "@/lib/axiosInstance";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Edit, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BicycleModal } from "@/components/ui/BikeModal";
import { DetailsSkeleton } from "@/components/ui/Skeleton/DetailsSkeleton";

export default function BikeDetailPage() {
    const { id: bikeId } = useParams();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
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

    if (isLoading) {
        return <DetailsSkeleton />;
    }

    if (error || !bikeData) return <p className="p-6 text-red-500">Error al cargar la bicicleta.</p>;

    const serviceColumns: ColumnDef<Service>[] = [
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
                <span className={`px-2 py-1 rounded-md text-white ${row.original.status === "COMPLETED" ? "bg-green-500" : row.original.status === "IN_PROGRESS" ? "bg-yellow-500" : "bg-red-500"}`}>
                    {row.original.status === "COMPLETED" ? "Completado" : row.original.status === "IN_PROGRESS" ? "En progreso" : "Cancelado"}
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
            header: "Acciones",
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/services/${row.original.id}`)}>
                        <Eye size={16} />
                    </Button>
                </div>
            ),
        },
    ];

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
        </div>
    );
}
