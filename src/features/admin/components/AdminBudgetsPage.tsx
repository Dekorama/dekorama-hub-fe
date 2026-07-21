"use client";

import { useEffect, useState } from "react";
import {
  Button, Chip, TableBody, TableCell,
  TableHead, TableRow,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import {
  getProposalStatusColor,
  getProposalStatusLabel,
  getProposalTypeLabel,
} from "@/shared/utils/proposalLabels";
import { ResponsiveTable, TableEmptyRow, TableLoadingRow } from "@/shared/ui";

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

export function AdminBudgetsPage() {
  const { user } = useCurrentUser();
  const { market } = useAdminMarket();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") return;
    setLoading(true);
    fetch(adminApiUrl("/proposals/solicitudes", market), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setProposals)
      .finally(() => setLoading(false));
  }, [user, market]);

  return (
    <>
      <AdminPageHeader
        title="Presupuestos y Solicitudes"
        actions={
          <Button
            component={Link}
            href="/admin/presupuestos/nuevo"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Nuevo presupuesto
          </Button>
        }
      />
      <ResponsiveTable minWidth={640}>
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
          {loading ? (
            <TableLoadingRow colSpan={6} />
          ) : proposals.length === 0 ? (
            <TableEmptyRow colSpan={6} message="No hay solicitudes pendientes" />
          ) : (
            proposals.map((p) => (
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
            ))
          )}
        </TableBody>
      </ResponsiveTable>
    </>
  );
}
