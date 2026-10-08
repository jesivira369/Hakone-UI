"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { ServiceModal } from "@/components/ui/ServiceModal";
import api from "@/lib/axiosInstance";
import { ColumnDef } from "@tanstack/react-table";
import { Service } from "@/lib/types";
import { MessageCircle, MoreVertical, Pencil, PackageCheck, PackageOpen, Trash2, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { DeleteModal } from "@/components/ui/DeleteModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    PaymentMethod,
    PaymentMethodLabels,
    ServiceStatus,
    ServiceStatusLabels,
    URGENT_STYLE,
    getServiceStatusLabel,
    getServiceStatusStyle,
} from "@/lib/enums";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, serviceTotal } from "@/lib/utils";
import { invalidateServiceQueries } from "@/lib/invalidateServiceQueries";
import { toast } from "react-toastify";
import { formatFolio } from "@/lib/whatsapp";
import { canShareService } from "@/lib/shareService";
import { useSendWhatsApp } from "@/components/ui/WhatsAppShareButton";
import { TableSkeleton } from "@/components/ui/Skeleton/TableSkeleton";

/** dd/mm/aa: más corta que `formatDate` para que la tabla entre en tablets. */
function formatShortDate(iso?: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

type PickupFilter = "ALL" | "false" | "true";

function ServicesContent() {
    const queryClient = useQueryClient();
    const { send: sendWhatsApp } = useSendWhatsApp();
    const router = useRouter();
    const searchParams = useSearchParams();
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
    // El dashboard enlaza con ?pickedUp=false ("Ver todas" las bicis que siguen en el taller).
    const [pickupFilter, setPickupFilter] = useState<PickupFilter>(() => {
        const initial = searchParams.get("pickedUp");
        return initial === "false" || initial === "true" ? initial : "ALL";
    });
    // En móvil los filtros se pliegan; desde `sm` siempre se ven.
    const [filtersOpen, setFiltersOpen] = useState(false);

    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, methodFilter, urgentOnly, pickupFilter]);

    const { data: servicesData, isLoading, error } = useQuery({
        queryKey: ["services", page, limit, debouncedSearch, sortBy, sortOrder, statusFilter, methodFilter, urgentOnly, pickupFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (sortBy) params.set("sortBy", sortBy);
            if (sortOrder) params.set("sortOrder", sortOrder);
            if (statusFilter !== "ALL") params.set("status", statusFilter);
            if (methodFilter !== "ALL") params.set("paymentMethod", methodFilter);
            if (urgentOnly) params.set("isUrgent", "true");
            if (pickupFilter !== "ALL") params.set("pickedUp", pickupFilter);
            const { data } = await api.get(`/services?${params.toString()}`);
            return data;
        },
        placeholderData: (prev: unknown) => prev,    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/services/${id}`);
        },
        onSuccess: () => {
            invalidateServiceQueries(queryClient);

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

    const pickupMutation = useMutation({
        mutationFn: async ({ id, pickedUp }: { id: number; pickedUp: boolean }) => {
            await api.patch(`/services/${id}/pickup`, { pickedUp });
            return pickedUp;
        },
        onSuccess: (pickedUp) => {
            invalidateServiceQueries(queryClient);
            toast.success(pickedUp ? "Bici entregada al cliente" : "La bici volvió a figurar en el taller", {
                className: "bg-green-600 text-white border border-green-700",
            });
        },
        onError: (error) => {
            toast.error(error.message || "No se pudo actualizar la entrega", {
                className: "bg-red-600 text-white border border-red-700",
            });
        },
    });

    // Columnas esenciales; el resto (mecánico, repuestos, método de pago, fechas de entrega/cobro) vive en el detalle.
    // Memoizadas: si el array cambia en cada render, React remonta las celdas y el menú ⋮ abierto se cierra solo.
    const pickup = pickupMutation.mutate;
    const send = sendWhatsApp;
    const columns = useMemo<ColumnDef<Service>[]>(() => [
        {
            id: "client.name",
            accessorKey: "client.name",
            header: "Cliente",
            enableSorting: true,
            // Cliente y bici comparten celda (dos líneas): ahorra una columna entera y evita el scroll horizontal en tablet.
            cell: ({ row }) => {
                const bike = row.original.bicycle;
                const label = bike ? `${bike.brand} ${bike.model}` : "Bici ocasional";
                return (
                    <div className="max-w-[9rem] lg:max-w-[10rem] xl:max-w-[14rem]">
                        <div className="truncate font-medium" title={row.original.client?.name}>
                            {row.original.client?.name ?? "—"}
                        </div>
                        <div className="truncate text-xs text-muted-foreground" title={label}>{label}</div>
                    </div>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Descripción",
            enableSorting: false,
            cell: ({ row }) => (
                <div title={row.original.description} className="max-w-[7rem] truncate text-muted-foreground md:max-w-[8rem] lg:max-w-[9rem] xl:max-w-[16rem]">
                    <span className="mr-1 font-medium text-foreground">{formatFolio(row.original.number)}</span>
                    {row.original.description}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Estado",
            enableSorting: true,
            cell: ({ row }) => (
                <div className="flex flex-wrap items-center gap-1">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${getServiceStatusStyle(row.original.status).badge}`}>
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
            id: "total",
            header: "Total",
            enableSorting: false,
            cell: ({ row }) => <span className="whitespace-nowrap">{formatCurrency(serviceTotal(row.original))}</span>,
        },
        {
            accessorKey: "createdAt",
            header: "Creado",
            enableSorting: true,
            cell: ({ row }) => <span className="whitespace-nowrap">{formatShortDate(row.original.createdAt)}</span>,
        },
        {
            accessorKey: "pickedUpAt",
            header: "Retiro",
            enableSorting: true,
            cell: ({ row }) =>
                row.original.pickedUpAt ? (
                    // La fecha exacta se ve en el detalle; aquí solo el estado (tooltip con la fecha).
                    <span
                        className="whitespace-nowrap rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                        title={`Retirada el ${formatDate(row.original.pickedUpAt)}`}
                    >
                        Retirado
                    </span>
                ) : (
                    <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        En el taller
                    </span>
                ),
        },
        {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }) => {
                const service = row.original;
                const pickedUp = Boolean(service.pickedUpAt);
                return (
                    // Frena el click para que abrir el menú no navegue al detalle.
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" aria-label="Acciones del servicio" className="h-8 w-8 p-0">
                                    <MoreVertical size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => { setSelectedService(service); setModalOpen(true); }}>
                                    <Pencil size={14} className="mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => pickup({ id: service.id, pickedUp: !pickedUp })}
                                >
                                    {pickedUp ? (
                                        <><PackageOpen size={14} className="mr-2" /> Marcar en el taller</>
                                    ) : (
                                        <><PackageCheck size={14} className="mr-2" /> Entregar bici</>
                                    )}
                                </DropdownMenuItem>
                                {canShareService(service) && (
                                    <>
                                        <DropdownMenuItem onSelect={() => void send("receipt", service)}>
                                            <MessageCircle size={14} className="mr-2" /> Enviar comprobante
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => void send("ready", service)}>
                                            <MessageCircle size={14} className="mr-2" /> Avisar que está lista
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={() => { setSelectedService(service); setDeleteModalOpen(true); }}
                                >
                                    <Trash2 size={14} className="mr-2" /> Borrar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], [pickup, send]);

    if (isLoading && !servicesData) return <TableSkeleton />;
    if (error) return <p>Error al cargar los servicios.</p>;

    const activeFilters =
        Number(statusFilter !== "ALL") + Number(methodFilter !== "ALL") + Number(urgentOnly) + Number(pickupFilter !== "ALL");

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
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1 sm:hidden"
                        onClick={() => setFiltersOpen((v) => !v)}
                        aria-expanded={filtersOpen}
                    >
                        <SlidersHorizontal size={16} className="mr-2" />
                        Filtros{activeFilters > 0 ? ` (${activeFilters})` : ""}
                    </Button>
                    <Button className="flex-1 shrink-0 sm:flex-none" onClick={() => { setSelectedService(null); setModalOpen(true); }}>
                        Nuevo Servicio
                    </Button>
                </div>
            </div>
            <div className={`${filtersOpen ? "flex" : "hidden"} flex-col gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center`}>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos los estados</SelectItem>
                        {Object.values(ServiceStatus).map((st) => (
                            <SelectItem key={st} value={st}>{ServiceStatusLabels[st]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={pickupFilter} onValueChange={(v) => setPickupFilter(v as PickupFilter)}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Retiro" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">En taller y retiradas</SelectItem>
                        <SelectItem value="false">En el taller</SelectItem>
                        <SelectItem value="true">Retiradas</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-full sm:w-48">
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
                onRowClick={(service) => router.push(`/services/${service.id}`)}
                stickyLastColumn
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

export default function ServicesPage() {
    // `useSearchParams` obliga a tener un límite de Suspense para que el build no falle.
    return (
        <Suspense fallback={<TableSkeleton />}>
            <ServicesContent />
        </Suspense>
    );
}
