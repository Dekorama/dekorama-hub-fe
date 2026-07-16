"use client";

import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { API } from "@/features/auth/hooks/useCurrentUser";
import { SELECT_INPUT_LABEL_PROPS } from "@/shared/components/LabeledSelect";
import {
  DEPARTMENT_LABELS,
  DEPARTMENT_STATUS_LABELS,
  DepartmentStatus,
  ProgressEntry,
  Project,
} from "@/features/projects/types";

interface ProjectProgressTabProps {
  project: Project;
  canEdit: boolean;
  onUpdated?: () => void;
}

export function ProjectProgressTab({ project, canEdit, onUpdated }: ProjectProgressTabProps) {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [progressPercentage, setProgressPercentage] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProgress = () => {
    fetch(`${API}/projects/${project.id}/progress`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setEntries);
  };

  useEffect(() => { fetchProgress(); }, [project.id]);

  const addEntry = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/projects/${project.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          departmentId: departmentId || undefined,
          progressPercentage: progressPercentage ? +progressPercentage : undefined,
        }),
      });
      setTitle("");
      setDescription("");
      setDepartmentId("");
      setProgressPercentage("");
      fetchProgress();
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const updateDeptProgress = async (deptId: string, status: DepartmentStatus, pct: number) => {
    await fetch(`${API}/projects/${project.id}/departments/${deptId}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status, progressPercentage: pct }),
    });
    fetchProgress();
    onUpdated?.();
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>Progreso por departamento</Typography>
        <Stack spacing={2}>
          {project.departments.map((dept) => (
            <Box key={dept.id}>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" fontWeight={600}>{DEPARTMENT_LABELS[dept.department]}</Typography>
                <Typography variant="body2">{dept.progressPercentage}% · {DEPARTMENT_STATUS_LABELS[dept.status]}</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={dept.progressPercentage} sx={{ mb: 1 }} />
              {canEdit && (
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    type="number"
                    label="%"
                    defaultValue={dept.progressPercentage}
                    sx={{ width: 80 }}
                    onBlur={(e) => updateDeptProgress(dept.id, dept.status, +e.target.value)}
                  />
                  <TextField
                    size="small"
                    select
                    label="Estado"
                    defaultValue={dept.status}
                    sx={{ width: 140 }}
                    onChange={(e) => updateDeptProgress(dept.id, e.target.value as DepartmentStatus, dept.progressPercentage)}
                  >
                    {(Object.keys(DEPARTMENT_STATUS_LABELS) as DepartmentStatus[]).map((s) => (
                      <MenuItem key={s} value={s}>{DEPARTMENT_STATUS_LABELS[s]}</MenuItem>
                    ))}
                  </TextField>
                </Stack>
              )}
            </Box>
          ))}
        </Stack>
      </Paper>

      {canEdit && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Nueva entrada de avance</Typography>
          <Stack spacing={2}>
            <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
            <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3} fullWidth />
            <TextField
              select
              label="Departamento (opcional)"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              fullWidth
              InputLabelProps={SELECT_INPUT_LABEL_PROPS}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) return "General";
                  const dept = project.departments.find((d) => d.id === selected);
                  return dept ? DEPARTMENT_LABELS[dept.department] : "General";
                },
              }}
            >
              {project.departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>{DEPARTMENT_LABELS[d.department]}</MenuItem>
              ))}
            </TextField>
            <TextField label="Progreso %" type="number" value={progressPercentage} onChange={(e) => setProgressPercentage(e.target.value)} fullWidth />
            <Button variant="contained" onClick={addEntry} disabled={saving || !title || !description}>
              {saving ? "Guardando..." : "Registrar avance"}
            </Button>
          </Stack>
        </Paper>
      )}

      {!canEdit && <Alert severity="info">Solo editores pueden registrar avances.</Alert>}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>Historial</Typography>
        {entries.length === 0 ? (
          <Typography color="text.secondary">Sin entradas aún.</Typography>
        ) : (
          <Stack spacing={2}>
            {entries.map((entry) => (
              <Box key={entry.id} sx={{ borderLeft: "3px solid", borderColor: "primary.main", pl: 2 }}>
                <Typography fontWeight={700}>{entry.title}</Typography>
                <Typography variant="body2" color="text.secondary">{entry.description}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {entry.createdBy?.name} · {new Date(entry.createdAt).toLocaleString()}
                  {entry.progressPercentage != null && ` · ${entry.progressPercentage}%`}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
