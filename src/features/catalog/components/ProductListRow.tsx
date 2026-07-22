"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { AddShoppingCart, Inventory2 } from "@mui/icons-material";
import type { CatalogProduct } from "../types";

type ProductListRowProps = {
  product: CatalogProduct;
  onAdd: (product: CatalogProduct) => void;
  adding?: boolean;
};

export function ProductListRow({ product, onAdd, adding }: ProductListRowProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ xs: "stretch", sm: "center" }}
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        "&:hover": { borderColor: "primary.light" },
      }}
    >
      <Box
        component={Link}
        href={`/catalogo/${encodeURIComponent(product.sku)}`}
        sx={{
          width: { xs: "100%", sm: 88 },
          height: { xs: 140, sm: 88 },
          flexShrink: 0,
          borderRadius: 1.5,
          overflow: "hidden",
          bgcolor: "grey.100",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.disabled",
          textDecoration: "none",
        }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Inventory2 />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component={Link}
          href={`/catalogo/${encodeURIComponent(product.sku)}`}
          variant="subtitle1"
          fontWeight={700}
          sx={{ textDecoration: "none", color: "text.primary", "&:hover": { color: "primary.main" } }}
        >
          {product.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {product.sku} · {product.unit}
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
          <Chip label={product.familyName} size="small" variant="outlined" />
          <Chip label={product.subfamilyName} size="small" />
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
        <Button
          size="small"
          variant="outlined"
          component={Link}
          href={`/catalogo/${encodeURIComponent(product.sku)}`}
        >
          Ver
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddShoppingCart />}
          onClick={() => onAdd(product)}
          disabled={adding}
        >
          Añadir
        </Button>
      </Stack>
    </Stack>
  );
}
