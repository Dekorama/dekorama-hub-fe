"use client";

import { Stack, type StackProps } from "@mui/material";
import type { ReactNode } from "react";

type PageToolbarProps = Omit<StackProps, "direction"> & {
  children: ReactNode;
};

export function PageToolbar({ children, sx, spacing = 2, ...props }: PageToolbarProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={spacing}
      alignItems={{ xs: "stretch", sm: "center" }}
      flexWrap="wrap"
      useFlexGap
      sx={{
        width: "100%",
        "& > *": {
          minWidth: { xs: "100%", sm: "auto" },
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Stack>
  );
}
