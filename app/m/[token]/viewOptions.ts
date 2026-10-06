export type JobSort = "urgent" | "scheduled" | "delivery" | "status" | "newest";
/** `ALL` = sin filtro por estado. */
export type StatusFilter = "ALL" | "IN_REVIEW" | "QUOTED" | "SCHEDULED" | "IN_PROGRESS" | "BLOCKED";

export interface JobView {
  sort: JobSort;
  status: StatusFilter;
}

export const DEFAULT_VIEW: JobView = { sort: "urgent", status: "ALL" };

export const SORT_OPTIONS: { value: JobSort; label: string }[] = [
  { value: "urgent", label: "Urgentes primero" },
  { value: "scheduled", label: "Fecha programada" },
  { value: "delivery", label: "Fecha de entrega" },
  { value: "status", label: "Estado" },
  { value: "newest", label: "Más recientes" },
];

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Todos los estados" },
  { value: "IN_REVIEW", label: "En revisión" },
  { value: "QUOTED", label: "Presupuestado" },
  { value: "SCHEDULED", label: "Programado" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "BLOCKED", label: "Bloqueado" },
];

const storageKey = (token: string) => `hakone:mechanic-view:${token}`;
const isSort = (v: unknown): v is JobSort => SORT_OPTIONS.some((o) => o.value === v);
const isStatus = (v: unknown): v is StatusFilter => STATUS_FILTER_OPTIONS.some((o) => o.value === v);

/** Orden y filtro guardados en este dispositivo; si no hay (o el navegador no deja leer), los valores por defecto. */
export function loadView(token: string): JobView {
  try {
    const raw = window.localStorage.getItem(storageKey(token));
    const parsed = raw ? (JSON.parse(raw) as Partial<JobView>) : {};
    return {
      sort: isSort(parsed.sort) ? parsed.sort : DEFAULT_VIEW.sort,
      status: isStatus(parsed.status) ? parsed.status : DEFAULT_VIEW.status,
    };
  } catch {
    return DEFAULT_VIEW;
  }
}

export function saveView(token: string, view: JobView): void {
  try {
    window.localStorage.setItem(storageKey(token), JSON.stringify(view));
  } catch {
    // Modo privado o almacenamiento bloqueado: la vista simplemente no se recuerda.
  }
}
