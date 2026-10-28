/**
 * Moneda por defecto. La API todavía no guarda una moneda por taller, así que
 * hasta que lo haga todos los montos se muestran en ARS.
 */
export const DEFAULT_CURRENCY = "ARS";

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  let formatter = formatters.get(currency);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    } catch {
      // Código de moneda inválido: se cae a la moneda por defecto en vez de romper la pantalla.
      return getFormatter(DEFAULT_CURRENCY);
    }
    formatters.set(currency, formatter);
  }
  return formatter;
}

/**
 * Formatea un monto para mostrarlo: miles con separador, sin decimales cuando
 * no hacen falta (`$ 45.000`, `$ 1.234,5`). Un valor que no sea un número se
 * muestra como cero.
 */
export function formatCurrency(value: number | string | null | undefined, currency: string = DEFAULT_CURRENCY): string {
  const numericValue =
    typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : Number(value ?? 0);

  return getFormatter(currency).format(Number.isFinite(numericValue) ? numericValue : 0);
}
