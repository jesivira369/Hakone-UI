export enum ServiceStatus {
  IN_REVIEW = "IN_REVIEW",
  QUOTED = "QUOTED",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  PAID = "PAID",
  BLOCKED = "BLOCKED",
  CANCELED = "CANCELED",
}

export const ServiceStatusLabels: Record<ServiceStatus, string> = {
  [ServiceStatus.IN_REVIEW]: "En revisión",
  [ServiceStatus.QUOTED]: "Presupuestado",
  [ServiceStatus.SCHEDULED]: "Programado",
  [ServiceStatus.IN_PROGRESS]: "En curso",
  [ServiceStatus.COMPLETED]: "Completado",
  [ServiceStatus.PAID]: "Completado y pagado",
  [ServiceStatus.BLOCKED]: "Bloqueado",
  [ServiceStatus.CANCELED]: "Cancelado",
};

/** Estados en los que el trabajo sigue abierto: es donde "urgente" se pinta en rojo. */
export const ACTIVE_SERVICE_STATUSES: ServiceStatus[] = [
  ServiceStatus.IN_REVIEW,
  ServiceStatus.QUOTED,
  ServiceStatus.SCHEDULED,
  ServiceStatus.IN_PROGRESS,
];

export interface ServiceStatusStyle {
  /** Etiqueta/pastilla (listado, detalle, calendario). */
  badge: string;
  /** Punto de color (calendario, leyenda). */
  dot: string;
  /** Color hex para gráficos. */
  chart: string;
}

// Fuente única de colores por estado. Las clases van completas (no armadas por
// partes) para que Tailwind las detecte. Ningún estado usa rojo: el rojo queda
// reservado a "urgente".
export const ServiceStatusStyles: Record<ServiceStatus, ServiceStatusStyle> = {
  [ServiceStatus.IN_REVIEW]: {
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
    dot: "bg-violet-500",
    chart: "#8b5cf6",
  },
  [ServiceStatus.QUOTED]: {
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
    dot: "bg-yellow-400",
    chart: "#facc15",
  },
  [ServiceStatus.SCHEDULED]: {
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    dot: "bg-sky-500",
    chart: "#0ea5e9",
  },
  [ServiceStatus.IN_PROGRESS]: {
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
    dot: "bg-orange-500",
    chart: "#f97316",
  },
  [ServiceStatus.COMPLETED]: {
    badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    dot: "bg-green-500",
    chart: "#22c55e",
  },
  [ServiceStatus.PAID]: {
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
    dot: "bg-teal-600",
    chart: "#0d9488",
  },
  [ServiceStatus.BLOCKED]: {
    badge: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-200",
    dot: "bg-fuchsia-600",
    chart: "#c026d3",
  },
  [ServiceStatus.CANCELED]: {
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    dot: "bg-gray-500",
    chart: "#6b7280",
  },
};

export const URGENT_STYLE: ServiceStatusStyle = {
  badge: "bg-red-600 text-white dark:bg-red-600 dark:text-white",
  dot: "bg-red-600",
  chart: "#dc2626",
};

const FALLBACK_STYLE: ServiceStatusStyle = {
  badge: "bg-muted text-muted-foreground",
  dot: "bg-muted-foreground",
  chart: "#9ca3af",
};

export function getServiceStatusStyle(status: string): ServiceStatusStyle {
  return ServiceStatusStyles[status as ServiceStatus] ?? FALLBACK_STYLE;
}

export function getServiceStatusLabel(status: string): string {
  return ServiceStatusLabels[status as ServiceStatus] ?? status;
}

/** Rojo solo si es urgente Y el trabajo sigue abierto; al cerrarse/cancelarse/bloquearse vuelve a su color. */
export function isUrgentActive(service: { isUrgent?: boolean; status: string }): boolean {
  return Boolean(service.isUrgent) && ACTIVE_SERVICE_STATUSES.includes(service.status as ServiceStatus);
}

/** Estilo con el que se pinta un servicio en calendario y listados. */
export function getServiceDisplayStyle(service: { isUrgent?: boolean; status: string }): ServiceStatusStyle {
  return isUrgentActive(service) ? URGENT_STYLE : getServiceStatusStyle(service.status);
}

const STATUSES_REQUIRING_PRICE: string[] = [
  ServiceStatus.QUOTED,
  ServiceStatus.SCHEDULED,
  ServiceStatus.IN_PROGRESS,
  ServiceStatus.COMPLETED,
  ServiceStatus.PAID,
];
const STATUSES_REQUIRING_DATES: string[] = [
  ServiceStatus.SCHEDULED,
  ServiceStatus.IN_PROGRESS,
  ServiceStatus.COMPLETED,
  ServiceStatus.PAID,
];

/**
 * Reglas relajadas según el estado (misma regla que `statusRuleErrors` de la API):
 * en revisión todavía no se conoce el precio ni las fechas.
 */
export function serviceStatusRuleErrors(
  status: string,
  data: { price?: number | null; scheduledAt?: string | null; deliveryAt?: string | null },
): { price?: string; scheduledAt?: string; deliveryAt?: string } {
  const errors: { price?: string; scheduledAt?: string; deliveryAt?: string } = {};
  if (STATUSES_REQUIRING_PRICE.includes(status) && !((data.price ?? 0) > 0)) {
    errors.price = "La mano de obra debe ser mayor a 0 para este estado";
  }
  if (STATUSES_REQUIRING_DATES.includes(status)) {
    if (!data.scheduledAt) errors.scheduledAt = "La fecha programada es obligatoria para este estado";
    if (!data.deliveryAt) errors.deliveryAt = "La fecha de entrega es obligatoria para este estado";
  }
  return errors;
}
