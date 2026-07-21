# Dekorama FE — Agent Guide

Read this before touching any frontend code.

## Architecture (mandatory)

Feature-based layout. `app/` is routing only.

```
src/
├── app/                 # Next.js App Router: page.tsx / layout.tsx / route.ts ONLY
├── features/<name>/     # Domain UI + hooks + api/utils + types
├── shared/              # Cross-feature: components, ui, hooks, utils
└── core/                # App-wide providers / theme
```

### Dependency direction (never invert)

```
app/page → features/*/components → shared/* → core/*
                ↓
         features/*/hooks|api|utils
```

- Pages import features. Features never import `app/**`.
- Features may import `shared/**` and `core/**`.
- Features must not import other features except via shared types/utils, or a thin intentional bridge (prefer shared).
- Prefer `@/` absolute imports.

### Feature folder shape

```
features/<name>/
├── components/     # UI (named *Page, *Tab, *Dialog, *Form)
├── hooks/          # optional — reusable client logic
├── api/ | utils/   # optional — fetch helpers
└── types.ts        # optional — domain types
```

Empty layer folders: do not create. Add when needed.

### Thin pages pattern

Every `app/**/page.tsx` should be thin:

```tsx
"use client"; // only if the feature page is a client component

import { CartPage } from "@/features/cart/components/CartPage";

export default function Page() {
  return <CartPage />;
}
```

Put logic, JSX, types local to the screen inside `features/<name>/components/`.

### Naming

| Kind | Name |
|------|------|
| Full screen from a route | `FooPage` |
| Tab panel | `FooTab` |
| Dialog | `FooDialog` |
| Form / wizard | `FooForm` / `FooWizard` |
| Shared primitive | under `shared/ui` or `shared/components` |

### Mobile UX (authenticated app)

Use shared primitives — do not reinvent:

- `ResponsiveTable` — tables (horizontal scroll on small screens)
- `ScrollableTabs` — tab bars
- `PageToolbar` — filter/action rows that stack on `xs`
- `TableLoadingRow` / `TableEmptyRow` — in-table loading spinner and empty message rows

Import: `import { ResponsiveTable, ScrollableTabs, PageToolbar, TableLoadingRow, TableEmptyRow } from "@/shared/ui"`.

### New screen checklist

1. Add / extend `features/<name>/components/...`
2. Wire thin `app/.../page.tsx` that only renders that component
3. Reuse `shared/ui` for tables/tabs/toolbars
4. Types in `features/<name>/types.ts` if shared across files
5. No business logic left in `app/` beyond route params → props if needed

### Feature map (routes → feature)

| Route prefix | Feature |
|--------------|---------|
| `/login`, `/registro` | `auth` |
| `/`, `/venezuela` | `landing` |
| `/carrito` | `cart` |
| `/pedidos` | `orders` |
| `/facturas` | `invoices` |
| `/propuestas`, `/solicitudes` | `proposals` |
| `/dashboard/comunidad/*` | `community` |
| `/perfil` | `profile` |
| `/profesionales/*` | `professionals` |
| `/portafolio/*` | `portfolio` |
| `/proyectos/*` | `projects` |
| `/admin/*`, `/dashboard` (admin widgets) | `admin` |

### Do not

- Dump new components into `app/components`
- Grow `page.tsx` past ~40 lines (prefer extract)
- Use `any`
- Add cards as default mobile table replacement (scroll tables via `ResponsiveTable`)
- Change public URLs when moving code
