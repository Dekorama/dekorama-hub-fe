"use client";

import { useEffect, useState } from "react";
import {
  Button, Chip, Paper, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useAdminMarket } from "../context/AdminMarketContext";
import { adminApiUrl } from "../utils/adminApi";
import {
  getProposalStatusColor,
  getProposalStatusLabel,
  getProposalTypeLabel,
} from "../../utils/proposalLabels";

interface Proposal {
  id: string;
  type: string;
  status: string;
  title?: string | null;
  laborCost: number;
  message: string | null;
  createdAt: string;
  client?: { name: string; email: string };
}

export default function PresupuestosAdminPage() {
  const { user } = useCurrentUser();
  const { market } = useAdminMarket();
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetch(adminApiUrl("/proposals/solicitudes", market), { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then(setProposals);
    }
  }, [user, market]);

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
        flexWrap="wrap"
        useFlexGap
        spacing={1}
      >
        <Typography variant="h5">Presupuestos y Solicitudes</Typography>
        <Button
          component={Link}
          href="/admin/presupuestos/nuevo"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nuevo presupuesto
        </Button>
      </Stack>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Chip label={getProposalTypeLabel(p.type)} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{p.title || "—"}</TableCell>
                <TableCell>{p.client?.name ?? p.client?.email ?? "N/D"}</TableCell>
                <TableCell>
                  <Chip
                    label={getProposalStatusLabel(p.status)}
                    size="small"
                    color={getProposalStatusColor(p.status)}
                  />
                </TableCell>
                <TableCell>{new Date(p.createdAt).toLocaleDateString("es-ES")}</TableCell>
                <TableCell>
                  <Button component={Link} href={`/admin/presupuestos/${p.id}`} size="small">
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {proposals.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay solicitudes pendientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
