"use client";

import { useEffect, useState } from "react";
import {
  Button, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { ResponsiveTable } from "@/shared/ui";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  total: number;
  status: string;
}

export function InvoicesPage() {
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
    <>
        <Typography variant="h5" sx={{ mb: 2 }}>Mis Facturas</Typography>
        <ResponsiveTable minWidth={560} paperSx={{ borderRadius: 3 }}>
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
        </ResponsiveTable>
    </>
  );
}
