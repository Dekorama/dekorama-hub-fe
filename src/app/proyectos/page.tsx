"use client";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "../components/AppShell";
import { useCurrentUser, API } from "../hooks/useCurrentUser";

interface Project {
  id: string;
  title: string;
  description: string;
  isPublic: boolean;
  status: string;
  budget: number | null;
  location: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  reviewing: "En revisión",
  in_progress: "En progreso",
  completed: "Finalizado",
};

const STATUS_COLORS: Record<string, "success" | "warning" | "info" | "default"> = {
  open: "success",
  reviewing: "warning",
  in_progress: "info",
  completed: "default",
};

export default function ProyectosPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProjects = () => {
    fetch(`${API}/projects`, { credentials: "include" })
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoadingProjects(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          isPublic,
          budget: budget ? +budget : undefined,
          location: location || undefined,
        }),
      });
      setOpen(false);
      setTitle(""); setDescription(""); setBudget(""); setLocation(""); setIsPublic(true);
      fetchProjects();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Proyectos" user={user}>
      {userLoading || loadingProjects ? (
        <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
      ) : (
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1}>
            <Typography variant="body2" color="text.secondary">
              {user?.role === "client" ? "Tus proyectos" : "Feed público de proyectos"}
            </Typography>
            {user?.role === "client" && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Nuevo proyecto
              </Button>
            )}
          </Stack>

          {projects.length === 0 && (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
              <Typography color="text.secondary">
                {user?.role === "client" ? "No tienes proyectos aún. ¡Crea el primero!" : "No hay proyectos públicos disponibles."}
              </Typography>
            </Paper>
          )}

          {projects.map((p) => (
            <Paper key={p.id} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="flex-start" gap={2}>
                <Box flex={1}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap">
                    {p.isPublic ? <PublicIcon fontSize="small" color="success" /> : <LockIcon fontSize="small" color="disabled" />}
                    <Typography variant="h6" fontWeight={700}>{p.title}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mb={1}>{p.description}</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                    <Chip label={STATUS_LABELS[p.status] ?? p.status} color={STATUS_COLORS[p.status] ?? "default"} size="small" />
                    {p.budget && <Chip label={`Presupuesto: $${p.budget}`} size="small" variant="outlined" />}
                    {p.location && <Chip label={p.location} size="small" variant="outlined" />}
                  </Stack>
                </Box>
                <Button component={Link} href={`/proyectos/${p.id}`} variant="outlined" size="small" sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 120 } }}>
                  Ver detalle
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo proyecto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
            <TextField label="Descripción de daños / necesidades" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3} required fullWidth />
            <TextField label="Presupuesto estimado (USD)" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} fullWidth />
            <TextField label="Ubicación general" value={location} onChange={(e) => setLocation(e.target.value)} fullWidth />
            <FormControlLabel
              control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
              label={isPublic ? "Proyecto público (visible en el feed)" : "Proyecto privado (solo via enlace)"}
            />
            <Box sx={{ p: 1.5, bgcolor: "grey.100", borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">
                📎 Adjuntar fotos — <strong>Próximamente</strong> (Google Cloud Storage)
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !title || !description}>
            {saving ? "Guardando..." : "Crear proyecto"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
