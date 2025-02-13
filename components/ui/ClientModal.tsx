"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { Client } from "@/lib/types";

const clientSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    phone: z
        .string()
        .regex(/^\d{2}-\d{4}-\d{4}$/, "El teléfono debe tener el formato xx-xxxx-xxxx"),
    email: z.string().email("Debe ser un email válido"),
});

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    client?: {
        id: number;
        name: string;
        phone: string;
        email: string;
    } | null;
}

export function ClientModal({ isOpen, onClose, client }: ClientModalProps) {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false)
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "",
            phone: "",
            email: "",
        },
    });

    useEffect(() => {
        if (client) {
            setValue("name", client.name);
            setValue("phone", client.phone);
            setValue("email", client.email);
        } else {
            reset();
        }
    }, [client, setValue, reset]);

    const mutation = useMutation({
        mutationFn: async (data: Partial<Client>) => {
            setIsLoading(true)
            if (client) {
                await api.patch(`/clients/${client.id}`, data);
            } else {
                await api.post("/clients", data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            onClose();
            setIsLoading(false)
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{client ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nombre</label>
                        <Input {...register("name")} />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Teléfono</label>
                        <Input {...register("phone")} placeholder="xx-xxxx-xxxx" />
                        {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <Input type="email" {...register("email")} />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Guardando..." : client ? "Actualizar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
