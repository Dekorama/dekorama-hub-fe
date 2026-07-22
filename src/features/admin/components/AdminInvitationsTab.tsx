"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { API, useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { AdminUser } from "@/features/admin/types/users";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";
import { ResponsiveTable, TableEmptyRow, TableLoadingRow } from "@/shared/ui";

type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

interface AdminInvitation {
  id: string;
  inviteeEmail: string;
  status: InvitationStatus;
  createdAt: string;
}

const STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  expired: "Expirada",
  revoked: "Revocada",
};

const STATUS_COLOR: Record<
  InvitationStatus,
  "warning" | "success" | "default" | "error"
> = {
  pending: "warning",
  accepted: "success",
  expired: "default",
  revoked: "error",
};

export function AdminInvitationsTab() {
  const { user } = useCurrentUser();
  const { confirm, ConfirmDialogHost } = useConfirmDialog();
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddEmail = () => {
    const trimmed = currentEmail.trim().toLowerCase();
    if (!trimmed) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Email inválido");
      return;
    }

    if (emails.includes(trimmed)) {
      setError("Email ya agregado");
      return;
    }

    setEmails([...emails, trimmed]);
    setCurrentEmail("");
    setError("");
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleSendInvitations = async () => {
    if (emails.length === 0) {
      setError("Agrega al menos un email");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API}/admin/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emails }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "Error al enviar invitaciones");
      }

      const newInvitations = (await res.json()) as AdminInvitation[];
      setSuccess(`${newInvitations.length} invitación(es) enviada(s)`);
      setEmails([]);
      void loadInvitations();
      void loadAdmins();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar invitaciones");
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    setListLoading(true);
    try {
      const res = await fetch(`${API}/admin/invitations`, {
        credentials: "include",
      });
      if (res.ok) {
        setInvitations(await res.json());
      }
    } catch (err) {
      console.error("Error loading invitations:", err);
    } finally {
      setListLoading(false);
    }
  };

  const loadAdmins = async () => {
    setAdminsLoading(true);
    try {
      const res = await fetch(`${API}/admin/users?role=admin`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as AdminUser[];
        setAdmins(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading admins:", err);
      setAdmins([]);
    } finally {
      setAdminsLoading(false);
    }
  };

  const runAction = async (
    id: string,
    action: "revoke" | "resend" | "delete",
    confirmMsg: string,
    successMsg: string,
  ) => {
    const ok = await confirm({
      title: action === "delete" ? "Confirmar eliminación" : "Confirmar acción",
      message: confirmMsg,
      confirmLabel: action === "delete" ? "Eliminar" : action === "revoke" ? "Revocar" : "Reenviar",
      confirmColor: action === "resend" ? "primary" : "error",
    });
    if (!ok) return;

    setActionId(id);
    setError("");
    setSuccess("");

    try {
      const path =
        action === "delete"
          ? `${API}/admin/invitations/${id}`
          : `${API}/admin/invitations/${id}/${action}`;
      const res = await fetch(path, {
        method: action === "delete" ? "DELETE" : "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "No se pudo completar la acción");
      }

      setSuccess(successMsg);
      void loadInvitations();
      void loadAdmins();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error en la acción");
    } finally {
      setActionId(null);
    }
  };

  useEffect(() => {
    void loadInvitations();
    void loadAdmins();
  }, []);

  return (
    <Stack spacing={3}>
      <ConfirmDialogHost />
      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Invitar Administradores
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Los administradores pueden gestionar usuarios, productos, y enviar más invitaciones.
          Se usará <strong>admin@dekoramagroup.com</strong> como remitente.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Email del nuevo admin"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
            placeholder="admin@dekoramagroup.com"
          />
          <Button
            variant="outlined"
            onClick={handleAddEmail}
            startIcon={<AddIcon />}
            sx={{ flexShrink: 0 }}
          >
            Agregar
          </Button>
        </Stack>

        {emails.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Emails agregados ({emails.length}):
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {emails.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  onDelete={() => handleRemoveEmail(email)}
                  color="primary"
                />
              ))}
            </Stack>
          </Box>
        )}

        <Button
          variant="contained"
          onClick={() => void handleSendInvitations()}
          disabled={loading || emails.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          fullWidth
        >
          {loading ? "Enviando..." : `Enviar ${emails.length} Invitación(es)`}
        </Button>
      </Paper>

      <Box>
        <Typography variant="h6" gutterBottom>
          Miembros con acceso
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Administradores activos que pueden entrar al panel.
        </Typography>

        <ResponsiveTable minWidth={480}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Desde</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adminsLoading ? (
              <TableLoadingRow colSpan={3} />
            ) : admins.length === 0 ? (
              <TableEmptyRow colSpan={3} message="No hay administradores registrados." />
            ) : (
              admins.map((admin) => {
                const isYou = user?.id === admin.id;
                return (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={600}>{admin.name}</Typography>
                        {isYou ? <Chip label="Tú" size="small" color="primary" /> : null}
                      </Stack>
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      {new Date(admin.createdAt).toLocaleDateString("es-ES")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </ResponsiveTable>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Historial de Invitaciones
        </Typography>

        <ResponsiveTable minWidth={560}>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha de Envío</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listLoading ? (
              <TableLoadingRow colSpan={4} />
            ) : invitations.length === 0 ? (
              <TableEmptyRow colSpan={4} message="No has enviado invitaciones aún." />
            ) : (
              invitations.map((inv) => {
                const busy = actionId === inv.id;
                const canRevoke = inv.status === "pending";
                const canResend = inv.status !== "accepted";

                return (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.inviteeEmail}</TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABEL[inv.status] ?? inv.status}
                        color={STATUS_COLOR[inv.status] ?? "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {canResend && (
                          <Tooltip title="Reenviar">
                            <span>
                              <IconButton
                                size="small"
                                disabled={busy}
                                aria-label="Reenviar invitación"
                                onClick={() =>
                                  void runAction(
                                    inv.id,
                                    "resend",
                                    `¿Reenviar invitación a ${inv.inviteeEmail}?`,
                                    "Invitación reenviada",
                                  )
                                }
                              >
                                {busy ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {canRevoke && (
                          <Tooltip title="Revocar">
                            <span>
                              <IconButton
                                size="small"
                                disabled={busy}
                                aria-label="Revocar invitación"
                                onClick={() =>
                                  void runAction(
                                    inv.id,
                                    "revoke",
                                    `¿Revocar invitación de ${inv.inviteeEmail}? El enlace dejará de funcionar.`,
                                    "Invitación revocada",
                                  )
                                }
                              >
                                <BlockIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        <Tooltip title="Eliminar">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={busy}
                              aria-label="Eliminar invitación"
                              onClick={() =>
                                void runAction(
                                  inv.id,
                                  "delete",
                                  `¿Eliminar invitación de ${inv.inviteeEmail}?`,
                                  "Invitación eliminada",
                                )
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </ResponsiveTable>
      </Box>
    </Stack>
  );
}
