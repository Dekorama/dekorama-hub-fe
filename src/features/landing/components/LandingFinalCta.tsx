"use client";

import { Box, Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import LandingFadeIn from "./LandingFadeIn";
import { landingTheme } from "./landingTheme";

export default function LandingFinalCta() {
  return (
    <Box component="section" sx={{ py: landingTheme.sectionPadding }}>
      <Container maxWidth="md">
        <LandingFadeIn>
          <Box
            sx={{
              textAlign: "center",
              p: { xs: 4, md: 6 },
              borderRadius: 5,
              bgcolor: landingTheme.glass,
              border: `1px solid ${landingTheme.glassBorder}`,
              backdropFilter: "blur(12px)",
            }}
          >
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                background: landingTheme.headlineGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 2,
                fontSize: { xs: "1.75rem", md: "2.25rem" },
              }}
            >
              Empieza en Dekorama Hub
            </Typography>
            <Typography variant="body1" sx={{ color: landingTheme.textMuted, mb: 4, maxWidth: 560, mx: "auto" }}>
              Elige tu mercado al registrarte. Clientes publican proyectos y compran materiales.
              Profesionales encuentran oportunidades y trabajan con Dekorama o por cuenta propia.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" mb={2}>
              <Button
                component={Link}
                href="/registro?cuenta=individual"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: landingTheme.ctaPrimary.bg,
                  color: landingTheme.ctaPrimary.text,
                  fontWeight: 600,
                  borderRadius: "50px",
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                }}
              >
                Crear cuenta de cliente
              </Button>
              <Button
                component={Link}
                href="/registro?rol=professional"
                variant="outlined"
                size="large"
                sx={{
                  color: "#ffffff",
                  borderColor: landingTheme.glassBorderStrong,
                  borderRadius: "50px",
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.35)",
                    bgcolor: "rgba(255,255,255,0.06)",
                  },
                }}
              >
                Registrarme como profesional
              </Button>
            </Stack>

            <Button
              component={Link}
              href="/venezuela"
              sx={{ color: landingTheme.textMuted, textTransform: "none", "&:hover": { color: "#ffffff" } }}
            >
              Conocer la iniciativa Venezuela →
            </Button>
          </Box>
        </LandingFadeIn>
      </Container>
    </Box>
  );
}
