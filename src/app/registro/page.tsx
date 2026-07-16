"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

interface InvitationInfo {
  organizerName?: string;
  organizerEmail?: string;
  senderName?: string;
  senderEmail?: string;
  inviteeEmail: string;
}

export default function RegistroPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const adminToken = searchParams.get("admin_token");
  
  const [role, setRole] = useState<"client" | "professional">("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Token-based registration state
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [tokenLoading, setTokenLoading] = useState(!!(token || adminToken));
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Load invitation info if token is present
  useEffect(() => {
    if (!token && !adminToken) return;

    const loadInvitation = async () => {
      try {
        const endpoint = adminToken 
          ? `${API}/admin/accept-invite/${adminToken}`
          : `${API}/communities/accept-invite/${token}`;
        
        const res = await fetch(endpoint, {
          credentials: "include",
        });
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Invitación inválida o expirada");
        }

        const info = await res.json();
        setInvitationInfo(info);
        setEmail(info.inviteeEmail); // Pre-fill email
      } catch (err: any) {
        setTokenError(err.message);
      } finally {
        setTokenLoading(false);
      }
    };

    loadInvitation();
  }, [token, adminToken]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErAdmin token registration
      if (adminToken && invitationInfo) {
        const res = await fetch(`${API}/auth/register-admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token: adminToken, email, password, name }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Error al registrar administrador");
        }

        window.location.href = "/admin";
        return;
      }
      
      // Community member token
    setLoading(true);
    
    try {
      // Token-based member registration
      if (token && invitationInfo) {
        const res = await fetch(`${API}/auth/register-member`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token, email, password, name }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Error al registrar miembro");
        }

        window.location.href = "/dashboard";
        return;
      }

      // Regular registration
      const profileData =
        role === "professional" && specialties
          ? { specialties: specialties.split(",").map((s) => s.trim()) }
          : undefined;

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
      (token || adminToken) && tokenLoading) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Verificando invitación...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Token error state
  if ((token || adminToken)
  };

  // Token loading state
  if (token && tokenLoading) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Verificando invitación...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Token error state
  if (token && tokenError) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <Paper sx={{ p: 4, width: "100%", borderRadius: 3 }}>
          <Alert severity="e(adminToken ? "Aceptar Invitación de Admin" : "Aceptar Invitación") : "Crear cuenta"}
        </Typography>
        
        {invitationInfo && (
          <Alert severity={adminToken ? "warning" : "info"} sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600}>
              {invitationInfo.organizerName || invitationInfo.senderName}
            </Typography>
            <Typography variant="caption">
              {adminToken 
                ? "te ha invitado a unirte como administrador de Dekorama Hub"
                : "te ha invitado a unirte a su comunidad"}
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", py: { xs: 3, sm: 0 }, px: { xs: 2, sm: 3 } }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: "100%", borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {invitationInfo ? "Aceptar Invitación" : "Crear cuenta"}
        </Typography>
        
        {invitationInfo && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600}>
              {invitationInfo.organizerName}
            </Typography>
            <Typography variant="caption">
              te ha invitado a unirte a su comunidad
            </Typography>
          </Alert>
        )}
        
        {!invitationInfo && (
          <Typography variant="body2" color="text.secondary" mb={3}>
            Únete a Dekorama Hub — plataforma colaborativa de reconstrucción.
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {!invitationInfo && (
              <FormControl>
                <FormLabel>Tipo de cuenta</FormLabel>
                <RadioGroup row={false} value={role} onChange={(e) => setRole(e.target.value as typeof role)} sx={{ flexDirection: { xs: "column", sm: "row" } }}>
                  <FormControlLabel value="client" control={<Radio />} label="Cliente / Comunidad" />
                  <FormControlLabel value="professional" control={<Radio />} label="Profesional / Empresa" />
                </RadioGroup>
              </FormControl>
            )}

            <TextField label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField 
              label="Email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              fullWidth 
              disabled={!!invitationInfo}
              helperText={invitationInfo ? "Email pre-asignado por invitación" : ""}
            />
            <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />

            {role === "professional" && !invitationInfo && (
              <>
                <TextField
                  label="Especialidades (separadas por coma)"
                  placeholder="Ej: Arquitectura, Obras civiles, Electricidad"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  fullWidth
                />
                <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    📎 Carga de certificados y RIF — <strong>Próximamente</strong> (Google Cloud Storage)
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Los profesionales requieren verificación del equipo Dekorama antes de poder enviar propuestas.
                </Typography>
              </>
            )}

            {error && <Typography variant="body2" color="error">{error}</Typography>}

            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? "Creando..." : invitationInfo ? "Aceptar y Crear Cuenta" : "Crear cuenta"}
            </Button>
            
            {!invitationInfo && (
              <Typography variant="body2">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login">Iniciar sesión</Link>
              </Typography>
            )}
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}

