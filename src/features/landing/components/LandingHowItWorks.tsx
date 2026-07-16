"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import LandingFadeIn from "./LandingFadeIn";
import LandingSectionTitle from "./LandingSectionTitle";
import { landingTheme } from "./landingTheme";

type AudienceKey = "individual" | "community" | "professional";

interface FlowStep {
  step: number;
  title: string;
  description: string;
}

const AUDIENCE_FLOWS: Record<
  AudienceKey,
  { label: string; steps: FlowStep[] }
> = {
  individual: {
    label: "Cliente individual",
    steps: [
      { step: 1, title: "Regístrate", description: "Crea tu cuenta como cliente individual en minutos." },
      { step: 2, title: "Crea tu proyecto", description: "Define tipo, ubicación y departamentos a intervenir." },
      { step: 3, title: "Publica o invita", description: "Comparte en el feed público o invita profesionales de confianza." },
      { step: 4, title: "Evalúa propuestas", description: "Compara mano de obra y materiales desglosados por departamento." },
      { step: 5, title: "Firma y compra", description: "Aprueba el presupuesto, genera pedido y adquiere en la tienda Dekorama de tu país." },
    ],
  },
  community: {
    label: "Organizador comunitario",
    steps: [
      { step: 1, title: "Registro comunidad", description: "Regístrate como organizador de condominio o edificio." },
      { step: 2, title: "Invita vecinos", description: "Envía invitaciones por email para que los residentes se unan." },
      { step: 3, title: "Proyecto compartido", description: "Crea un proyecto visible para la comunidad y gestiona avances en conjunto." },
      { step: 4, title: "Aprueba presupuesto", description: "Revisa propuestas y firma en nombre del edificio." },
      { step: 5, title: "Seguimiento en bitácora", description: "Documenta avances y notas privadas con vecinos invitados." },
    ],
  },
  professional: {
    label: "Profesional verificado",
    steps: [
      { step: 1, title: "Registro profesional", description: "Regístrate en tu mercado y prepara documentos de verificación fiscal." },
      { step: 2, title: "Verificación Dekorama", description: "El equipo valida tu licencia antes de licitar en proyectos públicos." },
      { step: 3, title: "Explora el feed", description: "Encuentra proyectos abiertos en tu país y envía propuestas modulares." },
      { step: 4, title: "Propón tu forma de trabajo", description: "Detalla mano de obra con materiales SKU Dekorama o con tus propios suministros." },
      { step: 5, title: "Ejecuta el proyecto", description: "Trabaja con el cliente dentro de la plataforma o de forma independiente según el acuerdo." },
    ],
  },
};

export default function LandingHowItWorks() {
  const [audience, setAudience] = useState<AudienceKey>("individual");
  const flow = AUDIENCE_FLOWS[audience];

  return (
    <Box
      id="como-funciona"
      component="section"
      sx={{ py: landingTheme.sectionPadding }}
    >
      <Container maxWidth="lg">
        <LandingSectionTitle
          title="Cómo funciona Dekorama Hub"
          subtitle="Clientes compran materiales Dekorama. Profesionales encuentran proyectos y licitan con catálogo oficial o por cuenta propia."
        />

        <LandingFadeIn>
          <Box
            sx={{
              bgcolor: landingTheme.glass,
              border: `1px solid ${landingTheme.glassBorder}`,
              borderRadius: 4,
              backdropFilter: "blur(12px)",
              p: { xs: 2, md: 3 },
            }}
          >
            <Tabs
              value={audience}
              onChange={(_, value: AudienceKey) => setAudience(value)}
              variant="scrollable"
              scrollButtons="auto"
              textColor="inherit"
              sx={{
                mb: 3,
                "& .MuiTab-root": {
                  color: landingTheme.textMuted,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                },
                "& .MuiTab-root.Mui-selected": {
                  color: "#ffffff",
                },
                "& .MuiTabs-indicator": { bgcolor: "#ffffff" },
              }}
            >
              {(Object.keys(AUDIENCE_FLOWS) as AudienceKey[]).map((key) => (
                <Tab key={key} value={key} label={AUDIENCE_FLOWS[key].label} />
              ))}
            </Tabs>

            <Stack spacing={2}>
              {flow.steps.map((item) => (
                <Box
                  key={item.step}
                  sx={{
                    display: "flex",
                    gap: 2,
                    p: 2,
                    borderRadius: 3,
                    border: `1px solid ${landingTheme.glassBorder}`,
                    bgcolor: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 36,
                      height: 36,
                      borderRadius: "50%",
                      bgcolor: "#ffffff",
                      color: "#000000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    {item.step}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="#ffffff">
                      {item.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: landingTheme.textMuted, mt: 0.5 }}>
                      {item.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </LandingFadeIn>
      </Container>
    </Box>
  );
}
