"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import { LabeledSelect } from "@/shared/components/LabeledSelect";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import {
  buildAdminProjectsQuery,
  type AdminProjectFilters,
  type CountryFilterMode,
} from "@/features/admin/utils/adminProjectsApi";
import {
  formatAddress,
  PROJECT_TYPE_LABELS,
  STATUS_LABELS,
  type Project,
  type ProjectType,
} from "@/features/projects/types";
import { getMarketLabel, MARKET_OPTIONS, type MarketCode } from "@/shared/utils/market";
import { PageToolbar, ResponsiveTable } from "@/shared/ui";

const STATUS_COLORS: Record<string, "success" | "warning" | "info" | "default"> = {
  open: "success",
  reviewing: "warning",
  in_progress: "info",
  completed: "default",
};

interface AdminProject extends Project {
  client?: { id: string; name: string; email: string };
}

const DEFAULT_FILTERS: AdminProjectFilters = {
  search: "",
  countryMode: "active",
  status: "",
  projectType: "",
  visibility: "",
};

export function AdminProjectsPage() {
  const { user } = useCurrentUser();
  const { market } = useAdminMarket();
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AdminProjectFilters>(DEFAULT_FILTERS);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const path = buildAdminProjectsQuery(filters, market);
      const res = await fetch(`${API}${path}`, { credentials: "include" });
      if (res.ok) {
        setProjects(await res.json());
      } else {
        setProjects([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, market]);

  useEffect(() => {
    if (user?.role === "admin") {
      void fetchProjects();
    }
  }, [user, fetchProjects]);

  function updateFilter<K extends keyof AdminProjectFilters>(
    key: K,
    value: AdminProjectFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const countryLabel =
    filters.countryMode === "active"
      ? `Tienda activa (${getMarketLabel(market)})`
      : filters.countryMode === "all"
        ? "Todos los países"
        : getMarketLabel(filters.countryMode);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Proyectos
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <PageToolbar>
          <TextField
            label="Buscar"
            placeholder="Título, cliente, localidad..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            sx={{ minWidth: { xs: "100%", md: 240 }, flex: 1 }}
          />
          <LabeledSelect
            label="País"
            value={filters.countryMode}
            onChange={(e) =>
              updateFilter("countryMode", e.target.value as CountryFilterMode)
            }
            formControlProps={{ sx: { minWidth: 180 } }}
          >
            <MenuItem value="active">Tienda activa</MenuItem>
            <MenuItem value="all">Todos</MenuItem>
            {MARKET_OPTIONS.map((code) => (
              <MenuItem key={code} value={code}>
                {getMarketLabel(code)}
              </MenuItem>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Estado"
            value={filters.status}
            emptyLabel="Todos"
            onChange={(e) => updateFilter("status", e.target.value)}
            formControlProps={{ sx: { minWidth: 160 } }}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Tipo"
            value={filters.projectType}
            emptyLabel="Todos"
            onChange={(e) => updateFilter("projectType", e.target.value)}
            formControlProps={{ sx: { minWidth: 160 } }}
          >
            {(Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]).map(
              ([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ),
            )}
          </LabeledSelect>
          <LabeledSelect
            label="Visibilidad"
            value={filters.visibility}
            emptyLabel="Todos"
            onChange={(e) => updateFilter("visibility", e.target.value)}
            formControlProps={{ sx: { minWidth: 150 } }}
          >
            <MenuItem value="public">Públicos</MenuItem>
            <MenuItem value="private">Privados</MenuItem>
          </LabeledSelect>
        </PageToolbar>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
          Filtro país: {countryLabel}
        </Typography>
      </Paper>

      <ResponsiveTable minWidth={800} paperSx={{ borderRadius: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell>Proyecto</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>País</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Visibilidad</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            )}
            {!loading && projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No hay proyectos con estos filtros
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Typography fontWeight={600}>{project.title}</Typography>
                    {formatAddress(project) && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatAddress(project)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.client?.name ?? "N/D"}
                    {project.client?.email && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {project.client.email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        project.country === "VE" || project.country === "ES"
                          ? getMarketLabel(project.country as MarketCode)
                          : project.country
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={STATUS_LABELS[project.status] ?? project.status}
                      color={STATUS_COLORS[project.status] ?? "default"}
                    />
                  </TableCell>
                  <TableCell>
                    {PROJECT_TYPE_LABELS[project.projectType] ?? project.projectType}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {project.isPublic ? (
                        <PublicIcon fontSize="small" color="success" />
                      ) : (
                        <LockIcon fontSize="small" color="disabled" />
                      )}
                      <Typography variant="body2">
                        {project.isPublic ? "Público" : "Privado"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {new Date(project.createdAt).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell>
                    <Button
                      component={Link}
                      href={`/proyectos/${project.id}`}
                      size="small"
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
      </ResponsiveTable>
    </>
  );
}
