import api from "@/lib/axiosInstance";
import type { Service } from "@/lib/types";
import {
  buildWaMeLink,
  buildWhatsAppReadyMessage,
  buildWhatsAppReceiptMessage,
  trackingUrl,
} from "@/lib/whatsapp";

export type WhatsAppMessageKind = "receipt" | "ready";

/** El Cliente Ocasional no tiene comprobante ni seguimiento (no suele dejar la bici). */
export function canShareService(service: Pick<Service, "client" | "status">): boolean {
  return Boolean(service.client && !service.client.isGeneric && service.status !== "CANCELED");
}

/** Pide (o crea) el código público del servicio. Con `regenerate` invalida el enlace anterior. */
export async function fetchPublicCode(serviceId: number, regenerate = false): Promise<{ number: number; publicCode: string }> {
  const { data } = await api.post(`/services/${serviceId}/share${regenerate ? "?regenerate=true" : ""}`);
  return data;
}

export async function disablePublicLink(serviceId: number): Promise<void> {
  await api.delete(`/services/${serviceId}/share`);
}

function bikeLabel(service: Service): string {
  return service.bicycle ? `${service.bicycle.brand} ${service.bicycle.model}` : "";
}

/**
 * Abre WhatsApp con el mensaje listo (un toque; sin API de WhatsApp Business).
 * La ventana se abre ANTES del `await` y se redirige después: los navegadores móviles bloquean
 * `window.open` si se llama tras una espera.
 */
export async function sendWhatsApp(kind: WhatsAppMessageKind, service: Service, shopName: string): Promise<void> {
  if (!canShareService(service) || !service.client) {
    throw new Error("Este servicio no tiene enlace de seguimiento");
  }

  const popup = window.open("", "_blank");
  try {
    const { number, publicCode } = await fetchPublicCode(service.id);
    const url = trackingUrl(window.location.origin, publicCode);
    const common = { clientName: service.client.name, bikeLabel: bikeLabel(service), shopName, number, url };
    const message =
      kind === "receipt"
        ? buildWhatsAppReceiptMessage({ ...common, description: service.description, deliveryAt: service.deliveryAt })
        : buildWhatsAppReadyMessage(common);
    const link = buildWaMeLink({ phoneE164: service.client.phone, message });
    if (popup) {
      popup.opener = null;
      popup.location.href = link;
    } else {
      window.location.href = link;
    }
  } catch (err) {
    popup?.close();
    throw err;
  }
}

export async function copyTrackingLink(serviceId: number): Promise<void> {
  const { publicCode } = await fetchPublicCode(serviceId);
  await navigator.clipboard.writeText(trackingUrl(window.location.origin, publicCode));
}
