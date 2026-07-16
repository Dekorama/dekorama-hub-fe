"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { API } from "../../hooks/useCurrentUser";
import { getMarketLabel, type MarketCode } from "../../utils/market";
import { Project } from "../types";

interface ProjectEditDialogProps {
  open: boolean;
  project: Project;
  onClose: () => void;
  onSaved: () => void;
}

export function ProjectEditDialog({ open, project, onClose, onSaved }: ProjectEditDialogProps) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [isPublic, setIsPublic] = useState(project.isPublic);
  const [budget, setBudget] = useState(project.budget?.toString() ?? "");
  const [location, setLocation] = useState(project.location ?? "");
  const [locality, setLocality] = useState(project.locality ?? "");
  const [state, setState] = useState(project.state ?? "");
  const [postalCode, setPostalCode] = useState(project.postalCode ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(project.title);
    setDescription(project.description);
    setIsPublic(project.isPublic);
    setBudget(project.budget?.toString() ?? "");
    setLocation(project.location ?? "");
    setLocality(project.locality ?? "");
    setState(project.state ?? "");
    setPostalCode(project.postalCode ?? "");
    setError("");
  }, [open, project]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          isPublic,
          budget: budget ? +budget : null,
          location: location.trim() || null,
          locality: locality.trim() || null,
          state: state.trim() || null,
          postalCode: postalCode.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al guardar");
      }
      onClose();
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar proyecto</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
          <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3} required fullWidth />
          <TextField label="Presupuesto (USD)" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} fullWidth />
          <TextField label="Dirección / edificio" value={location} onChange={(e) => setLocation(e.target.value)} fullWidth />
          <TextField label="Ciudad" value={locality} onChange={(e) => setLocality(e.target.value)} fullWidth />
          <TextField label="Estado / provincia" value={state} onChange={(e) => setState(e.target.value)} fullWidth />
          <TextField label="Código postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} fullWidth />
          <TextField
            label="País / mercado"
            value={getMarketLabel((project.country as MarketCode) ?? "VE")}
            fullWidth
            disabled
            helperText="Definido por el país del cliente al registrarse"
          />
          <FormControlLabel
            control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
            label={isPublic ? "Proyecto público" : "Proyecto privado"}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !title.trim() || !description.trim()}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
