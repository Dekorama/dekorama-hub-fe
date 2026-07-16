"use client";

import {
  Alert,
  Box,
  CircularProgress,
  Tab,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { usePageTitle } from "@/shared/components/PageTitleContext";
import { ProjectDepartmentsTab } from "@/features/projects/components/ProjectDepartmentsTab";
import { ProjectNotesTab } from "@/features/projects/components/ProjectNotesTab";
import { ProjectProductsTab } from "@/features/projects/components/ProjectProductsTab";
import { ProjectProgressTab } from "@/features/projects/components/ProjectProgressTab";
import { ProjectProposalsTab } from "@/features/projects/components/ProjectProposalsTab";
import { ProjectSummaryTab } from "@/features/projects/components/ProjectSummaryTab";
import { ProjectTeamTab } from "@/features/projects/components/ProjectTeamTab";
import { Project, ProjectMemberItem, Proposal } from "@/features/projects/types";
import { ScrollableTabs } from "@/shared/ui";

export function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, loading: userLoading } = useCurrentUser();

  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [publishing, setPublishing] = useState(false);

  const fetchAll = async () => {
    const [projRes, propRes, membersRes] = await Promise.all([
      fetch(`${API}/projects/${projectId}`, { credentials: "include" }),
      fetch(`${API}/projects/${projectId}/proposals`, { credentials: "include" }),
      fetch(`${API}/projects/${projectId}/members`, { credentials: "include" }),
    ]);
    if (projRes.ok) setProject(await projRes.json());
    if (propRes.ok) setProposals(await propRes.json());
    if (membersRes.ok) {
      const data = await membersRes.json();
      setMembers(data.members ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { if (!userLoading) fetchAll(); }, [userLoading, projectId]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await fetch(`${API}/projects/${projectId}/publish`, {
        method: "PATCH",
        credentials: "include",
      });
      fetchAll();
    } finally {
      setPublishing(false);
    }
  };

  const isOwner = !!(project && user && project.clientId === user.id);
  const myMember = members.find((m) => m.userId === user?.id);
  const canEdit =
    isOwner ||
    myMember?.role === "editor" ||
    myMember?.role === "owner" ||
    user?.accountType === "community";
  const canManageMembers = isOwner || user?.accountType === "community";

  usePageTitle(project?.title ?? "Proyecto");

  return (
    <>
      {loading || userLoading ? (
        <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
      ) : !project ? (
        <Alert severity="error">Proyecto no encontrado</Alert>
      ) : (
        <Box>
          <ScrollableTabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Resumen" />
            <Tab label="Departamentos" />
            <Tab label="Progreso" />
            <Tab label="Notas" />
            <Tab label="Propuestas" />
            <Tab label="Productos" />
            <Tab label="Equipo" />
          </ScrollableTabs>

          {tab === 0 && (
            <ProjectSummaryTab
              project={project}
              isOwner={isOwner}
              onPublish={handlePublish}
              publishing={publishing}
              onUpdated={fetchAll}
            />
          )}
          {tab === 1 && (
            <ProjectDepartmentsTab project={project} canEdit={canEdit} onUpdated={fetchAll} />
          )}
          {tab === 2 && <ProjectProgressTab project={project} canEdit={canEdit} onUpdated={fetchAll} />}
          {tab === 3 && <ProjectNotesTab project={project} canEdit={canEdit} />}
          {tab === 4 && (
            <ProjectProposalsTab
              project={project}
              user={user}
              proposals={proposals}
              isOwner={isOwner || canEdit}
              onRefresh={fetchAll}
            />
          )}
          {tab === 5 && <ProjectProductsTab project={project} canEdit={canEdit} />}
          {tab === 6 && (
            <ProjectTeamTab project={project} user={user} canManage={canManageMembers} />
          )}
        </Box>
      )}
    </>
  );
}
