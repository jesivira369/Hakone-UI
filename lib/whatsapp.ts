import { parsePhoneNumberFromString } from "libphonenumber-js";

export function buildWhatsAppReadyMessage(opts: { clientName: string; bikeLabel: string; shopName: string }) {
  const name = (opts.clientName || "").trim() || "Hola";
  const bike = (opts.bikeLabel || "").trim() || "tu bici";
  const shop = (opts.shopName || "").trim() || "el taller";
  return `Hola ${name}! Te avisamos desde ${shop} que tu ${bike} está lista para retirar.`;
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

