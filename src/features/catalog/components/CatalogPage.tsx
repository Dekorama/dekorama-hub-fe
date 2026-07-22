"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { Storefront } from "@mui/icons-material";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useAppSnackbar } from "@/shared/hooks/useAppSnackbar";
import { notifyCartUpdated } from "@/shared/utils/cartEvents";
import {
  addProductToCart,
  fetchCatalogFilters,
  fetchCatalogProducts,
} from "../api/catalogApi";
import type {
  CatalogFamily,
  CatalogProduct,
  CatalogSupplier,
  CatalogViewMode,
} from "../types";
import { CatalogFilters } from "./CatalogFilters";
import { ProductCard } from "./ProductCard";
import { ProductListRow } from "./ProductListRow";

const PAGE_SIZE = 24;
const VIEW_STORAGE_KEY = "dekorama.catalog.viewMode";

export function CatalogPage() {
  const { user, loading: authLoading } = useCurrentUser();
  const { showSuccess, showError, SnackbarHost } = useAppSnackbar();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<CatalogViewMode>("grid");

  const [families, setFamilies] = useState<CatalogFamily[]>([]);
  const [suppliers, setSuppliers] = useState<CatalogSupplier[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingSku, setAddingSku] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "grid" || stored === "list") setViewMode(stored);
    } catch {
      // ignore
    }
  }, []);

  const handleViewModeChange = (mode: CatalogViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!user) return;
    void fetchCatalogFilters()
      .then((data) => {
        setFamilies(data.families);
        setSuppliers(data.suppliers);
      })
      .catch(() => {
        // filters optional
      });
  }, [user]);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchCatalogProducts({
        search,
        family: family || undefined,
        supplierId: supplierId || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setProducts(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar catálogo");
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, search, family, supplierId, page]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleFamilyChange = (value: string) => {
    setFamily(value);
    setSupplierId("");
    setPage(1);
  };

  const handleSupplierChange = (value: string) => {
    setSupplierId(value);
    setPage(1);
  };

  const handleClear = () => {
    setSearchInput("");
    setSearch("");
    setFamily("");
    setSupplierId("");
    setPage(1);
  };

  const handleSearchSubmit = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleAdd = async (product: CatalogProduct) => {
    setAddingSku(product.sku);
    try {
      await addProductToCart(product.sku, 1);
      notifyCartUpdated();
      showSuccess(`${product.name} añadido al carrito`);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al añadir");
    } finally {
      setAddingSku(null);
    }
  };

  if (authLoading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) return null;

  if (user.role !== "client" && user.role !== "professional") {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">
          El catálogo está disponible para clientes y profesionales.
        </Alert>
      </Container>
    );
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 8 }}>
      <Stack spacing={3}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Storefront color="primary" />
            <Typography variant="h5" fontWeight={700}>
              Catálogo
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Explora materiales y añádelos al carrito para solicitar una proforma.
            Los precios los prepara Dekorama.
          </Typography>
        </Box>

        <CatalogFilters
          search={searchInput}
          family={family}
          supplierId={supplierId}
          viewMode={viewMode}
          families={families}
          suppliers={suppliers}
          onSearchChange={(value) => {
            setSearchInput(value);
            if (!value.trim()) {
              setSearch("");
              setPage(1);
            }
          }}
          onFamilyChange={handleFamilyChange}
          onSupplierChange={handleSupplierChange}
          onViewModeChange={handleViewModeChange}
          onClear={handleClear}
          onSearchSubmit={handleSearchSubmit}
        />

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Alert severity="info">
            No hay productos con estos filtros. Prueba otra búsqueda o limpia los
            filtros.
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              {total} producto{total === 1 ? "" : "s"}
            </Typography>

            {viewMode === "grid" ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={handleAdd}
                    adding={addingSku === product.sku}
                  />
                ))}
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {products.map((product) => (
                  <ProductListRow
                    key={product.id}
                    product={product}
                    onAdd={handleAdd}
                    adding={addingSku === product.sku}
                  />
                ))}
              </Stack>
            )}

            {pageCount > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
                <Pagination
                  count={pageCount}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Stack>
      <SnackbarHost />
    </Container>
  );
}
