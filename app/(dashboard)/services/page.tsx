"use client";

import { useState, useEffect } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
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
import {
    PaymentMethod,
    PaymentMethodLabels,
    ServiceStatus,
    ServiceStatusLabels,
    URGENT_STYLE,
    getPaymentMethodLabel,
    getServiceStatusLabel,
    getServiceStatusStyle,
} from "@/lib/enums";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import { TableSkeleton } from "@/components/ui/Skeleton/TableSkeleton";

export default function ServicesPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [methodFilter, setMethodFilter] = useState<string>("ALL");
    const [urgentOnly, setUrgentOnly] = useState(false);

    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, methodFilter, urgentOnly]);

    const { data: servicesData, isLoading, error } = useQuery({
        queryKey: ["services", page, limit, debouncedSearch, sortBy, sortOrder, statusFilter, methodFilter, urgentOnly],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (sortBy) params.set("sortBy", sortBy);
            if (sortOrder) params.set("sortOrder", sortOrder);
            if (statusFilter !== "ALL") params.set("status", statusFilter);
            if (methodFilter !== "ALL") params.set("paymentMethod", methodFilter);
            if (urgentOnly) params.set("isUrgent", "true");
            const { data } = await api.get(`/services?${params.toString()}`);
            return data;
        },
        placeholderData: (prev: unknown) => prev,    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/services/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] });

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
        {
            id: "client.name",
            accessorKey: "client.name",
            header: "Cliente",
            enableSorting: true,
        },
        {
            id: "bicycle",
            header: "Bicicleta",
            enableSorting: false,
            cell: ({ row }) => {
                const bike = row.original.bicycle;
                return (
                    <div>
                        {bike ? `${bike.brand} ${bike.model}` : "Bici ocasional"}
                    </div>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Descripción",
            enableSorting: false,
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
            id: "parts",
            header: "Repuestos",
            enableSorting: false,
            cell: ({ row }) => (
                <div>{row.original.parts?.length ?? 0}</div>
            ),
        },
        {
            accessorKey: "price",
            header: "Precio",
            enableSorting: true,
        },
        {
            accessorKey: "status",
            header: "Estado",
            enableSorting: true,
            cell: ({ row }) => (
                <div className="flex flex-wrap items-center gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getServiceStatusStyle(row.original.status).badge}`}>
                        {getServiceStatusLabel(row.original.status)}
                    </span>
                    {row.original.isUrgent && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENT_STYLE.badge}`}>
                            Urgente
                        </span>
                    )}
                </div>
            ),
        },
        {
            id: "paymentMethod",
            header: "Método de pago",
            enableSorting: false,
            cell: ({ row }) => getPaymentMethodLabel(row.original.paymentMethod),
        },
        {
            id: "mechanic.name",
            accessorKey: "mechanic.name",
            header: "Mecánico",
            enableSorting: true,
        },
        {
            accessorKey: "createdAt",
            header: "Fecha de creación",
            enableSorting: true,
            cell: ({ row }) => formatDate(row.original.createdAt ?? ""),
        },
        {
            accessorKey: "completedAt",
            header: "Fecha de finalización",
            enableSorting: true,
            cell: ({ row }) => row.original.completedAt ? formatDate(row.original.completedAt) : "—",
        },
        {
            id: "actions",
            header: "Acciones",
            enableSorting: false,
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

    if (isLoading && !servicesData) return <TableSkeleton />;
    if (error) return <p>Error al cargar los servicios.</p>;

    return (
        <div className="min-w-0 space-y-4">
            <h1 className="text-xl font-bold sm:text-2xl">Servicios</h1>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                    placeholder="Buscar servicio..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full min-w-0 sm:max-w-xs"
                />
                <Button className="shrink-0" onClick={() => { setSelectedService(null); setModalOpen(true); }}>Nuevo Servicio</Button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-52">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos los estados</SelectItem>
                        {Object.values(ServiceStatus).map((st) => (
                            <SelectItem key={st} value={st}>{ServiceStatusLabels[st]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-full sm:w-52">
                        <SelectValue placeholder="Método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos los métodos</SelectItem>
                        {Object.values(PaymentMethod).map((m) => (
                            <SelectItem key={m} value={m}>{PaymentMethodLabels[m]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)} />
                    Solo urgentes
                </label>
            </div>
            <DataTable
                columns={columns}
                data={servicesData.data ?? []}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                total={servicesData?.totalItems}
                totalPage={servicesData?.totalPages}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
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
