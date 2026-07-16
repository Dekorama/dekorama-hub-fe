"use client";

import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Link from "next/link";
import LandingFadeIn from "./LandingFadeIn";
import LandingSectionTitle from "./LandingSectionTitle";
import { landingTheme, SUPPORT_EMAIL } from "./landingTheme";
import { MARKETS } from "../../utils/market";

const INITIATIVE_STEPS = [
  {
    step: 1,
    title: "Regístrate en Dekorama Venezuela",
    body: "Propietarios individuales y organizadores de comunidad crean cuenta en la tienda venezolana.",
  },
  {
    step: 2,
    title: "Documenta tu proyecto",
    body: "Define alcance, ubicación y departamentos a intervenir con fotos y notas.",
  },
  {
    step: 3,
    title: "Recibe propuestas verificadas",
    body: "Profesionales licenciados envían presupuestos con mano de obra y materiales SKU Dekorama.",
  },
  {
    step: 4,
    title: "Aprueba y compra materiales",
    body: "Firma el presupuesto ganador y adquiere del catálogo oficial con trazabilidad completa.",
  },
  {
    step: 5,
    title: "Coordina apoyo financiero",
    body: "Si tu caso califica, el equipo Dekorama conecta fondos y aliados para cubrir parte del proyecto.",
  },
  {
    step: 6,
    title: "Ejecuta y documenta avances",
    body: "Sigue la obra en bitácora privada y comparte avances con vecinos o familiares invitados.",
  },
] as const;

const PARTICIPANTS = [
  {
    icon: HomeOutlinedIcon,
    title: "Familias y propietarios",
    body: "Viviendas dañadas o en remodelación que necesitan profesionales verificados y materiales oficiales.",
  },
  {
    icon: GroupsOutlinedIcon,
    title: "Comunidades y condominios",
    body: "Edificios con daños estructurales o espacios comunes que requieren presupuesto consolidado.",
  },
  {
    icon: AccountBalanceOutlinedIcon,
    title: "Aliados y donantes",
    body: "Organizaciones que canalizan recursos hacia proyectos verificados con trazabilidad en plataforma.",
  },
] as const;

function buildSupportMailto(): string {
  const market = MARKETS.VE;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Iniciativa Venezuela - ${market.storeName}`
  )}&body=${encodeURIComponent(
    `Hola, quiero conocer la iniciativa Venezuela y coordinar apoyo para mi proyecto.\n\nNombre:\nUbicación:\nTipo (individual / comunidad):\nDescripción del proyecto:\n`
  )}`;
}

export default function VenezuelaInitiative() {
  const market = MARKETS.VE;

  return (
    <>
      <Box sx={{ py: { xs: 5, md: 7 } }}>
        <Container maxWidth="md">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <LandingFadeIn>
              <Box
                sx={{
                  display: "inline-flex",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "100px",
                  bgcolor: landingTheme.venezuelaAccent,
                  border: `1px solid ${landingTheme.venezuelaBorder}`,
                }}
              >
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                  Iniciativa social · {market.storeName}
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
                  fontSize: { xs: "2.25rem", sm: "3.25rem", md: "3.75rem" },
                  lineHeight: 1.15,
                  maxWidth: 720,
                }}
              >
                Iniciativa Venezuela
              </Typography>
            </LandingFadeIn>

            <LandingFadeIn delay={160}>
              <Typography
                variant="h6"
                sx={{
                  color: landingTheme.textMuted,
                  maxWidth: 680,
                  fontSize: { xs: "1rem", sm: "1.15rem" },
                  lineHeight: 1.65,
                  fontWeight: 400,
                }}
              >
                Programa dedicado para familias y comunidades afectadas por los sismos recientes.
                Usa la misma plataforma Dekorama Hub con apoyo adicional para recuperar viviendas
                con profesionales verificados y materiales oficiales.
              </Typography>
            </LandingFadeIn>
          </Stack>
        </Container>
      </Box>

      <Box component="section" sx={{ py: landingTheme.sectionPadding }}>
        <Container maxWidth="lg">
          <LandingSectionTitle
            title="Por qué existe esta iniciativa"
            subtitle="Tras los sismos que afectaron comunidades en Caracas, Valencia y otras ciudades, Dekorama activó un canal específico para coordinar reconstrucción con transparencia."
          />

          <LandingFadeIn>
            <Box
              sx={{
                p: { xs: 2.5, md: 4 },
                borderRadius: 4,
                bgcolor: landingTheme.glass,
                border: `1px solid ${landingTheme.venezuelaBorder}`,
                backdropFilter: "blur(16px)",
              }}
            >
              <Typography variant="body1" sx={{ color: landingTheme.textMuted, mb: 3, maxWidth: 800, lineHeight: 1.75 }}>
                La iniciativa no reemplaza el uso normal de Dekorama Hub: cualquier cliente en Venezuela
                puede crear proyectos, comprar materiales y contratar profesionales. Este programa añade
                coordinación con aliados, priorización de casos comunitarios y vías de apoyo financiero
                para quienes lo necesiten tras el desastre.
              </Typography>

              <Box
                sx={{
                  display: "inline-flex",
                  px: 1.5,
                  py: 0.5,
                  mb: 3,
                  borderRadius: "100px",
                  bgcolor: landingTheme.venezuelaAccent,
                  border: `1px solid ${landingTheme.venezuelaBorder}`,
                }}
              >
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                  {market.storeName} · {market.currency} · {market.taxLabel} {market.taxRate}%
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {PARTICIPANTS.map((item) => (
                  <Grid item xs={12} md={4} key={item.title}>
                    <Box
                      sx={{
                        p: 2.5,
                        height: "100%",
                        borderRadius: 3,
                        border: `1px solid ${landingTheme.glassBorder}`,
                        bgcolor: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <Box sx={{ color: "#fff", mb: 1.5 }}>
                        <item.icon />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} color="#ffffff" gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: landingTheme.textMuted, lineHeight: 1.55 }}>
                        {item.body}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </LandingFadeIn>
        </Container>
      </Box>

      <Box id="como-funciona" component="section" sx={{ py: landingTheme.sectionPadding }}>
        <Container maxWidth="lg">
          <LandingSectionTitle
            title="Cómo funciona la iniciativa"
            subtitle="Seis pasos desde el registro hasta la ejecución del proyecto con trazabilidad completa."
          />

          <LandingFadeIn>
            <Stack spacing={1.5}>
              {INITIATIVE_STEPS.map((step) => (
                <Box
                  key={step.step}
                  sx={{
                    display: "flex",
                    gap: 2,
                    p: 2,
                    borderRadius: 3,
                    border: `1px solid ${landingTheme.glassBorder}`,
                    bgcolor: landingTheme.glass,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#ffffff",
                      color: "#000000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "13px",
                      flexShrink: 0,
                    }}
                  >
                    {step.step}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="#ffffff">
                      {step.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: landingTheme.textMuted, mt: 0.25, lineHeight: 1.55 }}>
                      {step.body}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </LandingFadeIn>
        </Container>
      </Box>

      <Box component="section" sx={{ py: landingTheme.sectionPadding }}>
        <Container maxWidth="md">
          <LandingFadeIn>
            <Box
              sx={{
                textAlign: "center",
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                bgcolor: landingTheme.glass,
                border: `1px solid ${landingTheme.venezuelaBorder}`,
                backdropFilter: "blur(12px)",
              }}
            >
              <Typography variant="h5" fontWeight={700} color="#ffffff" gutterBottom>
                Apoyo financiero
              </Typography>
              <Typography variant="body1" sx={{ color: landingTheme.textMuted, mb: 3, lineHeight: 1.65 }}>
                Si tu proyecto califica, nuestro equipo coordina con aliados y donantes.
                Todos los casos se gestionan con presupuestos proforma y profesionales verificados en plataforma.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                <Button
                  component="a"
                  href={buildSupportMailto()}
                  variant="contained"
                  sx={{
                    bgcolor: landingTheme.ctaPrimary.bg,
                    color: landingTheme.ctaPrimary.text,
                    fontWeight: 600,
                    borderRadius: "50px",
                    px: 3,
                    py: 1.2,
                    textTransform: "none",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                  }}
                >
                  Consultar apoyo financiero
                </Button>
                <Button
                  component={Link}
                  href="/"
                  variant="outlined"
                  sx={{
                    color: "#ffffff",
                    borderColor: landingTheme.glassBorderStrong,
                    borderRadius: "50px",
                    px: 3,
                    py: 1.2,
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.35)",
                      bgcolor: "rgba(255,255,255,0.06)",
                    },
                  }}
                >
                  Volver a la plataforma
                </Button>
              </Stack>
              <Typography variant="caption" sx={{ color: landingTheme.textMuted, display: "block", mt: 2 }}>
                Contacto: {SUPPORT_EMAIL}
              </Typography>
            </Box>
          </LandingFadeIn>
        </Container>
      </Box>

      <Box component="section" sx={{ py: landingTheme.sectionPadding }}>
        <Container maxWidth="md">
          <LandingFadeIn>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
              <Button
                component={Link}
                href="/registro?pais=VE&cuenta=individual"
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
                Registrarme como propietario
              </Button>
              <Button
                component={Link}
                href="/registro?pais=VE&cuenta=comunidad"
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
                Soy organizador de comunidad
              </Button>
            </Stack>
          </LandingFadeIn>
        </Container>
      </Box>
    </>
  );
}
