"use client";

import { Button } from "@/components/ui/button";
import { BicycleModal } from "@/components/ui/BikeModal";
import { DataTable } from "@/components/ui/DataTable";
import { DeleteModal } from "@/components/ui/DeleteModal";
import api from "@/lib/axiosInstance";
import { Bike } from "@/lib/types";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Bikes() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data: bikesData, isLoading, error } = useQuery({
        queryKey: ["bicycles", page, limit],
        queryFn: async () => {
            const { data } = await api.get(`/bicycles?page=${page}&limit=${limit}`);
            return data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/bicycles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bicycles"] });
            setDeleteModalOpen(false);
        },
    });

    const columns: ColumnDef<Bike>[] = [
        { accessorKey: "brand", header: "Marca" },
        { accessorKey: "model", header: "Modelo" },
        {
            accessorKey: "client.name",
            header: "Cliente",
            cell: ({ row }) => row.original.client?.name || "Sin cliente"
        },
        {
            accessorKey: "lastServiceDate",
            header: "Último Servicio",
            cell: ({ row }) => row.original.lastServiceDate ? new Date(row.original.lastServiceDate).toLocaleDateString() : "Sin registro"
        },
        {
            accessorKey: "services.length",
            header: "Servicios",
            cell: ({ row }) => row.original.services?.length || 0
        },
        {
            header: "Acciones",
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/bikes/${row.original.id}`)}>
                        <Eye size={16} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedBike(row.original); setModalOpen(true); }}>
                        <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setSelectedBike(row.original); setDeleteModalOpen(true); }}>
                        <Trash size={16} />
                    </Button>
                </div>
            ),
        },
    ];


    if (isLoading) return <p>Cargando bicicletas...</p>;
    if (error) return <p>Error al cargar las bicicletas.</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Bicicletas</h1>
            <div className="flex justify-between mb-4 gap-4">
                <Input
                    placeholder="Buscar bicicleta..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button onClick={() => { setSelectedBike(null); setModalOpen(true); }}>Nueva Bicicleta</Button>
            </div>
            <DataTable
                columns={columns}
                data={bikesData ?? []}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={bikesData?.total}
            />
            {modalOpen && (
                <BicycleModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    bicycle={selectedBike}
                />
            )}
            {deleteModalOpen && selectedBike && (
                <DeleteModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onDelete={() => deleteMutation.mutate(selectedBike.id)}
                    itemName="cliente"
                />
            )}
        </div>
    );
}