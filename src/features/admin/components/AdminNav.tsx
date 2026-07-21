"use client";

import { Box, Button, Tab } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API } from "@/features/auth/hooks/useCurrentUser";
import { ScrollableTabs } from "@/shared/ui";

const LINKS = [
  { href: "/admin", label: "General" },
  { href: "/admin/familias", label: "Familias" },
  { href: "/admin/proveedores", label: "Proveedores" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/presupuestos", label: "Presupuestos" },
  { href: "/admin/proyectos", label: "Proyectos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/pedidos-proveedor", label: "Pedidos Proveedor" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/configuracion", label: "Configuración" },
] as const;

function activeHref(pathname: string): string {
  const match = LINKS.find((link) =>
    link.href === "/admin"
      ? pathname === "/admin"
      : pathname === link.href || pathname.startsWith(`${link.href}/`),
  );
  return match?.href ?? "/admin";
}

export function AdminNav() {
  const pathname = usePathname();
  const value = activeHref(pathname);

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        bgcolor: "background.default",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <ScrollableTabs
        value={value}
        sx={{
          minHeight: 44,
          "& .MuiTab-root": {
            minHeight: 44,
            textTransform: "none",
            fontWeight: 500,
            px: 1.5,
          },
        }}
      >
        {LINKS.map((link) => (
          <Tab
            key={link.href}
            value={link.href}
            label={link.label}
            component={Link}
            href={link.href}
          />
        ))}
      </ScrollableTabs>
    </Box>
  );
}

export function ExportButton({
  endpoint,
  label,
  market,
}: {
  endpoint: string;
  label: string;
  market?: string;
}) {
  const url = market ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}market=${market}` : endpoint;
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={() => window.open(`${API}${url}`, "_blank")}
      sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
    >
      {label}
    </Button>
  );
}
