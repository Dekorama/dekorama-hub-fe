"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  Box,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import { Delete, Send, ShoppingCart } from "@mui/icons-material";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { useAppSnackbar } from "@/shared/hooks/useAppSnackbar";
import { notifyCartUpdated } from "@/shared/utils/cartEvents";
import { ConfirmDialog, ResponsiveTable } from "@/shared/ui";

interface CartProduct {
  sku: string;
  name: string;
  familyName: string;
  imageUrl: string | null;
}

interface CartItem {
  id: string;
  productSku: string;
  quantity: number;
  product: CartProduct | null;
}

function CartPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { user, loading: authLoading } = useCurrentUser();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [removeItemId, setRemoveItemId] = useState<string | null>(null);
  const [clearCartOpen, setClearCartOpen] = useState(false);
  const { showSuccess, showError, SnackbarHost } = useAppSnackbar();

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API}/cart`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar el carrito");
      const data: CartItem[] = await res.json();
      setCartItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar el carrito");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void fetchCart();
  }, [user]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const res = await fetch(`${API}/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!res.ok) throw new Error("Error al actualizar cantidad");

      await fetchCart();
      notifyCartUpdated();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al actualizar cantidad");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const res = await fetch(`${API}/cart/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al eliminar producto");

      await fetchCart();
      notifyCartUpdated();
      showSuccess("Producto eliminado del carrito");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al eliminar producto");
    }
  };

  const handleClearCart = async () => {
    try {
      const res = await fetch(`${API}/cart`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al vaciar carrito");

      await fetchCart();
      notifyCartUpdated();
      showSuccess("Carrito vaciado");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al vaciar carrito");
    }
  };

  const handleSubmitSolicitud = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/cart/submit-solicitud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: message.trim() || undefined,
          projectId: projectId ?? undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ?? "Error al enviar solicitud",
        );
      }
      setCartItems([]);
      setMessage("");
      notifyCartUpdated();
      setSuccessDialogOpen(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearCartConfirm = async () => {
    setClearCartOpen(false);
    await handleClearCart();
  };

  if (authLoading || loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Typography variant="h5">
            <ShoppingCart sx={{ verticalAlign: "middle", mr: 1 }} />
            Mi Carrito
          </Typography>
          {cartItems.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setClearCartOpen(true)}
            >
              Vaciar Carrito
            </Button>
          )}
        </Box>

        {projectId && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Esta solicitud se vinculará al proyecto seleccionado.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {cartItems.length === 0 ? (
          <Alert severity="info">
            Tu carrito está vacío. Explora el{" "}
            <Link href="/catalogo">catálogo</Link> o agrega productos desde{" "}
            <Link href="/proyectos">tus proyectos</Link>.
          </Alert>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Sin precios aquí. Al solicitar la proforma, Dekorama te enviará
              los precios para firmar.
            </Alert>

            <ResponsiveTable
              minWidth={560}
              elevation={0}
              paperSx={{ boxShadow: "none" }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell align="center">Cantidad</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => {
                  const productName = item.product?.name ?? item.productSku;
                  const productSku = item.product?.sku ?? item.productSku;
                  const familyName = item.product?.familyName;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          {item.product?.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.imageUrl}
                              alt={productName}
                              style={{
                                width: 60,
                                height: 60,
                                objectFit: "cover",
                                borderRadius: 4,
                              }}
                            />
                          )}
                          <Box>
                            <Typography variant="body1">{productName}</Typography>
                            {familyName && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {familyName}
                              </Typography>
                            )}
                            {!item.product && (
                              <Typography
                                variant="caption"
                                color="warning.main"
                                display="block"
                              >
                                Producto no disponible en catálogo
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{productSku}</TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value, 10) || 1;
                            void handleUpdateQuantity(item.id, newQty);
                          }}
                          inputProps={{
                            min: 1,
                            style: { textAlign: "center" },
                          }}
                          size="small"
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          onClick={() => setRemoveItemId(item.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </ResponsiveTable>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Box sx={{ width: { xs: "100%", sm: 320 } }}>
                <TextField
                  label="Mensaje para Dekorama (opcional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<Send />}
                  onClick={() => void handleSubmitSolicitud()}
                  disabled={submitting}
                >
                  {submitting ? "Enviando..." : "Solicitar preforma"}
                </Button>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1, textAlign: "center" }}
                >
                  Dekorama preparará tu proforma con precios y te la enviará
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Paper>

      <Dialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          window.location.href = "/solicitudes";
        }}
      >
        <DialogTitle>Solicitud enviada</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Tu solicitud fue enviada. El equipo Dekorama preparará tu proforma y
            te notificará cuando esté lista.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              window.location.href = "/solicitudes";
            }}
            variant="contained"
          >
            Ver mis solicitudes
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!removeItemId}
        title="Eliminar producto"
        message="¿Eliminar este producto del carrito?"
        confirmLabel="Eliminar"
        confirmColor="error"
        onCancel={() => setRemoveItemId(null)}
        onConfirm={() => {
          const id = removeItemId;
          setRemoveItemId(null);
          if (id) void handleRemoveItem(id);
        }}
      />

      <ConfirmDialog
        open={clearCartOpen}
        title="Vaciar carrito"
        message="¿Vaciar todo el carrito?"
        confirmLabel="Vaciar"
        confirmColor="error"
        onCancel={() => setClearCartOpen(false)}
        onConfirm={() => void handleClearCartConfirm()}
      />

      <SnackbarHost />
    </Container>
  );
}

export function CartPage() {
  return (
    <Suspense
      fallback={
        <Container sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Container>
      }
    >
      <CartPageContent />
    </Suspense>
  );
}
