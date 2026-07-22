"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddShoppingCart,
  ArrowBack,
  Inventory2,
} from "@mui/icons-material";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useAppSnackbar } from "@/shared/hooks/useAppSnackbar";
import { notifyCartUpdated } from "@/shared/utils/cartEvents";
import { addProductToCart, fetchProductBySku } from "../api/catalogApi";
import type { CatalogProduct } from "../types";

export function ProductDetailPage() {
  const { sku } = useParams<{ sku: string }>();
  const { user, loading: authLoading } = useCurrentUser();
  const { showSuccess, showError, SnackbarHost } = useAppSnackbar();

  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user || !sku) return;
    setLoading(true);
    setError("");
    void fetchProductBySku(decodeURIComponent(sku))
      .then(setProduct)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Producto no encontrado");
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [user, sku]);

  const handleAdd = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addProductToCart(product.sku, qty);
      notifyCartUpdated();
      showSuccess(`${product.name} añadido al carrito`);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al añadir");
    } finally {
      setAdding(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) return null;

  if (error || !product) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Producto no encontrado"}
        </Alert>
        <Button component={Link} href="/catalogo" startIcon={<ArrowBack />}>
          Volver al catálogo
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 8 }}>
      <Button
        component={Link}
        href="/catalogo"
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
      >
        Catálogo
      </Button>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems="stretch"
      >
        <Box
          sx={{
            width: { xs: "100%", md: 360 },
            height: { xs: 240, md: 360 },
            flexShrink: 0,
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "grey.100",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.disabled",
            border: "1px solid",
            borderColor: "divider",
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
            <Inventory2 sx={{ fontSize: 64 }} />
          )}
        </Box>

        <Stack spacing={2} sx={{ flex: 1 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SKU: {product.sku}
            </Typography>
          </Box>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip label={product.familyName} />
            <Chip label={product.subfamilyName} variant="outlined" />
            <Chip label={`Unidad: ${product.unit}`} variant="outlined" />
          </Stack>

          {product.description && (
            <Typography variant="body1" color="text.secondary">
              {product.description}
            </Typography>
          )}

          {(product.piecesPerBox || product.unitPerPiece) && (
            <Typography variant="body2" color="text.secondary">
              {product.piecesPerBox != null &&
                `Piezas/caja: ${product.piecesPerBox}`}
              {product.piecesPerBox != null &&
                product.unitPerPiece != null &&
                " · "}
              {product.unitPerPiece != null &&
                `Cobertura/pieza: ${product.unitPerPiece}`}
            </Typography>
          )}

          <Alert severity="info">
            Sin precio público. Añade al carrito y solicita proforma; Dekorama
            enviará los precios.
          </Alert>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <TextField
              type="number"
              label="Cantidad"
              size="small"
              value={qty}
              onChange={(e) =>
                setQty(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              inputProps={{ min: 1 }}
              sx={{ width: { xs: "100%", sm: 120 } }}
            />
            <Button
              variant="contained"
              size="large"
              startIcon={<AddShoppingCart />}
              onClick={() => void handleAdd()}
              disabled={adding}
            >
              {adding ? "Añadiendo..." : "Añadir al carrito"}
            </Button>
          </Stack>
        </Stack>
      </Stack>
      <SnackbarHost />
    </Container>
  );
}
