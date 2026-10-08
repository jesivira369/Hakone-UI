import api from "@/lib/axiosInstance";
import type { Mechanic } from "@/lib/types";
import { buildWaMeLink, buildWhatsAppMechanicLinkMessage, mechanicLinkUrl } from "@/lib/whatsapp";

const IDLE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type LinkTone = "ok" | "warn" | "off";

/** Estado del enlace personal: vence a los 30 días sin uso (misma regla que la API). */
export function linkState(m: Pick<Mechanic, "accessToken" | "accessTokenLastUsedAt">): { label: string; tone: LinkTone } {
  if (!m.accessToken) return { label: "Sin enlace", tone: "off" };
  const last = m.accessTokenLastUsedAt ? new Date(m.accessTokenLastUsedAt).getTime() : 0;
  if (Date.now() >= last + IDLE_DAYS * DAY_MS) return { label: "Vencido", tone: "warn" };
  const days = Math.floor((Date.now() - last) / DAY_MS);
  return {
    label: days <= 0 ? "Activo · usado hoy" : `Activo · usado hace ${days} ${days === 1 ? "día" : "días"}`,
    tone: "ok",
  };
}

/** Token vigente del mecánico, o uno nuevo si no tiene enlace, venció o se pidió regenerar. */
export async function resolveAccessToken(mechanic: Mechanic, regenerate = false): Promise<string> {
  if (!regenerate && mechanic.accessToken && linkState(mechanic).tone === "ok") return mechanic.accessToken;
  const { data } = await api.post<{ accessToken: string }>(`/mechanics/${mechanic.id}/access-link`);
  return data.accessToken;
}

/**
 * Abre WhatsApp con el enlace de tareas listo para enviarle al mecánico. La ventana se abre antes del `await`
 * (los móviles bloquean `window.open` si se llama después de una espera).
 */
export async function sendMechanicLinkWhatsApp(mechanic: Mechanic, shopName: string): Promise<void> {
  if (!mechanic.phone) throw new Error("El mecánico no tiene teléfono");

  const popup = window.open("", "_blank");
  try {
    const token = await resolveAccessToken(mechanic);
    const message = buildWhatsAppMechanicLinkMessage({
      mechanicName: mechanic.name,
      shopName,
      url: mechanicLinkUrl(window.location.origin, token),
    });
    const link = buildWaMeLink({ phoneE164: mechanic.phone, message });
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
