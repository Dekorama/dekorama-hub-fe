"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { AddShoppingCart, Inventory2 } from "@mui/icons-material";
import type { CatalogProduct } from "../types";

type ProductCardProps = {
  product: CatalogProduct;
  onAdd: (product: CatalogProduct) => void;
  adding?: boolean;
};

export function ProductCard({ product, onAdd, adding }: ProductCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        transition: "border-color 0.15s, box-shadow 0.15s",
        "&:hover": {
          borderColor: "primary.light",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        },
      }}
    >
      <Box
        component={Link}
        href={`/catalogo/${encodeURIComponent(product.sku)}`}
        sx={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        {product.imageUrl ? (
          <CardMedia
            component="img"
            height={180}
            image={product.imageUrl}
            alt={product.name}
            sx={{ objectFit: "cover", bgcolor: "grey.100" }}
          />
        ) : (
          <Box
            sx={{
              height: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "grey.100",
              color: "text.disabled",
            }}
          >
            <Inventory2 sx={{ fontSize: 48 }} />
          </Box>
        )}
        <CardContent sx={{ pb: 1, flexGrow: 1 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.8em",
            }}
          >
            {product.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {product.sku}
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            <Chip label={product.familyName} size="small" variant="outlined" />
            <Chip label={product.subfamilyName} size="small" />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Unidad: {product.unit}
          </Typography>
        </CardContent>
      </Box>
      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
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
          sx={{ ml: "auto !important" }}
        >
          Añadir
        </Button>
      </CardActions>
    </Card>
  );
}
