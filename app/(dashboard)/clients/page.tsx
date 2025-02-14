"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { Client } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Edit, Eye } from "lucide-react";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { ClientModal } from "@/components/ui/ClientModal";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";

export default function ClientsPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data: clientsData, isLoading, error } = useQuery({
        queryKey: ["clients", page, limit],
        queryFn: async () => {
            const { data } = await api.get(`/clients?page=${page}&limit=${limit}`);
            return data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/api/v1/clients/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            setDeleteModalOpen(false);
        },
    });

    const columns: ColumnDef<Client>[] = [
        { accessorKey: "name", header: "Nombre" },
        { accessorKey: "email", header: "Email" },
        { accessorKey: "phone", header: "Teléfono" },
        { accessorKey: "bicycles.length", header: "Bicicletas" },
        {
            header: "Acciones",
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/clientes/${row.original.id}`)}>
                        <Eye size={16} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedClient(row.original); setModalOpen(true); }}>
                        <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setSelectedClient(row.original); setDeleteModalOpen(true); }}>
                        <Trash size={16} />
                    </Button>
                </div>
            ),
        },
    ];

    if (isLoading) return <p>Cargando clientes...</p>;
    if (error) return <p>Error al cargar los clientes.</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Clientes</h1>
            <div className="flex justify-between mb-4 gap-4">
                <Input
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button onClick={() => { setSelectedClient(null); setModalOpen(true); }}>Nuevo Cliente</Button>
            </div>
            <DataTable
                columns={columns}
                data={clientsData ?? []}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={clientsData?.total}
            />
            {modalOpen && (
                <ClientModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    client={selectedClient}
                />
            )}
            {deleteModalOpen && selectedClient && (
                <DeleteModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onDelete={() => deleteMutation.mutate(selectedClient.id)}
                    itemName="cliente"
                />
            )}
        </div>
    );
}