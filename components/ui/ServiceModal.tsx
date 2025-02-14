"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { formatCurrency } from "@/lib/utils";
import { Service } from "@/lib/types";

const serviceSchema = z.object({
    bicycleId: z.string().nonempty("Debe seleccionar una bicicleta"),
    clientId: z.string().nonempty("Debe seleccionar un cliente"),
    description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
    price: z.string().nonempty("Debe ingresar un precio"),
    partsUsed: z.record(z.string(), z.number()).optional(),
});

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    service?: {
        id: number;
        description: string;
        price: number;
        bicycleId: number;
        clientId: number;
        partsUsed?: Record<string, number>;
    } | null;
}

export function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [hasParts, setHasParts] = useState(!!service?.partsUsed);
    const [partsUsed, setPartsUsed] = useState<{ name: string; quantity: number }[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            bicycleId: "",
            clientId: "",
            description: "",
            price: "",
            partsUsed: {},
        },
    });

    const { data: bicyclesData } = useQuery({
        queryKey: ["bicycles"],
        queryFn: async () => {
            const { data } = await api.get(`/bicycles?limit=10`);
            return data;
        },
    });

    useEffect(() => {
        if (service) {
            setValue("description", service.description);
            setValue("price", service.price.toString());
            setValue("bicycleId", service.bicycleId.toString());
            setValue("clientId", service.clientId.toString());
            setHasParts(!!service.partsUsed);
            if (service.partsUsed) {
                setPartsUsed(Object.entries(service.partsUsed).map(([name, quantity]) => ({ name, quantity })));
            }
        } else {
            reset();
        }
    }, [service, setValue, reset]);

    const mutation = useMutation({
        mutationFn: async (data: Service) => {

            const requestData = {
                ...data,
                bicycleId: Number(data.bicycleId),
                clientId: Number(data.clientId),
            };

            setIsLoading(true);
            if (service) {
                await api.patch(`/services/${service.id}`, requestData);
            } else {
                await api.post("/services", requestData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] });
            onClose();
            setIsLoading(false);
        },
    });

    const addPart = () => setPartsUsed([...partsUsed, { name: "", quantity: 1 }]);
    const removePart = (index: number) => setPartsUsed(partsUsed.filter((_, i) => i !== index));
    const updatePart = (index: number, field: keyof { name: string; quantity: number }, value: any) => {
        const updatedParts = [...partsUsed];
        updatedParts[index][field] = value;
        setPartsUsed(updatedParts);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{service ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit((data) =>
                        mutation.mutate({
                            ...data,
                            price: parseFloat(data.price),
                            partsUsed: hasParts
                                ? Object.fromEntries(partsUsed.map((part) => [part.name, part.quantity]))
                                : undefined,
                        })
                    )}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium">Bicicleta</label>
                        <Select onValueChange={(val) => setValue("bicycleId", val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una bicicleta" />
                            </SelectTrigger>
                            <SelectContent>
                                {bicyclesData?.map((bike: any) => (
                                    <SelectItem key={bike.id} value={bike.id.toString()}>
                                        {bike.brand} - {bike.model} - {bike.client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.bicycleId && <p className="text-red-500 text-sm">{errors.bicycleId.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Descripción</label>
                        <textarea {...register("description")} className="w-full p-2 border rounded-md min-h-[100px]" />
                        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                    </div>

                    <div>
                        <input type="checkbox" checked={hasParts} onChange={() => setHasParts(!hasParts)} /> Agregar repuestos
                    </div>
                    {hasParts && (
                        <div>
                            {partsUsed.map((part, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Nombre del repuesto"
                                        value={part.name}
                                        onChange={(e) => updatePart(index, "name", e.target.value)}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Cantidad"
                                        value={part.quantity}
                                        onChange={(e) => updatePart(index, "quantity", Number(e.target.value))}
                                    />
                                    <Button variant="destructive" onClick={() => removePart(index)}>
                                        Eliminar
                                    </Button>
                                </div>
                            ))}
                            <Button onClick={addPart}>Agregar repuesto</Button>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium">Precio</label>
                        <div className="relative">
                            <Input
                                type="text"
                                {...register("price")}
                                onChange={(e) => setValue("price", formatCurrency(e.target.value))}
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">USD</span>
                        </div>
                        {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Guardando..." : service ? "Actualizar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
