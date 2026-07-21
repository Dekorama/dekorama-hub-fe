"use client";

import { CircularProgress, TableCell, TableRow } from "@mui/material";

type TableLoadingRowProps = {
  colSpan: number;
};

export function TableLoadingRow({ colSpan }: TableLoadingRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
        <CircularProgress size={28} />
      </TableCell>
    </TableRow>
  );
}
