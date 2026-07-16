"use client";

import {
  Paper,
  Table,
  TableContainer,
  type PaperProps,
  type TableContainerProps,
  type TableProps,
} from "@mui/material";
import type { ReactNode } from "react";

type ResponsiveTableProps = {
  children: ReactNode;
  minWidth?: number | string;
  size?: TableProps["size"];
  stickyHeader?: TableProps["stickyHeader"];
  paperSx?: PaperProps["sx"];
  containerSx?: TableContainerProps["sx"];
  tableSx?: TableProps["sx"];
  elevation?: PaperProps["elevation"];
};

export function ResponsiveTable({
  children,
  minWidth = 640,
  size = "small",
  stickyHeader,
  paperSx,
  containerSx,
  tableSx,
  elevation = 0,
}: ResponsiveTableProps) {
  return (
    <Paper
      elevation={elevation}
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        ...paperSx,
      }}
    >
      <TableContainer
        sx={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          ...containerSx,
        }}
      >
        <Table
          size={size}
          stickyHeader={stickyHeader}
          sx={{ minWidth, ...tableSx }}
        >
          {children}
        </Table>
      </TableContainer>
    </Paper>
  );
}
