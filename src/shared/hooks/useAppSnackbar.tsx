"use client";

import { Alert, Snackbar } from "@mui/material";
import { useCallback, useState } from "react";

export type SnackbarSeverity = "success" | "error" | "warning" | "info";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

export function useAppSnackbar() {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const show = useCallback((message: string, severity: SnackbarSeverity = "success") => {
    setState({ open: true, message, severity });
  }, []);

  const showSuccess = useCallback((message: string) => show(message, "success"), [show]);
  const showError = useCallback((message: string) => show(message, "error"), [show]);
  const showWarning = useCallback((message: string) => show(message, "warning"), [show]);
  const showInfo = useCallback((message: string) => show(message, "info"), [show]);

  function SnackbarHost() {
    return (
      <Snackbar
        open={state.open}
        autoHideDuration={5000}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={close} severity={state.severity} variant="filled" sx={{ width: "100%" }}>
          {state.message}
        </Alert>
      </Snackbar>
    );
  }

  return { show, showSuccess, showError, showWarning, showInfo, close, SnackbarHost };
}
