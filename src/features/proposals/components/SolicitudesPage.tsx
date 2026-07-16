"use client";

import { useEffect, useState } from "react";
import {
  Button, Chip, TableBody, TableCell,
  TableHead, TableRow, Typography,
} from "@mui/material";
import Link from "next/link";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import {
  getProposalStatusColor,
  getProposalStatusLabel,
  getProposalTypeLabel,
} from "@/shared/utils/proposalLabels";
import { ResponsiveTable } from "@/shared/ui";

interface Proposal {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  message: string | null;
}

export function SolicitudesPage() {
  const { user, loading } = useCurrentUser();
  const [items, setItems] = useState<Proposal[]>([]);

  useEffect(() => {
    if (user) {
      fetch(`${API}/proposals/solicitudes`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : [])
        .then(setItems);
    }
  }, [user]);

  if (loading) return null;
  if (!user) return <Typography>Inicia sesión</Typography>;

  return (
    <>
        <Typography variant="h5" sx={{ mb: 2 }}>Mis Solicitudes y Presupuestos</Typography>
        <ResponsiveTable minWidth={520} paperSx={{ borderRadius: 3 }}>
          <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Chip label={getProposalTypeLabel(p.type)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getProposalStatusLabel(p.status)}
                      size="small"
                      color={getProposalStatusColor(p.status)}
                    />
                  </TableCell>
                  <TableCell>{new Date(p.createdAt).toLocaleDateString("es-ES")}</TableCell>
                  <TableCell>
                    <Button component={Link} href={`/solicitudes/${p.id}`} size="small">Ver</Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center">No hay solicitudes</TableCell></TableRow>
              )}
            </TableBody>
        </ResponsiveTable>
    </>
  );
}
