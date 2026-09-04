"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { Expense } from "@/lib/types";
import { ExpenseCategory, ExpenseCategoryLabels } from "@/lib/enums";
import { toast } from "react-toastify";

const expenseSchema = z.object({
    category: z.nativeEnum(ExpenseCategory, { errorMap: () => ({ message: "Selecciona una categoría" }) }),
    description: z.string().min(2, "La descripción es requerida"),
    amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
    provider: z.string().optional(),
    employeeName: z.string().optional(),
    paymentMethod: z.string().optional(),
    notes: z.string().optional(),
    paidAt: z.string().min(1, "La fecha es requerida"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    expense?: Expense | null;
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

export function ExpenseModal({ isOpen, onClose, expense }: ExpenseModalProps) {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            category: ExpenseCategory.OTRO,
            description: "",
            amount: 0,
            provider: "",
            employeeName: "",
            paymentMethod: "",
            notes: "",
            paidAt: todayISO(),
        },
    });

    const category = watch("category");

    useEffect(() => {
        if (expense) {
            setValue("category", expense.category);
            setValue("description", expense.description);
            setValue("amount", expense.amount);
            setValue("provider", expense.provider ?? "");
            setValue("employeeName", expense.employeeName ?? "");
            setValue("paymentMethod", expense.paymentMethod ?? "");
            setValue("notes", expense.notes ?? "");
            setValue("paidAt", expense.paidAt.slice(0, 10));
        } else {
            reset({
                category: ExpenseCategory.OTRO,
                description: "",
                amount: 0,
                provider: "",
                employeeName: "",
                paymentMethod: "",
                notes: "",
                paidAt: todayISO(),
            });
        }
    }, [expense, setValue, reset]);

    const mutation = useMutation({
        mutationFn: async (data: ExpenseFormValues) => {
            setIsLoading(true);
            const payload = {
                ...data,
                // "YYYY-MM-DD" sin hora: JS lo interpreta como medianoche UTC, no
                // local. Mandarlo tal cual corre el día un día hacia atrás en
                // cualquier huso horario detrás de UTC (Argentina incluida). Al
                // anclarlo a medianoche LOCAL antes de convertir a ISO, el mismo
                // navegador que lo cargó lo va a mostrar después en el mismo día.
                paidAt: new Date(`${data.paidAt}T00:00:00`).toISOString(),
            };
            if (expense) {
                await api.patch(`/expenses/${expense.id}`, payload);
            } else {
                await api.post("/expenses", payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["stats-expenses"] });
            queryClient.invalidateQueries({ queryKey: ["stats-overview"] });

            toast.success(expense ? "Gasto actualizado con éxito" : "Gasto creado con éxito", {
                className: "bg-green-600 text-white border border-green-700",
            });

            onClose();
            setIsLoading(false);
        },
        onError: (error) => {
            toast.error(error.message || "Ocurrió un error al guardar el gasto", {
                className: "bg-red-600 text-white border border-red-700",
            });

            setIsLoading(false);
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{expense ? "Editar Gasto" : "Nuevo Gasto"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Categoría</label>
                        <Select value={category} onValueChange={(val) => setValue("category", val as ExpenseCategory, { shouldValidate: true })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(ExpenseCategory).map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {ExpenseCategoryLabels[c]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Descripción</label>
                        <Input {...register("description")} placeholder="Factura de luz de septiembre" />
                        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Monto</label>
                            <Input type="number" step="0.01" min="0" {...register("amount")} placeholder="0.00" />
                            {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Fecha</label>
                            <Input type="date" {...register("paidAt")} />
                            {errors.paidAt && <p className="text-red-500 text-sm">{errors.paidAt.message}</p>}
                        </div>
                    </div>
                    {category === ExpenseCategory.SUELDOS ? (
                        <div>
                            <label className="block text-sm font-medium">Empleado</label>
                            <Input {...register("employeeName")} placeholder="Juan Pérez" />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium">Proveedor</label>
                            <Input {...register("provider")} placeholder="Nombre del proveedor" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium">Método de pago (opcional)</label>
                        <Input {...register("paymentMethod")} placeholder="Efectivo, transferencia..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Notas (opcional)</label>
                        <Input {...register("notes")} placeholder="Observaciones adicionales" />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Guardando..." : expense ? "Actualizar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
