"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { API, CurrentUser } from "../../hooks/useCurrentUser";
import { SELECT_INPUT_LABEL_PROPS } from "../../components/LabeledSelect";
import {
  CommunityMemberItem,
  MEMBER_ROLE_LABELS,
  Project,
  ProjectInvitationItem,
  ProjectMemberItem,
  ProjectMemberRole,
} from "../types";

interface ProjectTeamTabProps {
  project: Project;
  user: CurrentUser | null;
  canManage: boolean;
}

export function ProjectTeamTab({ project, user, canManage }: ProjectTeamTabProps) {
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitationItem[]>([]);
  const [communityMembers, setCommunityMembers] = useState<CommunityMemberItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [memberRole, setMemberRole] = useState<ProjectMemberRole>("viewer");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectMemberRole>("viewer");

  const fetchTeam = () => {
    fetch(`${API}/projects/${project.id}/members`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { members: [], invitations: [] }))
      .then((data: { members: ProjectMemberItem[]; invitations: ProjectInvitationItem[] }) => {
        setMembers(data.members ?? []);
        setInvitations(data.invitations ?? []);
      });
  };

  useEffect(() => {
    fetchTeam();
    if (user?.accountType === "community") {
      fetch(`${API}/communities/members`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then(setCommunityMembers);
    }
  }, [project.id, user?.accountType]);

  const assignMember = async () => {
    if (!selectedMemberId) return;
    await fetch(`${API}/projects/${project.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: selectedMemberId, role: memberRole }),
    });
    setSelectedMemberId("");
    fetchTeam();
  };

  const inviteByEmail = async () => {
    await fetch(`${API}/projects/${project.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    setInviteEmail("");
    fetchTeam();
  };

  const removeMember = async (userId: string) => {
    await fetch(`${API}/projects/${project.id}/members/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchTeam();
  };

  const getResidentBadge = (userId: string) => {
    const cm = communityMembers.find((m) => m.id === userId);
    if (!cm?.residentProfile?.unitNumber) return null;
    return `Unidad ${cm.residentProfile.unitNumber}`;
  };

  return (
    <Stack spacing={2}>
      {!canManage && <Alert severity="info">Solo el dueño puede gestionar el equipo.</Alert>}

      {canManage && user?.accountType === "community" && communityMembers.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Asignar vecino de la comunidad</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              select
              label="Vecino"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              fullWidth
              InputLabelProps={SELECT_INPUT_LABEL_PROPS}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) return "Seleccionar vecino";
                  const member = communityMembers.find((m) => m.id === selected);
                  if (!member) return String(selected);
                  const unit = member.residentProfile?.unitNumber
                    ? ` · Unidad ${member.residentProfile.unitNumber}`
                    : "";
                  return `${member.name} (${member.email})${unit}`;
                },
              }}
            >
              {communityMembers.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name} ({m.email})
                  {m.residentProfile?.unitNumber && ` · Unidad ${m.residentProfile.unitNumber}`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Rol"
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value as ProjectMemberRole)}
              sx={{ minWidth: 120 }}
              InputLabelProps={SELECT_INPUT_LABEL_PROPS}
            >
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="viewer">Lector</MenuItem>
            </TextField>
            <Button variant="contained" onClick={assignMember} disabled={!selectedMemberId}>Asignar</Button>
          </Stack>
        </Paper>
      )}

      {canManage && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Invitar por email</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField label="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} fullWidth />
            <TextField
              select
              label="Rol"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as ProjectMemberRole)}
              sx={{ minWidth: 120 }}
              InputLabelProps={SELECT_INPUT_LABEL_PROPS}
            >
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="viewer">Lector</MenuItem>
            </TextField>
            <Button variant="contained" onClick={inviteByEmail} disabled={!inviteEmail}>Invitar</Button>
          </Stack>
        </Paper>
      )}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>Miembros ({members.length})</Typography>
        {members.length === 0 ? (
          <Typography color="text.secondary">Sin miembros asignados.</Typography>
        ) : (
          <Stack spacing={1}>
            {members.map((m) => (
              <Stack key={m.id} direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={600}>{m.user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.user.email}</Typography>
                  <Stack direction="row" spacing={0.5} mt={0.5}>
                    <Chip label={MEMBER_ROLE_LABELS[m.role]} size="small" />
                    {getResidentBadge(m.userId) && (
                      <Chip label={getResidentBadge(m.userId)!} size="small" variant="outlined" />
                    )}
                  </Stack>
                </Box>
                {canManage && m.userId !== project.clientId && (
                  <Button size="small" color="error" onClick={() => removeMember(m.userId)}>Quitar</Button>
                )}
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      {invitations.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Invitaciones pendientes</Typography>
          {invitations.map((inv) => (
            <Typography key={inv.id} variant="body2">
              {inv.inviteeEmail} · {MEMBER_ROLE_LABELS[inv.role]} · {inv.status}
            </Typography>
          ))}
        </Paper>
      )}
    </Stack>
  );
}
