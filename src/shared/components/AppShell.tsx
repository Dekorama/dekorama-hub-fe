"use client";

import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
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
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ReceiptIcon from "@mui/icons-material/Receipt";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import Image from "next/image";
import Link from "next/link";
import { ReactNode, useEffect, useState, MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { CurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { CART_UPDATED_EVENT } from "@/shared/utils/cartEvents";
import { getInitials, getRoleLabel } from "@/shared/utils/userLabels";

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
  { href: "/carrito", label: "Carrito", icon: <ShoppingCartIcon />, roles: ["client", "professional"] },
  { href: "/solicitudes", label: "Solicitudes", icon: <RequestQuoteIcon />, roles: ["client", "professional"] },
  { href: "/pedidos", label: "Pedidos", icon: <LocalShippingIcon />, roles: ["client", "professional"] },
  { href: "/facturas", label: "Facturas", icon: <ReceiptIcon />, roles: ["client", "professional"] },
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

  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const showCart = user?.role === "client" || user?.role === "professional";
  const userMenuOpen = Boolean(userMenuAnchor);

  const refreshCartCount = () => {
    if (!user || !showCart) {
      setCartCount(0);
      return;
    }
    fetch(`${API}/cart`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((cart: unknown[]) => setCartCount(cart.length))
      .catch(() => setCartCount(0));
  };

  useEffect(() => {
    refreshCartCount();
  }, [user, pathname, showCart]);

  useEffect(() => {
    if (!showCart) return;
    const handleCartUpdated = () => refreshCartCount();
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
  }, [user, showCart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(open));
  }, [open]);

  const sidebarWidth = open ? SIDEBAR_OPEN : SIDEBAR_CLOSED;

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  const handleUserMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleMenuNavigate = (href: string) => {
    handleUserMenuClose();
    window.location.href = href;
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      (user?.role !== "admin" || item.href !== "/proyectos") &&
      (!item.roles || (user?.role && item.roles.includes(user.role))),
  );
  
  // Add Comunidad link dynamically for community organizers
  if (user?.accountType === "community") {
    const proyectosIndex = visibleItems.findIndex((item) => item.href === "/proyectos");
    const insertAt = proyectosIndex !== -1 ? proyectosIndex + 1 : visibleItems.length;
    visibleItems.splice(insertAt, 0,
      { href: "/dashboard/comunidad/invitaciones", label: "Invitaciones", icon: <GroupsIcon /> },
      { href: "/dashboard/comunidad/miembros", label: "Vecinos", icon: <GroupsIcon /> },
    );
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
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                <>
                  <Tooltip title="Cuenta">
                    <IconButton
                      onClick={handleUserMenuOpen}
                      size="small"
                      sx={{ p: 0.5 }}
                      aria-controls={userMenuOpen ? "user-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={userMenuOpen ? "true" : undefined}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "primary.main",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {getInitials(user.name ?? user.email)}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    id="user-menu"
                    anchorEl={userMenuAnchor}
                    open={userMenuOpen}
                    onClose={handleUserMenuClose}
                    onClick={handleUserMenuClose}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                    slotProps={{
                      paper: {
                        elevation: 3,
                        sx: { minWidth: 220, mt: 1 },
                      },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>
                        {user.name ?? "Usuario"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {user.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getRoleLabel(user.role)}
                      </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => handleMenuNavigate("/perfil")}>
                      <ListItemIcon>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      Mi perfil
                    </MenuItem>
                    {showCart && (
                      <MenuItem onClick={() => handleMenuNavigate("/carrito")}>
                        <ListItemIcon>
                          <Badge badgeContent={cartCount} color="primary">
                            <ShoppingCartIcon fontSize="small" />
                          </Badge>
                        </ListItemIcon>
                        Carrito
                      </MenuItem>
                    )}
                    {user.role === "admin" && (
                      <MenuItem onClick={() => handleMenuNavigate("/admin")}>
                        <ListItemIcon>
                          <AdminPanelSettingsIcon fontSize="small" />
                        </ListItemIcon>
                        Administración
                      </MenuItem>
                    )}
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      Cerrar sesión
                    </MenuItem>
                  </Menu>
                </>
              )}
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


