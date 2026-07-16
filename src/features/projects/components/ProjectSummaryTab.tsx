"use client";

import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";
import { ProjectEditDialog } from "./ProjectEditDialog";
import { Project, STATUS_LABELS, formatAddress, PROJECT_TYPE_LABELS } from "@/features/projects/types";

interface ProjectSummaryTabProps {
  project: Project;
  isOwner: boolean;
  onPublish: () => void;
  publishing: boolean;
  onUpdated: () => void;
}

export function ProjectSummaryTab({ project, isOwner, onPublish, publishing, onUpdated }: ProjectSummaryTabProps) {
  const [editOpen, setEditOpen] = useState(false);
  const address = formatAddress(project);

  return (
    <>
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        {isOwner && (
          <Box display="flex" justifyContent="flex-end">
            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
              Editar información
            </Button>
          </Box>
        )}

        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
          <Chip label={project.isPublic ? "Público" : "Privado"} color={project.isPublic ? "success" : "default"} size="small" />
          <Chip label={STATUS_LABELS[project.status] ?? project.status} size="small" variant="outlined" />
          <Chip label={PROJECT_TYPE_LABELS[project.projectType]} size="small" variant="outlined" />
          {project.budget && <Chip label={`$${project.budget}`} size="small" variant="outlined" />}
          {project.isDetailed && <Chip label="Publicado" color="info" size="small" />}
        </Stack>

        <Typography variant="body1">{project.description}</Typography>

        {address && (
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>Ubicación</Typography>
            <Typography variant="body2" color="text.secondary">{address}</Typography>
          </Box>
        )}

        {isOwner && !project.isDetailed && (
          <Button variant="contained" onClick={onPublish} disabled={publishing}>
            {publishing ? "Publicando..." : "Publicar proyecto detallado"}
          </Button>
        )}
      </Stack>
    </Paper>

    {isOwner && (
      <ProjectEditDialog
        open={editOpen}
        project={project}
        onClose={() => setEditOpen(false)}
        onSaved={onUpdated}
      />
    )}
    </>
  );
}
