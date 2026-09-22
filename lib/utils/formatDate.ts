export function formatDate(dateString: string): string {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Fecha inválida";

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" del día local (lo que espera <input type="date">). */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Del valor guardado (ISO) al día local para el input; vacío si no hay fecha. */
export function isoToDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : toDateInputValue(d);
}

/**
 * De "YYYY-MM-DD" a ISO fijado a las 12:00 hora local: al no caer cerca de la
 * medianoche, ningún corrimiento de zona horaria cambia el día al guardar/leer.
 */
export function dateInputToIso(value: string): string | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}
