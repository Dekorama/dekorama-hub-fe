"use client";

import { useEffect, useState } from "react";
import { TextField, type TextFieldProps } from "@mui/material";

type ClearableNumberFieldProps = Omit<
  TextFieldProps,
  "type" | "value" | "onChange"
> & {
  value: number;
  onValueChange: (value: number) => void;
  /** Written on blur when the field is empty. Default 0. */
  emptyValue?: number;
  integer?: boolean;
};

function parseDraft(raw: string, integer: boolean): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") {
    return null;
  }
  const n = integer ? parseInt(trimmed, 10) : parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** Number field that allows clearing (empty) while typing; commits on blur. */
export function ClearableNumberField({
  value,
  onValueChange,
  emptyValue = 0,
  integer = false,
  onBlur,
  onFocus,
  ...rest
}: ClearableNumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    setDraft(null);
  }, [value]);

  const display = draft !== null ? draft : String(value);

  return (
    <TextField
      {...rest}
      type="number"
      value={display}
      onFocus={(e) => {
        e.target.select();
        onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        const parsed = parseDraft(raw, integer);
        if (parsed !== null) onValueChange(parsed);
      }}
      onBlur={(e) => {
        const raw = draft;
        setDraft(null);
        if (raw !== null) {
          const parsed = parseDraft(raw, integer);
          onValueChange(parsed !== null ? parsed : emptyValue);
        }
        onBlur?.(e);
      }}
    />
  );
}
