"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { Client, Bike, ClientQuery } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";

const bicycleSchema = z.object({
    brand: z.string().min(3, "La marca debe tener al menos 3 caracteres"),
    model: z.string().min(2, "El modelo debe tener al menos 2 caracteres"),
    clientId: z.string().nonempty("Debe seleccionar un cliente"),
});

const newClientSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    phone: z
        .string()
        .min(6, "El teléfono debe tener al menos 6 caracteres")
        .regex(/^[+\d][\d\s\-().+]*$/, "Solo se permiten números"),
    email: z.string().email("Debe ser un email válido"),
});

type EntityMode = "existing" | "new";

interface InlineClientErrors { name?: string; phone?: string; email?: string }

interface BicycleModalProps {
    isOpen: boolean;
    onClose: () => void;
    bicycle?: {
        id: number;
        brand: string;
        model: string;
        lastServiceDate?: string;
        clientId: number;
    } | null;
}

export function BicycleModal({ isOpen, onClose, bicycle }: BicycleModalProps) {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [clientPage, setClientPage] = useState(1);
    const [clientMode, setClientMode] = useState<EntityMode>("existing");
    const [newClient, setNewClient] = useState({ name: "", phone: "", email: "" });
    const [clientErrors, setClientErrors] = useState<InlineClientErrors>({});
    const [selectedClientId, setSelectedClientId] = useState<string>("");

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(bicycleSchema),
        defaultValues: {
            brand: "",
            model: "",
            clientId: "",
        },
    });

    const {
        data: clientsData,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery<ClientQuery>({
        queryKey: ["clients"],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get(`/clients?page=${pageParam}&limit=10`);
            return data;
        },
        getNextPageParam: (lastPage) => (lastPage.data.length === 10 ? clientPage + 1 : undefined),
        initialPageParam: 1,
    });

    useEffect(() => {
        if (bicycle) {
            setValue("brand", bicycle.brand);
            setValue("model", bicycle.model);
            setValue("clientId", bicycle.clientId.toString());
            setSelectedClientId(bicycle.clientId.toString());
            setClientMode("existing");
            setNewClient({ name: "", phone: "", email: "" });
            setClientErrors({});
        } else {
            reset();
            setSelectedClientId("");
            setClientMode("existing");
            setNewClient({ name: "", phone: "", email: "" });
            setClientErrors({});
        }
    }, [bicycle, setValue, reset]);

    const mutation = useMutation({
        mutationFn: async (data: Partial<Bike>) => {
            setIsLoading(true);
            // Si el usuario eligió "Nuevo Cliente", lo creamos primero.
            let resolvedClientId = Number(data.clientId);

            if (!bicycle && clientMode === "new") {
                const parsed = newClientSchema.safeParse(newClient);
                if (!parsed.success) {
                    const errs: InlineClientErrors = {};
                    parsed.error.issues.forEach((i) => {
                        errs[i.path[0] as keyof InlineClientErrors] = i.message;
                    });
                    setClientErrors(errs);
                    setIsLoading(false);
                    throw new Error("Revisa los campos del nuevo cliente");
                }
                setClientErrors({});

                const { data: createdClient } = await api.post("/clients", parsed.data);
                resolvedClientId = createdClient.id;
                queryClient.invalidateQueries({ queryKey: ["clients"] });
            }

            const requestData = { ...data, clientId: resolvedClientId };

            if (bicycle) {
                await api.patch(`/bicycles/${bicycle.id}`, requestData);
            } else {
                await api.post("/bicycles", requestData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bicycles"] });

            toast.success(bicycle ? "Bicicleta actualizada con éxito" : "Bicicleta creada con éxito", {
                className: "bg-green-600 text-white border border-green-700",
            });

            onClose();
            setIsLoading(false);
        },
        onError: (error) => {
            toast.error(error.message || "Ocurrió un error al guardar la bicicleta", {
                className: "bg-red-600 text-white border border-red-700",
            });

            setIsLoading(false);
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{bicycle ? "Editar Bicicleta" : "Nueva Bicicleta"}</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit((data) =>
                        mutation.mutate({ ...data, clientId: Number(data.clientId) })
                    )}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium">Marca</label>
                        <Input {...register("brand")} />
                        {errors.brand && <p className="text-red-500 text-sm">{errors.brand.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Modelo</label>
                        <Input {...register("model")} />
                        {errors.model && <p className="text-red-500 text-sm">{errors.model.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Cliente</label>

                        {clientMode === "existing" || bicycle ? (
                            <>
                                <Select
                                    value={selectedClientId}
                                    onValueChange={(val) => {
                                        if (val === "NEW") {
                                            setClientMode("new");
                                            setSelectedClientId("");
                                            setValue("clientId", "");
                                            setClientErrors({});
                                            return;
                                        }
                                        setClientMode("existing");
                                        setSelectedClientId(val);
                                        setValue("clientId", val);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un cliente" />
                                    </SelectTrigger>
                                    <SelectContent
                                        onScroll={(e) => {
                                            const bottom =
                                                e.currentTarget.scrollHeight - e.currentTarget.scrollTop ===
                                                e.currentTarget.clientHeight;
                                            if (bottom && hasNextPage) fetchNextPage();
                                        }}
                                    >
                                        {!bicycle && (
                                            <SelectItem value="NEW" className="text-primary font-medium">
                                                + Nuevo Cliente
                                            </SelectItem>
                                        )}
                                        {clientsData?.pages.flatMap((page) =>
                                            page.data.map((client: Client) => (
                                                <SelectItem key={client.id} value={client.id.toString()}>
                                                    {client.name} - {client.email}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.clientId && <p className="text-red-500 text-sm">{errors.clientId.message}</p>}
                            </>
                        ) : (
                            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-primary">Nuevo Cliente</span>
                                    <button
                                        type="button"
                                        className="text-xs text-muted-foreground hover:underline"
                                        onClick={() => {
                                            setClientMode("existing");
                                            setSelectedClientId("");
                                            setValue("clientId", "");
                                            setClientErrors({});
                                            setNewClient({ name: "", phone: "", email: "" });
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
                                    {clientErrors.phone && <p className="text-red-500 text-xs mt-1">{clientErrors.phone}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Email</label>
                                    <Input
                                        type="email"
                                        value={newClient.email}
                                        onChange={(e) => setNewClient((c) => ({ ...c, email: e.target.value }))}
                                        placeholder="juan@email.com"
                                    />
                                    {clientErrors.email && <p className="text-red-500 text-xs mt-1">{clientErrors.email}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Guardando..." : bicycle ? "Actualizar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
