export const landingTheme = {
  pageBg: "radial-gradient(ellipse at top, #111119 0%, #030305 100%)",
  glass: "rgba(255, 255, 255, 0.03)",
  glassBorder: "rgba(255, 255, 255, 0.08)",
  glassBorderStrong: "rgba(255, 255, 255, 0.15)",
  textMuted: "rgba(255, 255, 255, 0.65)",
  textSoft: "rgba(255, 255, 255, 0.8)",
  headlineGradient: "linear-gradient(180deg, #ffffff 0%, #b3b3b3 100%)",
  ctaPrimary: { bg: "#ffffff", text: "#000000" },
  sectionPadding: { xs: 6, md: 9 },
  cardGradients: {
    purple: "linear-gradient(135deg, rgba(20, 20, 35, 0.4) 0%, rgba(10, 10, 18, 0.6) 100%)",
    red: "linear-gradient(135deg, rgba(30, 20, 20, 0.4) 0%, rgba(15, 10, 10, 0.6) 100%)",
    green: "linear-gradient(135deg, rgba(15, 30, 25, 0.4) 0%, rgba(8, 15, 12, 0.6) 100%)",
    blue: "linear-gradient(135deg, rgba(15, 25, 40, 0.4) 0%, rgba(8, 12, 22, 0.6) 100%)",
    amber: "linear-gradient(135deg, rgba(35, 28, 15, 0.4) 0%, rgba(18, 14, 8, 0.6) 100%)",
    teal: "linear-gradient(135deg, rgba(12, 32, 32, 0.4) 0%, rgba(6, 16, 16, 0.6) 100%)",
  },
  venezuelaAccent: "rgba(255, 200, 100, 0.12)",
  venezuelaBorder: "rgba(255, 200, 100, 0.2)",
  spotlightColor: "rgba(255, 255, 255, 0.12)" as `rgba(${number}, ${number}, ${number}, ${number})`,
} as const;

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "soporte@dekoramagroup.com";
