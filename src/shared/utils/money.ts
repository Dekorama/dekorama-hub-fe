/** Format amount with ISO currency code (EUR, USD, …). */
export function formatCurrency(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return "N/D";
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
