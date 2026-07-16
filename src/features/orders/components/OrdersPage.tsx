"use client";

import { useEffect, useState } from "react";
import {
  TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { formatOrderTotal } from "@/shared/utils/orderLabels";
import { ResponsiveTable } from "@/shared/ui";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

export function OrdersPage() {
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
    <>
        <Typography variant="h5" sx={{ mb: 2 }}>Mis Pedidos</Typography>
        <ResponsiveTable minWidth={480} paperSx={{ borderRadius: 3 }}>
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
        </ResponsiveTable>
    </>
  );
}
