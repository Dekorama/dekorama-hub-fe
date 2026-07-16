"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { API } from "@/features/auth/hooks/useCurrentUser";
import {
  DEPARTMENT_LABELS,
  DepartmentType,
  Project,
  ProjectDepartment,
  ProjectType,
} from "@/features/projects/types";

interface ProjectDepartmentsTabProps {
  project: Project;
  canEdit: boolean;
  onUpdated: () => void;
}

const ALL_DEPARTMENTS = Object.keys(DEPARTMENT_LABELS) as DepartmentType[];

function enrichFieldsForType(projectType: ProjectType, dept: ProjectDepartment) {
  const base = { technicalDetails: dept.technicalDetails ?? "" };
  if (projectType === "reconstruction") {
    return { ...base, damageDescription: dept.damageDescription ?? "" };
  }
  if (projectType === "renovation") {
    return { ...base, designNotes: dept.designNotes ?? "" };
  }
  return { ...base, blueprints: dept.blueprints ?? [] };
}

function DepartmentsSetup({
  project,
  canEdit,
  onUpdated,
}: ProjectDepartmentsTabProps) {
  const [selected, setSelected] = useState<DepartmentType[]>(["structure"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (dept: DepartmentType) => {
    setSelected((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
  };

  const handleSetup = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/projects/${project.id}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ departments: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al configurar departamentos");
      }
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al configurar departamentos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={700}>
          Configurar departamentos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Este proyecto aún no tiene departamentos. Selecciona las áreas de trabajo de la obra.
        </Typography>
        {!canEdit ? (
          <Alert severity="info">Solo el creador o editores pueden configurar departamentos.</Alert>
        ) : (
          <>
            {ALL_DEPARTMENTS.map((dept) => (
              <FormControlLabel
                key={dept}
                control={
                  <Checkbox
                    checked={selected.includes(dept)}
                    onChange={() => toggle(dept)}
                  />
                }
                label={DEPARTMENT_LABELS[dept]}
              />
            ))}
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              variant="contained"
              onClick={handleSetup}
              disabled={saving || selected.length === 0}
            >
              {saving ? "Guardando..." : "Agregar departamentos"}
            </Button>
          </>
        )}
      </Stack>
    </Paper>
  );
}

export function ProjectDepartmentsTab({ project, canEdit, onUpdated }: ProjectDepartmentsTabProps) {
  const departments = project.departments ?? [];
  const [savingId, setSavingId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, ReturnType<typeof enrichFieldsForType>>>({});

  useEffect(() => {
    setForms(
      Object.fromEntries(
        departments.map((d) => [d.id, enrichFieldsForType(project.projectType, d)]),
      ),
    );
  }, [departments, project.projectType]);

  const updateField = (deptId: string, field: string, value: string) => {
    setForms((prev) => ({ ...prev, [deptId]: { ...prev[deptId], [field]: value } }));
  };

  const saveDepartment = async (deptId: string) => {
    setSavingId(deptId);
    try {
      await fetch(`${API}/projects/${project.id}/departments/${deptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(forms[deptId]),
      });
      onUpdated();
    } finally {
      setSavingId(null);
    }
  };

  if (departments.length === 0) {
    return (
      <DepartmentsSetup project={project} canEdit={canEdit} onUpdated={onUpdated} />
    );
  }

  return (
    <Stack spacing={2}>
      {!canEdit && (
        <Alert severity="info">Solo editores pueden modificar departamentos.</Alert>
      )}
      {departments.map((dept) => (
        <Paper key={dept.id} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            {DEPARTMENT_LABELS[dept.department]}
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Detalles técnicos"
              value={forms[dept.id]?.technicalDetails ?? ""}
              onChange={(e) => updateField(dept.id, "technicalDetails", e.target.value)}
              multiline rows={3}
              fullWidth
              disabled={!canEdit}
            />
            {project.projectType === "reconstruction" && (
              <TextField
                label="Descripción de daños"
                value={(forms[dept.id] as { damageDescription?: string })?.damageDescription ?? ""}
                onChange={(e) => updateField(dept.id, "damageDescription", e.target.value)}
                multiline rows={2}
                fullWidth
                disabled={!canEdit}
              />
            )}
            {project.projectType === "renovation" && (
              <TextField
                label="Notas de diseño"
                value={(forms[dept.id] as { designNotes?: string })?.designNotes ?? ""}
                onChange={(e) => updateField(dept.id, "designNotes", e.target.value)}
                multiline rows={2}
                fullWidth
                disabled={!canEdit}
              />
            )}
            {project.projectType === "new_build" && (
              <TextField
                label="Planos (URLs separadas por coma)"
                value={((forms[dept.id] as { blueprints?: string[] })?.blueprints ?? []).join(", ")}
                onChange={(e) =>
                  setForms((prev) => ({
                    ...prev,
                    [dept.id]: {
                      ...prev[dept.id],
                      blueprints: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    },
                  }))
                }
                fullWidth
                disabled={!canEdit}
              />
            )}
            {canEdit && (
              <Box>
                <Button variant="contained" size="small" onClick={() => saveDepartment(dept.id)} disabled={savingId === dept.id}>
                  {savingId === dept.id ? "Guardando..." : "Guardar departamento"}
                </Button>
              </Box>
            )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
