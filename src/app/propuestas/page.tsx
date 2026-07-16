"use client";

import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser, API } from "../hooks/useCurrentUser";

interface ProposalWithProject {
  id: string;
  projectId: string;
  laborCost: number;
  message: string | null;
  status: "pending" | "proforma_ready" | "signed" | "rejected";
  createdAt: string;
  project: {
    id: string;
    title: string;
    status: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  proforma_ready: "Proforma lista",
  signed: "Firmada ✓",
  rejected: "Rechazada",
};

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "error"> = {
  pending: "default",
  proforma_ready: "warning",
  signed: "success",
  rejected: "error",
};

export default function PropuestasPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [proposals, setProposals] = useState<ProposalWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    fetch(`${API}/proposals/mine`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setProposals)
      .finally(() => setLoading(false));
  }, [userLoading]);

  return (
    <>
      {userLoading || loading ? (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      ) : proposals.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h6" fontWeight={600} mb={1}>
            Sin propuestas todavía
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role === "professional"
              ? "Explorá los proyectos disponibles y enviá tu primera propuesta."
              : "Las propuestas de los profesionales aparecerán aquí cuando sean enviadas."}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {proposals.map((p) => (
            <Paper
              key={p.id}
              component={Link}
              href={`/proyectos/${p.project?.id ?? p.projectId}`}
              sx={{
                p: 3,
                borderRadius: 3,
                textDecoration: "none",
                color: "inherit",
                display: "block",
                "&:hover": { boxShadow: 3 },
                transition: "box-shadow 0.2s",
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {p.project.title}
                  </Typography>
                  {p.message && (
                    <Typography variant="body2" color="text.secondary" mt={0.5} noWrap sx={{ maxWidth: 480 }}>
                      {p.message}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1.5} alignItems="center" flexShrink={0}>
                  <Typography variant="body2" color="text.secondary">
                    Mano de obra: <strong>${Number(p.laborCost).toLocaleString("es-AR")}</strong>
                  </Typography>
                  <Chip
                    label={STATUS_LABELS[p.status] ?? p.status}
                    color={STATUS_COLORS[p.status] ?? "default"}
                    size="small"
                  />
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </>
  );
}
