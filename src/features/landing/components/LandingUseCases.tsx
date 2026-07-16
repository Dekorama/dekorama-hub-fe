"use client";

import { Box, Container, Grid, Typography } from "@mui/material";
import LandingFadeIn from "./LandingFadeIn";
import SpotlightCard from "@/features/landing/reactbits/Components/SpotlightCard/SpotlightCard";
import LandingSectionTitle from "./LandingSectionTitle";
import { landingTheme } from "./landingTheme";

const USE_CASES = [
  {
    title: "Reparaciones y mejoras",
    description:
      "Documenta cada departamento con fotos y notas. Recibe propuestas modulares de profesionales verificados.",
    icon: "01",
  },
  {
    title: "Remodelación",
    description:
      "Planifica acabados con notas de diseño, compara presupuestos desglosados y compra materiales Dekorama al aprobar.",
    icon: "02",
  },
  {
    title: "Obra nueva",
    description:
      "Organiza tu proyecto por departamentos (estructura, instalaciones y acabados), desde los planos hasta la entrega.",
    icon: "03",
  },
  {
    title: "Comunidad / condominio",
    description:
      "El organizador invita vecinos, gestiona un proyecto compartido, bitácora privada y presupuesto consolidado del edificio.",
    icon: "04",
  },
  {
    title: "Compra de materiales",
    description:
      "Aprueba una propuesta y lleva los SKU al carrito. Factura con IVA de tu mercado y seguimiento de pedido.",
    icon: "05",
  },
  {
    title: "Profesional independiente",
    description:
      "Encuentra proyectos en el feed, licita con tu propia lista de materiales o usa el catálogo Dekorama.",
    icon: "06",
  },
] as const;

export default function LandingUseCases() {
  return (
    <Box
      id="casos-de-uso"
      component="section"
      sx={{ py: landingTheme.sectionPadding }}
    >
      <Container maxWidth="lg">
        <LandingSectionTitle
          title="Una plataforma para cada tipo de proyecto"
          subtitle="Remodelación, obra nueva, reparaciones y gestión comunitaria. Compra materiales Dekorama al aprobar cada propuesta."
        />

        <Grid container spacing={3}>
          {USE_CASES.map((useCase, index) => (
            <Grid item xs={12} sm={6} key={useCase.title}>
              <LandingFadeIn delay={index * 80}>
                <SpotlightCard spotlightColor={landingTheme.spotlightColor}>
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    sx={{
                      color: "#ffffff",
                      opacity: 0.15,
                      fontFamily: "monospace",
                      lineHeight: 1,
                      mb: 1.5,
                    }}
                  >
                    {useCase.icon}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="#ffffff"
                    gutterBottom
                  >
                    {useCase.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: landingTheme.textMuted, lineHeight: 1.6 }}
                  >
                    {useCase.description}
                  </Typography>
                </SpotlightCard>
              </LandingFadeIn>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
