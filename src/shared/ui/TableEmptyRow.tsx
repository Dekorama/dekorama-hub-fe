"use client";

import { TableCell, TableRow, Typography } from "@mui/material";

type TableEmptyRowProps = {
  colSpan: number;
  message: string;
};

export function TableEmptyRow({ colSpan, message }: TableEmptyRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
        <Typography color="text.secondary">{message}</Typography>
      </TableCell>
    </TableRow>
  );
}
