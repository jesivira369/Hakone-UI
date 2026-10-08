"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link2, MoreHorizontal, RefreshCw, Ban } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { invalidateServiceQueries } from "@/lib/invalidateServiceQueries";
import { canShareService, copyTrackingLink, disablePublicLink, fetchPublicCode } from "@/lib/shareService";
import { trackingUrl } from "@/lib/whatsapp";
import type { Service } from "@/lib/types";

const ok = { className: "bg-green-600 text-white border border-green-700" };
const fail = { className: "bg-red-600 text-white border border-red-700" };

/** Control del enlace público de un servicio: copiar, regenerar (el anterior deja de funcionar) o desactivar. */
export function TrackingLinkMenu({ service }: { service: Service }) {
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState(false);
    if (!canShareService(service)) return null;

    const run = async (action: () => Promise<string>) => {
        setBusy(true);
        try {
            toast.success(await action(), ok);
            invalidateServiceQueries(queryClient);
        } catch {
            toast.error("No se pudo completar la acción", fail);
        } finally {
            setBusy(false);
        }
    };

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0" disabled={busy}>
                    <Link2 size={16} className="mr-2" /> Seguimiento <MoreHorizontal size={14} className="ml-1 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onSelect={() => void run(async () => {
                        await copyTrackingLink(service.id);
                        return "Enlace de seguimiento copiado";
                    })}
                >
                    <Link2 size={14} className="mr-2" /> Copiar enlace
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={() => void run(async () => {
                        const { publicCode } = await fetchPublicCode(service.id, true);
                        await navigator.clipboard.writeText(trackingUrl(window.location.origin, publicCode));
                        return "Enlace nuevo copiado. El anterior ya no funciona";
                    })}
                >
                    <RefreshCw size={14} className="mr-2" /> Regenerar enlace
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => void run(async () => {
                        await disablePublicLink(service.id);
                        return "Enlace desactivado";
                    })}
                >
                    <Ban size={14} className="mr-2" /> Desactivar enlace
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
