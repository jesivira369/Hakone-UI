/**
 * Precio único del plan de Hakone. Un solo plan, sin tiers: todo está siempre
 * disponible y las funciones nuevas quedan incluidas. Es un valor constante, no
 * depende del país ni de la zona horaria del visitante.
 */
export const PLAN_PRICE_ARS = 45000;

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Precio formateado para mostrar, por ejemplo "$ 45.000". */
export const PLAN_PRICE_FORMATTED = priceFormatter.format(PLAN_PRICE_ARS);
