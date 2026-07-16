"use client";

import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { API } from "@/features/auth/hooks/useCurrentUser";
import { Project, ProjectNoteItem } from "@/features/projects/types";

interface ProjectNotesTabProps {
  project: Project;
  canEdit: boolean;
}

export function ProjectNotesTab({ project, canEdit }: ProjectNotesTabProps) {
  const [notes, setNotes] = useState<ProjectNoteItem[]>([]);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchNotes = () => {
    fetch(`${API}/projects/${project.id}/notes`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setNotes);
  };

  useEffect(() => { fetchNotes(); }, [project.id]);

  const addNote = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/projects/${project.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      setContent("");
      fetchNotes();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2}>
      {canEdit && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Nueva nota</Typography>
          <Stack spacing={2}>
            <TextField value={content} onChange={(e) => setContent(e.target.value)} multiline rows={3} fullWidth placeholder="Escribe una nota sobre la obra..." />
            <Button variant="contained" onClick={addNote} disabled={saving || !content.trim()}>
              {saving ? "Guardando..." : "Agregar nota"}
            </Button>
          </Stack>
        </Paper>
      )}

      {!canEdit && <Alert severity="info">Solo editores pueden agregar notas.</Alert>}

      {notes.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography color="text.secondary">No hay notas aún.</Typography>
        </Paper>
      ) : (
        notes.map((note) => (
          <Paper key={note.id} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="body1" mb={1}>{note.content}</Typography>
            <Typography variant="caption" color="text.secondary">
              {note.author?.name} · {new Date(note.createdAt).toLocaleString()}
            </Typography>
          </Paper>
        ))
      )}
    </Stack>
  );
}
