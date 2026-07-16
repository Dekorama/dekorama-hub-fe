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
import { FormEvent, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthBrandHeader from "../components/AuthBrandHeader";
import { MARKET_OPTIONS, MARKETS, isMarketCode, type MarketCode } from "../utils/market";
import { API } from "../hooks/useCurrentUser";

interface InvitationInfo {
  organizerName?: string;
  organizerEmail?: string;
  senderName?: string;
  senderEmail?: string;
  inviteeEmail: string;
}

function RegistroForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const adminToken = searchParams.get("admin_token");
  const rolParam = searchParams.get("rol");
  const cuentaParam = searchParams.get("cuenta");
  const paisParam = searchParams.get("pais");

  const [role, setRole] = useState<"client" | "professional">("client");
  const [accountType, setAccountType] = useState<"individual" | "community">("individual");
  const [country, setCountry] = useState<MarketCode>("VE");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [tokenLoading, setTokenLoading] = useState(!!(token || adminToken));
  const [tokenError, setTokenError] = useState<string | null>(null);

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

        const info: InvitationInfo = await res.json();
        setInvitationInfo(info);
        setEmail(info.inviteeEmail);
      } catch (err: unknown) {
        setTokenError(err instanceof Error ? err.message : "Invitación inválida o expirada");
      } finally {
        setTokenLoading(false);
      }
    };

    loadInvitation();
  }, [token, adminToken]);

  useEffect(() => {
    if (token || adminToken || invitationInfo) return;

    if (rolParam === "professional") {
      setRole("professional");
    }

    if (cuentaParam === "comunidad" || cuentaParam === "community") {
      setRole("client");
      setAccountType("community");
    } else if (cuentaParam === "individual") {
      setRole("client");
      setAccountType("individual");
    }

    if (paisParam && isMarketCode(paisParam)) {
      setCountry(paisParam);
    }
  }, [rolParam, cuentaParam, paisParam, token, adminToken, invitationInfo]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
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

      const profileData =
        role === "professional" && specialties
          ? { specialties: specialties.split(",").map((s) => s.trim()) }
          : undefined;

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          name,
          role: role === "professional" ? "professional" : "client",
          accountType: role === "client" ? accountType : undefined,
          country,
          profileData,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al registrar");
      }

      window.location.href = "/login";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  if ((token || adminToken) && tokenLoading) {
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

  if ((token || adminToken) && tokenError) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <Paper sx={{ p: 4, width: "100%", borderRadius: 3 }}>
          <AuthBrandHeader />
          <Alert severity="error" sx={{ mb: 2 }}>
            {tokenError}
          </Alert>
          <Typography variant="body2">
            <Link href="/login">Volver al inicio de sesión</Link>
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", py: { xs: 3, sm: 0 }, px: { xs: 2, sm: 3 } }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: "100%", borderRadius: 3 }}>
        <AuthBrandHeader />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {invitationInfo
            ? adminToken
              ? "Aceptar Invitación de Admin"
              : "Aceptar Invitación"
            : "Crear cuenta"}
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
            </Typography>
          </Alert>
        )}

        {!invitationInfo && (
          <Typography variant="body2" color="text.secondary" mb={3}>
            Únete a Dekorama Hub. Elige tu tienda (Venezuela o España). Tu cuenta queda vinculada a ese mercado.
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {!invitationInfo && (
              <FormControl>
                <FormLabel>Tienda / País</FormLabel>
                <RadioGroup
                  row
                  value={country}
                  onChange={(e) => setCountry(e.target.value as MarketCode)}
                >
                  {MARKET_OPTIONS.map((code) => (
                    <FormControlLabel
                      key={code}
                      value={code}
                      control={<Radio />}
                      label={`${MARKETS[code].label} (${MARKETS[code].storeName})`}
                    />
                  ))}
                </RadioGroup>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Catálogo, proyectos y facturación según {MARKETS[country].taxLabel} {MARKETS[country].taxRate}% · {MARKETS[country].currency}
                </Typography>
              </FormControl>
            )}

            {!invitationInfo && (
              <FormControl>
                <FormLabel>Tipo de cuenta</FormLabel>
                <RadioGroup row={false} value={role} onChange={(e) => setRole(e.target.value as typeof role)} sx={{ flexDirection: { xs: "column", sm: "row" } }}>
                  <FormControlLabel value="client" control={<Radio />} label="Cliente" />
                  <FormControlLabel value="professional" control={<Radio />} label="Profesional / Empresa" />
                </RadioGroup>
              </FormControl>
            )}

            {!invitationInfo && role === "client" && (
              <FormControl>
                <FormLabel>Tipo de cliente</FormLabel>
                <RadioGroup row value={accountType} onChange={(e) => setAccountType(e.target.value as typeof accountType)}>
                  <FormControlLabel value="individual" control={<Radio />} label="Individual" />
                  <FormControlLabel value="community" control={<Radio />} label="Comunidad / Edificio" />
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
                    📎 Carga de certificados y {MARKETS[country].docLabel}. <strong>Próximamente</strong>
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

export default function RegistroPage() {
  return (
    <Suspense
      fallback={
        <Container
          maxWidth="sm"
          sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <CircularProgress />
        </Container>
      }
    >
      <RegistroForm />
    </Suspense>
  );
}
