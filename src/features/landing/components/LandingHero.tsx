"use client";

import { Box, Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import LandingFadeIn from "./LandingFadeIn";
import { landingTheme } from "./landingTheme";

export default function LandingHero() {
  return (
    <Box display="flex" alignItems="center" sx={{ py: { xs: 5, md: 7 } }}>
      <Container maxWidth="md">
        <Stack spacing={3.5} alignItems="center" textAlign="center">
          <LandingFadeIn>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 0.6,
                borderRadius: "100px",
                border: `1px solid ${landingTheme.glassBorder}`,
                bgcolor: landingTheme.glass,
                backdropFilter: "blur(4px)",
              }}
            >
              <Box
                sx={{
                  bgcolor: "#ffffff",
                  color: "#000000",
                  fontSize: "10px",
                  fontWeight: 800,
                  px: 1.5,
                  py: 0.2,
                  borderRadius: "100px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                VE + ES
              </Box>
              <Typography variant="caption" sx={{ color: landingTheme.textSoft, fontWeight: 500, fontSize: "12.5px" }}>
                Dekorama Venezuela y Dekorama España
              </Typography>
            </Box>
          </LandingFadeIn>

          <LandingFadeIn delay={80}>
            <Typography
              variant="h2"
              fontWeight={800}
              sx={{
                background: landingTheme.headlineGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-1.5px",
                fontSize: { xs: "2.5rem", sm: "3.75rem", md: "4.25rem" },
                lineHeight: { xs: 1.15, md: 1.1 },
                maxWidth: 800,
              }}
            >
              Proyectos, materiales y profesionales
            </Typography>
          </LandingFadeIn>

          <LandingFadeIn delay={160}>
            <Typography
              variant="h5"
              sx={{
                color: landingTheme.textMuted,
                maxWidth: 700,
                fontSize: { xs: "1rem", sm: "1.2rem" },
                lineHeight: 1.65,
                fontWeight: 400,
              }}
            >
              Publica tu obra, compra materiales en la tienda Dekorama de tu país y contrata
              profesionales verificados. Los profesionales encuentran proyectos y trabajan con
              el catálogo oficial o con sus propios materiales.
            </Typography>
          </LandingFadeIn>

          <LandingFadeIn delay={240}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
              sx={{ width: "100%", maxWidth: "640px", pt: 1 }}
            >
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
                  px: 3,
                  py: 1.6,
                  fontSize: "15px",
                  textTransform: "none",
                  flex: 1,
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
                }}
              >
                Soy cliente
              </Button>
              <Button
                component={Link}
                href="/registro?rol=professional"
                variant="outlined"
                size="large"
                sx={{
                  color: "#ffffff",
                  borderColor: landingTheme.glassBorderStrong,
                  bgcolor: landingTheme.glass,
                  backdropFilter: "blur(4px)",
                  fontWeight: 600,
                  borderRadius: "50px",
                  px: 3,
                  py: 1.6,
                  fontSize: "15px",
                  textTransform: "none",
                  flex: 1,
                  "&:hover": {
                    borderColor: "rgba(255, 255, 255, 0.35)",
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                  },
                }}
              >
                Soy profesional
              </Button>
            </Stack>
          </LandingFadeIn>

          <Button
            component={Link}
            href="/venezuela"
            sx={{ color: landingTheme.textMuted, textTransform: "none", fontSize: "14px", "&:hover": { color: "#ffffff" } }}
          >
            Iniciativa Venezuela →
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
