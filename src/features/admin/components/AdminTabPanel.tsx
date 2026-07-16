"use client";

import { Box } from "@mui/material";
import { ReactNode } from "react";

interface AdminTabPanelProps {
  value: number;
  index: number;
  children: ReactNode;
}

export function AdminTabPanel({ value, index, children }: AdminTabPanelProps) {
  const active = value === index;

  return (
    <Box
      role="tabpanel"
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      hidden={!active}
      sx={{
        display: active ? "block" : "none",
        minHeight: 420,
        pt: 2,
      }}
    >
      {children}
    </Box>
  );
}
