"use client";

import { Box } from "@mui/material";
import dynamic from "next/dynamic";
import LandingFeatures from "./components/landing/LandingFeatures";
import LandingFinalCta from "./components/landing/LandingFinalCta";
import LandingFooter from "./components/landing/LandingFooter";
import LandingStores from "./components/landing/LandingStores";
import LandingHero from "./components/landing/LandingHero";
import LandingHowItWorks from "./components/landing/LandingHowItWorks";
import LandingNav from "./components/landing/LandingNav";
import LandingUseCases from "./components/landing/LandingUseCases";
import { landingTheme } from "./components/landing/landingTheme";

const LightRays = dynamic(() => import("./components/LightRays"), { ssr: false });

export default function Home() {
  return (
    <Box
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      sx={{
        background: landingTheme.pageBg,
        position: "relative",
        overflowX: "hidden",
      }}
    >
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
          followMouse
          mouseInfluence={0.06}
          noiseAmount={0.04}
          distortion={0.03}
        />
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <LandingNav />
        <LandingHero />
        <LandingUseCases />
        <LandingHowItWorks />
        <LandingStores />
        <LandingFeatures />
        <LandingFinalCta />
        <LandingFooter />
      </Box>
    </Box>
  );
}
