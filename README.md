## RanchOps MVP

Frontend (Next.js + Material UI) y backend (NestJS + Postgres) para el MVP descrito en `RanchOps — Technical MVP Overview`.

### Frontend (`ranchops-fe`)

- **Stack**: Next.js (App Router), React, Material UI.
- **Pantallas**:
  - **Landing** en `/` con explicación del MVP y CTA a login/registro.
  - **Login** en `/login`.
  - **Registro** en `/registro`.
  - **Dashboard** mínimo en `/dashboard` (requiere sesión).

#### Ejecutar frontend

```bash
cd ranchops-fe
npm install    # instala Next, React, MUI, etc.
npm run dev    # http://localhost:3000
```

- **Config API**: la URL base del backend se configura con `NEXT_PUBLIC_API_BASE_URL` (por defecto `http://localhost:3001`).

### Backend (`ranchops-be`)

- **Stack**: NestJS, TypeORM, Postgres.
- **Módulos**:
  - **Auth**: registro, login, logout, `me`.
  - **Users**: entidad `User` (email, nombre, password hash).
- **Sesión**: cookie HTTP-only `ranchops_session` con el `userId` (KISS, sin JWT para el MVP).

#### Variables de entorno sugeridas

En `ranchops-be`:

```bash
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ranchops
```

#### Ejecutar backend

```bash
cd ranchops-be
npm install        # instala NestJS, TypeORM, pg, etc.
npm run build
npm start          # API en http://localhost:3001
```

Endpoints principales del MVP:

- **POST** `/auth/register` – crear usuario.
- **POST** `/auth/login` – iniciar sesión y setear cookie de sesión.
- **POST** `/auth/logout` – limpiar cookie.
- **GET** `/auth/me` – devolver usuario actual (MVP muy simple).

