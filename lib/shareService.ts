import api from "@/lib/axiosInstance";
import type { Service } from "@/lib/types";
import {
  buildWaMeLink,
  buildWhatsAppReadyMessage,
  buildWhatsAppReceiptMessage,
  buildWhatsAppReminderMessage,
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
 * Link de WhatsApp con el aviso "lista para retirar". Lo usan el dashboard y el enlace del mecánico, para que el
 * mensaje sea exactamente el mismo en los dos. Lanza si el teléfono no es válido.
 */
export function buildReadyWhatsAppLink(opts: {
  phoneE164: string;
  clientName: string;
  bikeLabel: string;
  shopName: string;
  number: number;
  publicCode: string;
}): string {
  const { phoneE164, publicCode, ...rest } = opts;
  const url = trackingUrl(window.location.origin, publicCode);
  return buildWaMeLink({ phoneE164, message: buildWhatsAppReadyMessage({ ...rest, url }) });
}

/**
 * Lleva a WhatsApp la ventana que se abrió ANTES del `await` (o la actual si el navegador la bloqueó).
 * Los navegadores móviles bloquean `window.open` si se llama tras una espera.
 */
export function redirectToWhatsApp(popup: Window | null, link: string): void {
  if (popup) {
    popup.opener = null;
    popup.location.href = link;
  } else {
    window.location.href = link;
  }
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
    const common = { clientName: service.client.name, bikeLabel: bikeLabel(service), shopName, number };
    const link =
      kind === "receipt"
        ? buildWaMeLink({
            phoneE164: service.client.phone,
            message: buildWhatsAppReceiptMessage({
              ...common,
              url: trackingUrl(window.location.origin, publicCode),
              description: service.description,
              deliveryAt: service.deliveryAt,
            }),
          })
        : buildReadyWhatsAppLink({ ...common, phoneE164: service.client.phone, publicCode });
    redirectToWhatsApp(popup, link);
  } catch (err) {
    popup?.close();
    throw err;
  }
}

/**
 * Abre WhatsApp con el recordatorio ya redactado. No hay `await`: todo el mensaje sale de datos que
 * ya están en pantalla, así `window.open` se ejecuta dentro del mismo gesto del usuario.
 * Lanza si el teléfono no es válido (lo muestra el llamador).
 */
export function openReminderWhatsApp(opts: {
  clientName: string;
  phone: string;
  bikeLabel: string;
  serviceDescription: string;
  shopName: string;
}): void {
  const message = buildWhatsAppReminderMessage(opts);
  const link = buildWaMeLink({ phoneE164: opts.phone, message });
  window.open(link, "_blank", "noopener,noreferrer");
}

export async function copyTrackingLink(serviceId: number): Promise<void> {
  const { publicCode } = await fetchPublicCode(serviceId);
  await navigator.clipboard.writeText(trackingUrl(window.location.origin, publicCode));
}
