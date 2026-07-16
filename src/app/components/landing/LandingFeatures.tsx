"use client";

import { Box, Container, Grid, Typography } from "@mui/material";
import LandingFadeIn from "./LandingFadeIn";
import LandingSectionTitle from "./LandingSectionTitle";
import { landingTheme } from "./landingTheme";

const FEATURE_CARDS = [
  {
    index: "01",
    title: "Proyectos públicos y privados",
    desc: "Publica tu proyecto al feed general o invita solo a profesionales de tu entera confianza.",
    color: landingTheme.cardGradients.purple,
  },
  {
    index: "02",
    title: "Propuestas estructuradas",
    desc: "Recibe presupuestos claros y desglosados detallando mano de obra y SKUs originales de Dekorama.",
    color: landingTheme.cardGradients.red,
  },
  {
    index: "03",
    title: "Compra en un clic",
    desc: "Aprueba la cotización ganadora para exportar los materiales de forma inmediata a la tienda oficial.",
    color: landingTheme.cardGradients.green,
  },
  {
    index: "04",
    title: "Comunidades y vecinos",
    desc: "Invita residentes por email, comparte el proyecto y documenta avances en una bitácora privada.",
    color: landingTheme.cardGradients.blue,
  },
  {
    index: "05",
    title: "Profesionales verificados",
    desc: "Solo profesionales con RIF y licencia validados por el equipo Dekorama pueden licitar en proyectos públicos.",
    color: landingTheme.cardGradients.amber,
  },
  {
    index: "06",
    title: "Pedidos y facturas",
    desc: "Desde el presupuesto firmado hasta el pedido confirmado y factura con IVA, con trazabilidad completa.",
    color: landingTheme.cardGradients.teal,
  },
] as const;

export default function LandingFeatures() {
  return (
    <Box component="section" sx={{ py: landingTheme.sectionPadding }}>
      <Container maxWidth="lg">
        <LandingSectionTitle
          title="Todo lo que necesitas en un solo lugar"
          subtitle="Desde la publicación del proyecto hasta la compra de materiales y la facturación."
        />

        <Grid container spacing={2.5}>
          {FEATURE_CARDS.map((card, index) => (
            <Grid item xs={12} sm={6} key={card.title}>
              <LandingFadeIn delay={index * 60}>
                <Box
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    borderRadius: 4,
                    background: card.color,
                    border: `1px solid ${landingTheme.glassBorder}`,
                    backdropFilter: "blur(12px)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    transition: "border-color 0.2s ease",
                    "&:hover": {
                      borderColor: landingTheme.glassBorderStrong,
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    sx={{
                      opacity: 0.35,
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {card.index}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="#ffffff"
                    sx={{ fontSize: { xs: "1.05rem", sm: "1.15rem" }, lineHeight: 1.3 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: landingTheme.textMuted,
                      lineHeight: 1.6,
                      fontSize: "0.9rem",
                    }}
                  >
                    {card.desc}
                  </Typography>
                </Box>
              </LandingFadeIn>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
