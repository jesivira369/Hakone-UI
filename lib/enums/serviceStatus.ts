export enum ServiceStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
}

export const ServiceStatusLabels: Record<ServiceStatus, string> = {
  [ServiceStatus.IN_PROGRESS]: "En progreso",
  [ServiceStatus.COMPLETED]: "Completado",
  [ServiceStatus.CANCELED]: "Cancelado",
};
