"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { Service } from "@/lib/types";
import { ServiceCategoryLabels, ServiceStatus, ServiceStatusDescriptions, getPaymentMethodLabel, getServiceStatusLabel, getServiceStatusStyle, URGENT_STYLE } from "@/lib/enums";
import { formatCurrency, formatDate, partsTotal as calcPartsTotal, serviceTotal } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, PackageCheck, PackageOpen } from "lucide-react";
import { invalidateServiceQueries } from "@/lib/invalidateServiceQueries";
import { useState } from "react";
import { ServiceModal } from "@/components/ui/ServiceModal";
import { ServiceStatusUpdater } from "@/components/ui/ServiceStatusUpdater";
import { DetailsSkeleton } from "@/components/ui/Skeleton/DetailsSkeleton";
import { formatFolio } from "@/lib/whatsapp";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { TrackingLinkMenu } from "@/components/ui/TrackingLinkMenu";
import { toast } from "react-toastify";

export default function ServiceDetails() {
    const { id: serviceId } = useParams();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const pickupMutation = useMutation({
        mutationFn: async (pickedUp: boolean) => {
            await api.patch(`/services/${serviceId}/pickup`, { pickedUp });
            return pickedUp;
        },
        onSuccess: (pickedUp) => {
            invalidateServiceQueries(queryClient);
            toast.success(pickedUp ? "Bici entregada al cliente" : "La bici volvió a figurar en el taller", {
                className: "bg-green-600 text-white border border-green-700",
            });
        },
        onError: (error) => {
            toast.error(error.message || "No se pudo actualizar la entrega", {
                className: "bg-red-600 text-white border border-red-700",
            });
        },
    });

    const { data: service, isLoading, error } = useQuery<Service>({
        queryKey: ["service", serviceId],
        queryFn: async () => {
            const { data } = await api.get(`/services/${serviceId}`);
            return data;
        },
        enabled: !!serviceId,
    });

    if (isLoading) {
        return <DetailsSkeleton />;
    }

    if (error || !service) return <p className="p-6 text-red-500">Error al cargar el servicio.</p>;

    const partsTotal = calcPartsTotal(service);

    return (
        <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold sm:text-2xl">
                    Detalles del Servicio <span className="ml-1 text-muted-foreground">· Orden {formatFolio(service.number)}</span>
                </h1>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <WhatsAppShareButton service={service} />
                    <TrackingLinkMenu service={service} />
                    <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        disabled={pickupMutation.isPending}
                        onClick={() => pickupMutation.mutate(!service.pickedUpAt)}
                    >
                        {service.pickedUpAt ? (
                            <><PackageOpen size={16} className="mr-2" /> Marcar en el taller</>
                        ) : (
                            <><PackageCheck size={16} className="mr-2" /> Entregar bici</>
                        )}
                    </Button>
                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditModalOpen(true)}>
                        <Edit size={16} className="mr-2" /> Editar Servicio
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden rounded-xl shadow-md">
                <CardHeader>
                    <CardTitle>Información del Servicio</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-gray-500">Descripción:</p>
                        <p className="font-medium">{service.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span
                                title={ServiceStatusDescriptions[service.status as ServiceStatus]}
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${getServiceStatusStyle(service.status).badge}`}
                            >
                                {getServiceStatusLabel(service.status)}
                            </span>
                            {service.isUrgent && (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENT_STYLE.badge}`}>
                                    Urgente
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <ServiceStatusUpdater service={service} />
                        <p className="text-xs text-muted-foreground">
                            {ServiceStatusDescriptions[service.status as ServiceStatus]}
                        </p>
                    </div>

                    <div>
                        <p className="text-gray-500">Mano de obra:</p>
                        <p className="font-medium">{formatCurrency(service.price)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Total del servicio:</p>
                        <p className="font-semibold">{formatCurrency(serviceTotal(service))}</p>
                        {partsTotal > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {formatCurrency(service.price)} de mano de obra + {formatCurrency(partsTotal)} en repuestos
                            </p>
                        )}
                    </div>
                    <div>
                        <p className="text-gray-500">Categoría:</p>
                        <p className="font-medium">{ServiceCategoryLabels[service.category] ?? "—"}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Bicicleta:</p>
                        <p className="font-medium">
                            {service.bicycle ? `${service.bicycle.brand} ${service.bicycle.model}` : "Bici ocasional"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Fecha programada:</p>
                        <p className="font-medium">{service.scheduledAt ? formatDate(service.scheduledAt) : "Sin definir"}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Fecha de entrega:</p>
                        <p className="font-medium">{service.deliveryAt ? formatDate(service.deliveryAt) : "Sin definir"}</p>
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
                    <div>
                        <p className="text-gray-500">Retiro de la bici:</p>
                        <p className="font-medium">
                            {service.pickedUpAt ? `Retirada el ${formatDate(service.pickedUpAt)}` : "En el taller"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Recordatorio:</p>
                        <p className="font-medium">
                            {service.isReminderActive ? "Activo" : "Inactivo"}
                            {service.scheduledReminderDate ? ` · ${formatDate(service.scheduledReminderDate)}` : ""}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {service.status === ServiceStatus.PAID && (
                <Card className="overflow-hidden rounded-xl shadow-md">
                    <CardHeader>
                        <CardTitle>Pago</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-gray-500">Monto cobrado:</p>
                            <p className="font-semibold">{formatCurrency(service.paidAmount ?? serviceTotal(service))}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Método de pago:</p>
                            <p className="font-medium">{getPaymentMethodLabel(service.paymentMethod)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Fecha de cobro:</p>
                            <p className="font-medium">{service.paidAt ? formatDate(service.paidAt) : "—"}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {service.parts && service.parts.length > 0 && (
                <Card className="overflow-hidden rounded-xl shadow-md">
                    <CardHeader>
                        <CardTitle>Repuestos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full min-w-[400px] text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Repuesto</th>
                                        <th className="px-3 py-2 text-right font-medium">Cant.</th>
                                        <th className="px-3 py-2 text-right font-medium">P. unitario</th>
                                        <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {service.parts.map((part, i) => (
                                        <tr key={part.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                                            <td className="px-3 py-2">{part.name}</td>
                                            <td className="px-3 py-2 text-right">{part.quantity}</td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(part.unitPrice)}</td>
                                            <td className="px-3 py-2 text-right font-medium">
                                                {formatCurrency(part.quantity * part.unitPrice)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t">
                                    <tr>
                                        <td colSpan={3} className="px-3 py-2 text-right font-semibold">Total repuestos</td>
                                        <td className="px-3 py-2 text-right font-bold">
                                            {formatCurrency(service.parts.reduce((s, p) => s + p.quantity * p.unitPrice, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
