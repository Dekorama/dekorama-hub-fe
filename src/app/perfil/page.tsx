"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useCurrentUser, API } from "../hooks/useCurrentUser";
import {
  getAccountTypeLabel,
  getInitials,
  getRoleLabel,
  UserProfileData,
} from "../utils/userLabels";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "admin" | "professional" | "client";
  isVerified: boolean;
  accountType?: "individual" | "community" | "member" | null;
  profileData?: UserProfileData | null;
  createdAt?: string;
}

type TabKey = "profile" | "security" | "account";

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (data.message) return data.message;
  } catch {
    // ignore
  }
  return fallback;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useCurrentUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("profile");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const loadProfile = async () => {
    setLoading(true);
    const res = await fetch(`${API}/auth/me`, { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as UserProfile;
      setProfile(data);
      const pd = data.profileData ?? {};
      setName(data.name ?? "");
      setPhone(pd.phone ?? "");
      setAddress(pd.address ?? "");
      setCity(pd.city ?? "");
      setProvince(pd.province ?? "");
      setBio(pd.bio ?? "");
      setSpecialties((pd.specialties ?? []).join(", "));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const showFeedback = (message: string, severity: "success" | "error") => {
    setFeedback({ open: true, message, severity });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name,
        phone,
        address,
        city,
        province,
      };
      if (profile?.role === "professional") {
        body.bio = bio;
        body.specialties = specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const res = await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo guardar el perfil"));
      }
      const updated = (await res.json()) as UserProfile;
      setProfile(updated);
      showFeedback("Perfil actualizado correctamente", "success");
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showFeedback("Las contraseñas nuevas no coinciden", "error");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(`${API}/auth/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo cambiar la contraseña"));
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showFeedback("Contraseña actualizada correctamente", "success");
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al cambiar contraseña", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading || loading || !profile) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              bgcolor: "primary.main",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {getInitials(profile.name)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h5" fontWeight={700}>
                {profile.name}
              </Typography>
              {profile.role === "professional" && profile.isVerified && (
                <Chip
                  icon={<VerifiedIcon />}
                  label="Verificado"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Stack>
            <Typography color="text.secondary">{profile.email}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              <Chip label={getRoleLabel(profile.role)} size="small" />
              <Chip
                label={getAccountTypeLabel(profile.accountType)}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(_, value: TabKey) => setTab(value)}
          sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Información personal" value="profile" />
          <Tab label="Seguridad" value="security" />
          <Tab label="Cuenta" value="account" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === "profile" && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Datos personales
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Información visible en proformas, facturas y comunicaciones con Dekorama.
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Nombre completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      fullWidth
                      required
                      sx={{ flex: 1 }}
                    />
                    <TextField label="Email" value={profile.email} fullWidth disabled sx={{ flex: 1 }} />
                  </Stack>
                  <TextField
                    label="Teléfono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Dirección"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    fullWidth
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Ciudad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      fullWidth
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Provincia"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      fullWidth
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                </Stack>
              </Box>

              {profile.role === "professional" && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Perfil profesional
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        label="Biografía"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Describe tu experiencia y especialización..."
                      />
                      <TextField
                        label="Especialidades"
                        value={specialties}
                        onChange={(e) => setSpecialties(e.target.value)}
                        fullWidth
                        helperText="Separadas por comas. Ej: Cocinas, Baños, Iluminación"
                      />
                    </Stack>
                  </Box>
                </>
              )}

              <Box>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </Box>
            </Stack>
          )}

          {tab === "security" && (
            <Stack spacing={2} maxWidth={480}>
              <Typography variant="subtitle1" fontWeight={700}>
                Cambiar contraseña
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usa al menos 8 caracteres. Te recomendamos combinar letras, números y símbolos.
              </Typography>
              <TextField
                label="Contraseña actual"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                autoComplete="current-password"
              />
              <TextField
                label="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                autoComplete="new-password"
              />
              <TextField
                label="Confirmar nueva contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                autoComplete="new-password"
              />
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword}
                startIcon={changingPassword ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {changingPassword ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </Stack>
          )}

          {tab === "account" && (
            <Stack spacing={2} maxWidth={520}>
              <Typography variant="subtitle1" fontWeight={700}>
                Detalles de la cuenta
              </Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Rol
                  </Typography>
                  <Typography>{getRoleLabel(profile.role)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tipo de cuenta
                  </Typography>
                  <Typography>{getAccountTypeLabel(profile.accountType)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Estado de verificación
                  </Typography>
                  <Typography>
                    {profile.role === "professional"
                      ? profile.isVerified
                        ? "Profesional verificado"
                        : "Pendiente de verificación"
                      : "No aplica"}
                  </Typography>
                </Box>
                {profile.createdAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Miembro desde
                    </Typography>
                    <Typography>
                      {new Date(profile.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ID de usuario
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {profile.id}
                  </Typography>
                </Box>
              </Stack>
              {profile.role === "professional" && !profile.isVerified && (
                <Alert severity="info">
                  Tu cuenta profesional está pendiente de verificación por el equipo Dekorama.
                </Alert>
              )}
            </Stack>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={feedback.open}
        autoHideDuration={5000}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setFeedback((f) => ({ ...f, open: false }))}
          severity={feedback.severity}
          variant="filled"
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
