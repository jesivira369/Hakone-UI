"use client";

import { Button } from "@/components/ui/button";
import { MechanicModal } from "@/components/ui/MechanicModal";
import { DataTable } from "@/components/ui/DataTable";
import { DeleteModal } from "@/components/ui/DeleteModal";
import api from "@/lib/axiosInstance";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Mechanic } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import { TableSkeleton } from "@/components/ui/Skeleton/TableSkeleton";

export default function Mechanics() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => { setPage(1); }, [debouncedSearch]);

    const { data: mechanicsData, isLoading, error } = useQuery({
        queryKey: ["mechanics", page, limit, debouncedSearch, sortBy, sortOrder],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (sortBy) params.set("sortBy", sortBy);
            if (sortOrder) params.set("sortOrder", sortOrder);
            const { data } = await api.get(`/mechanics?${params.toString()}`);
            return data;
        },
        placeholderData: (prev: unknown) => prev,    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/mechanics/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mechanics"] });

            toast.success("Mecanico eliminado con exito", {
                className: "bg-green-600 text-white border border-green-700",
            });

            setDeleteModalOpen(false);
        },
        onError: (error) => {
            toast.error(error.message || "Ocurrió un error al eliminar el mecanico", {
                className: "bg-red-600 text-white border border-red-700",
            });
        },
    });

    const columns: ColumnDef<Mechanic>[] = [
        { accessorKey: "name", header: "Nombre", enableSorting: true },
        {
            accessorKey: "createdAt",
            header: "Fecha de Creación",
            enableSorting: true,
            cell: ({ row }) => formatDate(row.original.createdAt),
        },
        {
            id: "actions",
            header: "Acciones",
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedMechanic(row.original); setModalOpen(true); }}>
                        <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setSelectedMechanic(row.original); setDeleteModalOpen(true); }}>
                        <Trash size={16} />
                    </Button>
                </div>
            ),
        },
    ];

    if (isLoading && !mechanicsData) return <TableSkeleton />;
    if (error) return <p>Error al cargar los mecánicos.</p>;

    return (
        <div className="min-w-0 space-y-4">
            <h1 className="text-xl font-bold sm:text-2xl">Mecánicos</h1>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                    placeholder="Buscar mecánico..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full min-w-0 sm:max-w-xs"
                />
                <Button className="shrink-0" onClick={() => { setSelectedMechanic(null); setModalOpen(true); }}>Nuevo Mecánico</Button>
            </div>
            <DataTable
                columns={columns}
                data={mechanicsData.data ?? []}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={mechanicsData?.totalItems}
                totalPage={mechanicsData?.totalPages}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
            />
            {modalOpen && (
                <MechanicModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    mechanic={selectedMechanic}
                />
            )}
            {deleteModalOpen && selectedMechanic && (
                <DeleteModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onDelete={() => deleteMutation.mutate(selectedMechanic.id)}
                    itemName="mecánico"
                />
            )}
        </div>
    );
}
