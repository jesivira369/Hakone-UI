import { parsePhoneNumberFromString } from "libphonenumber-js";

/** Folio con ceros a la izquierda: #0123. */
export function formatFolio(number: number): string {
  return `#${String(number).padStart(4, "0")}`;
}

/** URL pública de seguimiento. Se arma con el origen actual para que sirva en cualquier dominio/entorno. */
export function trackingUrl(origin: string, publicCode: string): string {
  return `${origin.replace(/\/$/, "")}/s/${publicCode}`;
}

/** URL del enlace personal del mecánico. */
export function mechanicLinkUrl(origin: string, accessToken: string): string {
  return `${origin.replace(/\/$/, "")}/m/${accessToken}`;
}

export function buildWhatsAppReadyMessage(opts: {
  clientName: string;
  bikeLabel: string;
  shopName: string;
  /** Si se pasan, el aviso incluye el folio y el enlace de seguimiento. */
  number?: number;
  url?: string;
}) {
  const name = (opts.clientName || "").trim() || "Hola";
  const bike = (opts.bikeLabel || "").trim() || "tu bici";
  const shop = (opts.shopName || "").trim() || "el taller";
  const folio = opts.number ? ` Orden ${formatFolio(opts.number)}.` : "";
  const link = opts.url ? ` Detalle: ${opts.url}` : "";
  return `Hola ${name}! Te avisamos desde ${shop} que tu ${bike} está lista para retirar.${folio}${link}`;
}

/** Comprobante de ingreso: reemplaza el talón de papel del cliente. */
export function buildWhatsAppReceiptMessage(opts: {
  clientName: string;
  bikeLabel: string;
  shopName: string;
  number: number;
  description: string;
  deliveryAt?: string | null;
  url: string;
}) {
  const name = (opts.clientName || "").trim() || "Hola";
  const bike = (opts.bikeLabel || "").trim() || "tu bici";
  const shop = (opts.shopName || "").trim() || "el taller";
  const desc = (opts.description || "").trim();
  const when = opts.deliveryAt
    ? ` Entrega estimada: ${new Date(opts.deliveryAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}.`
    : "";
  return `Hola ${name}! Recibimos tu ${bike} en ${shop}. Orden ${formatFolio(opts.number)}${desc ? `: ${desc}` : ""}.${when} Sigue el estado aquí: ${opts.url}`;
}

/** Mensaje con el enlace personal de tareas del mecánico. */
export function buildWhatsAppMechanicLinkMessage(opts: { mechanicName: string; shopName: string; url: string }) {
  const name = (opts.mechanicName || "").trim() || "Hola";
  const shop = (opts.shopName || "").trim() || "el taller";
  return `Hola ${name}! Este es tu enlace para ver y actualizar tus trabajos en ${shop}: ${opts.url} Guárdalo como acceso directo en tu celular y no lo compartas.`;
}

export function buildWaMeLink(opts: {
  phoneE164: string;
  message: string;
}): string {
  const parsed = parsePhoneNumberFromString(opts.phoneE164);
  if (!parsed?.isValid()) {
    throw new Error("Teléfono inválido para WhatsApp (usa formato internacional, ej: +5491123456789)");
  }
  const digits = parsed.number.replace("+", "");
  const text = encodeURIComponent(opts.message);
  return `https://wa.me/${digits}?text=${text}`;
}
