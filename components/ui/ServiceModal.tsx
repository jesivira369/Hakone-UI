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
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { formatCurrency } from "@/lib/utils";
import { Bike, BikeQuery, Client, ClientQuery, Mechanic, MechanicQuery, Service, ServicePartInput } from "@/lib/types";
import { Plus, Trash } from "lucide-react";
import { toast } from "react-toastify";
import { PhoneInputE164 } from "@/components/ui/PhoneInputE164";
import { Switch } from "@/components/ui/switch";
import { ServiceCategory, ServiceCategoryLabels } from "@/lib/enums";

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDateTimeLocal(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOString(local: string): string {
    if (!local) return new Date().toISOString();
    return new Date(local).toISOString();
}

// ─── Schemas ────────────────────────────────────────────────────────────────

const serviceSchema = z.object({
    description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
    price: z.number().min(0.01, "El precio debe ser mayor a 0"),
    scheduledAt: z.string().min(1, "La fecha de programación es requerida"),
    deliveryAt: z.string().min(1, "La fecha de entrega es requerida"),
    category: z.nativeEnum(ServiceCategory),
    isReminderActive: z.boolean(),
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
// reparaciones sin bici y trabajos de una sola vez (ver ensureGenericClient en la API).
type ClientMode = "existing" | "new" | "generic";

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
    const [priceInput, setPriceInput] = useState<string>("");

    // Parts (new format: name, quantity, unitPrice)
    const [parts, setParts] = useState<ServicePartInput[]>([]);

    // Servicios que no están ligados a una bici registrada (armar una rueda
    // suelta, etc). Cuando es false se oculta todo el bloque de bicicleta y
    // el cliente se elige directamente en vez de derivarse de la bici.
    const [hasBike, setHasBike] = useState(true);
    const [loadingGeneric, setLoadingGeneric] = useState(false);

    // Entity selection modes
    const [bikeMode, setBikeMode] = useState<EntityMode>("existing");
    const [mechanicMode, setMechanicMode] = useState<EntityMode>("existing");
    const [clientModeForBike, setClientModeForBike] = useState<ClientMode>("existing");

    // Selected IDs for existing entities
    const [selectedBikeId, setSelectedBikeId] = useState<number | null>(null);
    const [selectedMechanicId, setSelectedMechanicId] = useState<number | null>(null);
    const [selectedClientIdForBike, setSelectedClientIdForBike] = useState<number | null>(null);

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
            price: 0,
            scheduledAt: "",
            deliveryAt: "",
            category: ServiceCategory.REPARACION_PUNTUAL,
            isReminderActive: false,
        },
    });

    const watchedCategory = (watch("category") as ServiceCategory | undefined) ?? ServiceCategory.REPARACION_PUNTUAL;
    const watchedReminder = Boolean(watch("isReminderActive"));

    const reminderHint =
        watchedCategory === ServiceCategory.MANTENIMIENTO_INTEGRAL
            ? "Se enviará un aviso en 6 meses (desde la fecha de finalización)."
            : watchedCategory === ServiceCategory.TRANSMISION_FRENOS
                ? "Se enviará un aviso en 3 meses (desde la fecha de finalización)."
                : null;

    // ── Infinite queries ────────────────────────────────────────────────────

    const {
        data: bicyclesData,
        fetchNextPage: fetchNextBike,
        hasNextPage: hasNextBike,
    } = useInfiniteQuery<BikeQuery>({
        queryKey: ["bicycles"],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get(`/bicycles?page=${pageParam}&limit=50`);
            return data;
        },
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
        initialPageParam: 1,
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
        enabled: (bikeMode === "new" || !hasBike) && clientModeForBike === "existing",
    });

    const selectGenericClient = async () => {
        setLoadingGeneric(true);
        try {
            const { data } = await api.get("/clients/generic");
            setSelectedClientIdForBike(data.id);
            setClientModeForBike("generic");
        } catch {
            toast.error("No se pudo obtener el Cliente Ocasional");
        } finally {
            setLoadingGeneric(false);
        }
    };

    // ── Populate form on edit ───────────────────────────────────────────────

    useEffect(() => {
        if (service) {
            setValue("description", service.description);
            setValue("price", service.price);
            setPriceInput(String(service.price));
            setValue(
                "scheduledAt",
                toDateTimeLocal(service.scheduledAt ?? null) ||
                    toDateTimeLocal(new Date().toISOString()),
            );
            setValue(
                "deliveryAt",
                toDateTimeLocal(service.deliveryAt ?? null) ||
                    toDateTimeLocal(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()),
            );
            const editingHasBike = Boolean(service.bicycleId);
            setHasBike(editingHasBike);
            setSelectedBikeId(service.bicycleId ?? null);
            setSelectedMechanicId(service.mechanicId);
            setBikeMode("existing");
            setMechanicMode("existing");
            if (!editingHasBike) {
                // Sin bici: el cliente se elige directo, no se deriva de ninguna bicicleta.
                setClientModeForBike("existing");
                setSelectedClientIdForBike(service.clientId);
            }
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
            setValue("scheduledAt", toDateTimeLocal(now.toISOString()));
            setValue("deliveryAt", toDateTimeLocal(in2Days.toISOString()));
            setValue("category", ServiceCategory.REPARACION_PUNTUAL);
            setValue("isReminderActive", false);
            setHasBike(true);
            setBikeMode("existing");
            setMechanicMode("existing");
            setClientModeForBike("existing");
            setSelectedBikeId(null);
            setSelectedMechanicId(null);
            setSelectedClientIdForBike(null);
            setNewBike({ brand: "", model: "" });
            setNewMechanic({ name: "" });
            setNewClient({ name: "", phone: "", email: "" });
            setParts([]);
            setPriceInput("");
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

    const addPart = () => setParts((p) => [...p, { name: "", quantity: 1, unitPrice: 0 }]);
    const removePart = (i: number) => setParts((p) => p.filter((_, idx) => idx !== i));
    const updatePart = (i: number, field: keyof ServicePartInput, value: string | number) =>
        setParts((p) => p.map((part, idx) => (idx === i ? { ...part, [field]: value } : part)));

    const totalParts = parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);

    // ── Submit ──────────────────────────────────────────────────────────────

    // Cliente: existente ya elegido, genérico ya resuelto (selectGenericClient),
    // o uno nuevo — validado con el mismo schema en ambos flujos (con/sin bici).
    const validateClientSelection = (): boolean => {
        if (clientModeForBike === "new") {
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
        if (!selectedClientIdForBike) {
            toast.error("Selecciona un cliente");
            return false;
        }
        return true;
    };

    const resolveClientId = async (): Promise<number> => {
        if (clientModeForBike === "new") {
            const { data: createdClient } = await api.post("/clients", newClient);
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            return createdClient.id;
        }
        // "existing" o "generic": selectedClientIdForBike ya tiene el id resuelto.
        return selectedClientIdForBike!;
    };

    const onSubmit = async (formData: z.infer<typeof serviceSchema>) => {
        let hasErrors = false;

        if (!hasBike) {
            // Sin bici: el cliente se valida directo, no hay nada de bicicleta que chequear.
            if (!validateClientSelection()) hasErrors = true;
        } else if (bikeMode === "new") {
            const bikeResult = newBikeSchema.safeParse(newBike);
            if (!bikeResult.success) {
                const errs: InlineBikeErrors = {};
                bikeResult.error.issues.forEach((i) => {
                    errs[i.path[0] as keyof InlineBikeErrors] = i.message;
                });
                setBikeErrors(errs);
                hasErrors = true;
            } else {
                setBikeErrors({});
            }

            if (!validateClientSelection()) hasErrors = true;
        } else if (!selectedBikeId) {
            toast.error("Selecciona una bicicleta");
            hasErrors = true;
        }

        // Validate mechanic section
        if (mechanicMode === "new") {
            const mechanicResult = newMechanicSchema.safeParse(newMechanic);
            if (!mechanicResult.success) {
                const errs: InlineMechanicErrors = {};
                mechanicResult.error.issues.forEach((i) => {
                    errs[i.path[0] as keyof InlineMechanicErrors] = i.message;
                });
                setMechanicErrors(errs);
                hasErrors = true;
            } else {
                setMechanicErrors({});
            }
        } else if (!selectedMechanicId) {
            toast.error("Selecciona un mecánico");
            hasErrors = true;
        }

        if (hasErrors) return;

        setIsSubmitting(true);
        try {
            let resolvedClientId = service?.clientId ?? 0;
            // undefined a propósito: un servicio sin bici no manda bicycleId
            // (JSON.stringify lo omite del payload, coincide con el opcional del backend).
            let resolvedBikeId: number | undefined;
            let resolvedMechanicId = selectedMechanicId ?? 0;

            if (!hasBike) {
                resolvedClientId = await resolveClientId();
            } else if (bikeMode === "new") {
                resolvedClientId = await resolveClientId();

                const { data: createdBike } = await api.post("/bicycles", {
                    brand: newBike.brand,
                    model: newBike.model,
                    clientId: resolvedClientId,
                });
                resolvedBikeId = createdBike.id;
                queryClient.invalidateQueries({ queryKey: ["bicycles"] });
            } else {
                resolvedBikeId = selectedBikeId ?? undefined;
                const allBikes = bicyclesData?.pages.flatMap((p) => p.data) ?? [];
                const bike = allBikes.find((b) => b.id === selectedBikeId);
                resolvedClientId = bike?.clientId ?? service?.clientId ?? 0;
            }

            // 3. Create mechanic if needed
            if (mechanicMode === "new") {
                const { data: createdMechanic } = await api.post("/mechanics", newMechanic);
                resolvedMechanicId = createdMechanic.id;
                queryClient.invalidateQueries({ queryKey: ["mechanics"] });
            }

            // 4. Create / update service
            const payload = {
                description: formData.description,
                price: parseFloat(formData.price.toString()),
                scheduledAt: toISOString(formData.scheduledAt),
                deliveryAt: toISOString(formData.deliveryAt),
                category: formData.category,
                isReminderActive: formData.isReminderActive,
                bicycleId: resolvedBikeId,
                clientId: resolvedClientId,
                mechanicId: resolvedMechanicId,
                parts: parts.map((p) => ({
                    name: p.name,
                    quantity: Number(p.quantity),
                    unitPrice: Number(p.unitPrice),
                })),
            };

            if (service) {
                await api.patch(`/services/${service.id}`, payload);
            } else {
                await api.post("/services", payload);
            }

            queryClient.invalidateQueries({ queryKey: ["services"] });
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

    // ── Selector de cliente (compartido: dentro de "bici nueva" y en el flujo sin bici) ──

    const clientPicker = clientModeForBike === "generic" ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <span className="text-sm font-medium">Cliente Ocasional seleccionado</span>
            <button
                type="button"
                className="text-xs text-muted-foreground hover:underline"
                onClick={() => {
                    setClientModeForBike("existing");
                    setSelectedClientIdForBike(null);
                }}
            >
                Cambiar
            </button>
        </div>
    ) : clientModeForBike === "existing" ? (
        <div className="space-y-2">
            <Select
                value={selectedClientIdForBike?.toString() ?? ""}
                onValueChange={(val) => {
                    if (val === "NEW") {
                        setClientModeForBike("new");
                        setSelectedClientIdForBike(null);
                        return;
                    }
                    setSelectedClientIdForBike(Number(val));
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
                    {clientsData?.pages.flatMap((page) =>
                        page.data.map((client: Client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                                {client.email ? ` — ${client.email}` : ""}
                            </SelectItem>
                        )),
                    )}
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
                    onClick={() => setClientModeForBike("existing")}
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

                    {/* ── ¿Bicicleta registrada? ── */}
                    <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                        <div className="min-w-0">
                            <div className="text-sm font-medium">¿Es sobre una bicicleta registrada?</div>
                            <div className="text-xs text-muted-foreground">
                                Desactivalo para reparaciones sueltas (armar una rueda, etc.) que no requieren registrar una bici.
                            </div>
                        </div>
                        <Switch
                            checked={hasBike}
                            onCheckedChange={(checked) => {
                                setHasBike(checked);
                                if (!checked) setClientModeForBike("existing");
                            }}
                        />
                    </div>

                    {/* ── Bicicleta (o cliente directo si no hay bici) ── */}
                    {!hasBike ? (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Cliente</label>
                            {clientPicker}
                        </div>
                    ) : (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Bicicleta</label>
                        {bikeMode === "existing" ? (
                            <Select
                                value={selectedBikeId?.toString() ?? ""}
                                onValueChange={(val) => {
                                    if (val === "NEW") {
                                        setBikeMode("new");
                                        setSelectedBikeId(null);
                                        return;
                                    }
                                    const id = Number(val);
                                    setSelectedBikeId(id);
                                    const bike = bicyclesData?.pages
                                        .flatMap((p) => p.data)
                                        .find((b: Bike) => b.id === id);
                                    if (bike) setValue("price", 0);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una bicicleta" />
                                </SelectTrigger>
                                <SelectContent
                                    onScroll={(e) => {
                                        const el = e.currentTarget;
                                        if (
                                            el.scrollHeight - el.scrollTop - el.clientHeight <= 1 &&
                                            hasNextBike
                                        )
                                            fetchNextBike();
                                    }}
                                >
                                    <SelectItem value="NEW" className="text-primary font-medium">
                                        + Nueva Bicicleta
                                    </SelectItem>
                                    {bicyclesData?.pages.flatMap((page) =>
                                        page.data.map((bike: Bike) => (
                                            <SelectItem key={bike.id} value={bike.id.toString()}>
                                                {bike.brand} — {bike.model}
                                            </SelectItem>
                                        )),
                                    )}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-primary">Nueva Bicicleta</span>
                                    <button
                                        type="button"
                                        className="text-xs text-muted-foreground hover:underline"
                                        onClick={() => setBikeMode("existing")}
                                    >
                                        Seleccionar existente
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Marca</label>
                                    <Input
                                        value={newBike.brand}
                                        onChange={(e) => setNewBike((b) => ({ ...b, brand: e.target.value }))}
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
                                        onChange={(e) => setNewBike((b) => ({ ...b, model: e.target.value }))}
                                        placeholder="Ej: Marlin 5"
                                    />
                                    {bikeErrors.model && (
                                        <p className="text-red-500 text-xs mt-1">{bikeErrors.model}</p>
                                    )}
                                </div>

                                {/* Cliente para la bicicleta */}
                                <div>
                                    <label className="block text-xs font-medium mb-1">Cliente de la bicicleta</label>
                                    {clientPicker}
                                </div>
                            </div>
                        )}
                    </div>
                    )}

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
                            <Input type="datetime-local" {...register("scheduledAt")} className="w-full" />
                            {errors.scheduledAt && (
                                <p className="text-red-500 text-sm">{errors.scheduledAt.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Fecha de entrega</label>
                            <Input type="datetime-local" {...register("deliveryAt")} className="w-full" />
                            {errors.deliveryAt && (
                                <p className="text-red-500 text-sm">{errors.deliveryAt.message}</p>
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
                                            onChange={(e) => updatePart(i, "name", e.target.value)}
                                        />
                                        <Input
                                            className="col-span-2"
                                            inputMode="numeric"
                                            placeholder="1"
                                            value={String(part.quantity)}
                                            onChange={(e) => {
                                                const next = e.target.value.replace(/[^\d]/g, "");
                                                updatePart(i, "quantity", next === "" ? 1 : Number(next));
                                            }}
                                        />
                                        <Input
                                            className="col-span-3"
                                            inputMode="decimal"
                                            placeholder="0.00"
                                            value={String(part.unitPrice)}
                                            onChange={(e) => {
                                                const next = e.target.value.replace(/[^\d.,]/g, "");
                                                const normalized = next.replace(",", ".");
                                                const parsed = normalized === "" ? 0 : Number(normalized);
                                                updatePart(i, "unitPrice", Number.isFinite(parsed) ? parsed : 0);
                                            }}
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
                        <Input
                            inputMode="decimal"
                            placeholder="Ej: 1200.50"
                            value={priceInput}
                            onChange={(e) => {
                                const next = e.target.value.replace(/[^\d.,]/g, "");
                                setPriceInput(next);

                                // Normaliza: acepta "," o "." como separador decimal (usa ".")
                                const normalized = next.replace(",", ".");
                                const parsed = normalized === "" ? 0 : Number(normalized);
                                setValue("price", Number.isFinite(parsed) ? parsed : 0, { shouldValidate: true });
                            }}
                            onBlur={() => {
                                const normalized = priceInput.replace(",", ".");
                                const parsed = normalized === "" ? 0 : Number(normalized);
                                if (Number.isFinite(parsed)) {
                                    setPriceInput(parsed === 0 ? "" : String(parsed));
                                }
                            }}
                        />
                        {errors.price && (
                            <p className="text-red-500 text-sm">{errors.price.message}</p>
                        )}
                    </div>

                    {/* Total efectivo: lo que se le cobra al cliente es mano de obra + repuestos. */}
                    <div className="flex items-baseline justify-between rounded-lg border bg-muted/40 px-3 py-2">
                        <span className="text-sm font-medium">Total a cobrar</span>
                        <div className="text-right">
                            <span className="text-lg font-bold">
                                {formatCurrency((watch("price") || 0) + totalParts)}
                            </span>
                            {totalParts > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(watch("price") || 0)} + {formatCurrency(totalParts)} en repuestos
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
