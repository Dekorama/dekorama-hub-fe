"use client";

import { Box, Button, Stack } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API } from "@/features/auth/hooks/useCurrentUser";

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
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        bgcolor: "background.default",
        borderBottom: 1,
        borderColor: "divider",
        pb: 1.5,
        mb: 0,
      }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          overflowX: "auto",
          flexWrap: "nowrap",
          pb: 0.5,
          "&::-webkit-scrollbar": { height: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 2 },
        }}
      >
        {LINKS.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Button
              key={link.href}
              component={Link}
              href={link.href}
              variant={active ? "contained" : "outlined"}
              size="small"
              sx={{
                flexShrink: 0,
                whiteSpace: "nowrap",
                minWidth: "auto",
                px: 2,
              }}
            >
              {link.label}
            </Button>
          );
        })}
      </Stack>
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
