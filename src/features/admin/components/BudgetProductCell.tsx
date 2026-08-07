"use client";

import { useEffect, useState } from "react";
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
  disabled?: boolean;
};

const UNIT_OPTIONS = ["unidad", "m2", "caja", "metro", "kg", "litro"] as const;

function isCatalogSku(sku: string, products: BudgetProductOption[]): boolean {
  if (!sku) return false;
  return products.some((p) => p.sku === sku);
}

function labelForCatalog(p: BudgetProductOption): string {
  return `${p.sku} — ${p.name}`;
}

export function BudgetProductCell({
  products,
  productSku,
  productName,
  unit,
  onChange,
  showSkuHint = false,
  disabled = false,
}: BudgetProductCellProps) {
  const catalog = products.find((p) => p.sku === productSku) ?? null;
  const manual = !catalog && Boolean(productName.trim() || productSku.trim());

  const [inputValue, setInputValue] = useState(() =>
    catalog ? labelForCatalog(catalog) : productName,
  );

  useEffect(() => {
    setInputValue(catalog ? labelForCatalog(catalog) : productName);
  }, [catalog, productName, productSku]);

  function commitManualName(raw: string) {
    const name = raw.trim();
    if (!name) {
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
    onChange({
      productSku: productSku.startsWith("MAN-") ? productSku : "",
      productName: name,
      piecesPerBox: null,
      unitPerPiece: null,
    });
  }

  return (
    <Stack spacing={0.75} sx={{ minWidth: 220 }}>
      <Autocomplete
        size="small"
        freeSolo
        disabled={disabled}
        options={products}
        value={catalog}
        inputValue={inputValue}
        clearOnBlur={false}
        blurOnSelect
        onChange={(_, value, reason) => {
          if (reason === "clear") {
            setInputValue("");
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
          // Ignore blur/reset null — keep typed manual text (clearOnBlur=false + local state)
          if (value == null) return;
          if (typeof value === "string") {
            setInputValue(value);
            commitManualName(value);
            return;
          }
          setInputValue(labelForCatalog(value));
          onChange({
            productSku: value.sku,
            productName: value.name,
            unit: normalizeUnit(value.unit),
            suggestedPrice: Number(value.pvpPrice) || 0,
            piecesPerBox: value.piecesPerBox,
            unitPerPiece: value.unitPerPiece,
          });
        }}
        onInputChange={(_, next, reason) => {
          if (reason === "reset") return;
          setInputValue(next);
          if (reason !== "input") return;
          // Keep parent in sync so Guardar works without waiting for blur
          onChange({
            productSku: catalog ? "" : productSku.startsWith("MAN-") ? productSku : "",
            productName: next,
            ...(catalog
              ? { suggestedPrice: 0, piecesPerBox: null, unitPerPiece: null }
              : { piecesPerBox: null, unitPerPiece: null }),
          });
        }}
        onBlur={() => {
          if (catalog) return;
          if (inputValue.trim() !== productName.trim()) {
            commitManualName(inputValue);
          }
        }}
        getOptionLabel={(option) =>
          typeof option === "string" ? option : labelForCatalog(option)
        }
        isOptionEqualToValue={(a, b) => a.sku === b.sku}
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
              disabled
                ? undefined
                : manual
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
          disabled={disabled}
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
