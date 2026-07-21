"use client";

import { useCallback, useRef, useState } from "react";
import type { ButtonProps } from "@mui/material";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: ButtonProps["color"];
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

const INITIAL: ConfirmState = {
  open: false,
  message: "",
};

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>(INITIAL);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    setState(INITIAL);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, ...options });
    });
  }, []);

  function ConfirmDialogHost() {
    return (
      <ConfirmDialog
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        confirmColor={state.confirmColor}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    );
  }

  return { confirm, ConfirmDialogHost };
}
