"use client";

import {
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Clear, GridView, ViewList } from "@mui/icons-material";
import { PageToolbar } from "@/shared/ui";
import type {
  CatalogFamily,
  CatalogSupplier,
  CatalogViewMode,
} from "../types";

type CatalogFiltersProps = {
  search: string;
  family: string;
  supplierId: string;
  viewMode: CatalogViewMode;
  families: CatalogFamily[];
  suppliers: CatalogSupplier[];
  onSearchChange: (value: string) => void;
  onFamilyChange: (value: string) => void;
  onSupplierChange: (value: string) => void;
  onViewModeChange: (mode: CatalogViewMode) => void;
  onClear: () => void;
  onSearchSubmit: () => void;
};

export function CatalogFilters({
  search,
  family,
  supplierId,
  viewMode,
  families,
  suppliers,
  onSearchChange,
  onFamilyChange,
  onSupplierChange,
  onViewModeChange,
  onClear,
  onSearchSubmit,
}: CatalogFiltersProps) {
  const filteredSuppliers = family
    ? suppliers.filter((s) => s.familyCodes.includes(family))
    : suppliers;

  const hasFilters = Boolean(search.trim() || family || supplierId);

  return (
    <Stack spacing={1.5}>
      <PageToolbar>
        <TextField
          size="small"
          label="Buscar"
          placeholder="Nombre o SKU"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearchSubmit();
          }}
          sx={{ flex: { sm: 1 }, minWidth: { sm: 200 } }}
        />
        <FormControl size="small" sx={{ minWidth: { sm: 160 } }}>
          <InputLabel id="catalog-family-label">Familia</InputLabel>
          <Select
            labelId="catalog-family-label"
            label="Familia"
            value={family}
            onChange={(e) => onFamilyChange(e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            {families.map((f) => (
              <MenuItem key={f.code} value={f.code}>
                {f.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { sm: 180 } }}>
          <InputLabel id="catalog-supplier-label">Proveedor</InputLabel>
          <Select
            labelId="catalog-supplier-label"
            label="Proveedor"
            value={supplierId}
            onChange={(e) => onSupplierChange(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {filteredSuppliers.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={onSearchSubmit}>
          Buscar
        </Button>
        {hasFilters && (
          <Button variant="outlined" startIcon={<Clear />} onClick={onClear}>
            Limpiar
          </Button>
        )}
        <ToggleButtonGroup
          exclusive
          size="small"
          value={viewMode}
          onChange={(_, value: CatalogViewMode | null) => {
            if (value) onViewModeChange(value);
          }}
          sx={{ ml: { sm: "auto" } }}
        >
          <ToggleButton value="grid" aria-label="Vista cuadrícula">
            <GridView fontSize="small" />
          </ToggleButton>
          <ToggleButton value="list" aria-label="Vista lista">
            <ViewList fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </PageToolbar>

      {hasFilters && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {search.trim() && (
            <Chip
              size="small"
              label={`Buscar: ${search.trim()}`}
              onDelete={() => onSearchChange("")}
            />
          )}
          {family && (
            <Chip
              size="small"
              label={families.find((f) => f.code === family)?.name ?? family}
              onDelete={() => onFamilyChange("")}
            />
          )}
          {supplierId && (
            <Chip
              size="small"
              label={
                suppliers.find((s) => s.id === supplierId)?.name ?? "Proveedor"
              }
              onDelete={() => onSupplierChange("")}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
}
