"use client";

import { Autocomplete, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { normalizeUnit } from "@/features/admin/utils/lineItemMath";

export type BudgetProductOption = {
  sku: string;
  name: string;
  pvpPrice: number;
  unit: string;
  piecesPerBox: number | null;
  unitPerPiece: number | null;
};

export type BudgetProductPatch = {
  productSku: string;
  productName: string;
  unit: string;
  suggestedPrice: number;
  piecesPerBox: number | null;
  unitPerPiece: number | null;
};

type BudgetProductCellProps = {
  products: BudgetProductOption[];
  productSku: string;
  productName: string;
  unit: string;
  onChange: (patch: Partial<BudgetProductPatch>) => void;
  showSkuHint?: boolean;
};

const UNIT_OPTIONS = ["unidad", "m2", "caja", "metro", "kg", "litro"] as const;

function isCatalogSku(sku: string, products: BudgetProductOption[]): boolean {
  if (!sku) return false;
  return products.some((p) => p.sku === sku);
}

export function BudgetProductCell({
  products,
  productSku,
  productName,
  unit,
  onChange,
  showSkuHint = false,
}: BudgetProductCellProps) {
  const catalog = products.find((p) => p.sku === productSku) ?? null;
  const manual = !catalog && Boolean(productName.trim() || productSku.trim());
  const autocompleteValue: BudgetProductOption | string | null = catalog
    ? catalog
    : productName
      ? productName
      : null;

  return (
    <Stack spacing={0.75} sx={{ minWidth: 220 }}>
      <Autocomplete
        size="small"
        freeSolo
        options={products}
        value={autocompleteValue}
        onChange={(_, value) => {
          if (value == null || value === "") {
            onChange({
              productSku: "",
              productName: "",
              unit: "unidad",
              suggestedPrice: 0,
              piecesPerBox: null,
              unitPerPiece: null,
            });
            return;
          }
          if (typeof value === "string") {
            const name = value.trim();
            onChange({
              productSku: productSku.startsWith("MAN-") ? productSku : "",
              productName: name,
              piecesPerBox: null,
              unitPerPiece: null,
            });
            return;
          }
          onChange({
            productSku: value.sku,
            productName: value.name,
            unit: normalizeUnit(value.unit),
            suggestedPrice: Number(value.pvpPrice) || 0,
            piecesPerBox: value.piecesPerBox,
            unitPerPiece: value.unitPerPiece,
          });
        }}
        onInputChange={(_, inputValue, reason) => {
          if (reason !== "input") return;
          if (catalog) {
            onChange({
              productSku: "",
              productName: inputValue,
              suggestedPrice: 0,
              piecesPerBox: null,
              unitPerPiece: null,
            });
            return;
          }
          onChange({
            productSku: productSku.startsWith("MAN-") ? productSku : "",
            productName: inputValue,
            piecesPerBox: null,
            unitPerPiece: null,
          });
        }}
        getOptionLabel={(option) =>
          typeof option === "string" ? option : `${option.sku} — ${option.name}`
        }
        isOptionEqualToValue={(a, b) => {
          if (typeof a === "string" || typeof b === "string") return a === b;
          return a.sku === b.sku;
        }}
        filterOptions={(options, state) => {
          const q = state.inputValue.trim().toLowerCase();
          if (!q) return options;
          return options.filter(
            (p) =>
              p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Producto"
            size="small"
            placeholder="Catálogo o nombre manual"
            helperText={
              manual
                ? "Línea manual (sin catálogo)"
                : "Escribe un nombre libre si no está en catálogo"
            }
          />
        )}
      />
      {manual && (
        <TextField
          select
          size="small"
          label="Unidad"
          value={normalizeUnit(unit)}
          onChange={(e) => onChange({ unit: normalizeUnit(e.target.value) })}
        >
          {UNIT_OPTIONS.map((u) => (
            <MenuItem key={u} value={u}>
              {u === "m2" ? "m²" : u}
            </MenuItem>
          ))}
        </TextField>
      )}
      {showSkuHint && productSku && !isCatalogSku(productSku, products) && (
        <Typography variant="caption" color="text.secondary">
          Ref: {productSku}
        </Typography>
      )}
    </Stack>
  );
}
