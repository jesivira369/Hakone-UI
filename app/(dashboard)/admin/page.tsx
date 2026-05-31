"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { useAuth } from "@/context/auth-provider";
import { useDebounce } from "@/hooks/useDebounce";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserModal } from "@/components/ui/UserModal";
import { toast } from "react-toastify";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { AppUser, ContactRequest, ContactRequestsQuery, ContactRequestStatus, UsersQuery } from "@/lib/types";
import type { SubscriptionStatus } from "@/lib/types/auth";

type AdminTab = "talleres" | "contactos";

// ─── Subscription badge ───────────────────────────────────────────────────────
const statusLabel: Record<SubscriptionStatus, string> = {
    TRIAL: "Trial",
    ACTIVE: "Activa",
    GRACE: "Gracia",
    EXPIRED: "Vencida",
};
const statusColor: Record<SubscriptionStatus, string> = {
    TRIAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    GRACE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    EXPIRED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function SubBadge({ status }: { status: SubscriptionStatus }) {
    return (
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${statusColor[status]}`}>
            {statusLabel[status]}
        </span>
    );
}

// ─── Payment modal ────────────────────────────────────────────────────────────
interface PaymentModalProps {
    user: AppUser;
    onClose: () => void;
}

function PaymentModal({ user, onClose }: PaymentModalProps) {
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("Efectivo");

    const effectiveExpiry = user.subscriptionEndsAt ?? user.trialEndsAt;
    const base = new Date(effectiveExpiry) > new Date() ? new Date(effectiveExpiry) : new Date();
    const newExpiry = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);

    const mutation = useMutation({
        mutationFn: async () => {
            await api.post(`/subscriptions/${user.id}/payments`, {
                amount: parseFloat(amount),
                paymentMethod: method,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-talleres"] });
            toast.success("Pago registrado. Suscripción extendida hasta " + newExpiry.toLocaleDateString("es"), {
                className: "bg-green-600 text-white border border-green-700",
            });
            onClose();
        },
        onError: () => {
            toast.error("Error al registrar el pago", {
                className: "bg-red-600 text-white border border-red-700",
            });
        },
    });

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar pago — {user.shopName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Monto</label>
                        <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Método de pago</label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                                <SelectItem value="Transferencia">Transferencia</SelectItem>
                                <SelectItem value="Nequi">Nequi</SelectItem>
                                <SelectItem value="Daviplata">Daviplata</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                        Nueva fecha de vencimiento:{" "}
                        <strong>{newExpiry.toLocaleDateString("es")}</strong>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={!amount || parseFloat(amount) <= 0 || mutation.isPending}
                    >
                        {mutation.isPending ? "Registrando..." : "Confirmar pago"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Payment history modal ────────────────────────────────────────────────────
function PaymentHistoryModal({ user, onClose }: PaymentModalProps) {
    const { data, isLoading } = useQuery({
        queryKey: ["payment-history", user.id],
        queryFn: async () => {
            const { data } = await api.get(`/subscriptions/${user.id}/payments`);
            return data as Array<{
                id: number; amount: number; paymentMethod: string;
                paidAt: string; newExpiresAt: string;
            }>;
        },
    });

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Historial de pagos — {user.shopName}</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">Cargando...</div>
                ) : !data || data.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">Sin pagos registrados.</div>
                ) : (
                    <div className="divide-y text-sm">
                        {data.map((p) => (
                            <div key={p.id} className="flex items-center justify-between py-3">
                                <div>
                                    <div className="font-medium">${p.amount.toFixed(2)} — {p.paymentMethod}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Pagado: {formatDate(p.paidAt)} · Vence: {formatDate(p.newExpiresAt)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<AdminTab>("talleres");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [statusFilter, setStatusFilter] = useState<ContactRequestStatus | "ALL">("NEW");
    const [createOpen, setCreateOpen] = useState(false);
    const [paymentTarget, setPaymentTarget] = useState<AppUser | null>(null);
    const [historyTarget, setHistoryTarget] = useState<AppUser | null>(null);

    useEffect(() => { setPage(1); }, [debouncedSearch, tab]);

    useEffect(() => {
        if (isLoading) return;
        if (!user) router.replace("/login");
        else if (user.role !== "SUPER_ADMIN") router.replace("/dashboard");
    }, [user, isLoading, router]);

    // Talleres query
    const { data: talleres } = useQuery<UsersQuery>({
        queryKey: ["admin-talleres", page, limit, debouncedSearch, sortBy, sortOrder],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (sortBy) params.set("sortBy", sortBy);
            if (sortOrder) params.set("sortOrder", sortOrder);
            const res = await api.get(`/users?${params.toString()}`);
            return res.data as UsersQuery;
        },
        enabled: !!user && user.role === "SUPER_ADMIN" && tab === "talleres",
        placeholderData: (prev) => prev,
    });

    // Contact requests query
    const { data: contacts } = useQuery<ContactRequestsQuery>({
        queryKey: ["admin-contacts", page, limit, statusFilter, debouncedSearch, sortBy, sortOrder],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (statusFilter !== "ALL") params.set("status", statusFilter);
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (sortBy) params.set("sortBy", sortBy);
            if (sortOrder) params.set("sortOrder", sortOrder);
            const res = await api.get(`/contact-requests?${params.toString()}`);
            return res.data as ContactRequestsQuery;
        },
        enabled: !!user && user.role === "SUPER_ADMIN" && tab === "contactos",
        placeholderData: (prev) => prev,
    });

    const updateContactStatus = useMutation({
        mutationFn: async (payload: { id: number; status: ContactRequestStatus }) => {
            const res = await api.patch(`/contact-requests/${payload.id}`, { status: payload.status });
            return res.data as ContactRequest;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-contacts"] }),
    });

    const talleresColumns: ColumnDef<AppUser>[] = useMemo(() => [
        { accessorKey: "shopName", header: "Tienda", enableSorting: true },
        { accessorKey: "email", header: "Email", enableSorting: true },
        {
            accessorKey: "subscriptionStatus",
            header: "Suscripción",
            enableSorting: false,
            cell: ({ row }) => <SubBadge status={row.original.subscriptionStatus} />,
        },
        {
            accessorKey: "trialEndsAt",
            header: "Vencimiento",
            enableSorting: true,
            cell: ({ row }) => {
                const expiry = row.original.subscriptionEndsAt ?? row.original.trialEndsAt;
                return formatDate(expiry);
            },
        },
        {
            accessorKey: "createdAt",
            header: "Creado",
            enableSorting: true,
            cell: ({ row }) => formatDate(row.original.createdAt),
        },
        {
            id: "actions",
            header: "Acciones",
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPaymentTarget(row.original)}>
                        Registrar pago
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setHistoryTarget(row.original)}>
                        Historial
                    </Button>
                </div>
            ),
        },
    ], []);

    const contactsColumns: ColumnDef<ContactRequest>[] = useMemo(() => [
        { accessorKey: "name", header: "Nombre", enableSorting: true },
        { accessorKey: "shopName", header: "Tienda", enableSorting: true },
        { accessorKey: "phone", header: "Teléfono", enableSorting: false },
        { accessorKey: "email", header: "Email", enableSorting: true },
        {
            accessorKey: "status",
            header: "Estado",
            enableSorting: true,
            cell: ({ row }) => {
                const r = row.original;
                return (
                    <Select
                        value={r.status}
                        onValueChange={(v) => updateContactStatus.mutate({ id: r.id, status: v as ContactRequestStatus })}
                    >
                        <SelectTrigger className="h-8 w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NEW">Nuevo</SelectItem>
                            <SelectItem value="CONTACTED">Contactado</SelectItem>
                            <SelectItem value="CLOSED">Cerrado</SelectItem>
                        </SelectContent>
                    </Select>
                );
            },
        },
        {
            accessorKey: "createdAt", header: "Fecha", enableSorting: true,
            cell: ({ row }) => formatDate(row.original.createdAt),
        },
        {
            accessorKey: "message", header: "Comentario", enableSorting: false,
            cell: ({ row }) => (
                <span className="line-clamp-2 max-w-[360px] text-sm text-muted-foreground">
                    {row.original.message}
                </span>
            ),
        },
    ], [updateContactStatus]);

    if (isLoading || !user || user.role !== "SUPER_ADMIN") return null;

    return (
        <div className="min-w-0 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold sm:text-2xl">Panel Super Admin</h1>
                {tab === "talleres" && (
                    <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
                        Crear taller
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
                {(["talleres", "contactos"] as AdminTab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                            tab === t
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {t === "talleres" ? "Talleres" : "Contactos"}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                    placeholder={tab === "talleres" ? "Buscar por email o tienda..." : "Buscar por nombre, tienda, email..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full min-w-0 sm:max-w-sm"
                />
                {tab === "contactos" && (
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContactRequestStatus | "ALL")}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NEW">Nuevos</SelectItem>
                            <SelectItem value="CONTACTED">Contactados</SelectItem>
                            <SelectItem value="CLOSED">Cerrados</SelectItem>
                            <SelectItem value="ALL">Todos</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Tables */}
            {tab === "talleres" && (
                <DataTable
                    columns={talleresColumns}
                    data={talleres?.data ?? []}
                    page={page} setPage={setPage}
                    limit={limit} setLimit={setLimit}
                    total={talleres?.totalItems ?? 0}
                    totalPage={talleres?.totalPages ?? 0}
                    sortBy={sortBy} setSortBy={setSortBy}
                    sortOrder={sortOrder} setSortOrder={setSortOrder}
                />
            )}
            {tab === "contactos" && (
                <DataTable
                    columns={contactsColumns}
                    data={contacts?.data ?? []}
                    page={page} setPage={setPage}
                    limit={limit} setLimit={setLimit}
                    total={contacts?.totalItems ?? 0}
                    totalPage={contacts?.totalPages ?? 0}
                    sortBy={sortBy} setSortBy={setSortBy}
                    sortOrder={sortOrder} setSortOrder={setSortOrder}
                />
            )}

            {/* Modals */}
            {createOpen && <UserModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />}
            {paymentTarget && <PaymentModal user={paymentTarget} onClose={() => setPaymentTarget(null)} />}
            {historyTarget && <PaymentHistoryModal user={historyTarget} onClose={() => setHistoryTarget(null)} />}
        </div>
    );
}
