"use client";

import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { API } from "@/features/auth/hooks/useCurrentUser";
import { notifyCartUpdated } from "@/shared/utils/cartEvents";
import {
  CatalogProduct,
  Project,
  ProjectProductItem,
  getProductPrice,
} from "@/features/projects/types";

interface ProjectProductsTabProps {
  project: Project;
  canEdit: boolean;
}

export function ProjectProductsTab({ project, canEdit }: ProjectProductsTabProps) {
  const [items, setItems] = useState<ProjectProductItem[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "warning" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchItems = () => {
    fetch(`${API}/projects/${project.id}/products`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems);
  };

  useEffect(() => { fetchItems(); }, [project.id]);

  const searchProducts = async () => {
    const res = await fetch(`${API}/products?search=${encodeURIComponent(search)}`, { credentials: "include" });
    if (res.ok) setProducts(await res.json());
  };

  const addToCart = async (productSku: string, quantity: number): Promise<boolean> => {
    const res = await fetch(`${API}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productSku, quantity }),
    });
    if (res.ok) {
      notifyCartUpdated();
    }
    return res.ok;
  };

  const addProduct = async () => {
    if (!selected) return;
    setAdding(true);
    try {
      const projectRes = await fetch(`${API}/projects/${project.id}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productSku: selected.sku,
          quantity: +qty,
          notes: notes || undefined,
        }),
      });

      if (!projectRes.ok) {
        const err = await projectRes.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Error al agregar producto al proyecto");
      }

      const cartOk = await addToCart(selected.sku, +qty);
      setSelected(null);
      setQty("1");
      setNotes("");
      fetchItems();

      if (cartOk) {
        setSnackbar({ open: true, message: "Producto agregado al carrito", severity: "success" });
      } else {
        setSnackbar({
          open: true,
          message: "Producto guardado en el proyecto, pero no se pudo agregar al carrito",
          severity: "warning",
        });
      }
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Error al agregar producto",
        severity: "warning",
      });
    } finally {
      setAdding(false);
    }
  };

  const syncToCart = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API}/cart/import-from-project/${project.id}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Error al sincronizar al carrito");
      }
      notifyCartUpdated();
      setSnackbar({ open: true, message: "Productos sincronizados al carrito", severity: "success" });
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Error al sincronizar al carrito",
        severity: "warning",
      });
    } finally {
      setSyncing(false);
    }
  };

  const removeProduct = async (productId: string) => {
    await fetch(`${API}/projects/${project.id}/products/${productId}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchItems();
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Los productos se agregan al carrito para solicitar proforma a Dekorama.
      </Alert>

      {canEdit && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Agregar producto Dekorama</Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1}>
              <TextField label="Buscar producto" value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ flex: 1 }} />
              <Button variant="outlined" onClick={searchProducts}>Buscar</Button>
            </Stack>
            {products.slice(0, 5).map((p) => (
              <Stack
                key={p.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ p: 1, border: selected?.id === p.id ? "2px solid #ff6f00" : "1px solid #e0e0e0", borderRadius: 1, cursor: "pointer" }}
                onClick={() => setSelected(p)}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                  <Typography variant="caption" color="text.secondary">SKU: {p.sku}</Typography>
                </Box>
                <Typography fontWeight={700}>${getProductPrice(p).toFixed(2)}</Typography>
              </Stack>
            ))}
            {selected && (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField label="Cantidad" type="number" value={qty} onChange={(e) => setQty(e.target.value)} size="small" sx={{ width: 100 }} />
                <TextField label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} size="small" sx={{ flex: 1 }} />
                <Button variant="contained" onClick={addProduct} disabled={adding}>
                  {adding ? "Agregando..." : "Agregar"}
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      {!canEdit && <Alert severity="info">Solo editores pueden gestionar productos.</Alert>}

      {items.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            onClick={syncToCart}
            disabled={syncing}
          >
            {syncing ? "Sincronizando..." : "Sincronizar al carrito"}
          </Button>
          <Button
            variant="contained"
            component={Link}
            href={`/carrito?projectId=${project.id}`}
          >
            Ver carrito
          </Button>
        </Stack>
      )}

      {items.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography color="text.secondary">No hay productos seleccionados.</Typography>
        </Paper>
      ) : (
        items.map((item) => (
          <Paper key={item.id} sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography fontWeight={700}>{item.productName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  SKU: {item.productSku} · Cant: {item.quantity}
                  {item.notes && ` · ${item.notes}`}
                </Typography>
              </Box>
              {canEdit && (
                <Button size="small" color="error" onClick={() => removeProduct(item.id)}>Eliminar</Button>
              )}
            </Stack>
          </Paper>
        ))
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
      />
    </Stack>
  );
}
