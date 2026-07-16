import type { Metadata } from "next";
import "./globals.css";
import { RanchOpsThemeProvider } from "./RanchOpsThemeProvider";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

export const metadata: Metadata = {
  title: "Dekorama Hub",
  description: "Plataforma colaborativa de reconstrucción — conecta clientes con profesionales verificados",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  icons: {
    icon: "/logo/dekorama-icon-white.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AppRouterCacheProvider>
          <RanchOpsThemeProvider>{children}</RanchOpsThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
