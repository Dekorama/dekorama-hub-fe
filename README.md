# Dekorama Hub — Frontend

Next.js App Router UI for Dekorama Hub: landing, client/professional workspace, and admin console for VE/ES markets.

## Stack

- **Next.js** 16 (App Router) + **React** 19 + **TypeScript**
- **Material UI** 6 (`@mui/material`, Emotion)
- **Recharts** (admin reports)
- **GSAP** / **Motion** / **Lenis** / **OGL** (landing motion)
- Cookie session against the Nest API (`credentials: "include"`)

## Prerequisites

- Node.js 20+
- Running backend ([`dekorama-be`](../dekorama-be)) on port **3001** by default

## Quick start

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build
npm start
npm run lint
```

## Environment

| Variable | Default | Notes |
|----------|---------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3001` | Backend origin |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | _(optional)_ | Support mailto / contact |

`.env.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_SUPPORT_EMAIL=soporte@dekorama.com
```

API helper: `useCurrentUser` and most pages use `process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"`.

## Auth & roles

Session cookie `dekorama_session` is set by the backend. Frontend never stores the password; it calls `/auth/me` with cookies.

| Role | Typical routes |
|------|----------------|
| Guest | `/`, `/login`, `/registro`, `/venezuela` |
| Client | `/dashboard`, `/proyectos`, `/carrito`, `/solicitudes`, `/facturas`, `/pedidos`, comunidad |
| Professional | Same project/proposal flows + `/portafolio`, verification docs |
| Admin | `/admin/*` |

Account types for clients: `individual` | `community` | `member` (community organizer invites vecinos).

## Routes

### Public

| Path | Screen |
|------|--------|
| `/` | Marketing landing |
| `/venezuela` | VE store / market page |
| `/login` | Login |
| `/registro` | Register (client / professional) |

### App (authenticated)

| Path | Screen |
|------|--------|
| `/dashboard` | Home by role |
| `/dashboard/comunidad/miembros` | Community members |
| `/dashboard/comunidad/invitaciones` | Community invites |
| `/proyectos` / `/proyectos/[id]` | Projects (depts, progress, notes, team, products, proposals) |
| `/propuestas` | User proposals |
| `/solicitudes` / `/solicitudes/[id]` | Material solicitudes |
| `/carrito` | Cart → submit solicitud |
| `/pedidos` | Client orders |
| `/facturas` | Invoices |
| `/perfil` | Profile / password |
| `/portafolio/editar` | Professional portfolio |
| `/profesionales/[userId]` | Public professional profile |

### Admin (`/admin`)

| Path | Screen |
|------|--------|
| `/admin` | Users, verification, clients, invitations |
| `/admin/productos` | Catalog |
| `/admin/familias` | Families / subfamilies |
| `/admin/proveedores` | Suppliers + factory codes |
| `/admin/presupuestos` | Proposals (list / nuevo / detail) |
| `/admin/pedidos` | Client orders |
| `/admin/pedidos-proveedor` | Supplier orders |
| `/admin/proyectos` | All projects |
| `/admin/reportes` | Charts / KPIs |
| `/admin/configuracion` | Market settings |

Admin market context switches VE ↔ ES for filtered API calls (`adminApiUrl`).

## Project layout

```
src/app/
  page.tsx                 landing
  login/ registro/ venezuela/
  dashboard/ proyectos/ propuestas/ solicitudes/
  carrito/ pedidos/ facturas/ perfil/ portafolio/ profesionales/
  admin/                   admin shell + market context
  components/              AppShell, landing, motion
  hooks/useCurrentUser.ts  session + API base URL
  utils/                   labels, market helpers
public/logo/
```

## Local full stack

1. Start Postgres + API in `dekorama-be` (`docker compose up -d`, set `ADMIN_*` in `.env`, `npm run seed`, `npm run start:dev`).
2. FE `.env`: `NEXT_PUBLIC_API_BASE_URL=/api` and `API_PROXY_TARGET=http://localhost:3001` (or direct BE URL for local-only).
3. `npm run dev` here.
4. Login with the admin credentials you set in `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
