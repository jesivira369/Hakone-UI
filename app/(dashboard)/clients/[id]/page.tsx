"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Client, Bike } from "@/lib/types";
import api from "@/lib/axiosInstance";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Edit, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { ClientModal } from "@/components/ui/ClientModal";
import { formatDate } from "@/lib/utils";

export default function ClientDetailPage() {
    const { id: clientId } = useParams();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const router = useRouter();

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

    if (isLoading) return <p>Cargando cliente...</p>;
    if (error || !clientData) return <p>Error al cargar el cliente.</p>;

    const bicycleColumns: ColumnDef<Bike>[] = [
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
            header: "Acciones",
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/bikes/${row.original.id}`)}>
                        <Eye size={16} />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Cliente: {clientData.name}</h1>
                <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                    <Edit size={16} className="mr-2" /> Editar Cliente
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Información de Contacto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Teléfono:</strong> {clientData.phone}</p>
                        <p><strong>Email:</strong> {clientData.email}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Datos Generales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Registrado el:</strong> {formatDate(clientData.updatedAt)}</p>
                        <p><strong>Última actualización:</strong> {formatDate(clientData.updatedAt)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Resumen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Bicicletas asociadas:</strong> {clientData.bicycles?.length || 0}</p>
                        <p><strong>Servicios realizados:</strong> {clientData.services?.length || 0}</p>
                    </CardContent>
                </Card>
            </div>

            {isBikeLoading && <p>Cargando bicicletas...</p>}
            {isBikeError && <p>Error al cargar las bicicletas.</p>}
            <div>
                <h2 className="text-xl font-semibold mb-4">Bicicletas del Cliente</h2>
                <DataTable
                    columns={bicycleColumns}
                    data={clientData.bicycles}
                    page={page}
                    limit={limit}
                    total={bikesData?.total}
                    setPage={setPage}
                    setLimit={setLimit}
                />
            </div>

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Estadísticas y Reportes (Próximamente)</h2>
                <p className="text-gray-500">Aquí se mostrarán gráficos y estadísticas sobre los servicios y actividad del cliente.</p>
            </div>
            {editModalOpen && (
                <ClientModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    client={clientData}
                />
            )}
        </div>

    );
}
