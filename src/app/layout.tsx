import type { Metadata } from "next";
import "./globals.css";
import { RanchOpsThemeProvider } from "./RanchOpsThemeProvider";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { AppShellLayout } from "./components/AppShellLayout";

export const metadata: Metadata = {
  title: "Dekorama Hub",
  description: "Publica proyectos, compra materiales Dekorama y conecta con profesionales verificados en Venezuela y España",
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
      <body suppressHydrationWarning>
        <AppRouterCacheProvider>
          <RanchOpsThemeProvider>
            <AppShellLayout>{children}</AppShellLayout>
          </RanchOpsThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
