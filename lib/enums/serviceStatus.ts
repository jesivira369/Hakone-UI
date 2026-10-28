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

/** Qué significa cada estado, para tooltips y ayudas en pantalla. */
export const ServiceStatusDescriptions: Record<ServiceStatus, string> = {
  [ServiceStatus.IN_REVIEW]: "La bici llegó al taller y se está revisando; todavía no hay precio.",
  [ServiceStatus.QUOTED]: "Ya hay un presupuesto para el cliente.",
  [ServiceStatus.SCHEDULED]: "Trabajo aceptado y con fecha de inicio y de entrega.",
  [ServiceStatus.IN_PROGRESS]: "Se está trabajando en la bici.",
  [ServiceStatus.COMPLETED]: "Trabajo terminado y cliente avisado; falta cobrarlo.",
  [ServiceStatus.PAID]: "Trabajo terminado y cobrado. Cuenta como ingreso.",
  [ServiceStatus.BLOCKED]: "El trabajo está frenado por algún motivo (repuestos, cliente, etc.).",
  [ServiceStatus.CANCELED]: "El servicio se descartó.",
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

// Fuente única de colores por estado. Tonos mate de una misma familia (misma
// saturación y luminosidad aprox.), iguales a los de las gráficas
// (`lib/chartColors.ts`). Las clases van completas (no armadas por partes) para
// que Tailwind las detecte. El rojo queda reservado a "urgente".
export const ServiceStatusStyles: Record<ServiceStatus, ServiceStatusStyle> = {
  [ServiceStatus.IN_REVIEW]: {
    badge: "bg-[#8A7BB8]/20 text-[#4B3F78] dark:text-[#D6CCF0]",
    dot: "bg-[#8A7BB8]",
    chart: "#8A7BB8",
  },
  [ServiceStatus.QUOTED]: {
    badge: "bg-[#D9B45A]/25 text-[#7A5C12] dark:text-[#F3E3B0]",
    dot: "bg-[#D9B45A]",
    chart: "#D9B45A",
  },
  [ServiceStatus.SCHEDULED]: {
    badge: "bg-[#5B9BBF]/20 text-[#2A5F80] dark:text-[#BFDDF0]",
    dot: "bg-[#5B9BBF]",
    chart: "#5B9BBF",
  },
  [ServiceStatus.IN_PROGRESS]: {
    badge: "bg-[#E08A5E]/25 text-[#8A4119] dark:text-[#F7D5C2]",
    dot: "bg-[#E08A5E]",
    chart: "#E08A5E",
  },
  [ServiceStatus.COMPLETED]: {
    badge: "bg-[#6FAF7E]/25 text-[#2F6B3E] dark:text-[#C4E6CB]",
    dot: "bg-[#6FAF7E]",
    chart: "#6FAF7E",
  },
  [ServiceStatus.PAID]: {
    badge: "bg-[#2A9D90]/20 text-[#17625A] dark:text-[#B5E5DF]",
    dot: "bg-[#2A9D90]",
    chart: "#2A9D90",
  },
  [ServiceStatus.BLOCKED]: {
    badge: "bg-[#B9708F]/20 text-[#7A3556] dark:text-[#EED0DD]",
    dot: "bg-[#B9708F]",
    chart: "#B9708F",
  },
  [ServiceStatus.CANCELED]: {
    badge: "bg-[#8B939F]/20 text-[#4B525C] dark:text-[#D5D9DF]",
    dot: "bg-[#8B939F]",
    chart: "#8B939F",
  },
};

export const URGENT_STYLE: ServiceStatusStyle = {
  badge: "bg-[#C2453D] text-white dark:bg-[#C2453D] dark:text-white",
  dot: "bg-[#C2453D]",
  chart: "#C2453D",
};

const FALLBACK_STYLE: ServiceStatusStyle = {
  badge: "bg-muted text-muted-foreground",
  dot: "bg-muted-foreground",
  chart: "#8B939F",
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
