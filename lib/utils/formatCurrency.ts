export function formatCurrency(value: string) {
  const numericValue = value.replace(/[^0-9.]/g, "");

  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(numericValue) || 0);

  return formattedValue.replace("$", "");
}
