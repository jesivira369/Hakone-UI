"use client";

import { Button } from "@/components/ui/button";
import { MechanicModal } from "@/components/ui/MechanicModal";
import { DataTable } from "@/components/ui/DataTable";
import { DeleteModal } from "@/components/ui/DeleteModal";
import api from "@/lib/axiosInstance";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Ban, Link2, MoreVertical, Pencil, RefreshCw, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mechanicLinkUrl } from "@/lib/whatsapp";
import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Mechanic } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import { TableSkeleton } from "@/components/ui/Skeleton/TableSkeleton";

const IDLE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Estado del enlace personal: vence a los 30 días sin uso (misma regla que la API). */
function linkState(m: Mechanic): { label: string; tone: "ok" | "warn" | "off" } {
    if (!m.accessToken) return { label: "Sin enlace", tone: "off" };
    const last = m.accessTokenLastUsedAt ? new Date(m.accessTokenLastUsedAt).getTime() : 0;
    if (Date.now() >= last + IDLE_DAYS * DAY_MS) return { label: "Vencido", tone: "warn" };
    const days = Math.floor((Date.now() - last) / DAY_MS);
    return { label: days <= 0 ? "Activo · usado hoy" : `Activo · usado hace ${days} ${days === 1 ? "día" : "días"}`, tone: "ok" };
}

const TONE_CLASS = {
    ok: "bg-primary/15 text-primary",
    warn: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    off: "bg-muted text-muted-foreground",
} as const;

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

    const linkMutation = useMutation({
        mutationFn: async ({ mechanic, action }: { mechanic: Mechanic; action: "copy" | "regenerate" | "disable" }) => {
            if (action === "disable") {
                await api.delete(`/mechanics/${mechanic.id}/access-link`);
                return "Enlace desactivado";
            }
            const state = linkState(mechanic);
            // Copiar reutiliza el enlace vigente; si no hay o venció, o se pidió regenerar, se crea uno nuevo.
            const reuse = action === "copy" && state.tone === "ok" && mechanic.accessToken;
            const token = reuse
                ? mechanic.accessToken!
                : (await api.post<{ accessToken: string }>(`/mechanics/${mechanic.id}/access-link`)).data.accessToken;
            await navigator.clipboard.writeText(mechanicLinkUrl(window.location.origin, token));
            return action === "regenerate"
                ? "Enlace nuevo copiado. El anterior ya no funciona"
                : "Enlace copiado: mandáselo al mecánico por WhatsApp";
        },
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ["mechanics"] });
            toast.success(message, { className: "bg-green-600 text-white border border-green-700" });
        },
        onError: () => {
            toast.error("No se pudo completar la acción", { className: "bg-red-600 text-white border border-red-700" });
        },
    });
    const runLink = linkMutation.mutate;

    // Memoizadas: si el array cambia en cada render, el menú ⋮ abierto se cierra solo.
    const columns = useMemo<ColumnDef<Mechanic>[]>(() => [
        { accessorKey: "name", header: "Nombre", enableSorting: true },
        {
            accessorKey: "createdAt",
            header: "Fecha de Creación",
            enableSorting: true,
            cell: ({ row }) => formatDate(row.original.createdAt),
        },
        {
            id: "link",
            header: "Enlace del mecánico",
            enableSorting: false,
            cell: ({ row }) => {
                const state = linkState(row.original);
                return (
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASS[state.tone]}`}>
                        {state.label}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }) => {
                const mechanic = row.original;
                return (
                    <div className="flex justify-end">
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" aria-label="Acciones del mecánico" className="h-8 w-8 p-0">
                                    <MoreVertical size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => { setSelectedMechanic(mechanic); setModalOpen(true); }}>
                                    <Pencil size={14} className="mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => runLink({ mechanic, action: "copy" })}>
                                    <Link2 size={14} className="mr-2" /> Copiar enlace
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => runLink({ mechanic, action: "regenerate" })}>
                                    <RefreshCw size={14} className="mr-2" /> Regenerar enlace
                                </DropdownMenuItem>
                                {mechanic.accessToken && (
                                    <DropdownMenuItem onSelect={() => runLink({ mechanic, action: "disable" })}>
                                        <Ban size={14} className="mr-2" /> Desactivar enlace
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={() => { setSelectedMechanic(mechanic); setDeleteModalOpen(true); }}
                                >
                                    <Trash2 size={14} className="mr-2" /> Borrar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], [runLink]);

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
                stickyLastColumn
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
