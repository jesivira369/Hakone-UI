import { parsePhoneNumberFromString } from "libphonenumber-js";

export type OptionalPhone = { ok: true; value: string } | { ok: false };

/**
 * Normaliza un teléfono opcional del formulario. `PhoneInputE164` emite solo el código del país ("+54") mientras no
 * se escribió el número, y eso cuenta como "sin teléfono". Un número escrito debe ser válido para WhatsApp.
 */
export function normalizeOptionalPhone(raw: string | undefined | null): OptionalPhone {
  const value = (raw ?? "").trim();
  if (!value || /^\+\d{1,4}$/.test(value)) return { ok: true, value: "" };

  const parsed = parsePhoneNumberFromString(value);
  return parsed?.isValid() ? { ok: true, value: parsed.number } : { ok: false };
}
