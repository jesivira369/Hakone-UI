import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import api from "@/lib/axiosInstance";
import { ServiceStatus, ServiceStatusLabels } from "@/lib/enums";

export function ServiceStatusUpdater({ serviceId, currentStatus }: { serviceId: number, currentStatus: ServiceStatus }) {
    const queryClient = useQueryClient();
    const [selectedStatus, setSelectedStatus] = useState<ServiceStatus>(currentStatus);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

    const statusMutation = useMutation({
        mutationFn: async (newStatus: ServiceStatus) => {
            await api.patch(`/services/${serviceId}`, { status: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["service", serviceId] });
            setConfirmModalOpen(false);
        }
    });

    const handleChangeStatus = (newStatus: ServiceStatus) => {
        setSelectedStatus(newStatus);
        setConfirmModalOpen(true);
    };

    const confirmStatusChange = () => {
        statusMutation.mutate(selectedStatus);
    };

    return (
        <>
            <div>
                <p className="text-gray-500">Estado:</p>
                <Select onValueChange={(val) => handleChangeStatus(val as ServiceStatus)} defaultValue={currentStatus}>
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

            <Dialog open={isConfirmModalOpen} onOpenChange={setConfirmModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
                    </DialogHeader>
                    <p>¿Estás seguro de que deseas cambiar el estado del servicio a <b>{ServiceStatusLabels[selectedStatus]}</b>?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmStatusChange} disabled={statusMutation.isPending}>
                            {statusMutation.isPending ? "Guardando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
