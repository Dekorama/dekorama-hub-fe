"use client";

import { Tabs, type TabsProps } from "@mui/material";

export function ScrollableTabs({
  variant = "scrollable",
  scrollButtons = "auto",
  allowScrollButtonsMobile = true,
  ...props
}: TabsProps) {
  return (
    <Tabs
      variant={variant}
      scrollButtons={scrollButtons}
      allowScrollButtonsMobile={allowScrollButtonsMobile}
      {...props}
    />
  );
}
