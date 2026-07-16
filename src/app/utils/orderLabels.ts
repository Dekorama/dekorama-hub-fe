export function formatOrderTotal(
  total: number | string | null | undefined,
  lineItems?: { unitPrice: number | string; quantityOrdered: number }[],
): string {
  let value = Number(total);
  if (!Number.isFinite(value) && lineItems?.length) {
    value = lineItems.reduce(
      (sum, item) => sum + Number(item.unitPrice) * Number(item.quantityOrdered),
      0,
    );
  }
  if (!Number.isFinite(value)) return "N/D";
  return `$${value.toFixed(2)}`;
}
