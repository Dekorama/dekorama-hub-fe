"use client";

import { Box, Typography } from "@mui/material";
import { landingTheme } from "./landingTheme";

interface LandingSectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export default function LandingSectionTitle({
  title,
  subtitle,
  align = "center",
}: LandingSectionTitleProps) {
  return (
    <Box textAlign={align} mb={{ xs: 4, md: 5 }}>
      <Typography
        variant="h3"
        fontWeight={700}
        sx={{
          background: landingTheme.headlineGradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
          lineHeight: 1.2,
          letterSpacing: "-0.5px",
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body1"
          sx={{
            color: landingTheme.textMuted,
            maxWidth: align === "center" ? 640 : "none",
            mx: align === "center" ? "auto" : 0,
            mt: 2,
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            lineHeight: 1.65,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
