"use client";

import {
  FormControl,
  FormControlProps,
  InputLabel,
  Select,
  SelectProps,
} from "@mui/material";
import { useId } from "react";

export interface LabeledSelectProps extends Omit<SelectProps<string>, "label"> {
  label: string;
  formControlProps?: FormControlProps;
  /** Shown when value is empty; keeps label above border (no overlap) */
  emptyLabel?: string;
}

export function LabeledSelect({
  label,
  formControlProps,
  emptyLabel,
  value,
  children,
  renderValue,
  ...selectProps
}: LabeledSelectProps) {
  const labelId = useId();
  const normalizedValue = value ?? "";
  const isEmpty = normalizedValue === "";
  const labelShrunk = !isEmpty || Boolean(emptyLabel);

  return (
    <FormControl variant="outlined" {...formControlProps}>
      <InputLabel id={labelId} shrink={labelShrunk}>
        {label}
      </InputLabel>
      <Select
        {...selectProps}
        labelId={labelId}
        value={normalizedValue}
        label={label}
        displayEmpty={Boolean(emptyLabel)}
        notched={labelShrunk}
        renderValue={
          emptyLabel && isEmpty
            ? () => emptyLabel
            : renderValue
        }
      >
        {children}
      </Select>
    </FormControl>
  );
}

export const SELECT_INPUT_LABEL_PROPS = { shrink: true } as const;
