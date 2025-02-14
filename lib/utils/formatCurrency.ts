export function formatCurrency(value: number | string): string {
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.]/g, ""))
      : value;

  if (isNaN(numericValue)) return "0.00";

  return numericValue.toFixed(2);
}
