"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Stack } from "@mui/material";
import Image from "next/image";
import Link from "next/link";

export default function AuthBrandHeader() {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Button
        component={Link}
        href="/"
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{
          alignSelf: "flex-start",
          textTransform: "none",
          color: "text.secondary",
          px: 0,
          minWidth: 0,
          "&:hover": { bgcolor: "transparent", color: "text.primary" },
        }}
      >
        Volver al inicio
      </Button>
      <Box
        component={Link}
        href="/"
        sx={{
          display: "block",
          position: "relative",
          width: { xs: 160, sm: 190 },
          height: { xs: 36, sm: 42 },
          textDecoration: "none",
        }}
      >
        <Image
          src="/logo/dekorama-logo.svg"
          alt="Dekorama Hub"
          fill
          priority
          style={{ objectFit: "contain", objectPosition: "left" }}
        />
      </Box>
    </Stack>
  );
}
