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
import { Mechanic } from "@/lib/types";

const mechanicSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

interface MechanicModalProps {
    isOpen: boolean;
    onClose: () => void;
    mechanic?: Mechanic | null;
}

export function MechanicModal({ isOpen, onClose, mechanic }: MechanicModalProps) {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(mechanicSchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        if (mechanic) {
            setValue("name", mechanic.name);
        } else {
            reset();
        }
    }, [mechanic, setValue, reset]);

    const mutation = useMutation({
        mutationFn: async (data: z.infer<typeof mechanicSchema>) => {
            setIsLoading(true);
            if (mechanic) {
                await api.patch(`/mechanics/${mechanic.id}`, data);
            } else {
                await api.post("/mechanics", data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mechanics"] });
            onClose();
            setIsLoading(false);
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mechanic ? "Editar Mecánico" : "Nuevo Mecánico"}</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit((data) => mutation.mutate(data))}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium">Nombre</label>
                        <Input {...register("name")} placeholder="Nombre del mecánico" />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Guardando..." : mechanic ? "Actualizar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
