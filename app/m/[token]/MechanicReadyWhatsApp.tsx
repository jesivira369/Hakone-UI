"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildReadyWhatsAppLink, redirectToWhatsApp } from "@/lib/shareService";
import { fetchWhatsappReady } from "./api";
import type { JobDetail } from "./types";

/**
 * Avisa al cliente por WhatsApp que su bici está lista. Usa exactamente el mismo mensaje y enlace de seguimiento que
 * el dashboard (`buildReadyWhatsAppLink`). Solo aparece cuando el trabajo está completado y el cliente tiene
 * seguimiento (no el ocasional ni un cancelado). El teléfono llega recién al tocar el botón y no se muestra.
 */
export function MechanicReadyWhatsApp({ token, detail }: { token: string; detail: Pick<JobDetail, "id" | "status" | "canNotifyClient"> }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (detail.status !== "COMPLETED" || !detail.canNotifyClient) return null;

  const send = async () => {
    setError(null);
    setSending(true);
    // La ventana se abre ANTES del `await`: los navegadores móviles bloquean `window.open` después de una espera.
    const popup = window.open("", "_blank");
    try {
      const data = await fetchWhatsappReady(token, detail.id);
      const link = buildReadyWhatsAppLink({
        phoneE164: data.phoneE164,
        clientName: data.clientName,
        bikeLabel: data.bike ?? "",
        shopName: data.shopName,
        number: data.number,
        publicCode: data.publicCode,
      });
      redirectToWhatsApp(popup, link);
    } catch (err) {
      popup?.close();
      setError(err instanceof Error && err.message ? err.message : "No se pudo abrir WhatsApp");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={() => void send()} disabled={sending} className="h-10">
        <MessageCircle size={16} className="mr-2 text-green-600" aria-hidden />
        {sending ? "Abriendo WhatsApp..." : "Avisar que está lista"}
      </Button>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
