"use client";

import { useState, type MouseEvent } from "react";
import { IconButton, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { TransferTarget } from "@/features/admin/components/BudgetLineTransferDialog";

type BudgetLineTransferMenuProps = {
  canOrder: boolean;
  canCreateSupplierOrder: boolean;
  canInvoice: boolean;
  transferEnabled: boolean;
  disabled?: boolean;
  onAction: (target: TransferTarget) => void;
};

export function BudgetLineTransferMenu({
  canOrder,
  canCreateSupplierOrder,
  canInvoice,
  transferEnabled,
  disabled = false,
  onAction,
}: BudgetLineTransferMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  function open(e: MouseEvent<HTMLElement>) {
    setAnchor(e.currentTarget);
  }

  function close() {
    setAnchor(null);
  }

  function pick(target: TransferTarget) {
    close();
    onAction(target);
  }

  if (!transferEnabled) return null;

  return (
    <>
      <Tooltip title="Traspasar línea">
        <span>
          <IconButton
            size="small"
            aria-label="Acciones de traspaso"
            disabled={disabled}
            onClick={open}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem disabled={!canOrder} onClick={() => pick("order")}>
          <ListItemText
            primary="Pasar este producto a Pedido"
            secondary={!canOrder ? "Ya traspasado a pedido" : undefined}
          />
        </MenuItem>
        <MenuItem
          disabled={!canCreateSupplierOrder}
          onClick={() => pick("supplier_order")}
        >
          <ListItemText
            primary="Pasar este producto a Pedido a Proveedor"
            secondary={
              !canCreateSupplierOrder ? "Sin cantidad pendiente de pedido" : undefined
            }
          />
        </MenuItem>
        <MenuItem disabled={!canInvoice} onClick={() => pick("invoice")}>
          <ListItemText
            primary="Pasar este producto a Factura"
            secondary={!canInvoice ? "Sin cantidad pendiente de factura" : undefined}
          />
        </MenuItem>
      </Menu>
    </>
  );
}
