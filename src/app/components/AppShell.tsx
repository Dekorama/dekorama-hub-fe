"use client";

import {
  AppBar,
  Badge,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import GroupsIcon from "@mui/icons-material/Groups";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Image from "next/image";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CurrentUser, API } from "../hooks/useCurrentUser";

const SIDEBAR_OPEN = 240;
const SIDEBAR_CLOSED = 64;
const STORAGE_KEY = "dekorama_sidebar_open";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: <DashboardIcon /> },
  { href: "/proyectos", label: "Proyectos", icon: <FolderOpenIcon /> },
  { href: "/propuestas", label: "Propuestas", icon: <DescriptionIcon />, roles: ["professional"] },
  { href: "/portafolio/editar", label: "Portafolio", icon: <FolderOpenIcon />, roles: ["professional"] },
  { href: "/admin", label: "Administración", icon: <AdminPanelSettingsIcon />, roles: ["admin"] },
];

interface AppShellProps {
  title: string;
  children: ReactNode;
  user?: CurrentUser | null;
}

export function AppShell({ title, children, user }: AppShellProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = useState<boolean>(true);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setOpen(stored === "true");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch cart count
      fetch(`${API}/cart`, { credentials: "include" })
        .then((res) => res.ok ? res.json() : [])
        .then((cart) => setCartCount(cart.length))
        .catch(() => setCartCount(0));
    }
  }, [user]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, String(open));
    }
  }, [open, mounted]);

  const sidebarWidth = open ? SIDEBAR_OPEN : SIDEBAR_CLOSED;

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );
  
  // Add Comunidad link dynamically for community organizers
  if (user?.accountType === "community") {
    const comunidadItem = {
      href: "/dashboard/comunidad/invitaciones",
      label: "Comunidad",
      icon: <GroupsIcon />,
    };
    // Insert after Proyectos, before Propuestas/Admin
    const insertIndex = visibleItems.findIndex(item => item.href === "/propuestas" || item.href === "/admin");
    if (insertIndex !== -1) {
      visibleItems.splice(insertIndex, 0, comunidadItem);
    } else {
      visibleItems.push(comunidadItem);
    }
  }

  const drawerContent = (
    <>
      {/* Logo */}
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? "center" : (open ? "flex-start" : "center"),
          px: isMobile ? 2 : (open ? 2 : 0),
          flexShrink: 0,
        }}
      >
        <Image
          src={isMobile ? "/logo/dekorama-logo-white.svg" : (open ? "/logo/dekorama-logo-white.svg" : "/logo/dekorama-icon-white.svg")}
          alt="Dekorama"
          width={isMobile ? 140 : (open ? 140 : 36)}
          height={36}
          priority
          style={{ objectFit: "contain" }}
        />
      </Box>

      {/* Nav items */}
      <List sx={{ flex: 1, px: 1, pt: 1 }}>
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const isOpen = isMobile || open;
          const btn = (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                minHeight: 44,
                px: isOpen ? 2 : 1.5,
                justifyContent: isOpen ? "flex-start" : "center",
                bgcolor: active ? "rgba(255,255,255,0.12)" : "transparent",
                borderLeft: active ? "3px solid #fff" : "3px solid transparent",
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                color: "#fff",
              }}
            >
              <ListItemIcon
                sx={{
                  color: "#fff",
                  minWidth: isOpen ? 36 : "unset",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {isOpen && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }}
                />
              )}
            </ListItemButton>
          );
          return (isOpen || isMobile) ? (
            btn
          ) : (
            <Tooltip key={item.href} title={item.label} placement="right">
              {btn}
            </Tooltip>
          );
        })}
      </List>

      {/* Toggle button - solo en desktop */}
      {!isMobile && (
        <Box
          sx={{
            display: "flex",
            justifyContent: open ? "flex-end" : "center",
            p: 1,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <IconButton onClick={() => setOpen((v) => !v)} sx={{ color: "rgba(255,255,255,0.5)" }}>
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: SIDEBAR_OPEN,
              bgcolor: "#0f0f0f",
              color: "#fff",
              borderRight: "none",
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: sidebarWidth,
              overflowX: "hidden",
              bgcolor: "#0f0f0f",
              color: "#fff",
              borderRight: "none",
              transition: (theme) =>
                theme.transitions.create("width", {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Right column */}
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "#fff",
            borderBottom: "1px solid #e0e0e0",
            color: "#000",
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isMobile && (
                <IconButton
                  onClick={() => setMobileOpen(true)}
                  edge="start"
                  sx={{ mr: 1, color: "#000" }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {title}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {user && (
                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: { xs: 100, sm: 200 } }}>
                  {user.name ?? user.email}
                </Typography>
              )}
              {user && (
                <Tooltip title="Carrito de compras">
                  <IconButton component={Link} href="/carrito" size="small" sx={{ color: "#555" }}>
                    <Badge badgeContent={cartCount} color="primary">
                      <ShoppingCartIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Cerrar sesión">
                <IconButton onClick={handleLogout} size="small" sx={{ color: "#555" }}>
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3 }, bgcolor: "background.default" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}


