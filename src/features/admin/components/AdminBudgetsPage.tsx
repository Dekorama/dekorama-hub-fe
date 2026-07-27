"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Snackbar,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Link from "next/link";
import { API, useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import {
  getProposalStatusColor,
  getProposalStatusLabel,
  getProposalTypeLabel,
} from "@/shared/utils/proposalLabels";
import { ResponsiveTable, TableEmptyRow, TableLoadingRow } from "@/shared/ui";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

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

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (data.message) return data.message;
  } catch {
    // ignore parse errors
  }
  return fallback;
}

export function AdminBudgetsPage() {
  const { user } = useCurrentUser();
  const { market } = useAdminMarket();
  const { confirm, ConfirmDialogHost } = useConfirmDialog();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const fetchProposals = useCallback(() => {
    if (user?.role !== "admin") return;
    setLoading(true);
    fetch(adminApiUrl("/proposals/solicitudes", market), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setProposals)
      .finally(() => setLoading(false));
  }, [user, market]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  async function handleDelete(proposal: Proposal) {
    const label = proposal.title?.trim() || getProposalTypeLabel(proposal.type);
    const ok = await confirm({
      title: "Eliminar presupuesto",
      message: `¿Eliminar «${label}»? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      confirmColor: "error",
    });
    if (!ok) return;

    setDeletingId(proposal.id);
    try {
      const res = await fetch(`${API}/proposals/${proposal.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo eliminar"));
      }
      setProposals((prev) => prev.filter((p) => p.id !== proposal.id));
      setFeedback({
        open: true,
        message: "Presupuesto eliminado",
        severity: "success",
      });
    } catch (err: unknown) {
      setFeedback({
        open: true,
        message: err instanceof Error ? err.message : "Error al eliminar",
        severity: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <ConfirmDialogHost />
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
            <TableCell align="right">Acciones</TableCell>
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
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                    <Button component={Link} href={`/admin/presupuestos/${p.id}`} size="small">
                      Ver
                    </Button>
                    <Tooltip title="Eliminar">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="Eliminar presupuesto"
                          color="error"
                          disabled={deletingId === p.id}
                          onClick={() => void handleDelete(p)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </ResponsiveTable>
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback((f) => ({ ...f, open: false }))}
          variant="filled"
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}
