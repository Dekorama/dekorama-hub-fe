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
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { ResponsiveTable } from "@/shared/ui";

interface Invitation {
  id: string;
  inviteeEmail: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
}

export function CommunityInvitationsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddEmail = () => {
    const trimmed = currentEmail.trim().toLowerCase();
    if (!trimmed) return;
    
    // Basic email validation
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
      const res = await fetch(`${API}/communities/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emails }),
      });

      if (!res.ok) {
        throw new Error("Error al enviar invitaciones");
      }

      const newInvitations = await res.json();
      setSuccess(`${newInvitations.length} invitación(es) enviada(s)`);
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
      const res = await fetch(`${API}/communities/invitations`, {
        credentials: "include",
      });
      if (res.ok) {
        setInvitations(await res.json());
      }
    } catch (err) {
      console.error("Error loading invitations:", err);
    }
  };

  // Load invitations on mount
  useEffect(() => {
    if (user) loadInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (userLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (user?.accountType !== "community") {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Solo organizadores comunitarios pueden enviar invitaciones.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Invitaciones de Vecinos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Invita a tus vecinos a unirse a tu comunidad en Dekorama Hub
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Agregar Emails
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Email del vecino"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
            placeholder="vecino@email.com"
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

      <Paper sx={{ p: 3 }}>
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
    </Box>
  );
}
