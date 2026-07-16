"use client";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { API, useCurrentUser } from "../../hooks/useCurrentUser";
import { LabeledSelect } from "../../components/LabeledSelect";
import { getMarketConfig, getMarketLabel, type MarketCode } from "../../utils/market";
import { DEPARTMENT_LABELS, DepartmentType, PROJECT_TYPE_LABELS, ProjectType } from "../types";

const ALL_DEPARTMENTS = Object.keys(DEPARTMENT_LABELS) as DepartmentType[];

interface ProjectFormWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ProjectFormWizard({ open, onClose, onCreated }: ProjectFormWizardProps) {
  const { user } = useCurrentUser(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("reconstruction");
  const [budget, setBudget] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [location, setLocation] = useState("");
  const [locality, setLocality] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState<MarketCode>("VE");

  const [departments, setDepartments] = useState<DepartmentType[]>(["structure"]);

  useEffect(() => {
    if (user?.country) {
      setCountry(user.country);
    }
  }, [user?.country, open]);

  const reset = () => {
    setStep(0);
    setTitle("");
    setDescription("");
    setProjectType("reconstruction");
    setBudget("");
    setIsPublic(true);
    setLocation("");
    setLocality("");
    setState("");
    setPostalCode("");
    setCountry(user?.country ?? "VE");
    setDepartments(["structure"]);
  };

  const toggleDepartment = (dept: DepartmentType) => {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          isPublic,
          projectType,
          budget: budget ? +budget : undefined,
          location: location || undefined,
          locality: locality || undefined,
          state: state || undefined,
          postalCode: postalCode || undefined,
          departments,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al crear proyecto");
      }
      reset();
      onClose();
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  const canNext =
    step === 0
      ? title.trim() && description.trim()
      : step === 1
        ? location.trim() && locality.trim()
        : departments.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nuevo proyecto</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3, mt: 1 }}>
          <Step><StepLabel>Datos</StepLabel></Step>
          <Step><StepLabel>Ubicación</StepLabel></Step>
          <Step><StepLabel>Departamentos</StepLabel></Step>
        </Stepper>

        {step === 0 && (
          <Stack spacing={2}>
            <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
            <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3} required fullWidth />
            <LabeledSelect
              label="Tipo de obra"
              value={projectType}
              fullWidth
              formControlProps={{ fullWidth: true }}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
            >
              {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((t) => (
                <MenuItem key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</MenuItem>
              ))}
            </LabeledSelect>
            <TextField
              label={`Presupuesto estimado (${getMarketConfig(country).currency})`}
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              fullWidth
            />
            <FormControlLabel
              control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
              label={isPublic ? "Público (visible en feed)" : "Privado"}
            />
          </Stack>
        )}

        {step === 1 && (
          <Stack spacing={2}>
            <TextField label="Dirección / edificio" value={location} onChange={(e) => setLocation(e.target.value)} required fullWidth />
            <TextField label="Ciudad" value={locality} onChange={(e) => setLocality(e.target.value)} required fullWidth />
            <TextField label="Estado / provincia" value={state} onChange={(e) => setState(e.target.value)} fullWidth />
            <TextField label="Código postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} fullWidth />
            <TextField
              label="País / mercado"
              value={getMarketLabel(country)}
              fullWidth
              disabled
              helperText="El proyecto se crea en tu tienda registrada"
            />
          </Stack>
        )}

        {step === 2 && (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Selecciona los departamentos afectados en la obra:
            </Typography>
            {ALL_DEPARTMENTS.map((dept) => (
              <FormControlLabel
                key={dept}
                control={<Checkbox checked={departments.includes(dept)} onChange={() => toggleDepartment(dept)} />}
                label={DEPARTMENT_LABELS[dept]}
              />
            ))}
            <Box sx={{ p: 1.5, bgcolor: "grey.100", borderRadius: 2, mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Después podrás enriquecer cada departamento con notas técnicas y publicar el proyecto.
              </Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>Atrás</Button>}
        {step < 2 ? (
          <Button variant="contained" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Siguiente
          </Button>
        ) : (
          <Button variant="contained" onClick={handleCreate} disabled={saving || !canNext}>
            {saving ? "Guardando..." : "Crear proyecto"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
