"use client";

import { Check, Link2, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
            <DialogContent className="max-w-[min(95vw,28rem)]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            <Check size={16} />
                        </span>
                        Servicio creado · Orden {formatFolio(service.number)}
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    {shareable
                        ? "Mandale el comprobante al cliente: tiene el número de orden y un enlace para seguir el estado de su bici."
                        : "El Cliente Ocasional no recibe comprobante. Anotá el número de orden para identificar la bici."}
                </p>
                <DialogFooter className="gap-2 sm:gap-2">
                    {shareable && (
                        <>
                            <Button onClick={() => void send("receipt", service)} disabled={sending} className="w-full sm:w-auto">
                                <MessageCircle size={16} className="mr-2" /> Enviar comprobante por WhatsApp
                            </Button>
                            <Button variant="outline" onClick={() => void handleCopy()} className="w-full sm:w-auto">
                                <Link2 size={16} className="mr-2" /> Copiar enlace
                            </Button>
                        </>
                    )}
                    <Button variant={shareable ? "ghost" : "default"} onClick={onClose} className="w-full sm:w-auto">
                        {shareable ? "Ahora no" : "Listo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
