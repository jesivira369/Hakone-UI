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
import { toast } from "react-toastify";
import { PhoneInputE164 } from "@/components/ui/PhoneInputE164";
import { normalizeOptionalPhone } from "@/lib/phone";

const mechanicSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    // Opcional: sirve para enviarle por WhatsApp el enlace de sus tareas. Si se escribe, debe ser válido.
    phone: z
        .string()
        .optional()
        .refine((value) => normalizeOptionalPhone(value).ok, "Número inválido para WhatsApp. Selecciona el país e ingresa el número sin 0 ni 15."),
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
        watch,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(mechanicSchema),
        defaultValues: {
            name: "",
            phone: "",
        },
    });

    useEffect(() => {
        if (mechanic) {
            setValue("name", mechanic.name);
            setValue("phone", mechanic.phone ?? "");
        } else {
            reset();
        }
    }, [mechanic, setValue, reset]);

    const mutation = useMutation({
        mutationFn: async (data: z.infer<typeof mechanicSchema>) => {
            setIsLoading(true);
            // "" (sin teléfono) llega a la API como null y limpia el campo.
            const normalized = normalizeOptionalPhone(data.phone);
            const payload = { name: data.name, phone: normalized.ok ? normalized.value : "" };
            if (mechanic) {
                await api.patch(`/mechanics/${mechanic.id}`, payload);
            } else {
                await api.post("/mechanics", payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mechanics"] });

            toast.success(mechanic ? "Mecanico actualizado con éxito" : "Mecanico creado con éxito", {
                className: "bg-green-600 text-white border border-green-700",
            });

            onClose();
            setIsLoading(false);
        },
        onError: (error) => {
            toast.error(error.message || "Ocurrió un error al guardar el mecanico", {
                className: "bg-red-600 text-white border border-red-700",
            });

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

                    <div>
                        <label className="mb-1 block text-sm font-medium">Teléfono (opcional)</label>
                        <PhoneInputE164
                            value={watch("phone") ?? ""}
                            onChange={(next) => setValue("phone", next, { shouldValidate: true })}
                        />
                        {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">Para enviarle por WhatsApp el enlace de sus trabajos.</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
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
