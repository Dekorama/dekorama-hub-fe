"use client";

import { Box } from "@mui/material";
import dynamic from "next/dynamic";
import LandingFeatures from "@/features/landing/components/LandingFeatures";
import LandingFinalCta from "@/features/landing/components/LandingFinalCta";
import LandingFooter from "@/features/landing/components/LandingFooter";
import LandingStores from "@/features/landing/components/LandingStores";
import LandingHero from "@/features/landing/components/LandingHero";
import LandingHowItWorks from "@/features/landing/components/LandingHowItWorks";
import LandingNav from "@/features/landing/components/LandingNav";
import LandingUseCases from "@/features/landing/components/LandingUseCases";
import { landingTheme } from "@/features/landing/components/landingTheme";

const LightRays = dynamic(() => import("@/shared/components/LightRays"), { ssr: false });

export function HomePage() {
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
