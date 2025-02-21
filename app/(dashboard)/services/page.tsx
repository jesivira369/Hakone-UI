"use client";

import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { ServiceModal } from "@/components/ui/ServiceModal";
import api from "@/lib/axiosInstance";
import { ColumnDef } from "@tanstack/react-table";
import { Service } from "@/lib/types";
import { Eye, Edit, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { ServiceStatus, ServiceStatusLabels } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import { TableSkeleton } from "@/components/ui/Skeleton/TableSkeleton";

export default function ServicesPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data: servicesData, isLoading, error } = useQuery({
        queryKey: ["services", page, limit],
        queryFn: async () => {
            const { data } = await api.get(`/services?page=${page}&limit=${limit}`);
            return data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/bicycles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bicycles"] });

            toast.success("Servicio eliminado con exito", {
                className: "bg-green-600 text-white border border-green-700",
            });

            setDeleteModalOpen(false);
        },
        onError: (error) => {
            toast.error(error.message || "Ocurrió un error al eliminar el servicio", {
                className: "bg-red-600 text-white border border-red-700",
            });
        },
    });

    const columns: ColumnDef<Service>[] = [
        { accessorKey: "client.name", header: "Cliente" },
        {
            header: "Bicicleta",
            cell: ({ row }) => {
                const bike = row.original.bicycle;
                return (
                    <div>
                        {bike?.brand} {bike?.model}
                    </div>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Descripción",
            cell: ({ row }) => {
                const description = row.original.description;
                return (
                    <div title={description} className="truncate w-40">
                        {description.length > 50 ? description.slice(0, 50) + "..." : description}
                    </div>
                );
            },
        },
        {
            header: "Repuestos Usados",
            cell: ({ row }) => (
                <div>
                    {row.original.partsUsed ? Object.keys(row.original.partsUsed).length : 0}
                </div>
            ),
        },
        { accessorKey: "price", header: "Precio" },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => (
                <span>
                    {ServiceStatusLabels[row.original.status as ServiceStatus] || "Desconocido"}
                </span>
            ),
        },
        { accessorKey: "mechanic.name", header: "Mecánico" },
        { accessorKey: "createdAt", header: "Fecha de creación", cell: ({ row }) => formatDate(row.original.createdAt), },
        { accessorKey: "completedAt", header: "Fecha de finalizacion", cell: ({ row }) => formatDate(row.original.completedAt), },
        {
            header: "Acciones",
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/services/${row.original.id}`)}>
                        <Eye size={16} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedService(row.original); setModalOpen(true); }}>
                        <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setSelectedService(row.original); setDeleteModalOpen(true); }}>
                        <Trash size={16} />
                    </Button>
                </div>
            ),
        },
    ];

    if (isLoading) return <TableSkeleton />;
    if (error) return <p>Error al cargar los servicios.</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Servicios</h1>
            <div className="flex justify-between mb-4 gap-4">
                <Input
                    placeholder="Buscar servicio..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button onClick={() => { setSelectedService(null); setModalOpen(true); }}>Nuevo Service</Button>
            </div>
            <DataTable
                columns={columns}
                data={servicesData.data ?? []}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={servicesData?.total}
                totalPage={servicesData?.totalPages}
            />
            {modalOpen && (
                <ServiceModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    service={selectedService}
                />
            )}
            {deleteModalOpen && selectedService && (
                <DeleteModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onDelete={() => deleteMutation.mutate(selectedService.id)}
                    itemName="servicio"
                />
            )}
        </div>
    );
}