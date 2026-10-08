"use client";

import { Check, Link2, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSendWhatsApp } from "@/components/ui/WhatsAppShareButton";
import { canShareService, copyTrackingLink } from "@/lib/shareService";
import { formatFolio } from "@/lib/whatsapp";
import type { Service } from "@/lib/types";

/**
 * Se muestra al crear un servicio (en cualquier estado inicial): el camino rápido para entregarle al cliente
 * su "talón" digital sin salir de la pantalla. Para el Cliente Ocasional solo confirma el folio.
 */
export function ServiceCreatedDialog({ service, onClose }: { service: Service; onClose: () => void }) {
    const { send, sending } = useSendWhatsApp();
    const shareable = canShareService(service);

    const handleCopy = async () => {
        try {
            await copyTrackingLink(service.id);
            toast.success("Enlace de seguimiento copiado", { className: "bg-green-600 text-white border border-green-700" });
        } catch {
            toast.error("No se pudo copiar el enlace", { className: "bg-red-600 text-white border border-red-700" });
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 pr-6 text-left leading-snug">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            <Check size={16} />
                        </span>
                        Servicio creado · Orden {formatFolio(service.number)}
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    {shareable
                        ? "Envía el comprobante al cliente: tiene el número de orden y un enlace para seguir el estado de su bici."
                        : "El Cliente Ocasional no recibe comprobante. Anota el número de orden para identificar la bici."}
                </p>
                {/* Apilado: el botón principal a todo el ancho y los secundarios debajo, para que nada se desborde */}
                <div className="grid gap-2">
                    {shareable && (
                        <Button onClick={() => void send("receipt", service)} disabled={sending} className="h-11 w-full">
                            <MessageCircle size={16} className="mr-2 shrink-0" /> Enviar comprobante por WhatsApp
                        </Button>
                    )}
                    <div className={shareable ? "grid grid-cols-2 gap-2" : "grid"}>
                        {shareable && (
                            <Button variant="outline" onClick={() => void handleCopy()} className="w-full">
                                <Link2 size={16} className="mr-2 shrink-0" /> Copiar enlace
                            </Button>
                        )}
                        <Button variant={shareable ? "ghost" : "default"} onClick={onClose} className="w-full">
                            {shareable ? "Ahora no" : "Listo"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
