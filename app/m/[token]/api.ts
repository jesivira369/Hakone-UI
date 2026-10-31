import type { JobDetail, JobItem, JobsPage, Section } from "./types";
import type { JobView } from "./viewOptions";

export const PAGE_SIZE = 20;

/** Error con el mensaje que la API devuelve para mostrar al mecánico. */
export class JobsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** En un 409 (el servicio cambió mientras se editaba), la API manda el detalle vigente. */
    readonly current?: JobDetail,
  ) {
    super(message);
  }
}

const base = (token: string) => `/api/v1/public/mechanic/${encodeURIComponent(token)}/services`;

async function errorFrom(res: Response, fallback: string): Promise<JobsApiError> {
  const body = (await res.json().catch(() => ({}))) as { message?: string | string[]; current?: JobDetail };
  const message = typeof body.message === "string" ? body.message : fallback;
  return new JobsApiError(message, res.status, body.current);
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

const JSON_HEADERS = { "Content-Type": "application/json" };

async function sendJson(url: string, method: "PATCH" | "POST" | "DELETE", body: unknown, fallback: string) {
  const res = await fetch(url, {
    method,
    headers: JSON_HEADERS,
    cache: "no-store",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw await errorFrom(res, fallback);
  return (await res.json()) as JobDetail;
}

export async function fetchJobDetail(token: string, id: number): Promise<JobDetail> {
  const res = await fetch(`${base(token)}/${id}`, { cache: "no-store" });
  if (!res.ok) throw await errorFrom(res, "No se pudo cargar el trabajo");
  return (await res.json()) as JobDetail;
}

/** Campos editables del servicio. Las fechas viajan como ISO (o `null` para quitarlas). */
export interface JobFieldsPatch {
  description?: string;
  notes?: string | null;
  scheduledAt?: string | null;
  deliveryAt?: string | null;
}

export function saveJobFields(token: string, id: number, patch: JobFieldsPatch, expectedUpdatedAt: string) {
  return sendJson(`${base(token)}/${id}`, "PATCH", { ...patch, expectedUpdatedAt }, "No se pudieron guardar los cambios");
}

export interface PartInput {
  name: string;
  quantity: number;
  unitPrice?: number;
}

export function addJobPart(token: string, id: number, part: PartInput, expectedUpdatedAt: string) {
  return sendJson(`${base(token)}/${id}/parts`, "POST", { ...part, expectedUpdatedAt }, "No se pudo agregar el repuesto");
}

export function editJobPart(
  token: string,
  id: number,
  partId: number,
  patch: Partial<PartInput>,
  expectedUpdatedAt: string,
) {
  return sendJson(
    `${base(token)}/${id}/parts/${partId}`,
    "PATCH",
    { ...patch, expectedUpdatedAt },
    "No se pudo cambiar el repuesto",
  );
}

export function removeJobPart(token: string, id: number, partId: number, expectedUpdatedAt: string) {
  const query = new URLSearchParams({ expectedUpdatedAt });
  return sendJson(`${base(token)}/${id}/parts/${partId}?${query}`, "DELETE", undefined, "No se pudo borrar el repuesto");
}
