export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  TRANSFER = "TRANSFER",
  ELECTRONIC = "ELECTRONIC",
}

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Efectivo",
  [PaymentMethod.CARD]: "Tarjeta",
  [PaymentMethod.TRANSFER]: "Transferencia",
  [PaymentMethod.ELECTRONIC]: "Pago electrónico",
};

export function getPaymentMethodLabel(method?: string | null): string {
  return method ? (PaymentMethodLabels[method as PaymentMethod] ?? method) : "—";
}
