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

/** Normalize product unit for line snapshots (m² → m2). */
export function normalizeUnit(unit?: string | null): string {
  if (!unit?.trim()) return "unidad";
  const trimmed = unit.trim();
  const normalized = trimmed
    .toLowerCase()
    .replace("²", "2")
    .replace(/\s+/g, "");
  if (normalized === "m2") return "m2";
  return trimmed;
}

export function isM2Unit(unit?: string | null): boolean {
  return normalizeUnit(unit) === "m2";
}

/** UI label for unit column. */
export function displayUnitLabel(unit?: string | null): string {
  const u = normalizeUnit(unit);
  if (u === "m2") return "m²";
  if (u.toLowerCase() === "unidad" || u.toLowerCase() === "ud") return "unidad";
  return u;
}

/** m² per box from product packaging; null if incomplete. */
export function m2PerBox(
  piecesPerBox?: number | null,
  unitPerPiece?: number | null,
): number | null {
  const pieces = Number(piecesPerBox);
  const perPiece = Number(unitPerPiece);
  if (
    !Number.isFinite(pieces) ||
    !Number.isFinite(perPiece) ||
    pieces <= 0 ||
    perPiece <= 0
  ) {
    return null;
  }
  return pieces * perPiece;
}

/** Box count for a given m² quantity (ceil). */
export function boxesForM2(quantityM2: number, m2PerBoxValue: number): number {
  if (m2PerBoxValue <= 0) return 0;
  return Math.ceil(Number(quantityM2) / m2PerBoxValue);
}

/** Round m² up to exact full-box coverage. */
export function roundM2ToFullBoxes(
  quantityM2: number,
  piecesPerBox?: number | null,
  unitPerPiece?: number | null,
): number {
  const perBox = m2PerBox(piecesPerBox, unitPerPiece);
  if (perBox === null || perBox <= 0) return Number(quantityM2) || 0;
  const boxes = boxesForM2(quantityM2, perBox);
  return Number((boxes * perBox).toFixed(4));
}

export type ProductPackaging = {
  piecesPerBox: number | null;
  unitPerPiece: number | null;
};

/** Parse packaging fields from a raw product API payload. */
export function parsePackaging(raw: {
  piecesPerBox?: number | string | null;
  unitPerPiece?: number | string | null;
}): ProductPackaging {
  const pieces =
    raw.piecesPerBox === null || raw.piecesPerBox === undefined
      ? null
      : Number(raw.piecesPerBox);
  const perPiece =
    raw.unitPerPiece === null || raw.unitPerPiece === undefined
      ? null
      : Number(raw.unitPerPiece);
  return {
    piecesPerBox:
      pieces !== null && Number.isFinite(pieces) && pieces > 0 ? pieces : null,
    unitPerPiece:
      perPiece !== null && Number.isFinite(perPiece) && perPiece > 0
        ? perPiece
        : null,
  };
}
