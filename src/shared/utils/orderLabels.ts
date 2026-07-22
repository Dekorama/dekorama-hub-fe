export function formatOrderTotal(
  total: number | string | null | undefined,
  lineItems?: {
    unitPrice: number | string;
    quantityOrdered: number;
    discountPct?: number | string;
    lineTotal?: number | string;
  }[],
): string {
  let value = Number(total);
  if (!Number.isFinite(value) && lineItems?.length) {
    value = lineItems.reduce((sum, item) => {
      if (item.lineTotal != null && Number.isFinite(Number(item.lineTotal))) {
        return sum + Number(item.lineTotal);
      }
      const discount = Number(item.discountPct) || 0;
      return (
        sum +
        Number(item.unitPrice) *
          Number(item.quantityOrdered) *
          (1 - discount / 100)
      );
    }, 0);
  }
  if (!Number.isFinite(value)) return "N/D";
  return `$${value.toFixed(2)}`;
}
