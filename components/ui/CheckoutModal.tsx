"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumericInput } from "@/components/ui/NumericInput";
import api from "@/lib/axiosInstance";
import { invalidateServiceQueries } from "@/lib/invalidateServiceQueries";
import { PaymentMethod, PaymentMethodLabels } from "@/lib/enums";
import { formatCurrency, partsTotal, serviceTotal } from "@/lib/utils";
import { Service } from "@/lib/types";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service;
}

/** Cobro: resumen tipo factura, monto recibido (editable) y método de pago. Marca el servicio como pagado. */
export function CheckoutModal({ isOpen, onClose, service }: CheckoutModalProps) {
    const queryClient = useQueryClient();
    const total = serviceTotal(service);
    const [amount, setAmount] = useState<number | null>(total);
    const [method, setMethod] = useState<PaymentMethod | "">("");
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAmount(serviceTotal(service));
            setMethod("");
            setSubmitted(false);
        }
    }, [isOpen, service]);

    const payMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/services/${service.id}/pay`, { amount: amount ?? 0, method });
        },
        onSuccess: () => {
            invalidateServiceQueries(queryClient);
            toast.success("Cobro registrado", { className: "bg-green-600 text-white border border-green-700" });
            onClose();
        },
        onError: () => {
            toast.error("No se pudo registrar el cobro", { className: "bg-red-600 text-white border border-red-700" });
        },
    });

    const handleConfirm = () => {
        setSubmitted(true);
        if (!method || amount === null) return;
        payMutation.mutate();
    };

    const parts = service.parts ?? [];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !payMutation.isPending && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cobrar servicio</DialogTitle>
                    <DialogDescription>
                        {service.client?.name ?? "Sin cliente"} — {service.description}
                    </DialogDescription>
                </DialogHeader>

                {/* Detalle tipo factura */}
                <div className="rounded-lg border text-sm">
                    <div className="flex justify-between px-3 py-2">
                        <span>Mano de obra</span>
                        <span>{formatCurrency(service.price)}</span>
                    </div>
                    {parts.map((p) => (
                        <div key={p.id} className="flex justify-between border-t px-3 py-2 text-muted-foreground">
                            <span>
                                {p.name} × {p.quantity}
                            </span>
                            <span>{formatCurrency(p.quantity * p.unitPrice)}</span>
                        </div>
                    ))}
                    {parts.length > 0 && (
                        <div className="flex justify-between border-t px-3 py-2">
                            <span>Repuestos</span>
                            <span>{formatCurrency(partsTotal(service))}</span>
                        </div>
                    )}
                    <div className="flex justify-between border-t bg-muted/40 px-3 py-2 font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Monto cobrado</label>
                        <NumericInput decimal value={amount} onValueChange={setAmount} emptyValue={null} placeholder="0.00" />
                        {amount !== null && amount !== total && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Difiere del total ({formatCurrency(total)}). Los ingresos usarán el monto cobrado.
                            </p>
                        )}
                        {submitted && amount === null && (
                            <p className="mt-1 text-sm text-red-500">Ingresa el monto cobrado</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Método de pago</label>
                        <Select value={method} onValueChange={(val) => setMethod(val as PaymentMethod)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona cómo se cobró" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(PaymentMethod).map((m) => (
                                    <SelectItem key={m} value={m}>
                                        {PaymentMethodLabels[m]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {submitted && !method && (
                            <p className="mt-1 text-sm text-red-500">Selecciona el método de pago</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={payMutation.isPending}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={payMutation.isPending}>
                        {payMutation.isPending ? "Registrando..." : "Confirmar cobro"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
