"use client";

import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { landingTheme } from "./landingTheme";

type NavVariant = "default" | "venezuela";

const DEFAULT_LINKS = [
  { label: "Casos de uso", href: "/#casos-de-uso" },
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Tiendas", href: "/#tiendas" },
  { label: "Iniciativa VE", href: "/venezuela" },
] as const;

const VENEZUELA_LINKS = [
  { label: "Plataforma", href: "/" },
  { label: "Cómo funciona", href: "#como-funciona" },
] as const;

interface LandingNavProps {
  variant?: NavVariant;
}

export default function LandingNav({ variant = "default" }: LandingNavProps) {
  const links = variant === "venezuela" ? VENEZUELA_LINKS : DEFAULT_LINKS;

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{ top: 0, zIndex: 10, mt: { xs: 1.5, sm: 3 }, px: { xs: 1, sm: 2 } }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 3 } }}>
        <Toolbar
          sx={{
            justifyContent: "space-between",
            bgcolor: landingTheme.glass,
            border: `1px solid ${landingTheme.glassBorder}`,
            borderRadius: "50px",
            px: { xs: 2, sm: 3 },
            py: { xs: 0.2, sm: 0.5 },
            minHeight: { xs: "48px", sm: "64px" },
            backdropFilter: "blur(12px)",
            gap: 1,
          }}
        >
          <Box
            component={Link}
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              width: { xs: 105, sm: 140 },
              height: { xs: 24, sm: 32 },
              position: "relative",
              textDecoration: "none",
            }}
          >
            <Image
              src="/logo/dekorama-logo-white.svg"
              alt="Dekorama Hub"
              fill
              priority
              style={{ objectFit: "contain", objectPosition: "left" }}
            />
          </Box>

          <Stack
            direction="row"
            spacing={{ xs: 0, sm: 1 }}
            alignItems="center"
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            {links.map((link) => (
              <Button
                key={link.href}
                component={link.href.startsWith("/") && !link.href.includes("#") ? Link : "a"}
                href={link.href}
                sx={{
                  color: landingTheme.textSoft,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "13px",
                  px: 1.5,
                  minWidth: "auto",
                  "&:hover": { color: "#ffffff" },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Stack>

          <Stack direction="row" spacing={{ xs: 0.5, sm: 2 }} alignItems="center">
            <Button
              component={Link}
              href="/login"
              sx={{
                color: landingTheme.textSoft,
                textTransform: "none",
                fontWeight: 500,
                fontSize: { xs: "13px", sm: "14px" },
                px: { xs: 1.2, sm: 2.5 },
                minWidth: "auto",
                "&:hover": { color: "#ffffff" },
              }}
            >
              Ingresar
            </Button>
            <Button
              component={Link}
              href="/registro"
              variant="contained"
              sx={{
                bgcolor: landingTheme.ctaPrimary.bg,
                color: landingTheme.ctaPrimary.text,
                borderRadius: "50px",
                px: { xs: 1.8, sm: 3 },
                py: { xs: 0.5, sm: 0.8 },
                fontWeight: 600,
                fontSize: { xs: "13px", sm: "14px" },
                textTransform: "none",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
              }}
            >
              Registrarse
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
