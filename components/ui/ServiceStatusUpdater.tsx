import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CheckoutModal } from "@/components/ui/CheckoutModal";
import api from "@/lib/axiosInstance";
import { invalidateServiceQueries } from "@/lib/invalidateServiceQueries";
import { ServiceStatus, ServiceStatusLabels, serviceStatusRuleErrors } from "@/lib/enums";
import { Service } from "@/lib/types";

type PendingChange = "generic" | "cancel" | null;

export function ServiceStatusUpdater({ service }: { service: Service }) {
    const queryClient = useQueryClient();
    const currentStatus = service.status as ServiceStatus;
    const [selectedStatus, setSelectedStatus] = useState<ServiceStatus>(currentStatus);
    const [pending, setPending] = useState<PendingChange>(null);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    const statusMutation = useMutation({
        mutationFn: async (newStatus: ServiceStatus) => {
            await api.patch(`/services/${service.id}`, { status: newStatus });
        },
        onSuccess: () => {
            invalidateServiceQueries(queryClient);
            setPending(null);
        },
        onError: () => {
            toast.error("No se pudo cambiar el estado del servicio", {
                className: "bg-red-600 text-white border border-red-700",
            });
        },
    });

    const handleChangeStatus = (newStatus: ServiceStatus) => {
        if (newStatus === currentStatus) return;

        // Mano de obra y fechas se exigen desde ciertos estados: se avisa antes de pegarle a la API.
        const ruleErrors = serviceStatusRuleErrors(newStatus, {
            price: service.price,
            scheduledAt: service.scheduledAt,
            deliveryAt: service.deliveryAt,
        });
        const firstError = ruleErrors.price ?? ruleErrors.scheduledAt ?? ruleErrors.deliveryAt;
        if (firstError) {
            toast.error(`${firstError}. Completala en "Editar Servicio".`, {
                className: "bg-red-600 text-white border border-red-700",
            });
            return;
        }

        setSelectedStatus(newStatus);
        if (newStatus === ServiceStatus.PAID) {
            // El cobro se registra en el checkout (monto + método), no con un simple cambio de estado.
            setCheckoutOpen(true);
        } else if (newStatus === ServiceStatus.CANCELED) {
            setPending("cancel");
        } else {
            setPending("generic");
        }
    };

    const confirmStatusChange = () => {
        statusMutation.mutate(selectedStatus);
    };

    return (
        <>
            <div>
                <p className="text-gray-500">Estado:</p>
                <Select value={currentStatus} onValueChange={(val) => handleChangeStatus(val as ServiceStatus)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={ServiceStatusLabels[currentStatus]} />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(ServiceStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                                {ServiceStatusLabels[status]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Cambio de estado genérico */}
            <Dialog open={pending === "generic"} onOpenChange={(open) => !open && setPending(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
                    </DialogHeader>
                    <p>
                        ¿Estás seguro de que deseas cambiar el estado del servicio a{" "}
                        <b>{ServiceStatusLabels[selectedStatus]}</b>?
                    </p>
                    {currentStatus === ServiceStatus.PAID && (
                        <p className="text-sm text-muted-foreground">
                            El servicio dejará de figurar como cobrado y se borrarán los datos del cobro (monto y método).
                        </p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPending(null)}>Cancelar</Button>
                        <Button onClick={confirmStatusChange} disabled={statusMutation.isPending}>
                            {statusMutation.isPending ? "Guardando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancelación: confirmación propia */}
            <Dialog open={pending === "cancel"} onOpenChange={(open) => !open && setPending(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancelar servicio</DialogTitle>
                        <DialogDescription>
                            El servicio quedará como <b>Cancelado</b> y no contará como ingreso.
                        </DialogDescription>
                    </DialogHeader>
                    <p>¿Estás seguro de que deseas cancelar este servicio?</p>
                    {currentStatus === ServiceStatus.PAID && (
                        <p className="text-sm text-red-600">
                            El servicio ya estaba cobrado: se borrarán los datos del cobro (monto y método).
                        </p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPending(null)} disabled={statusMutation.isPending}>
                            Volver
                        </Button>
                        <Button variant="destructive" onClick={confirmStatusChange} disabled={statusMutation.isPending}>
                            {statusMutation.isPending ? "Cancelando..." : "Sí, cancelar servicio"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} service={service} />
        </>
    );
}
