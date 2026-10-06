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
  counts: Record<Section, number>;
  services: JobItem[];
}
