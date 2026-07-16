"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const ROUTE_TITLES: Array<{ match: (path: string) => boolean; title: string }> = [
  { match: (p) => p === "/dashboard/comunidad/miembros", title: "Vecinos" },
  { match: (p) => p === "/dashboard/comunidad/invitaciones", title: "Invitaciones" },
  { match: (p) => p === "/dashboard", title: "Panel Dekorama Hub" },
  { match: (p) => p === "/proyectos", title: "Proyectos" },
  { match: (p) => p.startsWith("/proyectos/"), title: "Proyecto" },
  { match: (p) => p === "/solicitudes", title: "Mis Solicitudes" },
  { match: (p) => p.startsWith("/solicitudes/"), title: "Solicitud" },
  { match: (p) => p === "/pedidos", title: "Mis Pedidos" },
  { match: (p) => p === "/facturas", title: "Mis Facturas" },
  { match: (p) => p === "/propuestas", title: "Propuestas" },
  { match: (p) => p === "/portafolio/editar", title: "Portafolio" },
  { match: (p) => p === "/carrito", title: "Carrito de Compras" },
  { match: (p) => p === "/perfil", title: "Mi Perfil" },
  { match: (p) => p.startsWith("/profesionales/"), title: "Perfil Profesional" },
  { match: (p) => p.startsWith("/admin"), title: "Administración" },
];

export function getDefaultPageTitle(pathname: string): string {
  return ROUTE_TITLES.find(({ match }) => match(pathname))?.title ?? "Dekorama Hub";
}

interface PageTitleContextValue {
  setTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextValue | null>(null);

export function PageTitleProvider({
  children,
  setTitle,
}: {
  children: ReactNode;
  setTitle: (title: string) => void;
}) {
  return (
    <PageTitleContext.Provider value={{ setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle(title: string): void {
  const ctx = useContext(PageTitleContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.setTitle(title);
  }, [ctx, title]);
}

export function usePageTitleState(pathname: string): { title: string; setTitle: (title: string) => void } {
  const [title, setTitle] = useState(() => getDefaultPageTitle(pathname));

  useEffect(() => {
    setTitle(getDefaultPageTitle(pathname));
  }, [pathname]);

  return { title, setTitle };
}
