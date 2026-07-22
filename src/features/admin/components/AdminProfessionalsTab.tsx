"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Chip,
  MenuItem,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { API } from "@/features/auth/hooks/useCurrentUser";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import type { AdminUser } from "@/features/admin/types/users";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import { LabeledSelect } from "@/shared/components/LabeledSelect";
import { PageToolbar, ResponsiveTable, TableEmptyRow, TableLoadingRow } from "@/shared/ui";

type VerifyFilter = "all" | "pending" | "verified";

export function AdminProfessionalsTab() {
  const { market, config } = useAdminMarket();
  const [pros, setPros] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<VerifyFilter>("all");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchPros = useCallback(() => {
    setLoading(true);
    fetch(adminApiUrl("/admin/users?role=professional", market), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: AdminUser[]) => setPros(Array.isArray(data) ? data : []))
      .catch(() => setPros([]))
      .finally(() => setLoading(false));
  }, [market]);

  useEffect(() => {
    fetchPros();
  }, [fetchPros]);

  const verify = async (id: string, isVerified: boolean) => {
    setActionId(id);
    try {
      await fetch(`${API}/admin/users/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVerified }),
      });
      fetchPros();
    } finally {
      setActionId(null);
    }
  };

  const pendingCount = pros.filter((p) => !p.isVerified).length;

  const filtered = pros.filter((p) => {
    if (verifyFilter === "pending" && p.isVerified) return false;
    if (verifyFilter === "verified" && !p.isVerified) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const specialties = (p.profileData?.specialties ?? []).join(" ").toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      specialties.includes(q)
    );
  });

  return (
    <Stack spacing={2}>
      <PageToolbar>
        <TextField
          placeholder="Buscar por nombre, email o especialidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <LabeledSelect
          label="Estado"
          size="small"
          value={verifyFilter}
          onChange={(e) => setVerifyFilter(e.target.value as VerifyFilter)}
          formControlProps={{ size: "small", sx: { minWidth: 180 } }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="pending">Pendientes{pendingCount > 0 ? ` (${pendingCount})` : ""}</MenuItem>
          <MenuItem value="verified">Verificados</MenuItem>
        </LabeledSelect>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {filtered.length} profesional{filtered.length === 1 ? "" : "es"} · {config.label}
        </Typography>
      </PageToolbar>

      <ResponsiveTable minWidth={800}>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Especialidades</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Registro</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableLoadingRow colSpan={6} />
          ) : filtered.length === 0 ? (
            <TableEmptyRow
              colSpan={6}
              message={
                verifyFilter === "pending"
                  ? "No hay profesionales pendientes de verificación."
                  : "No hay profesionales registrados en este mercado."
              }
            />
          ) : (
            filtered.map((pro) => (
              <TableRow key={pro.id}>
                <TableCell>
                  <Typography fontWeight={600}>{pro.name}</Typography>
                </TableCell>
                <TableCell>{pro.email}</TableCell>
                <TableCell>
                  {(pro.profileData?.specialties?.length ?? 0) > 0 ? (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {(pro.profileData?.specialties ?? []).map((s) => (
                        <Chip key={s} label={s} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={pro.isVerified ? "Verificado" : "Pendiente"}
                    size="small"
                    color={pro.isVerified ? "success" : "warning"}
                  />
                </TableCell>
                <TableCell>
                  {new Date(pro.createdAt).toLocaleDateString("es-ES")}
                </TableCell>
                <TableCell align="center">
                  {pro.isVerified ? (
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      disabled={actionId === pro.id}
                      onClick={() => verify(pro.id, false)}
                    >
                      Revocar
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      disabled={actionId === pro.id}
                      onClick={() => verify(pro.id, true)}
                    >
                      Aprobar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </ResponsiveTable>
    </Stack>
  );
}
