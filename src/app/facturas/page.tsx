"use client";

import { useEffect, useState } from "react";
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import { useCurrentUser, API } from "../hooks/useCurrentUser";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  total: number;
  status: string;
}

export default function FacturasPage() {
  const { user, loading } = useCurrentUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (user) {
      fetch(`${API}/invoices`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : [])
        .then(setInvoices);
    }
  }, [user]);

  if (loading) return null;
  if (!user) return <Typography>Inicia sesión</Typography>;

  return (
    <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Mis Facturas</Typography>
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>PDF</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.invoiceNumber}</TableCell>
                  <TableCell>{new Date(inv.issueDate).toLocaleDateString("es-ES")}</TableCell>
                  <TableCell>${Number(inv.total).toFixed(2)}</TableCell>
                  <TableCell>{inv.status}</TableCell>
                  <TableCell>
                    <Button size="small" href={`${API}/invoices/${inv.id}/pdf`} target="_blank" component="a">Descargar</Button>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">No hay facturas</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>
  );
}
