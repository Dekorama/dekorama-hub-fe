"use client";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMarketBadge } from "../utils/market";
import { useCurrentUser, API } from "../hooks/useCurrentUser";
import { ProjectFormWizard } from "./components/ProjectFormWizard";
import { Project, STATUS_LABELS, formatAddress } from "./types";

const STATUS_COLORS: Record<string, "success" | "warning" | "info" | "default"> = {
  open: "success",
  reviewing: "warning",
  in_progress: "info",
  completed: "default",
};

export default function ProyectosPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchProjects = () => {
    fetch(`${API}/projects`, { credentials: "include" })
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoadingProjects(false));
  };

  useEffect(() => {
    if (userLoading) return;
    if (user?.role === "admin") {
      router.replace("/admin/proyectos");
      return;
    }
    fetchProjects();
  }, [userLoading, user?.role, router]);

  return (
    <>
      {userLoading || loadingProjects ? (
        <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
      ) : (
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1}>
            <Typography variant="body2" color="text.secondary">
              {user?.role === "client"
                ? "Tus proyectos y obras"
                : user?.country
                ? `Feed público · ${formatMarketBadge(user.country)}`
                : "Feed público de proyectos"}
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
                {user?.role === "client" ? "No tienes proyectos aún." : "No hay proyectos públicos."}
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
                    {p.budget && <Chip label={`$${p.budget}`} size="small" variant="outlined" />}
                    {formatAddress(p) && <Chip label={formatAddress(p)} size="small" variant="outlined" />}
                  </Stack>
                </Box>
                <Button component={Link} href={`/proyectos/${p.id}`} variant="outlined" size="small">
                  Ver detalle
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <ProjectFormWizard open={open} onClose={() => setOpen(false)} onCreated={fetchProjects} />
    </>
  );
}
