export type Section = "todo" | "ready";

export interface JobItem {
  id: number;
  number: number;
  description: string;
  status: string;
  isUrgent: boolean;
  deliveryAt: string | null;
  scheduledAt: string | null;
  clientName: string;
  bike: string | null;
  /** Repuestos del trabajo: nombre y cantidad (nunca el precio). */
  parts: { name: string; quantity: number }[];
}

/** Respuesta de `GET /public/mechanic/:token/services` (una página de una sección). */
export interface JobsPage {
  mechanicName: string;
  shopName: string;
  section: Section;
  page: number;
  limit: number;
  totalPages: number;
  /** Trabajos de esta sección que cumplen el filtro (los `counts` son los totales sin filtrar). */
  matching: number;
  counts: Record<Section, number>;
  services: JobItem[];
}

/** Repuesto en el detalle. `unitPrice` falta mientras el servicio está "En revisión" (montos ocultos). */
export interface JobPart {
  id: number;
  name: string;
  quantity: number;
  unitPrice?: number;
  addedBy: "OWNER" | "MECHANIC";
  /** Solo el precio de los repuestos libres que cargó este mecánico es editable. */
  editablePrice: boolean;
}

/** Montos en solo lectura. `null` en "En revisión". Nunca costo ni ganancia. */
export interface JobCost {
  labor: number;
  parts: number;
  total: number;
}

/** Respuesta de `GET /public/mechanic/:token/services/:id` (y de cada edición). */
export interface JobDetail {
  id: number;
  number: number;
  description: string;
  notes: string | null;
  status: string;
  isUrgent: boolean;
  deliveryAt: string | null;
  scheduledAt: string | null;
  /** Se reenvía como `expectedUpdatedAt`: si el servicio cambió mientras se editaba, la API responde 409. */
  updatedAt: string;
  clientName: string;
  bike: string | null;
  /** `false` en servicios cobrados o cancelados. */
  editable: boolean;
  /** `false` para el cliente ocasional y los cancelados (no tienen seguimiento). */
  canNotifyClient: boolean;
  cost: JobCost | null;
  parts: JobPart[];
}
