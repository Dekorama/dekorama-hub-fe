"use client";

import { useEffect, useState } from "react";
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
import { Delete, ShoppingCart, Payment } from "@mui/icons-material";
import { AppShell } from "../components/AppShell";
import { useCurrentUser, API } from "../hooks/useCurrentUser";

interface CartItem {
  id: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  product: {
    sku: string;
    name: string;
    pvpPrice: number;
    familyName: string;
    imageUrl: string | null;
  };
}

const IVA_RATE = 0.16; // 16% IVA

export default function CartPage() {
  const { user, loading: authLoading } = useCurrentUser();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API}/cart`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar el carrito");
      const data = await res.json();
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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al actualizar cantidad");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("¿Eliminar este producto del carrito?")) return;

    try {
      const res = await fetch(`${API}/cart/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al eliminar producto");

      await fetchCart();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al eliminar producto");
    }
  };

  const handleClearCart = async () => {
    if (!confirm("¿Vaciar todo el carrito?")) return;

    try {
      const res = await fetch(`${API}/cart`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al vaciar carrito");

      await fetchCart();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al vaciar carrito");
    }
  };

  if (authLoading || loading) {
    return (
      <AppShell title="Carrito de Compras" user={user}>
        <Container sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Container>
      </AppShell>
    );
  }

  if (!user) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + +item.unitPrice * item.quantity, 0);
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;

  return (
    <AppShell title="Carrito de Compras" user={user}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            <Typography variant="h5">
              <ShoppingCart sx={{ verticalAlign: "middle", mr: 1 }} />
              Mi Carrito
            </Typography>
            {cartItems.length > 0 && (
              <Button variant="outlined" color="error" onClick={handleClearCart}>
                Vaciar Carrito
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {cartItems.length === 0 ? (
            <Alert severity="info">Tu carrito está vacío. ¡Explora nuestro catálogo de productos!</Alert>
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
                    {cartItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {item.product.imageUrl && (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }}
                              />
                            )}
                            <Box>
                              <Typography variant="body1">{item.product.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.product.familyName}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{item.product.sku}</TableCell>
                        <TableCell align="right">${(+item.unitPrice).toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
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
                          <IconButton color="error" onClick={() => handleRemoveItem(item.id)}>
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 3 }} />

              {/* Order Summary */}
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Box sx={{ width: 300 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body1">Subtotal:</Typography>
                    <Typography variant="body1">${subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body1">IVA (16%):</Typography>
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
                    startIcon={<Payment />}
                    onClick={() => setCheckoutDialogOpen(true)}
                  >
                    Proceder al Pago
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Paper>

        {/* Coming Soon Dialog */}
        <Dialog open={checkoutDialogOpen} onClose={() => setCheckoutDialogOpen(false)}>
          <DialogTitle>🚧 Pasarela de Pago en Desarrollo</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              La integración con pasarelas de pago (Stripe/MercadoPago) estará disponible próximamente.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Tu carrito se ha guardado y podrás completar la compra cuando esta funcionalidad esté habilitada.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCheckoutDialogOpen(false)} variant="contained">
              Entendido
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppShell>
  );
}
