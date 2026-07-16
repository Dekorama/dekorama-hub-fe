"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
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
import { useCurrentUser, API } from "../hooks/useCurrentUser";
import { useAppSnackbar } from "../hooks/useAppSnackbar";
import { getMarketConfig } from "../utils/market";
import { notifyCartUpdated } from "../utils/cartEvents";

interface CartProduct {
  sku: string;
  name: string;
  pvpPrice: number;
  familyName: string;
  imageUrl: string | null;
}

interface CartItem {
  id: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  product: CartProduct | null;
}

const IVA_RATE = 0.16;

function CartPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { user, loading: authLoading } = useCurrentUser();
  const market = user ? getMarketConfig(user.country) : null;
  const taxRate = market ? market.taxRate / 100 : IVA_RATE;

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
    if (user) fetchCart();
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
        throw new Error((err as { message?: string }).message ?? "Error al enviar solicitud");
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

  const subtotal = cartItems.reduce((sum, item) => sum + +item.unitPrice * item.quantity, 0);
  const iva = subtotal * taxRate;
  const total = subtotal + iva;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            <Typography variant="h5">
              <ShoppingCart sx={{ verticalAlign: "middle", mr: 1 }} />
              Mi Carrito
            </Typography>
            {cartItems.length > 0 && (
              <Button variant="outlined" color="error" onClick={() => setClearCartOpen(true)}>
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
              Tu carrito está vacío. Agrega productos desde{" "}
              <Link href="/proyectos">tus proyectos</Link> o explora el catálogo Dekorama.
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell align="right">Precio Unitario</TableCell>
                      <TableCell align="center">Cantidad</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
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
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              {item.product?.imageUrl && (
                                <img
                                  src={item.product.imageUrl}
                                  alt={productName}
                                  style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }}
                                />
                              )}
                              <Box>
                                <Typography variant="body1">{productName}</Typography>
                                {familyName && (
                                  <Typography variant="caption" color="text.secondary">
                                    {familyName}
                                  </Typography>
                                )}
                                {!item.product && (
                                  <Typography variant="caption" color="warning.main" display="block">
                                    Producto no disponible en catálogo
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{productSku}</TableCell>
                          <TableCell align="right">${(+item.unitPrice).toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = parseInt(e.target.value, 10) || 1;
                                handleUpdateQuantity(item.id, newQty);
                              }}
                              inputProps={{ min: 1, style: { textAlign: "center" } }}
                              size="small"
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="bold">
                              ${(+item.unitPrice * item.quantity).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton color="error" onClick={() => setRemoveItemId(item.id)}>
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Box sx={{ width: 300 }}>
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
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body1">Subtotal:</Typography>
                    <Typography variant="body1">${subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body1">{market?.taxLabel ?? "IVA"} ({market?.taxRate ?? 16}%):</Typography>
                    <Typography variant="body1">${iva.toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      ${total.toFixed(2)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<Send />}
                    onClick={handleSubmitSolicitud}
                    disabled={submitting}
                  >
                    {submitting ? "Enviando..." : "Enviar Solicitud"}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
                    Dekorama preparará tu proforma y te la enviará por email
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Paper>

        <Dialog open={successDialogOpen} onClose={() => { setSuccessDialogOpen(false); window.location.href = "/solicitudes"; }}>
          <DialogTitle>Solicitud enviada</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Tu solicitud fue enviada. El equipo Dekorama preparará tu proforma y te notificará cuando esté lista.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { window.location.href = "/solicitudes"; }} variant="contained">
              Ver mis solicitudes
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!removeItemId} onClose={() => setRemoveItemId(null)}>
          <DialogTitle>Eliminar producto</DialogTitle>
          <DialogContent>
            <Typography>¿Eliminar este producto del carrito?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRemoveItemId(null)}>Cancelar</Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => {
                const id = removeItemId;
                setRemoveItemId(null);
                if (id) void handleRemoveItem(id);
              }}
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={clearCartOpen} onClose={() => setClearCartOpen(false)}>
          <DialogTitle>Vaciar carrito</DialogTitle>
          <DialogContent>
            <Typography>¿Vaciar todo el carrito?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearCartOpen(false)}>Cancelar</Button>
            <Button color="error" variant="contained" onClick={() => void handleClearCartConfirm()}>
              Vaciar
            </Button>
          </DialogActions>
        </Dialog>

        <SnackbarHost />
      </Container>
  );
}

export default function CartPage() {
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
