"use client";

import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import Link from "next/link";
import LandingFadeIn from "./LandingFadeIn";
import LandingSectionTitle from "./LandingSectionTitle";
import { landingTheme } from "./landingTheme";
import { MARKETS, type MarketCode } from "../../utils/market";

const STORE_POINTS = [
  {
    icon: StorefrontOutlinedIcon,
    title: "Catálogo oficial",
    description: "Materiales SKU Dekorama con precios y stock actualizados por mercado.",
  },
  {
    icon: Inventory2OutlinedIcon,
    title: "Presupuesto a pedido",
    description: "Aprueba una propuesta y exporta los materiales al carrito en un clic.",
  },
] as const;

export default function LandingStores() {
  return (
    <Box id="tiendas" component="section" sx={{ py: landingTheme.sectionPadding }}>
      <Container maxWidth="lg">
        <LandingSectionTitle
          title="Compra en tu tienda Dekorama"
          subtitle="Dos mercados independientes con catálogo local, IVA y profesionales verificados de cada país."
        />

        <LandingFadeIn>
          <Grid container spacing={3}>
            {(["VE", "ES"] as MarketCode[]).map((code) => {
              const market = MARKETS[code];
              return (
                <Grid item xs={12} md={6} key={code}>
                  <Box
                    sx={{
                      p: { xs: 2.5, md: 3 },
                      borderRadius: 4,
                      bgcolor: landingTheme.glass,
                      border: `1px solid ${landingTheme.glassBorder}`,
                      backdropFilter: "blur(12px)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h6" fontWeight={700} color="#ffffff" gutterBottom>
                      {market.storeName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: landingTheme.textMuted, mb: 2, lineHeight: 1.6 }}>
                      Facturación con {market.taxLabel} {market.taxRate}% · Moneda {market.currency}
                    </Typography>

                    <Stack spacing={2} mb={2}>
                      {STORE_POINTS.map((point) => (
                        <Stack key={point.title} direction="row" spacing={1.5} alignItems="flex-start">
                          <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: "rgba(255,255,255,0.06)", color: "#fff" }}>
                            <point.icon sx={{ fontSize: 18 }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#ffffff">
                              {point.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: landingTheme.textMuted, lineHeight: 1.5 }}>
                              {point.description}
                            </Typography>
                          </Box>
                        </Stack>
                      ))}
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: "rgba(255,255,255,0.06)", color: "#fff" }}>
                          <PaymentsOutlinedIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="#ffffff">
                            Pagos integrados
                          </Typography>
                          <Typography variant="body2" sx={{ color: landingTheme.textMuted, lineHeight: 1.5 }}>
                            {market.paymentMethods.join(" · ")} · Próximamente en plataforma
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>

                    <Box sx={{ mt: "auto" }}>
                      <Button
                        component={Link}
                        href={`/registro?pais=${code}&cuenta=individual`}
                        variant="contained"
                        fullWidth
                        sx={{
                          bgcolor: landingTheme.ctaPrimary.bg,
                          color: landingTheme.ctaPrimary.text,
                          fontWeight: 600,
                          borderRadius: "50px",
                          py: 1.2,
                          textTransform: "none",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                        }}
                      >
                        Crear cuenta en {market.label}
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </LandingFadeIn>
      </Container>
    </Box>
  );
}
