"use client";

import { Button } from "@/components/ui/button";
import { MechanicModal } from "@/components/ui/MechanicModal";
import { DataTable } from "@/components/ui/DataTable";
import { DeleteModal } from "@/components/ui/DeleteModal";
import api from "@/lib/axiosInstance";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Ban, Link2, MessageCircle, MoreVertical, Pencil, RefreshCw, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mechanicLinkUrl } from "@/lib/whatsapp";
import { linkState, resolveAccessToken, sendMechanicLinkWhatsApp, type LinkTone } from "@/lib/mechanicLink";
import { useAuth } from "@/context/auth-provider";
import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Mechanic } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import { TableSkeleton } from "@/components/ui/Skeleton/TableSkeleton";

const TONE_CLASS: Record<LinkTone, string> = {
    ok: "bg-primary/15 text-primary",
    warn: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    off: "bg-muted text-muted-foreground",
};

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
            // Copiar reutiliza el enlace vigente; si no hay o venció, o se pidió regenerar, se crea uno nuevo.
            const token = await resolveAccessToken(mechanic, action === "regenerate");
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

    const { user } = useAuth();
    const shopName = user?.shopName ?? "";
    const whatsappMutation = useMutation({
        mutationFn: (mechanic: Mechanic) => sendMechanicLinkWhatsApp(mechanic, shopName),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mechanics"] }),
        onError: (err: Error) => {
            toast.error(err.message || "No se pudo abrir WhatsApp", { className: "bg-red-600 text-white border border-red-700" });
        },
    });
    const sendWhatsApp = whatsappMutation.mutate;
    // Sin teléfono no hay a quién enviarle: se abre la edición para cargarlo.
    const askForPhone = (mechanic: Mechanic) => {
        toast.info("Agrega el teléfono del mecánico para enviarle el enlace por WhatsApp");
        setSelectedMechanic(mechanic);
        setModalOpen(true);
    };

    // Memoizadas: si el array cambia en cada render, el menú ⋮ abierto se cierra solo.
    const columns = useMemo<ColumnDef<Mechanic>[]>(() => [
        {
            accessorKey: "name",
            header: "Nombre",
            enableSorting: true,
            // En móvil la tabla es angosta: el estado del enlace se muestra bajo el nombre (en pantallas grandes tiene su columna).
            cell: ({ row }) => {
                const state = linkState(row.original);
                return (
                    <div className="min-w-0">
                        <div className="truncate font-medium">{row.original.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{row.original.phone || "Sin teléfono"}</div>
                        <span className={`mt-1 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium sm:hidden ${TONE_CLASS[state.tone]}`}>
                            {state.label}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: "Fecha de Creación",
            enableSorting: true,
            meta: { className: "hidden sm:table-cell" },
            cell: ({ row }) => formatDate(row.original.createdAt),
        },
        {
            id: "link",
            header: "Enlace del mecánico",
            enableSorting: false,
            meta: { className: "hidden sm:table-cell" },
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
                                <DropdownMenuItem onSelect={() => (mechanic.phone ? sendWhatsApp(mechanic) : askForPhone(mechanic))}>
                                    <MessageCircle size={14} className="mr-2" /> Enviar enlace por WhatsApp
                                </DropdownMenuItem>
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
    ], [runLink, sendWhatsApp]);

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
