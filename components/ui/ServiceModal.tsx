"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { formatCurrency } from "@/lib/utils";
import { Bike, BikeQuery, Mechanic, MechanicQuery, Service } from "@/lib/types";
import { Plus, Trash } from "lucide-react";
import { toast } from "react-toastify";

const serviceSchema = z.object({
    bicycleId: z.number().min(1, "Debe seleccionar una bicicleta"),
    clientId: z.number().min(1, "Debe seleccionar un cliente"),
    mechanicId: z.number().min(1, "Debe seleccionar un mecanico"),
    description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
    price: z.number().min(1, "El precio debe ser un número válido"),
    partsUsed: z.record(z.string(), z.number()).optional(),
});

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    service?: Service | null;
}

export function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [hasParts, setHasParts] = useState(!!service?.partsUsed);
    const [partsUsed, setPartsUsed] = useState<{ name: string; quantity: number }[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [bicyclesPage, setBicyclesPagePage] = useState(1);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [mechanicsPage, setMechanicsPage] = useState(1)

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
        watch,
    } = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            bicycleId: 0,
            clientId: 0,
            mechanicId: 0,
            description: "",
            price: 0,
            partsUsed: {},
        },
    });

    const {
        data: bicyclesData,
        fetchNextPage: fetchNextBicyclePage,
        hasNextPage: hasNextBicyclePage,
    } = useInfiniteQuery<BikeQuery>({
        queryKey: ["bicycles"],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get(`/bicycles?page=${pageParam}&limit=10`);
            return data;
        },
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
    });

    const {
        data: mechanicsData,
        fetchNextPage: fetchNextMechanicsPage,
        hasNextPage: hasNextMechanicsPage,
    } = useInfiniteQuery<MechanicQuery>({
        queryKey: ["mechanics"],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get(`/mechanics?page=${pageParam}&limit=10`);
            return data;
        },
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
    });


    useEffect(() => {
        if (service) {
            setValue("description", service.description);
            setValue("price", service.price);
            setValue("bicycleId", service.bicycleId);
            setValue("clientId", service.clientId);
            setValue("mechanicId", service.mechanicId);
            setHasParts(!!service.partsUsed);
            if (service.partsUsed) {
                setPartsUsed(Object.entries(service.partsUsed).map(([name, quantity]) => ({ name, quantity })));
            }
        } else {
            reset();
        }
    }, [service, setValue, reset]);

    const mutation = useMutation({
        mutationFn: async (data: z.infer<typeof serviceSchema>) => {

            const requestData = {
                ...data,
                price: parseFloat(data.price.toString()),
                partsUsed: hasParts && partsUsed.length > 0
                    ? Object.fromEntries(partsUsed.map((part) => [part.name, part.quantity]))
                    : {},
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

            toast.success(service ? "Servicio actualizado con éxito" : "Servicio creado con éxito", {
                className: "bg-green-600 text-white border border-green-700",
            });

            onClose();
            setIsLoading(false);
        },
        onError: (error) => {
            toast.error(error.message || "Ocurrió un error al guardar el servicio", {
                className: "bg-red-600 text-white border border-red-700",
            });

            setIsLoading(false);
        },
    });

    const addPart = () => setPartsUsed([...partsUsed, { name: "", quantity: 1 }]);
    const removePart = (index: number) => setPartsUsed(partsUsed.filter((_, i) => i !== index));
    const updatePart = (index: number, field: "name" | "quantity", value: string | number) => {
        setPartsUsed((prevParts) => {
            const updatedParts = [...prevParts];
            updatedParts[index] = { ...updatedParts[index], [field]: value };
            return updatedParts;
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{service ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit((data) => {
                        mutation.mutate({
                            ...data,
                            price: parseFloat(data.price.toString()),
                            partsUsed: hasParts && partsUsed.length > 0
                                ? Object.fromEntries(partsUsed.map((part) => [part.name, part.quantity]))
                                : undefined,
                        });
                    })}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium">Bicicleta</label>
                        <Select
                            onValueChange={(val) => {
                                setValue("bicycleId", +val);
                                const selectedBike = bicyclesData?.pages
                                    .flatMap((page) => page.data)
                                    .find((bike: Bike) => bike.id.toString() === val);
                                if (selectedBike) {
                                    setValue("clientId", selectedBike.clientId);
                                }
                            }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una bicicleta" />
                            </SelectTrigger>
                            <SelectContent
                                onScroll={(e) => {
                                    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
                                    if (bottom && hasNextBicyclePage) fetchNextBicyclePage();
                                }}
                            >
                                {bicyclesData?.pages.flatMap((page) =>
                                    page.data.map((bike: Bike) => (
                                        <SelectItem key={bike.id} value={bike.id.toString()}>
                                            {bike.brand} - {bike.model}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {errors.bicycleId && <p className="text-red-500 text-sm">{errors.bicycleId.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Mecanico</label>
                        <Select
                            onValueChange={(val) => {
                                setValue("mechanicId", +val);
                            }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un mecanico" />
                            </SelectTrigger>
                            <SelectContent
                                onScroll={(e) => {
                                    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
                                    if (bottom && hasNextMechanicsPage) fetchNextMechanicsPage();
                                }}
                            >
                                {mechanicsData?.pages.flatMap((page) =>
                                    page.data.map((mechanic: Mechanic) => (
                                        <SelectItem key={mechanic.id} value={mechanic.id.toString()}>
                                            {mechanic.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {errors.mechanicId && <p className="text-red-500 text-sm">{errors.mechanicId.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Descripción</label>
                        <textarea {...register("description")} className="w-full p-2 border rounded-md min-h-[100px]" />
                        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                    </div>

                    <div className="flex justify-end items-center gap-4">
                        <label className="block text-sm font-medium">Agregar repuestos</label>
                        <input type="checkbox" checked={hasParts} onChange={() => setHasParts(!hasParts)} className="w-5 h-5" />
                    </div>
                    {hasParts && (
                        <div className="space-y-2">
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
                                    <Button variant="destructive" type="button" size="sm" onClick={() => removePart(index)}>
                                        <Trash size={14} />
                                    </Button>
                                </div>
                            ))}
                            <div className="flex justify-end">
                                <Button type="button" variant="outline" size="sm" className="flex items-center self-end mt-2" onClick={addPart}>
                                    <Plus size={16} />
                                </Button>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium">Precio</label>
                        <div className="relative">
                            <Input
                                type="text"
                                value={formatCurrency(watch("price"))}
                                onChange={(e) => setValue("price", parseFloat(e.target.value) || 0)}
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
