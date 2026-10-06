import type { JobItem, JobsPage, Section } from "./types";
import type { JobView } from "./viewOptions";

export const PAGE_SIZE = 20;

/** Error con el mensaje que la API devuelve para mostrar al mecánico. */
export class JobsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const base = (token: string) => `/api/v1/public/mechanic/${encodeURIComponent(token)}/services`;

async function errorFrom(res: Response, fallback: string): Promise<JobsApiError> {
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return new JobsApiError(body.message ?? fallback, res.status);
}

async function requestJobs(token: string, section: Section, page: number, view: JobView): Promise<JobsPage> {
  const query = new URLSearchParams({ section, page: String(page), limit: String(PAGE_SIZE), sort: view.sort });
  if (view.status !== "ALL") query.set("status", view.status);
  const res = await fetch(`${base(token)}?${query}`, { cache: "no-store" });
  if (!res.ok) throw await errorFrom(res, "No se pudieron cargar los trabajos");
  return (await res.json()) as JobsPage;
}

// Peticiones idénticas en curso: al abrir la página React monta el componente dos veces seguidas y cada montaje
// pide la misma lista; se comparte una sola petición en vez de duplicar la carga en la API.
const inFlight = new Map<string, Promise<JobsPage>>();

export function fetchJobs(token: string, section: Section, page: number, view: JobView): Promise<JobsPage> {
  const key = `${token}:${section}:${page}:${view.sort}:${view.status}`;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = requestJobs(token, section, page, view).finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}

export async function updateJobStatus(token: string, id: number, status: string): Promise<JobItem> {
  const res = await fetch(`${base(token)}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw await errorFrom(res, "No se pudo cambiar el estado");
  return (await res.json()) as JobItem;
}
