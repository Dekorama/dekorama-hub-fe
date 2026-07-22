"use client";

import { useEffect, useState } from "react";
import {
  Chip,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import type { AdminUser } from "@/features/admin/types/users";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import { PageToolbar, ResponsiveTable, TableEmptyRow, TableLoadingRow } from "@/shared/ui";

const ACCOUNT_LABEL: Record<string, string> = {
  individual: "Individual",
  community: "Comunidad",
  member: "Miembro",
};

export function AdminClientsTab() {
  const { market, config } = useAdminMarket();
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(adminApiUrl("/admin/users?role=client", market), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: AdminUser[]) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [market]);

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.profileData?.company?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <Stack spacing={2}>
      <PageToolbar>
        <TextField
          placeholder="Buscar por nombre, email o empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {filtered.length} cliente{filtered.length === 1 ? "" : "s"} · {config.label}
        </Typography>
      </PageToolbar>

      <ResponsiveTable minWidth={720}>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>IVA</TableCell>
            <TableCell>Registro</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableLoadingRow colSpan={5} />
          ) : filtered.length === 0 ? (
            <TableEmptyRow colSpan={5} message="No hay clientes registrados en este mercado." />
          ) : (
            filtered.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <Typography fontWeight={600}>{client.name}</Typography>
                  {client.profileData?.phone ? (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {client.profileData.phone}
                    </Typography>
                  ) : null}
                  {client.profileData?.company ? (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {client.profileData.company}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>
                  {client.accountType
                    ? ACCOUNT_LABEL[client.accountType] ?? client.accountType
                    : "—"}
                </TableCell>
                <TableCell>
                  {client.taxExempt ? (
                    <Chip label="Exento" size="small" color="default" />
                  ) : (
                    <Typography variant="body2">
                      {client.taxRate != null ? `${Number(client.taxRate)}%` : `${config.taxRate}%`}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(client.createdAt).toLocaleDateString("es-ES")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </ResponsiveTable>
    </Stack>
  );
}
