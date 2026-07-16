"use client";

import { useEffect, useState } from "react";
import {
  Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import { useCurrentUser, API } from "../hooks/useCurrentUser";
import { formatOrderTotal } from "../utils/orderLabels";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

export default function PedidosPage() {
  const { user, loading } = useCurrentUser();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) {
      fetch(`${API}/orders`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : [])
        .then(setOrders);
    }
  }, [user]);

  if (loading) return null;
  if (!user) return <Typography>Inicia sesión</Typography>;

  return (
    <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Mis Pedidos</Typography>
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.orderNumber}</TableCell>
                  <TableCell>{o.status}</TableCell>
                  <TableCell>{formatOrderTotal(o.total)}</TableCell>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString("es-ES")}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center">No hay pedidos</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>
  );
}
