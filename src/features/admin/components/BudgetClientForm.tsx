"use client";

import { useMemo } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import {
  getClientDocumentOptions,
  isMarketCode,
  type MarketCode,
} from "@/shared/utils/market";
import type {
  ClientDocumentType,
  ClientLegalType,
} from "@/shared/utils/userLabels";
import { ClearableNumberField } from "@/shared/ui";

export type BudgetClientFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  legalType: ClientLegalType;
  documentType: ClientDocumentType;
  documentNumber: string;
  address: string;
  city: string;
  province: string;
  taxRate: number;
  taxExempt: boolean;
};

export type BudgetClientSnapshot = {
  id?: string;
  name: string;
  email: string;
  taxRate?: number | null;
  taxExempt?: boolean;
  country?: string;
  profileData?: Record<string, unknown> | null;
};

function profileStr(
  pd: Record<string, unknown> | null | undefined,
  key: string,
): string {
  if (!pd) return "";
  const val = pd[key];
  return typeof val === "string" ? val : "";
}

export function emptyBudgetClientForm(
  taxRate: number,
  market: string,
): BudgetClientFormValues {
  const code = isMarketCode(market) ? market : "VE";
  const docs = getClientDocumentOptions(code, "particular");
  return {
    name: "",
    email: "",
    phone: "",
    password: "",
    legalType: "particular",
    documentType: docs[0]?.value ?? "cedula",
    documentNumber: "",
    address: "",
    city: "",
    province: "",
    taxRate,
    taxExempt: false,
  };
}

export function clientToFormValues(
  client: BudgetClientSnapshot,
  fallbackTaxRate: number,
  market: string,
): BudgetClientFormValues {
  const code = isMarketCode(market) ? market : "VE";
  const pd = client.profileData ?? null;
  const legalRaw = profileStr(pd, "legalType");
  const legalType: ClientLegalType =
    legalRaw === "empresa" ? "empresa" : "particular";
  const docs = getClientDocumentOptions(code, legalType);
  const docRaw = profileStr(pd, "documentType") as ClientDocumentType | "";
  const documentType =
    docs.find((d) => d.value === docRaw)?.value ?? docs[0]?.value ?? "cedula";

  return {
    name: client.name ?? "",
    email: client.email ?? "",
    phone: profileStr(pd, "phone"),
    password: "",
    legalType,
    documentType,
    documentNumber: profileStr(pd, "documentNumber"),
    address: profileStr(pd, "address"),
    city: profileStr(pd, "city"),
    province: profileStr(pd, "province"),
    taxRate:
      client.taxExempt
        ? 0
        : client.taxRate !== null && client.taxRate !== undefined
          ? Number(client.taxRate)
          : fallbackTaxRate,
    taxExempt: Boolean(client.taxExempt),
  };
}

export function buildClientProfileData(
  form: BudgetClientFormValues,
): Record<string, string> {
  const data: Record<string, string> = {
    legalType: form.legalType,
  };
  if (form.phone.trim()) data.phone = form.phone.trim();
  if (form.documentNumber.trim()) {
    data.documentType = form.documentType;
    data.documentNumber = form.documentNumber.trim();
  }
  if (form.address.trim()) data.address = form.address.trim();
  if (form.city.trim()) data.city = form.city.trim();
  if (form.province.trim()) data.province = form.province.trim();
  return data;
}

/** Compare form against existing client for whether PATCH is needed. */
export function clientFormHasChanges(
  form: BudgetClientFormValues,
  client: BudgetClientSnapshot,
  fallbackTaxRate: number,
  market: string,
): boolean {
  const baseline = clientToFormValues(client, fallbackTaxRate, market);
  return (
    form.name.trim() !== baseline.name.trim() ||
    form.email.trim().toLowerCase() !== baseline.email.trim().toLowerCase() ||
    form.phone.trim() !== baseline.phone.trim() ||
    form.legalType !== baseline.legalType ||
    form.documentType !== baseline.documentType ||
    form.documentNumber.trim() !== baseline.documentNumber.trim() ||
    form.address.trim() !== baseline.address.trim() ||
    form.city.trim() !== baseline.city.trim() ||
    form.province.trim() !== baseline.province.trim() ||
    form.taxExempt !== baseline.taxExempt ||
    Number(form.taxRate) !== Number(baseline.taxRate)
  );
}

type BudgetClientFormProps = {
  value: BudgetClientFormValues;
  onChange: (patch: Partial<BudgetClientFormValues>) => void;
  market: MarketCode | string;
  taxLabel: string;
  /** Show password field (new client only). */
  showPassword?: boolean;
  disabled?: boolean;
};

export function BudgetClientForm({
  value,
  onChange,
  market,
  taxLabel,
  showPassword = false,
  disabled = false,
}: BudgetClientFormProps) {
  const marketCode: MarketCode = isMarketCode(market) ? market : "VE";
  const documentOptions = useMemo(
    () => getClientDocumentOptions(marketCode, value.legalType),
    [marketCode, value.legalType],
  );

  return (
    <Stack spacing={2}>
      <TextField
        select
        label="Tipo"
        size="small"
        disabled={disabled}
        value={value.legalType}
        onChange={(e) => {
          const legalType = e.target.value as ClientLegalType;
          const options = getClientDocumentOptions(marketCode, legalType);
          onChange({
            legalType,
            documentType: options[0]?.value ?? value.documentType,
          });
        }}
      >
        <MenuItem value="particular">Particular</MenuItem>
        <MenuItem value="empresa">Empresa</MenuItem>
      </TextField>
      <TextField
        label={value.legalType === "empresa" ? "Razón social" : "Nombre"}
        size="small"
        required
        disabled={disabled}
        value={value.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <TextField
        label="Email"
        size="small"
        type="email"
        required
        disabled={disabled}
        value={value.email}
        onChange={(e) => onChange({ email: e.target.value })}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          select
          label="Documento"
          size="small"
          disabled={disabled}
          value={value.documentType}
          onChange={(e) =>
            onChange({ documentType: e.target.value as ClientDocumentType })
          }
          sx={{ minWidth: { sm: 140 } }}
        >
          {documentOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Número de documento"
          size="small"
          fullWidth
          disabled={disabled}
          value={value.documentNumber}
          onChange={(e) => onChange({ documentNumber: e.target.value })}
        />
      </Stack>
      <TextField
        label="Teléfono"
        size="small"
        disabled={disabled}
        value={value.phone}
        onChange={(e) => onChange({ phone: e.target.value })}
      />
      <TextField
        label="Dirección"
        size="small"
        disabled={disabled}
        value={value.address}
        onChange={(e) => onChange({ address: e.target.value })}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Ciudad"
          size="small"
          fullWidth
          disabled={disabled}
          value={value.city}
          onChange={(e) => onChange({ city: e.target.value })}
        />
        <TextField
          label="Provincia"
          size="small"
          fullWidth
          disabled={disabled}
          value={value.province}
          onChange={(e) => onChange({ province: e.target.value })}
        />
      </Stack>
      {showPassword && (
        <TextField
          label="Contraseña"
          size="small"
          type="password"
          required
          disabled={disabled}
          value={value.password}
          onChange={(e) => onChange({ password: e.target.value })}
          helperText="Mínimo 8 caracteres. Compártela al cliente por canal seguro."
          inputProps={{ minLength: 8 }}
        />
      )}
      <TextField
        select
        label="Exento de IVA"
        size="small"
        disabled={disabled}
        value={value.taxExempt ? "yes" : "no"}
        onChange={(e) =>
          onChange({ taxExempt: e.target.value === "yes" })
        }
      >
        <MenuItem value="no">No</MenuItem>
        <MenuItem value="yes">Sí</MenuItem>
      </TextField>
      {!value.taxExempt && (
        <ClearableNumberField
          label={`${taxLabel} %`}
          size="small"
          disabled={disabled}
          value={value.taxRate}
          onValueChange={(taxRate) => onChange({ taxRate })}
        />
      )}
    </Stack>
  );
}
