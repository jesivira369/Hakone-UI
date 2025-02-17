"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { Service } from "@/lib/types";
import { ServiceStatus } from "@/lib/enums";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useState } from "react";
import { ServiceModal } from "@/components/ui/ServiceModal";
import { ServiceStatusUpdater } from "@/components/ui/ServiceStatusUpdater";

export default function ServiceDetails() {
    const { id: serviceId } = useParams();
    const [editModalOpen, setEditModalOpen] = useState(false);

    const { data: service, isLoading, error } = useQuery<Service>({
        queryKey: ["service", serviceId],
        queryFn: async () => {
            const { data } = await api.get(`/services/${serviceId}`);
            return data;
        },
        enabled: !!serviceId,
    });

    if (isLoading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Detalles del Servicio</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3 mb-2" />
                </div>
            </div>
        );
    }

    if (error || !service) return <p className="p-6 text-red-500">Error al cargar el servicio.</p>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Detalles del Servicio</h1>
                <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                    <Edit size={16} className="mr-2" /> Editar Servicio
                </Button>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Información del Servicio</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-500">Descripción:</p>
                        <p className="font-medium">{service.description}</p>
                    </div>
                    <ServiceStatusUpdater serviceId={service.id} currentStatus={service.status as ServiceStatus} />

                    <div>
                        <p className="text-gray-500">Precio:</p>
                        <p className="font-medium">{formatCurrency(service.price)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Fecha de Creación:</p>
                        <p className="font-medium">{formatDate(service.createdAt)}</p>
                    </div>
                    {service.completedAt && (
                        <div>
                            <p className="text-gray-500">Fecha de Finalización:</p>
                            <p className="font-medium">{formatDate(service.completedAt)}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {service.partsUsed && Object.keys(service.partsUsed).length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Repuestos Usados</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(service.partsUsed).map(([part, quantity]) => (
                            <div key={part} className="p-3 border rounded-lg shadow-sm flex justify-between items-center">
                                <p className="font-medium">{part}</p>
                                <span className="text-gray-700 font-semibold">{quantity}x</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-500">Nombre:</p>
                        <p className="font-medium">{service.client ? service.client.name : "Sin cliente"}</p>

                        <p className="text-gray-500 mt-2">Email:</p>
                        <p className="font-medium">{service.client?.email || "No disponible"}</p>

                        <p className="text-gray-500 mt-2">Teléfono:</p>
                        <p className="font-medium">{service.client?.phone || "No disponible"}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Información del Mecánico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-500">Nombre:</p>
                        <p className="font-medium">{service.mechanic?.name}</p>
                    </CardContent>
                </Card>
            </div>

            {editModalOpen && (
                <ServiceModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    service={service}
                />
            )}
        </div>
    );
}
