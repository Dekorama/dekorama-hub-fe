"use client";

import {
  AppBar,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR Canvas / window issues
const LightRays = dynamic(() => import("./components/LightRays"), { ssr: false });
const ScrollStack = dynamic(() => import("./components/ScrollStack"), { ssr: false });

export default function Home() {
  return (
    <Box
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      sx={{
        background: "radial-gradient(ellipse at top, #111119 0%, #030305 100%)",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Light Rays Background Canvas (low pointer priority and zIndex) */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: { xs: "500px", md: "700px" },
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1.0}
          lightSpread={0.65}
          rayLength={1.4}
          pulsating={false}
          fadeDistance={1.2}
          saturation={0.8}
          followMouse={true}
          mouseInfluence={0.06}
          noiseAmount={0.04}
          distortion={0.03}
        />
      </Box>

      {/* Main Content Area (high relative zIndex so everything is interactable) */}
      <Box sx={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Floating Glassmorphic AppBar */}
        <AppBar position="static" color="transparent" elevation={0} sx={{ mt: { xs: 1.5, sm: 3 }, px: { xs: 1, sm: 2 } }}>
          <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 3 } }}>
            <Toolbar
              sx={{
                justifyContent: "space-between",
                bgcolor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "50px",
                px: { xs: 2, sm: 4 },
                py: { xs: 0.2, sm: 0.5 },
                minHeight: { xs: "48px", sm: "64px" },
                backdropFilter: "blur(12px)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", width: { xs: 105, sm: 140 }, height: { xs: 24, sm: 32 }, position: "relative" }}>
                <Image
                  src="/logo/dekorama-logo-white.svg"
                  alt="Dekorama Hub"
                  fill
                  priority
                  style={{ objectFit: "contain", objectPosition: "left" }}
                />
              </Box>
              <Stack direction="row" spacing={{ xs: 0.5, sm: 2 }} alignItems="center">
                <Button
                  component={Link}
                  href="/login"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
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
                    bgcolor: "#ffffff",
                    color: "#000000",
                    borderRadius: "50px",
                    px: { xs: 1.8, sm: 3 },
                    py: { xs: 0.5, sm: 0.8 },
                    fontWeight: 600,
                    fontSize: { xs: "13px", sm: "14px" },
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.9)",
                    },
                  }}
                >
                  Registrarse
                </Button>
              </Stack>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Hero Section */}
        <Box
          flex={1}
          display="flex"
          alignItems="center"
          sx={{ py: { xs: 6, md: 10 } }}
        >
          <Container maxWidth="md">
            <Stack spacing={4} alignItems="center" textAlign="center">
              
              {/* Premium Announcement Badge */}
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 0.6,
                  borderRadius: "100px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  bgcolor: "rgba(255, 255, 255, 0.03)",
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
                  NUEVO
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontWeight: 500,
                    fontSize: "12.5px",
                  }}
                >
                  Plataforma Dekorama v2.0
                </Typography>
              </Box>

              {/* Metallic Gradient Headline */}
              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  background: "linear-gradient(180deg, #ffffff 0%, #b3b3b3 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-1.5px",
                  fontSize: { xs: "2.5rem", sm: "3.75rem", md: "4.5rem" },
                  lineHeight: { xs: 1.15, md: 1.1 },
                  maxWidth: "800px",
                }}
              >
                Reconstruye con confianza
              </Typography>

              {/* Sub-headline */}
              <Typography
                variant="h5"
                sx={{
                  color: "rgba(255, 255, 255, 0.65)",
                  maxWidth: 640,
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  lineHeight: 1.6,
                  fontWeight: 400,
                }}
              >
                Conectamos a comunidades afectadas con profesionales verificados.
                Propuestas transparentes, materiales Dekorama, todo en un solo lugar.
              </Typography>

              {/* Action Buttons */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2.5}
                justifyContent="center"
                sx={{ width: "100%", maxWidth: "520px", pt: 1.5 }}
              >
                <Button
                  component={Link}
                  href="/registro"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: "#ffffff",
                    color: "#000000",
                    fontWeight: 600,
                    borderRadius: "50px",
                    px: 4,
                    py: 1.8,
                    fontSize: "15px",
                    textTransform: "none",
                    flex: 1,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.9)",
                      transform: "scale(1.02)",
                    },
                  }}
                >
                  Soy cliente / comunidad
                </Button>
                <Button
                  component={Link}
                  href="/registro"
                  variant="outlined"
                  size="large"
                  sx={{
                    color: "#ffffff",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    bgcolor: "rgba(255, 255, 255, 0.03)",
                    backdropFilter: "blur(4px)",
                    fontWeight: 600,
                    borderRadius: "50px",
                    px: 4,
                    py: 1.8,
                    fontSize: "15px",
                    textTransform: "none",
                    flex: 1,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "rgba(255, 255, 255, 0.35)",
                      bgcolor: "rgba(255, 255, 255, 0.08)",
                      transform: "scale(1.02)",
                    },
                  }}
                >
                  Soy profesional
                </Button>
              </Stack>

              {/* Feature Cards ScrollStack */}
              <Box
                sx={{
                  width: "100%",
                  maxWidth: "640px",
                  height: { xs: "360px", sm: "420px", md: "460px" },
                  pt: { xs: 4, md: 6 },
                  pb: 2,
                  position: "relative",
                  mx: "auto",
                }}
              >
                <ScrollStack
                  itemDistance={40}
                  itemScale={0.04}
                  itemStackDistance={16}
                  stackPosition="12%"
                  scaleEndPosition="4%"
                  baseScale={0.9}
                  blurAmount={1.5}
                >
                  {[
                    {
                      index: "01",
                      title: "Proyectos públicos y privados",
                      desc: "Publica tu necesidad de reconstrucción al feed general o invita solo a profesionales de tu entera confianza.",
                      color: "linear-gradient(135deg, rgba(20, 20, 35, 0.4) 0%, rgba(10, 10, 18, 0.6) 100%)",
                    },
                    {
                      index: "02",
                      title: "Propuestas estructuradas",
                      desc: "Recibe presupuestos claros y desglosados detallando mano de obra y SKUs originales de Dekorama.",
                      color: "linear-gradient(135deg, rgba(30, 20, 20, 0.4) 0%, rgba(15, 10, 10, 0.6) 100%)",
                    },
                    {
                      index: "03",
                      title: "Compra en un clic",
                      desc: "Aprueba la cotización ganadora para exportar los materiales de forma inmediata a la tienda oficial.",
                      color: "linear-gradient(135deg, rgba(15, 30, 25, 0.4) 0%, rgba(8, 15, 12, 0.6) 100%)",
                    },
                  ].map((card) => (
                    <Paper
                      key={card.title}
                      className="scroll-stack-card"
                      elevation={0}
                      sx={{
                        p: { xs: 3, sm: 4.5 },
                        borderRadius: 5,
                        background: card.color,
                        color: "#ffffff",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        backdropFilter: "blur(20px)",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        gap: { xs: 1, sm: 1.5 },
                        minHeight: { xs: "180px", sm: "220px" },
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="h5"
                        fontWeight={900}
                        sx={{
                          opacity: 0.15,
                          fontFamily: "monospace",
                          lineHeight: 1,
                          fontSize: { xs: "1.5rem", sm: "2rem" },
                        }}
                      >
                        {card.index}
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color="#ffffff"
                        sx={{ fontSize: { xs: "1.1rem", sm: "1.35rem" } }}
                      >
                        {card.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255, 255, 255, 0.6)",
                          lineHeight: 1.5,
                          fontSize: { xs: "0.85rem", sm: "0.95rem" },
                        }}
                      >
                        {card.desc}
                      </Typography>
                    </Paper>
                  ))}
                </ScrollStack>
              </Box>
            </Stack>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

