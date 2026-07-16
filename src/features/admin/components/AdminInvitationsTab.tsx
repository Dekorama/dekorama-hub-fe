"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
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
} from "@mui/material";
import { Add as AddIcon, Send as SendIcon } from "@mui/icons-material";
import { API } from "@/features/auth/hooks/useCurrentUser";
import { ResponsiveTable } from "@/shared/ui";

interface AdminInvitation {
  id: string;
  inviteeEmail: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
}

export function AdminInvitationsTab() {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(false);
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
        throw new Error("Error al enviar invitaciones");
      }

      const newInvitations = await res.json();
      setSuccess(`${newInvitations.length} invitación(es) enviada(s) ✅`);
      setEmails([]);
      loadInvitations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const res = await fetch(`${API}/admin/invitations`, {
        credentials: "include",
      });
      if (res.ok) {
        setInvitations(await res.json());
      }
    } catch (err) {
      console.error("Error loading invitations:", err);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  return (
    <Stack spacing={3}>
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

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Invitar Administradores
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Los administradores pueden gestionar usuarios, productos, y enviar más invitaciones.
          Se usará <strong>admin@dekoramagroup.com</strong> como remitente.
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
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
          >
            Agregar
          </Button>
        </Stack>

        {emails.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Emails agregados ({emails.length}):
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {emails.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  onDelete={() => handleRemoveEmail(email)}
                  color="primary"
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Button
          variant="contained"
          onClick={handleSendInvitations}
          disabled={loading || emails.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          fullWidth
        >
          {loading ? "Enviando..." : `Enviar ${emails.length} Invitación(es)`}
        </Button>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Historial de Invitaciones
        </Typography>

        {invitations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No has enviado invitaciones aún.
          </Typography>
        ) : (
          <ResponsiveTable minWidth={480} paperSx={{ borderRadius: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha de Envío</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.inviteeEmail}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        inv.status === "pending"
                          ? "Pendiente"
                          : inv.status === "accepted"
                          ? "Aceptada"
                          : "Expirada"
                      }
                      color={
                        inv.status === "pending"
                          ? "warning"
                          : inv.status === "accepted"
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ResponsiveTable>
        )}
      </Paper>
    </Stack>
  );
}
