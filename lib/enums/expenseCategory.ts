export enum ExpenseCategory {
  SERVICIOS_BASICOS = "SERVICIOS_BASICOS",
  MATERIALES_INSUMOS = "MATERIALES_INSUMOS",
  SUELDOS = "SUELDOS",
  OTRO = "OTRO",
}

export const ExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  [ExpenseCategory.SERVICIOS_BASICOS]: "Servicios básicos (luz, alquiler)",
  [ExpenseCategory.MATERIALES_INSUMOS]: "Materiales e insumos",
  [ExpenseCategory.SUELDOS]: "Sueldos",
  [ExpenseCategory.OTRO]: "Otro",
};
