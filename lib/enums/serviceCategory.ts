export enum ServiceCategory {
  MANTENIMIENTO_INTEGRAL = "MANTENIMIENTO_INTEGRAL",
  ARMADO = "ARMADO",
  TRANSMISION_FRENOS = "TRANSMISION_FRENOS",
  REPARACION_PUNTUAL = "REPARACION_PUNTUAL",
}

export const ServiceCategoryLabels: Record<ServiceCategory, string> = {
  [ServiceCategory.MANTENIMIENTO_INTEGRAL]: "Mantenimiento integral",
  [ServiceCategory.ARMADO]: "Armado",
  [ServiceCategory.TRANSMISION_FRENOS]: "Transmisión y frenos",
  [ServiceCategory.REPARACION_PUNTUAL]: "Reparación puntual",
};

