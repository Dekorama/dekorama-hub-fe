"use client";

import { useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import { ClearableNumberField } from "@/shared/ui";
import {
  boxesForM2,
  displayUnitLabel,
  formatQty,
  isM2Unit,
  lineNetTotal,
  m2PerBox,
  roundM2ToFullBoxes,
} from "@/features/admin/utils/lineItemMath";

export type BudgetLineEditable = {
  unit: string;
  quantity: number;
  suggestedPrice: number;
  discountPct: number;
  piecesPerBox: number | null;
  unitPerPiece: number | null;
  externalComment: string;
  internalComment: string;
};

type BudgetLineRowProps = {
  line: BudgetLineEditable;
  onChange: (patch: Partial<BudgetLineEditable>) => void;
  /** Cells rendered before the quantity column (SKU, product, autocomplete…). */
  leadingCells: ReactNode;
  /** Optional cell after Ud (e.g. Pedido ratio). */
  afterUnitCell?: ReactNode;
  commentsColSpan: number;
  onDelete?: () => void;
  canDelete?: boolean;
};

export function BudgetLineRow({
  line,
  onChange,
  leadingCells,
  afterUnitCell,
  commentsColSpan,
  onDelete,
  canDelete = true,
}: BudgetLineRowProps) {
  const hasComments =
    Boolean(line.externalComment?.trim()) || Boolean(line.internalComment?.trim());
  const [commentsOpen, setCommentsOpen] = useState(hasComments);

  const m2Mode = isM2Unit(line.unit);
  const perBox = m2Mode
    ? m2PerBox(line.piecesPerBox, line.unitPerPiece)
    : null;
  const boxCount =
    perBox !== null && line.quantity > 0
      ? boxesForM2(line.quantity, perBox)
      : null;
  const rounded =
    perBox !== null
      ? roundM2ToFullBoxes(line.quantity, line.piecesPerBox, line.unitPerPiece)
      : null;
  const canAdjustBoxes =
    rounded !== null && Math.abs(rounded - Number(line.quantity)) > 1e-6;

  const subtotal = lineNetTotal(
    Number(line.quantity),
    Number(line.suggestedPrice),
    Number(line.discountPct) || 0,
  );

  return (
    <>
      <TableRow>
        {leadingCells}
        <TableCell sx={{ verticalAlign: "top", minWidth: 110 }}>
          <ClearableNumberField
            label={m2Mode ? "m²" : "Cant."}
            size="small"
            value={line.quantity}
            onValueChange={(quantity) => onChange({ quantity })}
            inputProps={{ min: 0, step: "any" }}
            sx={{ width: 100 }}
          />
          {m2Mode && perBox !== null && (
            <Box sx={{ mt: 0.5, maxWidth: 160 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {boxCount !== null
                  ? `Equivale a ${boxCount} caja${boxCount === 1 ? "" : "s"}`
                  : "Sin cantidad"}
                {" · "}
                {formatQty(perBox)} m²/caja
                {line.piecesPerBox != null && line.piecesPerBox > 0
                  ? ` · ${line.piecesPerBox} pz`
                  : ""}
              </Typography>
              {canAdjustBoxes && (
                <Button
                  size="small"
                  onClick={() => onChange({ quantity: rounded })}
                  sx={{ mt: 0.25, px: 0.5, minWidth: 0, textTransform: "none" }}
                >
                  Ajustar a cajas ({formatQty(rounded)})
                </Button>
              )}
            </Box>
          )}
          {m2Mode && perBox === null && (
            <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
              Sin packaging (piezas + m²/caja)
            </Typography>
          )}
        </TableCell>
        <TableCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
          <Typography variant="body2">{displayUnitLabel(line.unit)}</Typography>
        </TableCell>
        {afterUnitCell}
        <TableCell align="right" sx={{ verticalAlign: "top" }}>
          <ClearableNumberField
            label="Precio"
            size="small"
            value={line.suggestedPrice}
            onValueChange={(suggestedPrice) => onChange({ suggestedPrice })}
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ width: 110 }}
          />
        </TableCell>
        <TableCell align="right" sx={{ verticalAlign: "top" }}>
          <ClearableNumberField
            label="Dto %"
            size="small"
            value={line.discountPct}
            onValueChange={(n) =>
              onChange({
                discountPct: Math.min(100, Math.max(0, n)),
              })
            }
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            sx={{ width: 90 }}
          />
        </TableCell>
        <TableCell align="right" sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
          <Typography variant="body2" sx={{ pt: 1 }}>
            ${subtotal.toFixed(2)}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
          <Stack direction="row" spacing={0.25} justifyContent="flex-end">
            <Tooltip title={commentsOpen ? "Ocultar comentarios" : "Comentarios"}>
              <IconButton
                size="small"
                aria-label="Comentarios de línea"
                color={hasComments ? "primary" : "default"}
                onClick={() => setCommentsOpen((o) => !o)}
              >
                <CommentOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {onDelete && (
              <IconButton
                size="small"
                aria-label="Eliminar línea"
                disabled={!canDelete}
                onClick={onDelete}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={commentsColSpan} sx={{ borderTop: 0, py: 0 }}>
          <Collapse in={commentsOpen} unmountOnExit>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ pb: 1.5, pt: 0.5 }}>
              <TextField
                label="Comentario externo"
                size="small"
                fullWidth
                value={line.externalComment}
                onChange={(e) => onChange({ externalComment: e.target.value })}
              />
              <TextField
                label="Comentario interno"
                size="small"
                fullWidth
                value={line.internalComment}
                onChange={(e) => onChange({ internalComment: e.target.value })}
              />
            </Stack>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
