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

const bicycleSchema = z.object({
    brand: z.string().min(3, "La marca debe tener al menos 3 caracteres"),
    model: z.string().min(2, "El modelo debe tener al menos 2 caracteres"),
    clientId: z.string().nonempty("Debe seleccionar un cliente"),
});

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
        } else {
            reset();
        }
    }, [bicycle, setValue, reset]);

    const mutation = useMutation({
        mutationFn: async (data: Partial<Bike>) => {
            setIsLoading(true);
            const requestData = {
                ...data,
                clientId: Number(data.clientId),
            };

            if (bicycle) {
                await api.patch(`/bicycles/${bicycle.id}`, requestData);
            } else {
                await api.post("/bicycles", requestData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bicycles"] });
            onClose();
            setIsLoading(false);
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{bicycle ? "Editar Bicicleta" : "Nueva Bicicleta"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit((data) => mutation.mutate({ ...data, clientId: Number(data.clientId) }))} className="space-y-4">
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
                        <Select onValueChange={(val) => setValue("clientId", val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                            <SelectContent
                                onScroll={(e) => {
                                    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
                                    if (bottom && hasNextPage) fetchNextPage();
                                }}
                            >
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
