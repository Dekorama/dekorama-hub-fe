"use client";

import { Chip, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { MARKET_OPTIONS, getMarketLabel } from "../../utils/market";
import { useAdminMarket } from "../context/AdminMarketContext";

export function AdminMarketSwitcher() {
  const { market, setMarket, config, loading } = useAdminMarket();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Stack direction="row" spacing={1} sx={{ mb: 1.5, pt: 1, minHeight: 40 }} />
    );
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
      spacing={1}
      sx={{ mb: 1.5, pt: 1 }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={market}
        onChange={(_, value: string | null) => {
          if (value === "VE" || value === "ES") setMarket(value);
        }}
        sx={{ flexShrink: 0 }}
      >
        {MARKET_OPTIONS.map((code) => (
          <ToggleButton key={code} value={code} sx={{ px: 2 }}>
            {getMarketLabel(code)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography variant="body2" color="text.secondary">
          {config.storeName}
        </Typography>
        {!loading && (
          <>
            <Chip label={config.currency} size="small" variant="outlined" />
            <Chip
              label={`${config.taxLabel} ${config.taxRate}%`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </>
        )}
      </Stack>
    </Stack>
  );
}
