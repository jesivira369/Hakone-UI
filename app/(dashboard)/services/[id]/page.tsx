"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { Service } from "@/lib/types";
import { ServiceCategoryLabels, ServiceStatus } from "@/lib/enums";
import { formatCurrency, formatDate, partsTotal as calcPartsTotal, serviceTotal } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, MessageCircle } from "lucide-react";
import { useState } from "react";
import { ServiceModal } from "@/components/ui/ServiceModal";
import { ServiceStatusUpdater } from "@/components/ui/ServiceStatusUpdater";
import { DetailsSkeleton } from "@/components/ui/Skeleton/DetailsSkeleton";
import { buildWaMeLink, buildWhatsAppReadyMessage } from "@/lib/whatsapp";
import { toast } from "react-toastify";
import { useAuth } from "@/context/auth-provider";

export default function ServiceDetails() {
    const { id: serviceId } = useParams();
    const { user } = useAuth();
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
        return <DetailsSkeleton />;
    }

    if (error || !service) return <p className="p-6 text-red-500">Error al cargar el servicio.</p>;

    const partsTotal = calcPartsTotal(service);

    return (
        <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold sm:text-2xl">Detalles del Servicio</h1>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                            try {
                                const phone = service.client?.phone ?? "";
                                const bikeLabel = service.bicycle ? `${service.bicycle.brand} ${service.bicycle.model}` : "tu bici";
                                const msg = buildWhatsAppReadyMessage({
                                    clientName: service.client?.name ?? "",
                                    bikeLabel,
                                    shopName: user?.shopName ?? "",
                                });
                                const link = buildWaMeLink({ phoneE164: phone, message: msg });
                                window.open(link, "_blank", "noopener,noreferrer");
                            } catch (e: unknown) {
                                const msg = e instanceof Error ? e.message : "No se pudo abrir WhatsApp";
                                toast.error(msg, {
                                    className: "bg-red-600 text-white border border-red-700",
                                });
                            }
                        }}
                    >
                        <MessageCircle size={16} className="mr-2 text-green-600" /> WhatsApp
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
                    </div>
                    <ServiceStatusUpdater serviceId={service.id} currentStatus={service.status as ServiceStatus} />

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
                        <p className="text-gray-500">Recordatorio:</p>
                        <p className="font-medium">
                            {service.isReminderActive ? "Activo" : "Inactivo"}
                            {service.scheduledReminderDate ? ` · ${formatDate(service.scheduledReminderDate)}` : ""}
                        </p>
                    </div>
                </CardContent>
            </Card>

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
