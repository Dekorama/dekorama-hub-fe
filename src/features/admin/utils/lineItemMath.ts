/** Net line total after per-item discount %. */
export function lineNetTotal(
  quantity: number,
  unitPrice: number,
  discountPct = 0,
): number {
  const discount = Math.min(100, Math.max(0, Number(discountPct) || 0));
  return Number(quantity) * Number(unitPrice) * (1 - discount / 100);
}

export function formatQty(value: number): string {
  const n = Number(value);
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(4).replace(/\.?0+$/, "");
}
