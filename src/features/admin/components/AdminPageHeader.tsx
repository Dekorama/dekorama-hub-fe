"use client";

import { Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { PageToolbar } from "@/shared/ui/PageToolbar";

type AdminPageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", sm: "center" }}
      spacing={1.5}
      sx={{ mb: 2 }}
    >
      <Stack spacing={0.25} minWidth={0}>
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      {actions ? (
        <PageToolbar
          spacing={1}
          sx={{
            width: { xs: "100%", sm: "auto" },
            justifyContent: { xs: "stretch", sm: "flex-end" },
            flexShrink: 0,
            "& > *": { minWidth: { xs: "100%", sm: "auto" } },
          }}
        >
          {actions}
        </PageToolbar>
      ) : null}
    </Stack>
  );
}
