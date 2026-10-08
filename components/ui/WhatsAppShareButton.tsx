"use client";

import { useCallback, useState } from "react";
import { MessageCircle, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-provider";
import { canShareService, sendWhatsApp, type WhatsAppMessageKind } from "@/lib/shareService";
import type { Service } from "@/lib/types";

/** Texto de error que se muestra al usuario ante un fallo de envío. */
function errorMessage(err: unknown): string {
    return err instanceof Error && err.message ? err.message : "No se pudo abrir WhatsApp";
}

/** Envía un mensaje por WhatsApp mostrando el error como toast. Se reutiliza en menús y diálogos. */
export function useSendWhatsApp() {
    const { user } = useAuth();
    const [sending, setSending] = useState(false);

    const shopName = user?.shopName ?? "";
    // Estable entre renders: las tablas lo usan dentro de columnas memoizadas.
    const send = useCallback(
        async (kind: WhatsAppMessageKind, service: Service) => {
            setSending(true);
            try {
                await sendWhatsApp(kind, service, shopName);
            } catch (err) {
                toast.error(errorMessage(err), { className: "bg-red-600 text-white border border-red-700" });
            } finally {
                setSending(false);
            }
        },
        [shopName],
    );

    return { send, sending };
}

/**
 * Un solo botón de WhatsApp con selector de mensaje: comprobante de ingreso (folio, trabajo, fecha estimada y
 * enlace de seguimiento) o aviso de "lista para retirar". No aparece para el Cliente Ocasional ni en cancelados.
 */
export function WhatsAppShareButton({ service, size = "sm" }: { service: Service; size?: "sm" | "default" }) {
    const { send, sending } = useSendWhatsApp();
    if (!canShareService(service)) return null;

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size={size} className="shrink-0" disabled={sending}>
                    <MessageCircle size={16} className="mr-2 text-green-600" /> WhatsApp
                    <ChevronDown size={14} className="ml-1 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => void send("receipt", service)}>Comprobante de ingreso</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void send("ready", service)}>Aviso de lista para retirar</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
