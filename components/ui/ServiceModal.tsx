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
import { Plus, Trash, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-toastify";

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
});

const newClientSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    phone: z
        .string()
        .min(6, "El teléfono debe tener al menos 6 caracteres")
        .regex(/^[+\d][\d\s\-().+]*$/, "Solo se permiten números"),
    email: z.string().email("Debe ser un email válido"),
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

    // Parts (new format: name, quantity, unitPrice)
    const [parts, setParts] = useState<ServicePartInput[]>([]);

    // Entity selection modes
    const [bikeMode, setBikeMode] = useState<EntityMode>("existing");
    const [mechanicMode, setMechanicMode] = useState<EntityMode>("existing");
    const [clientModeForBike, setClientModeForBike] = useState<EntityMode>("existing");

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
        },
    });

    // ── Infinite queries ────────────────────────────────────────────────────

    const {
        data: bicyclesData,
        fetchNextPage: fetchNextBike,
        hasNextPage: hasNextBike,
    } = useInfiniteQuery<BikeQuery>({
        queryKey: ["bicycles"],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get(`/bicycles?page=${pageParam}&limit=10`);
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
            const { data } = await api.get(`/mechanics?page=${pageParam}&limit=10`);
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
            const { data } = await api.get(`/clients?page=${pageParam}&limit=10`);
            return data;
        },
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
        initialPageParam: 1,
        enabled: bikeMode === "new" && clientModeForBike === "existing",
    });

    // ── Populate form on edit ───────────────────────────────────────────────

    useEffect(() => {
        if (service) {
            setValue("description", service.description);
            setValue("price", service.price);
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
            setSelectedBikeId(service.bicycleId);
            setSelectedMechanicId(service.mechanicId);
            setBikeMode("existing");
            setMechanicMode("existing");
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
        }
    }, [service, setValue, reset]);

    // ── Parts helpers ───────────────────────────────────────────────────────

    const addPart = () => setParts((p) => [...p, { name: "", quantity: 1, unitPrice: 0 }]);
    const removePart = (i: number) => setParts((p) => p.filter((_, idx) => idx !== i));
    const updatePart = (i: number, field: keyof ServicePartInput, value: string | number) =>
        setParts((p) => p.map((part, idx) => (idx === i ? { ...part, [field]: value } : part)));

    const totalParts = parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);

    // ── Submit ──────────────────────────────────────────────────────────────

    const onSubmit = async (formData: z.infer<typeof serviceSchema>) => {
        let hasErrors = false;

        // Validate bicycle section
        if (bikeMode === "new") {
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

            if (clientModeForBike === "new") {
                const clientResult = newClientSchema.safeParse(newClient);
                if (!clientResult.success) {
                    const errs: InlineClientErrors = {};
                    clientResult.error.issues.forEach((i) => {
                        errs[i.path[0] as keyof InlineClientErrors] = i.message;
                    });
                    setClientErrors(errs);
                    hasErrors = true;
                } else {
                    setClientErrors({});
                }
            } else if (!selectedClientIdForBike) {
                toast.error("Selecciona un cliente para la bicicleta");
                hasErrors = true;
            }
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
            let resolvedBikeId = selectedBikeId ?? 0;
            let resolvedMechanicId = selectedMechanicId ?? 0;

            // 1. Create client if needed
            if (bikeMode === "new") {
                if (clientModeForBike === "new") {
                    const { data: createdClient } = await api.post("/clients", newClient);
                    resolvedClientId = createdClient.id;
                    queryClient.invalidateQueries({ queryKey: ["clients"] });
                } else {
                    resolvedClientId = selectedClientIdForBike!;
                }

                // 2. Create bicycle
                const { data: createdBike } = await api.post("/bicycles", {
                    brand: newBike.brand,
                    model: newBike.model,
                    clientId: resolvedClientId,
                });
                resolvedBikeId = createdBike.id;
                queryClient.invalidateQueries({ queryKey: ["bicycles"] });
            } else {
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

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{service ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* ── Bicicleta ── */}
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
                                            el.scrollHeight - el.scrollTop === el.clientHeight &&
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
                                    {clientModeForBike === "existing" ? (
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
                                                    if (
                                                        el.scrollHeight - el.scrollTop ===
                                                            el.clientHeight &&
                                                        hasNextClient
                                                    )
                                                        fetchNextClient();
                                                }}
                                            >
                                                <SelectItem
                                                    value="NEW"
                                                    className="text-primary font-medium"
                                                >
                                                    + Nuevo Cliente
                                                </SelectItem>
                                                {clientsData?.pages.flatMap((page) =>
                                                    page.data.map((client: Client) => (
                                                        <SelectItem
                                                            key={client.id}
                                                            value={client.id.toString()}
                                                        >
                                                            {client.name} — {client.email}
                                                        </SelectItem>
                                                    )),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-primary">
                                                    Nuevo Cliente
                                                </span>
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
                                                    onChange={(e) =>
                                                        setNewClient((c) => ({
                                                            ...c,
                                                            name: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Juan Pérez"
                                                />
                                                {clientErrors.name && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {clientErrors.name}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Teléfono</label>
                                                <Input
                                                    value={newClient.phone}
                                                    onChange={(e) =>
                                                        setNewClient((c) => ({
                                                            ...c,
                                                            phone: e.target.value.replace(/[^\d\s+\-().]/g, ""),
                                                        }))
                                                    }
                                                    placeholder="1234567"
                                                />
                                                {clientErrors.phone && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {clientErrors.phone}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Email</label>
                                                <Input
                                                    type="email"
                                                    value={newClient.email}
                                                    onChange={(e) =>
                                                        setNewClient((c) => ({
                                                            ...c,
                                                            email: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="juan@email.com"
                                                />
                                                {clientErrors.email && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {clientErrors.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
                                            el.scrollHeight - el.scrollTop === el.clientHeight &&
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
                                            type="number"
                                            min={1}
                                            value={part.quantity}
                                            onChange={(e) =>
                                                updatePart(i, "quantity", Number(e.target.value))
                                            }
                                        />
                                        <Input
                                            className="col-span-3"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            placeholder="0.00"
                                            value={part.unitPrice}
                                            onChange={(e) =>
                                                updatePart(i, "unitPrice", parseFloat(e.target.value) || 0)
                                            }
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
                        <label className="block text-sm font-medium">Precio del servicio</label>
                        <div className="relative">
                            <Input
                                type="text"
                                value={formatCurrency(watch("price"))}
                                onChange={(e) =>
                                    setValue("price", parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0)
                                }
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                USD
                            </span>
                        </div>
                        {errors.price && (
                            <p className="text-red-500 text-sm">{errors.price.message}</p>
                        )}
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
