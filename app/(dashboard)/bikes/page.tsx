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
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import { TableSkeleton } from "@/components/ui/Skeleton/TableSkeleton";

export default function Bikes() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => { setPage(1); }, [debouncedSearch]);

    const { data: bikesData, isLoading, error } = useQuery({
        queryKey: ["bicycles", page, limit, debouncedSearch, sortBy, sortOrder],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (sortBy) params.set("sortBy", sortBy);
            if (sortOrder) params.set("sortOrder", sortOrder);
            const { data } = await api.get(`/bicycles?${params.toString()}`);
            return data;
        },
        placeholderData: (prev: any) => prev,    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/bicycles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bicycles"] });

            toast.success("Bicicleta eliminado con exito", {
                className: "bg-green-600 text-white border border-green-700",
            });

            setDeleteModalOpen(false);
        },
        onError: (error) => {
            toast.error(error.message || "Ocurrió un error al eliminar la bicicleta", {
                className: "bg-red-600 text-white border border-red-700",
            });
        },
    });

    const columns: ColumnDef<Bike>[] = [
        { accessorKey: "brand", header: "Marca", enableSorting: true },
        { accessorKey: "model", header: "Modelo", enableSorting: true },
        {
            id: "client.name",
            accessorKey: "client.name",
            header: "Cliente",
            enableSorting: true,
            cell: ({ row }) => row.original.client?.name || "Sin cliente",
        },
        {
            accessorKey: "lastServiceDate",
            header: "Último Servicio",
            enableSorting: true,
            cell: ({ row }) => row.original.lastServiceDate ? formatDate(row.original.lastServiceDate) : "Sin registro",
        },
        {
            id: "services",
            header: "Servicios",
            enableSorting: false,
            cell: ({ row }) => row.original.services?.length || 0,
        },
        {
            id: "actions",
            header: "Acciones",
            enableSorting: false,
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

    if (isLoading && !bikesData) return <TableSkeleton />;
    if (error) return <p>Error al cargar las bicicletas.</p>;

    return (
        <div className="min-w-0 space-y-4">
            <h1 className="text-xl font-bold sm:text-2xl">Bicicletas</h1>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                    placeholder="Buscar bicicleta..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full min-w-0 sm:max-w-xs"
                />
                <Button className="shrink-0" onClick={() => { setSelectedBike(null); setModalOpen(true); }}>Nueva Bicicleta</Button>
            </div>
            <DataTable
                columns={columns}
                data={bikesData?.data ?? []}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={bikesData?.totalItems}
                totalPage={bikesData?.totalPages}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
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
                    itemName="bicicleta"
                />
            )}
        </div>
    );
}
