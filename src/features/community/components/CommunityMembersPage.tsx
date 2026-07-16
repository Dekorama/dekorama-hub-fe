"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { CommunityMemberItem } from "@/features/projects/types";
import { ResponsiveTable } from "@/shared/ui";

export function CommunityMembersPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [members, setMembers] = useState<CommunityMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMember, setEditMember] = useState<CommunityMemberItem | null>(null);
  const [unitNumber, setUnitNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [isOccupant, setIsOccupant] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMembers = () => {
    fetch(`${API}/communities/members`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setMembers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (!userLoading) fetchMembers(); }, [userLoading]);

  const openEdit = (member: CommunityMemberItem) => {
    setEditMember(member);
    setUnitNumber(member.residentProfile?.unitNumber ?? "");
    setFloor(member.residentProfile?.floor ?? "");
    setIsOccupant(member.residentProfile?.isOccupant ?? true);
    setNotes(member.residentProfile?.notes ?? "");
  };

  const saveProfile = async () => {
    if (!editMember) return;
    setSaving(true);
    try {
      await fetch(`${API}/communities/members/${editMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ unitNumber, floor, isOccupant, notes }),
      });
      setEditMember(null);
      fetchMembers();
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
    );
  }

  if (user?.accountType !== "community") {
    return (
      <Alert severity="warning">Solo organizadores comunitarios pueden acceder.</Alert>
    );
  }

  return (
    <>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          Gestiona los vecinos de tu comunidad: unidad, piso y ocupación.
        </Typography>

        <ResponsiveTable minWidth={640} paperSx={{ borderRadius: 3 }}>
          <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Piso</TableCell>
                <TableCell>Ocupante</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={2}>No hay miembros registrados aún.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>{m.residentProfile?.unitNumber ?? "N/D"}</TableCell>
                    <TableCell>{m.residentProfile?.floor ?? "N/D"}</TableCell>
                    <TableCell>
                      <Chip
                        label={m.residentProfile?.isOccupant !== false ? "Sí" : "No"}
                        size="small"
                        color={m.residentProfile?.isOccupant !== false ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(m)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
        </ResponsiveTable>
      </Stack>

      <Dialog open={!!editMember} onClose={() => setEditMember(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Datos del residente</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Unidad / apartamento" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} fullWidth />
            <TextField label="Piso" value={floor} onChange={(e) => setFloor(e.target.value)} fullWidth />
            <TextField
              label="¿Es ocupante?"
              select
              value={isOccupant ? "yes" : "no"}
              onChange={(e) => setIsOccupant(e.target.value === "yes")}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </TextField>
            <TextField label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={2} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMember(null)}>Cancelar</Button>
          <Button variant="contained" onClick={saveProfile} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
