"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { useAppSnackbar } from "@/shared/hooks/useAppSnackbar";
import { readApiError } from "@/features/admin/utils/readApiError";
import { ResponsiveTable } from "@/shared/ui";

interface Family {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export function AdminFamiliesPage() {
  const { user } = useCurrentUser();
  const { showSuccess, showError, SnackbarHost } = useAppSnackbar();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);

  const [familyDialogOpen, setFamilyDialogOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [familyForm, setFamilyForm] = useState({ code: "", name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchFamilies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/products/families/all`, { credentials: "include" });
      if (!res.ok) {
        showError(await readApiError(res, "Error al cargar familias"));
        return;
      }
      setFamilies((await res.json()) as Family[]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (user?.role === "admin") void fetchFamilies();
  }, [user, fetchFamilies]);

  function openCreateFamily() {
    setEditingFamily(null);
    setFamilyForm({ code: "", name: "", description: "" });
    setFamilyDialogOpen(true);
  }

  function openEditFamily(f: Family) {
    setEditingFamily(f);
    setFamilyForm({
      code: f.code,
      name: f.name,
      description: f.description ?? "",
    });
    setFamilyDialogOpen(true);
  }

  async function saveFamily() {
    const name = familyForm.name.trim();
    if (!name) {
      showError("Nombre obligatorio");
      return;
    }
    const code = familyForm.code.trim().toUpperCase();
    if (code && code.length !== 3) {
      showError("Código interno: 3 caracteres o vacío (auto)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        editingFamily
          ? `${API}/products/families/${editingFamily.code}`
          : `${API}/products/families`,
        {
          method: editingFamily ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(
            editingFamily
              ? { name, description: familyForm.description || null }
              : {
                  ...(code ? { code } : {}),
                  name,
                  description: familyForm.description || undefined,
                },
          ),
        },
      );
      if (!res.ok) {
        showError(await readApiError(res, "Error al guardar familia"));
        return;
      }
      showSuccess(editingFamily ? "Familia actualizada" : "Familia creada");
      setFamilyDialogOpen(false);
      await fetchFamilies();
    } finally {
      setSaving(false);
    }
  }

  async function deleteFamily(code: string) {
    if (!confirm(`¿Eliminar familia ${code}?`)) return;
    const res = await fetch(`${API}/products/families/${code}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      showError(await readApiError(res, "Error al eliminar familia"));
      return;
    }
    showSuccess("Familia eliminada");
    await fetchFamilies();
  }

  if (user && user.role !== "admin") {
    return <Typography>No autorizado</Typography>;
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Familias</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateFamily}>
          Nueva familia
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Categoría de producto. El prefijo de SKU lo define el proveedor (enlazado a una o más
        familias).
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <ResponsiveTable minWidth={560} paperSx={{ borderRadius: 3 }}>
          <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {families.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Sin familias</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                families.map((f) => (
                  <TableRow key={f.code} hover>
                    <TableCell>{f.code}</TableCell>
                    <TableCell>{f.name}</TableCell>
                    <TableCell>{f.description ?? "—"}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditFamily(f)} aria-label="Editar">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => void deleteFamily(f.code)}
                        aria-label="Eliminar"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
        </ResponsiveTable>
      )}

      <Dialog open={familyDialogOpen} onClose={() => !saving && setFamilyDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingFamily ? "Editar familia" : "Nueva familia"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editingFamily ? (
              <TextField label="ID" value={familyForm.code} disabled fullWidth />
            ) : (
              <TextField
                label="ID interno (opcional)"
                value={familyForm.code}
                onChange={(e) =>
                  setFamilyForm({ ...familyForm, code: e.target.value.toUpperCase().slice(0, 3) })
                }
                fullWidth
                helperText="3 caracteres. Vacío = se genera del nombre. No es el prefijo de SKU."
              />
            )}
            <TextField
              label="Nombre"
              value={familyForm.name}
              onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Descripción"
              value={familyForm.description}
              onChange={(e) => setFamilyForm({ ...familyForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFamilyDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void saveFamily()} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarHost />
    </>
  );
}
