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
import AssignmentIcon from "@mui/icons-material/Assignment";
import EngineeringIcon from "@mui/icons-material/Engineering";
import HomeRepairServiceIcon from "@mui/icons-material/HomeRepairService";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { formatMarketBadge } from "@/shared/utils/market";
import { AdminDashboard } from "@/features/admin/components/AdminDashboard";

export function DashboardHomePage() {
  const { user, loading } = useCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <>
      {loading ? (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          {!isAdmin && (
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              color: "#fff",
              background: "linear-gradient(135deg, #ff6f00 0%, #e65100 100%)",
              boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start" justifyContent="space-between">
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap">
                  <Typography variant="h5" fontWeight={800}>
                    Hola {user?.name ?? user?.email},
                  </Typography>
                  <Chip
                    label={user?.role === "professional" ? (user.isVerified ? "Verificado ✓" : "Pendiente verificación") : user?.role}
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff" }}
                  />
                  {user?.country && (
                    <Chip
                      label={formatMarketBadge(user.country)}
                      size="small"
                      sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff" }}
                    />
                  )}
                </Stack>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {user?.role === "client"
                    ? "Crea tus proyectos, compra materiales Dekorama y recibe propuestas de profesionales verificados."
                    : "Explora proyectos abiertos y envía propuestas con materiales Dekorama o por cuenta propia."}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mt={3}>
                  <Button
                    component={Link}
                    href="/proyectos"
                    variant="contained"
                    sx={{ bgcolor: "#fff", color: "#ff6f00", fontWeight: 700, "&:hover": { bgcolor: "#fff3e0" } }}
                  >
                    {user?.role === "client" ? "Mis proyectos" : "Ver proyectos"}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Paper>
          )}

          {isAdmin && user && <AdminDashboard user={user} />}

          {!isAdmin && (
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <AssignmentIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>Proyectos</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {user?.role === "client"
                    ? "Gestiona tus proyectos, controla el estado y revisa cotizaciones antes de comprar materiales."
                    : "Explora el feed público de proyectos y licita en tu mercado."}
                </Typography>
                <Button component={Link} href="/proyectos" variant="outlined" size="small">Ver proyectos</Button>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <EngineeringIcon color="secondary" />
                  <Typography variant="h6" fontWeight={700}>Propuestas</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {user?.role === "professional"
                    ? "Revisa tus propuestas enviadas y el estado de aprobación."
                    : "Recibe y evalúa propuestas de profesionales verificados para tus proyectos."}
                </Typography>
                <Button component={Link} href="/proyectos" variant="outlined" size="small" color="secondary">
                  Ver propuestas
                </Button>
              </Paper>
            </Stack>
          )}

          {isAdmin && (
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <HomeRepairServiceIcon color="secondary" />
                  <Typography variant="h6" fontWeight={700}>Catálogo de productos</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Administra productos, familias y precios por mercado.
                </Typography>
                <Button component={Link} href="/admin/productos" variant="outlined" size="small" color="secondary">
                  Ir al catálogo
                </Button>
              </Paper>
              <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <AssignmentIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>Proyectos</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Filtra y gestiona proyectos por país del cliente.
                </Typography>
                <Button component={Link} href="/admin/proyectos" variant="outlined" size="small">
                  Ver proyectos
                </Button>
              </Paper>
            </Stack>
          )}
        </Stack>
      )}
    </>
  );
}
