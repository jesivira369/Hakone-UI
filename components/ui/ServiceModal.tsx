"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { invalidateServiceQueries } from "@/lib/invalidateServiceQueries";
import { formatCurrency } from "@/lib/utils";
import { Bike, Client, ClientQuery, Mechanic, MechanicQuery, Service } from "@/lib/types";
import { Plus, Trash } from "lucide-react";
import { toast } from "react-toastify";
import { PhoneInputE164 } from "@/components/ui/PhoneInputE164";
import { Switch } from "@/components/ui/switch";
import { NumericInput } from "@/components/ui/NumericInput";
import {
    ServiceCategory,
    ServiceCategoryLabels,
    ServiceStatus,
    ServiceStatusLabels,
    serviceStatusRuleErrors,
} from "@/lib/enums";
import { dateInputToIso, isoToDateInput, toDateInputValue } from "@/lib/utils/formatDate";

// ─── Helpers ────────────────────────────────────────────────────────────────

// Estados que se pueden elegir al crear. `PAID` no está: solo se llega por el checkout de cobro.
const CREATABLE_STATUSES = Object.values(ServiceStatus).filter((st) => st !== ServiceStatus.PAID);


// ─── Schemas ────────────────────────────────────────────────────────────────

// Mano de obra y fechas se validan a mano según el estado (ver onSubmit).
const serviceSchema = z.object({
    description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
    scheduledAt: z.string(),
    deliveryAt: z.string(),
    category: z.nativeEnum(ServiceCategory),
    status: z.nativeEnum(ServiceStatus),
    isReminderActive: z.boolean(),
    isUrgent: z.boolean(),
});

const newClientSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    phone: z
        .string()
        .min(8, "El teléfono debe tener al menos 8 caracteres")
        .regex(/^\+[1-9]\d{6,14}$/, "Debe estar en formato internacional (E.164)"),
    // Opcional, igual que en ClientModal: para un cliente de una sola vez
    // suele alcanzar con nombre y teléfono.
    email: z.string().email("Debe ser un email válido").optional().or(z.literal("")),
});

const newBikeSchema = z.object({
    brand: z.string().min(2, "La marca debe tener al menos 2 caracteres"),
    model: z.string().min(2, "El modelo debe tener al menos 2 caracteres"),
});

const newMechanicSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

// ─── Types ───────────────────────────────────────────────────────────────────

type EntityMode = "existing" | "new";
// "generic": el "Cliente Ocasional" único y reutilizable del taller, para
// trabajos de una sola vez (ver ensureGenericClient en la API). Va siempre con "bici ocasional" (sin bici).
type ClientMode = "existing" | "new" | "generic";

// Cantidad y precio pueden quedar vacíos mientras se escribe (ver NumericInput).
interface PartDraft { name: string; quantity: number | null; unitPrice: number | null }
interface FieldErrors { price?: string; scheduledAt?: string; deliveryAt?: string; client?: string; bike?: string }

interface InlineClientErrors { name?: string; phone?: string; email?: string }
interface InlineBikeErrors { brand?: string; model?: string }
interface InlineMechanicErrors { name?: string }

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    service?: Service | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [price, setPrice] = useState<number | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    // Parts (name, quantity, unitPrice)
    const [parts, setParts] = useState<PartDraft[]>([]);

    const [loadingGeneric, setLoadingGeneric] = useState(false);

    // Entity selection modes
    const [bikeMode, setBikeMode] = useState<EntityMode>("existing");
    const [mechanicMode, setMechanicMode] = useState<EntityMode>("existing");
    const [clientMode, setClientMode] = useState<ClientMode>("existing");

    // Selected IDs for existing entities
    const [selectedBikeId, setSelectedBikeId] = useState<number | null>(null);
    const [selectedMechanicId, setSelectedMechanicId] = useState<number | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

    // New entity data
    const [newBike, setNewBike] = useState({ brand: "", model: "" });
    const [newMechanic, setNewMechanic] = useState({ name: "" });
    const [newClient, setNewClient] = useState({ name: "", phone: "", email: "" });

    // Inline validation errors
    const [bikeErrors, setBikeErrors] = useState<InlineBikeErrors>({});
    const [mechanicErrors, setMechanicErrors] = useState<InlineMechanicErrors>({});
    const [clientErrors, setClientErrors] = useState<InlineClientErrors>({});

    // Main service form (description, price, dates)
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            description: "",
            scheduledAt: "",
            deliveryAt: "",
            category: ServiceCategory.REPARACION_PUNTUAL,
            status: ServiceStatus.IN_REVIEW,
            isReminderActive: false,
            isUrgent: false,
        },
    });

    const watchedCategory = (watch("category") as ServiceCategory | undefined) ?? ServiceCategory.REPARACION_PUNTUAL;
    const watchedReminder = Boolean(watch("isReminderActive"));
    const watchedUrgent = Boolean(watch("isUrgent"));
    // Al editar no se cambia el estado desde acá (eso se hace en el detalle); las reglas usan el estado actual.
    const effectiveStatus: string = service ? service.status : (watch("status") as string);

    // No hay envío automático: el aviso aparece en el dashboard para contactar al cliente.
    const reminderHint =
        watchedCategory === ServiceCategory.MANTENIMIENTO_INTEGRAL ||
        watchedCategory === ServiceCategory.TRANSMISION_FRENOS
            ? "Se te recordará contactar al cliente en 6 meses (desde la fecha de finalización)."
            : null;

    // ── Infinite queries ────────────────────────────────────────────────────

    // Solo las bicis del cliente elegido (la API filtra por clientId).
    const { data: clientBikes } = useQuery<Bike[]>({
        queryKey: ["bicycles", "by-client", selectedClientId],
        queryFn: async () => {
            const { data } = await api.get(`/bicycles?clientId=${selectedClientId}&page=1&limit=100`);
            return data.data as Bike[];
        },
        enabled: clientMode === "existing" && selectedClientId !== null,
    });

    const {
        data: mechanicsData,
        fetchNextPage: fetchNextMechanic,
        hasNextPage: hasNextMechanic,
    } = useInfiniteQuery<MechanicQuery>({
        queryKey: ["mechanics"],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get(`/mechanics?page=${pageParam}&limit=50`);
            return data;
        },
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
        initialPageParam: 1,
    });

    const {
        data: clientsData,
        fetchNextPage: fetchNextClient,
        hasNextPage: hasNextClient,
    } = useInfiniteQuery<ClientQuery>({
        queryKey: ["clients"],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get(`/clients?page=${pageParam}&limit=50`);
            return data;
        },
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
        initialPageParam: 1,
        enabled: isOpen && clientMode === "existing",
    });

    const selectGenericClient = async () => {
        setLoadingGeneric(true);
        try {
            const { data } = await api.get("/clients/generic");
            setSelectedClientId(data.id);
            setClientMode("generic");
            setSelectedBikeId(null);
            setBikeMode("existing");
        } catch {
            toast.error("No se pudo obtener el Cliente Ocasional");
        } finally {
            setLoadingGeneric(false);
        }
    };

    // ── Populate form on edit ───────────────────────────────────────────────

    useEffect(() => {
        setFieldErrors({});
        if (service) {
            setValue("description", service.description);
            setPrice(service.price);
            setValue("scheduledAt", isoToDateInput(service.scheduledAt));
            setValue("deliveryAt", isoToDateInput(service.deliveryAt));
            setValue("status", service.status as ServiceStatus);
            setValue("isUrgent", Boolean(service.isUrgent));
            setSelectedBikeId(service.bicycleId ?? null);
            setSelectedMechanicId(service.mechanicId);
            setBikeMode("existing");
            setMechanicMode("existing");
            setSelectedClientId(service.clientId);
            setClientMode(service.client?.isGeneric ? "generic" : "existing");
            setValue("category", service.category ?? ServiceCategory.REPARACION_PUNTUAL);
            setValue("isReminderActive", Boolean(service.isReminderActive));
            setParts(
                (service.parts ?? []).map((p) => ({
                    name: p.name,
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
                })),
            );
        } else {
            reset();
            const now = new Date();
            const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
            setValue("scheduledAt", toDateInputValue(now));
            setValue("deliveryAt", toDateInputValue(in2Days));
            setValue("category", ServiceCategory.REPARACION_PUNTUAL);
            setValue("status", ServiceStatus.IN_REVIEW);
            setValue("isReminderActive", false);
            setValue("isUrgent", false);
            setBikeMode("existing");
            setMechanicMode("existing");
            setClientMode("existing");
            setSelectedBikeId(null);
            setSelectedMechanicId(null);
            setSelectedClientId(null);
            setNewBike({ brand: "", model: "" });
            setNewMechanic({ name: "" });
            setNewClient({ name: "", phone: "", email: "" });
            setParts([]);
            setPrice(null);
        }
    }, [service, setValue, reset]);

    // ── Recordatorios: auto-toggle inteligente ─────────────────────────────
    useEffect(() => {
        if (watchedCategory === ServiceCategory.MANTENIMIENTO_INTEGRAL) {
            setValue("isReminderActive", true, { shouldDirty: true, shouldValidate: true });
        }

        if (
            watchedCategory === ServiceCategory.ARMADO ||
            watchedCategory === ServiceCategory.REPARACION_PUNTUAL
        ) {
            setValue("isReminderActive", false, { shouldDirty: true, shouldValidate: true });
        }

        if (watchedCategory === ServiceCategory.TRANSMISION_FRENOS) {
            setValue("isReminderActive", true, { shouldDirty: true, shouldValidate: true });
        }
    }, [watchedCategory, setValue]);

    // ── Parts helpers ───────────────────────────────────────────────────────

    const addPart = () => setParts((p) => [...p, { name: "", quantity: 1, unitPrice: null }]);
    const removePart = (i: number) => setParts((p) => p.filter((_, idx) => idx !== i));
    const updatePart = (i: number, patch: Partial<PartDraft>) =>
        setParts((p) => p.map((part, idx) => (idx === i ? { ...part, ...patch } : part)));

    const totalParts = parts.reduce((sum, p) => sum + (p.quantity ?? 0) * (p.unitPrice ?? 0), 0);

    // ── Submit ──────────────────────────────────────────────────────────────

    // Cliente: existente ya elegido, genérico ya resuelto (selectGenericClient) o uno nuevo.
    const validateClientSelection = (): boolean => {
        if (clientMode === "new") {
            const clientResult = newClientSchema.safeParse(newClient);
            if (!clientResult.success) {
                const errs: InlineClientErrors = {};
                clientResult.error.issues.forEach((i) => {
                    errs[i.path[0] as keyof InlineClientErrors] = i.message;
                });
                setClientErrors(errs);
                return false;
            }
            setClientErrors({});
            return true;
        }
        return selectedClientId !== null;
    };

    const resolveClientId = async (): Promise<number> => {
        if (clientMode === "new") {
            const { data: createdClient } = await api.post("/clients", newClient);
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            return createdClient.id;
        }
        // "existing" o "generic": selectedClientId ya tiene el id resuelto.
        return selectedClientId!;
    };

    const onSubmit = async (formData: z.infer<typeof serviceSchema>) => {
        let hasErrors = false;
        const errs: FieldErrors = {};

        // Mano de obra y fechas: obligatorias según el estado (misma regla que la API).
        const priceValue = price ?? 0;
        Object.assign(
            errs,
            serviceStatusRuleErrors(effectiveStatus, {
                price: priceValue,
                scheduledAt: formData.scheduledAt,
                deliveryAt: formData.deliveryAt,
            }),
        );

        // Cliente → bicicleta
        if (!validateClientSelection()) {
            if (clientMode !== "new") errs.client = "Selecciona un cliente";
            hasErrors = true;
        }
        if (clientMode === "generic") {
            // Bici ocasional: no hay nada que validar.
        } else if (bikeMode === "new" || clientMode === "new") {
            const bikeResult = newBikeSchema.safeParse(newBike);
            if (!bikeResult.success) {
                const bErrs: InlineBikeErrors = {};
                bikeResult.error.issues.forEach((i) => {
                    bErrs[i.path[0] as keyof InlineBikeErrors] = i.message;
                });
                setBikeErrors(bErrs);
                hasErrors = true;
            } else {
                setBikeErrors({});
            }
        } else if (!selectedBikeId) {
            errs.bike = "Selecciona una bicicleta";
            hasErrors = true;
        }

        // Validate mechanic section
        if (mechanicMode === "new") {
            const mechanicResult = newMechanicSchema.safeParse(newMechanic);
            if (!mechanicResult.success) {
                const mErrs: InlineMechanicErrors = {};
                mechanicResult.error.issues.forEach((i) => {
                    mErrs[i.path[0] as keyof InlineMechanicErrors] = i.message;
                });
                setMechanicErrors(mErrs);
                hasErrors = true;
            } else {
                setMechanicErrors({});
            }
        } else if (!selectedMechanicId) {
            toast.error("Selecciona un mecánico");
            hasErrors = true;
        }

        setFieldErrors(errs);
        if (hasErrors || Object.keys(errs).length > 0) return;

        setIsSubmitting(true);
        try {
            let resolvedMechanicId = selectedMechanicId ?? 0;
            // null a propósito en cliente ocasional: al editar desasocia la bici anterior.
            let resolvedBikeId: number | null = null;

            const resolvedClientId = await resolveClientId();

            if (clientMode !== "generic") {
                if (bikeMode === "new" || clientMode === "new") {
                    const { data: createdBike } = await api.post("/bicycles", {
                        brand: newBike.brand,
                        model: newBike.model,
                        clientId: resolvedClientId,
                    });
                    resolvedBikeId = createdBike.id;
                    queryClient.invalidateQueries({ queryKey: ["bicycles"] });
                } else {
                    resolvedBikeId = selectedBikeId;
                }
            }

            // Create mechanic if needed
            if (mechanicMode === "new") {
                const { data: createdMechanic } = await api.post("/mechanics", newMechanic);
                resolvedMechanicId = createdMechanic.id;
                queryClient.invalidateQueries({ queryKey: ["mechanics"] });
            }

            // Create / update service
            const payload = {
                description: formData.description,
                price: priceValue,
                // Solo fecha (sin hora), fijada a mediodía local para que ninguna zona horaria cambie el día.
                scheduledAt: dateInputToIso(formData.scheduledAt),
                deliveryAt: dateInputToIso(formData.deliveryAt),
                category: formData.category,
                isReminderActive: formData.isReminderActive,
                isUrgent: formData.isUrgent,
                // Al editar no se toca el estado desde acá (se cambia en el detalle).
                ...(service ? {} : { status: formData.status }),
                bicycleId: resolvedBikeId,
                clientId: resolvedClientId,
                mechanicId: resolvedMechanicId,
                parts: parts.map((p) => ({
                    name: p.name,
                    quantity: p.quantity ?? 1,
                    unitPrice: p.unitPrice ?? 0,
                })),
            };

            if (service) {
                await api.patch(`/services/${service.id}`, payload);
            } else {
                await api.post("/services", payload);
            }

            invalidateServiceQueries(queryClient);
            toast.success(service ? "Servicio actualizado con éxito" : "Servicio creado con éxito", {
                className: "bg-green-600 text-white border border-green-700",
            });
            onClose();
        } catch {
            toast.error("Ocurrió un error al guardar el servicio", {
                className: "bg-red-600 text-white border border-red-700",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Selector de cliente (siempre visible) ──

    // El cliente del servicio que se edita puede no estar en las páginas ya cargadas: se agrega para que el select lo muestre.
    const clientList: Client[] = (() => {
        const list = clientsData?.pages.flatMap((page) => page.data) ?? [];
        if (service?.client && !list.some((c) => c.id === service.client!.id)) return [service.client, ...list];
        return list;
    })();

    // Bicis del cliente elegido; la del servicio que se edita se agrega si quedó fuera (p. ej. archivada).
    const bikeList: Bike[] = (() => {
        const list = clientBikes ?? [];
        if (service?.bicycle && service.clientId === selectedClientId && !list.some((b) => b.id === service.bicycle!.id)) {
            return [service.bicycle, ...list];
        }
        return list;
    })();

    const clientPicker = clientMode === "generic" ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <span className="text-sm font-medium">Cliente Ocasional seleccionado</span>
            <button
                type="button"
                className="text-xs text-muted-foreground hover:underline"
                onClick={() => {
                    setClientMode("existing");
                    setSelectedClientId(null);
                    setSelectedBikeId(null);
                }}
            >
                Cambiar
            </button>
        </div>
    ) : clientMode === "existing" ? (
        <div className="space-y-2">
            <Select
                value={selectedClientId?.toString() ?? ""}
                onValueChange={(val) => {
                    if (val === "NEW") {
                        setClientMode("new");
                        setSelectedClientId(null);
                        setSelectedBikeId(null);
                        setBikeMode("new");
                        return;
                    }
                    const id = Number(val);
                    const picked = clientList.find((c) => c.id === id);
                    setSelectedBikeId(null);
                    setBikeMode("existing");
                    if (picked?.isGeneric) {
                        // El cliente ocasional siempre va con "bici ocasional".
                        setSelectedClientId(id);
                        setClientMode("generic");
                        return;
                    }
                    setSelectedClientId(id);
                }}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent
                    onScroll={(e) => {
                        const el = e.currentTarget;
                        if (el.scrollHeight - el.scrollTop === el.clientHeight && hasNextClient)
                            fetchNextClient();
                    }}
                >
                    <SelectItem value="NEW" className="text-primary font-medium">
                        + Nuevo Cliente
                    </SelectItem>
                    {clientList.map((client: Client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                            {client.email ? ` — ${client.email}` : ""}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <button
                type="button"
                onClick={selectGenericClient}
                disabled={loadingGeneric}
                className="text-xs text-primary hover:underline"
            >
                {loadingGeneric ? "Buscando Cliente Ocasional..." : "Usar Cliente Ocasional (trabajo de una sola vez)"}
            </button>
        </div>
    ) : (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
            <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-primary">Nuevo Cliente</span>
                <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => {
                        setClientMode("existing");
                        setBikeMode("existing");
                    }}
                >
                    Seleccionar existente
                </button>
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Nombre</label>
                <Input
                    value={newClient.name}
                    onChange={(e) => setNewClient((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Juan Pérez"
                />
                {clientErrors.name && <p className="text-red-500 text-xs mt-1">{clientErrors.name}</p>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Teléfono</label>
                <PhoneInputE164
                    value={newClient.phone}
                    onChange={(next) => setNewClient((c) => ({ ...c, phone: next }))}
                />
                {clientErrors.phone && <p className="text-red-500 text-xs mt-1">{clientErrors.phone}</p>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Email (opcional)</label>
                <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient((c) => ({ ...c, email: e.target.value }))}
                    placeholder="juan@email.com"
                />
                {clientErrors.email && <p className="text-red-500 text-xs mt-1">{clientErrors.email}</p>}
            </div>
        </div>
    );

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{service ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* ── Cliente (siempre visible) ── */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Cliente</label>
                        {clientPicker}
                        {fieldErrors.client && <p className="text-red-500 text-sm">{fieldErrors.client}</p>}
                    </div>

                    {/* ── Bicicleta: depende del cliente ── */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Bicicleta</label>
                        {clientMode === "generic" ? (
                            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                <span className="font-medium">Bici ocasional</span>
                                <span className="text-muted-foreground"> — sin bicicleta registrada</span>
                            </div>
                        ) : clientMode === "new" || bikeMode === "new" ? (
                            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-primary">Nueva Bicicleta</span>
                                    {clientMode === "existing" && (
                                        <button
                                            type="button"
                                            className="text-xs text-muted-foreground hover:underline"
                                            onClick={() => setBikeMode("existing")}
                                        >
                                            Seleccionar existente
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Marca</label>
                                    <Input
                                        value={newBike.brand}
                                        onChange={(e) => setNewBike((bk) => ({ ...bk, brand: e.target.value }))}
                                        placeholder="Ej: Trek"
                                    />
                                    {bikeErrors.brand && (
                                        <p className="text-red-500 text-xs mt-1">{bikeErrors.brand}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Modelo</label>
                                    <Input
                                        value={newBike.model}
                                        onChange={(e) => setNewBike((bk) => ({ ...bk, model: e.target.value }))}
                                        placeholder="Ej: Marlin 5"
                                    />
                                    {bikeErrors.model && (
                                        <p className="text-red-500 text-xs mt-1">{bikeErrors.model}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Select
                                value={selectedBikeId?.toString() ?? ""}
                                onValueChange={(val) => {
                                    if (val === "NEW") {
                                        setBikeMode("new");
                                        setSelectedBikeId(null);
                                        return;
                                    }
                                    setSelectedBikeId(Number(val));
                                }}
                                disabled={selectedClientId === null}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            selectedClientId === null
                                                ? "Selecciona primero un cliente"
                                                : "Selecciona una bicicleta"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NEW" className="text-primary font-medium">
                                        + Crear bicicleta
                                    </SelectItem>
                                    {bikeList.map((bike: Bike) => (
                                        <SelectItem key={bike.id} value={bike.id.toString()}>
                                            {bike.brand} — {bike.model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {fieldErrors.bike && <p className="text-red-500 text-sm">{fieldErrors.bike}</p>}
                    </div>

                    {/* ── Mecánico ── */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Mecánico</label>
                        {mechanicMode === "existing" ? (
                            <Select
                                value={selectedMechanicId?.toString() ?? ""}
                                onValueChange={(val) => {
                                    if (val === "NEW") {
                                        setMechanicMode("new");
                                        setSelectedMechanicId(null);
                                        return;
                                    }
                                    setSelectedMechanicId(Number(val));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un mecánico" />
                                </SelectTrigger>
                                <SelectContent
                                    onScroll={(e) => {
                                        const el = e.currentTarget;
                                        if (
                                            el.scrollHeight - el.scrollTop - el.clientHeight <= 1 &&
                                            hasNextMechanic
                                        )
                                            fetchNextMechanic();
                                    }}
                                >
                                    <SelectItem value="NEW" className="text-primary font-medium">
                                        + Nuevo Mecánico
                                    </SelectItem>
                                    {mechanicsData?.pages.flatMap((page) =>
                                        page.data.map((mechanic: Mechanic) => (
                                            <SelectItem key={mechanic.id} value={mechanic.id.toString()}>
                                                {mechanic.name}
                                            </SelectItem>
                                        )),
                                    )}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-primary">Nuevo Mecánico</span>
                                    <button
                                        type="button"
                                        className="text-xs text-muted-foreground hover:underline"
                                        onClick={() => setMechanicMode("existing")}
                                    >
                                        Seleccionar existente
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Nombre</label>
                                    <Input
                                        value={newMechanic.name}
                                        onChange={(e) =>
                                            setNewMechanic({ name: e.target.value })
                                        }
                                        placeholder="Carlos Méndez"
                                    />
                                    {mechanicErrors.name && (
                                        <p className="text-red-500 text-xs mt-1">{mechanicErrors.name}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Estado inicial (solo al crear) + Urgente ── */}
                    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                        {!service && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Estado inicial</label>
                                <Select
                                    value={watch("status")}
                                    onValueChange={(val) =>
                                        setValue("status", val as ServiceStatus, { shouldDirty: true })
                                    }
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Selecciona un estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CREATABLE_STATUSES.map((st) => (
                                            <SelectItem key={st} value={st}>
                                                {ServiceStatusLabels[st]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-medium">Urgente</div>
                                <div className="text-xs text-muted-foreground">
                                    Se marca en rojo en el calendario mientras el trabajo siga abierto.
                                </div>
                            </div>
                            <Switch
                                checked={watchedUrgent}
                                onCheckedChange={(checked) =>
                                    setValue("isUrgent", checked, { shouldDirty: true })
                                }
                            />
                        </div>
                    </div>

                    {/* ── Categoría + Recordatorio ── */}
                    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Categoría del servicio</label>
                            <Select
                                value={watchedCategory}
                                onValueChange={(val) =>
                                    setValue("category", val as ServiceCategory, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    })
                                }
                            >
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(ServiceCategory).map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {ServiceCategoryLabels[c]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-red-500 text-sm">{errors.category.message as string}</p>
                            )}
                        </div>

                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-medium">Activar recordatorio</div>
                                <div className="text-xs text-muted-foreground">
                                    {reminderHint ?? "Esta categoría no genera recordatorios automáticos."}
                                </div>
                            </div>
                            <Switch
                                checked={watchedReminder}
                                onCheckedChange={(checked) =>
                                    setValue("isReminderActive", checked, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    })
                                }
                                disabled={
                                    watchedCategory === ServiceCategory.ARMADO ||
                                    watchedCategory === ServiceCategory.REPARACION_PUNTUAL
                                }
                            />
                        </div>
                    </div>

                    {/* ── Fechas ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Fecha programada</label>
                            <Input type="date" {...register("scheduledAt")} className="w-full" />
                            {fieldErrors.scheduledAt && (
                                <p className="text-red-500 text-sm">{fieldErrors.scheduledAt}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Fecha de entrega</label>
                            <Input type="date" {...register("deliveryAt")} className="w-full" />
                            {fieldErrors.deliveryAt && (
                                <p className="text-red-500 text-sm">{fieldErrors.deliveryAt}</p>
                            )}
                        </div>
                    </div>

                    {/* ── Descripción ── */}
                    <div>
                        <label className="block text-sm font-medium">Descripción</label>
                        <textarea
                            {...register("description")}
                            className="w-full p-2 border rounded-md min-h-[80px] bg-background"
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm">{errors.description.message}</p>
                        )}
                    </div>

                    {/* ── Repuestos ── */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium">
                                Repuestos{" "}
                                {parts.length > 0 && (
                                    <span className="text-muted-foreground font-normal">
                                        ({parts.length}) — Total: {formatCurrency(totalParts)}
                                    </span>
                                )}
                            </label>
                            <Button type="button" variant="outline" size="sm" onClick={addPart}>
                                <Plus size={14} className="mr-1" /> Agregar repuesto
                            </Button>
                        </div>
                        {parts.length > 0 && (
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-1 text-xs font-medium text-muted-foreground px-1">
                                    <span className="col-span-5">Nombre</span>
                                    <span className="col-span-2 text-center">Cant.</span>
                                    <span className="col-span-3 text-center">P. unitario</span>
                                    <span className="col-span-2" />
                                </div>
                                {parts.map((part, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-1 items-center">
                                        <Input
                                            className="col-span-5"
                                            placeholder="Frenos Shimano"
                                            value={part.name}
                                            onChange={(e) => updatePart(i, { name: e.target.value })}
                                        />
                                        <NumericInput
                                            className="col-span-2"
                                            placeholder="1"
                                            value={part.quantity}
                                            onValueChange={(v) => updatePart(i, { quantity: v })}
                                            emptyValue={1}
                                            min={1}
                                        />
                                        <NumericInput
                                            className="col-span-3"
                                            decimal
                                            placeholder="0.00"
                                            value={part.unitPrice}
                                            onValueChange={(v) => updatePart(i, { unitPrice: v })}
                                            emptyValue={0}
                                        />
                                        <Button
                                            className="col-span-2"
                                            variant="destructive"
                                            type="button"
                                            size="sm"
                                            onClick={() => removePart(i)}
                                        >
                                            <Trash size={14} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Precio ── */}
                    <div>
                        <label className="block text-sm font-medium">Mano de obra</label>
                        <NumericInput
                            decimal
                            placeholder="Ej: 1200.50"
                            value={price}
                            onValueChange={setPrice}
                            emptyValue={0}
                        />
                        {fieldErrors.price && (
                            <p className="text-red-500 text-sm">{fieldErrors.price}</p>
                        )}
                    </div>

                    {/* Total efectivo: lo que se le cobra al cliente es mano de obra + repuestos. */}
                    <div className="flex items-baseline justify-between rounded-lg border bg-muted/40 px-3 py-2">
                        <span className="text-sm font-medium">Total a cobrar</span>
                        <div className="text-right">
                            <span className="text-lg font-bold">
                                {formatCurrency((price ?? 0) + totalParts)}
                            </span>
                            {totalParts > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(price ?? 0)} + {formatCurrency(totalParts)} en repuestos
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : service ? "Actualizar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
