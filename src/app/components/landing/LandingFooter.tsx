"use client";

import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { landingTheme, SUPPORT_EMAIL } from "./landingTheme";

type FooterVariant = "default" | "venezuela";

const DEFAULT_LINKS = [
  { label: "Casos de uso", href: "/#casos-de-uso" },
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Tiendas", href: "/#tiendas" },
  { label: "Iniciativa VE", href: "/venezuela" },
  { label: "Ingresar", href: "/login" },
  { label: "Registrarse", href: "/registro" },
] as const;

const VENEZUELA_LINKS = [
  { label: "Plataforma", href: "/" },
  { label: "Registrarse", href: "/registro?pais=VE&cuenta=individual" },
  { label: "Ingresar", href: "/login" },
] as const;

interface LandingFooterProps {
  variant?: FooterVariant;
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const isInternal = href.startsWith("/");
  const Component = isInternal ? Link : "a";

  return (
    <Typography
      component={Component}
      href={href}
      variant="body2"
      sx={{
        color: landingTheme.textMuted,
        textDecoration: "none",
        "&:hover": { color: "#ffffff" },
      }}
    >
      {label}
    </Typography>
  );
}

export default function LandingFooter({ variant = "default" }: LandingFooterProps) {
  const links = variant === "venezuela" ? VENEZUELA_LINKS : DEFAULT_LINKS;

  return (
    <Box
      component="footer"
      sx={{
        py: 5,
        borderTop: `1px solid ${landingTheme.glassBorder}`,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={3}
        >
          <Box component={Link} href="/" sx={{ width: 130, height: 28, position: "relative", display: "block" }}>
            <Image
              src="/logo/dekorama-logo-white.svg"
              alt="Dekorama Hub"
              fill
              style={{ objectFit: "contain", objectPosition: "left" }}
            />
          </Box>

          <Stack direction="row" flexWrap="wrap" gap={2}>
            {links.map((link) => (
              <FooterLink key={link.href} href={link.href} label={link.label} />
            ))}
          </Stack>
        </Stack>

        <Divider sx={{ my: 3, borderColor: landingTheme.glassBorder }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={1}
        >
          <Typography variant="caption" sx={{ color: landingTheme.textMuted }}>
            © {new Date().getFullYear()} Dekorama Hub. Proyectos, materiales y profesionales verificados
          </Typography>
          <Typography variant="caption" sx={{ color: landingTheme.textMuted }}>
            Soporte: {SUPPORT_EMAIL}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
