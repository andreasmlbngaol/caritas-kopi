<div align="center">

# Database Kopi

**Caritas Kopi — baseline data collection for coffee villages and farmers of Indonesia. PKL project by Andreas Manatar Lumban Gaol.**

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D2744?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![NextAuth](https://img.shields.io/badge/NextAuth-v5-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://authjs.dev/)
[![bcrypt.js](https://img.shields.io/badge/bcrypt.js-3-2A4D69?style=for-the-badge&logo=javascript)](https://www.npmjs.com/package/bcryptjs)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare%20R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/r2/)
[![ESLint](https://img.shields.io/badge/ESLint-9-4034EA?style=for-the-badge&logo=eslint&logoColor=white)](https://eslint.org/)

</div>

Database Kopi is a web application for collecting **baseline data of coffee
villages and farmers** across Indonesia. Developed by **Andreas Manatar Lumban
Gaol** as a **PKL (Praktik Kerja Lapangan)** internship project, the app lets
enumerators record village profiles, coffee business conditions, conservation
status, farmer details, plots, Good Agricultural Practices (GAP), production
history, products sold, market channels, and garden conditions — then export
each record to **PDF** or **DOCX**. Built on a Next.js App Router with PostgreSQL,
Prisma, NextAuth, and Cloudflare R2 for photo storage.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
  - [Frontend](#frontend)
  - [Backend & API](#backend--api)
  - [Database](#database)
  - [Storage](#storage)
  - [Tooling](#tooling)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Configuration](#configuration)
  - [Development](#development)
  - [Production Build](#production-build)
- [Usage](#usage)
- [License](#license)

---

## Overview

Every coffee-lending or sustainability program starts with a question: *what
does the landscape look like here?* Database Kopi answers that by structuring
the full baseline survey into a guided, form-based workflow:

1. **Enumerators** log in with credentials issued by the admin.
2. They walk village-by-village through an **Indonesian administrative
   hierarchy** (Provinsi → Kabupaten → Kecamatan → Desa), recording each
   *desa's* territory data, local institutions and policies, coffee business
   conditions, and conservation status.
3. Within each village they register **farmer groups** (*kelompok tani*) and
   individual **farmers** (*petani*), capturing every detail — plot coordinates,
   shade trees, GAP practices, multi-year production, products sold, and market
   channels.
4. Photos are uploaded directly to **Cloudflare R2** (processed server-side:
   EXIF-rotated, resized to 1920 px max, re-encoded to WebP at 90 % quality).
5. Any record can be **exported** as a printable PDF or an editable DOCX with a
   single click.
6. **Admins** get a dedicated **analytics dashboard**: aggregate views across
   GAP adoption, agronomy, production, market & products, conservation, region &
   institutions, and a geospatial map — all read-only and admin-only.

Role-based access ensures enumerators only see and edit their own records,
while admins get a full overview and can manage user accounts. The UI ships
with a **light/dark theme** (following the OS by default, with a manual toggle)
and a **responsive navigation** that collapses to a drawer on small screens.

## Features

| Feature                        | Description                                                                                                                                                                  |
|--------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Two-tier auth**              | Credential-based login (NextAuth 5) with JWT sessions; admin can create/manage enumerator accounts with bcrypt-hashed passwords.                                              |
| **Role-based access control**  | Admins see all data across the system; enumerators see only their own records. Authorization is enforced both in the UI (role-gated nav) and server-side on every action.      |
| **Hierarchical wilayah**       | Full Indonesian region tree (Provinsi → Kabupaten → Kecamatan → Desa) seeded from a SQL dump; live-filtered cascading selects on every form.                                  |
| **Baseline desa forms**        | Structured forms covering territory, population, coffee business, and conservation — split into collapsible sections with shared UI primitives.                             |
| **Farmer (petani) profiles**   | Rich farmer records: identity, contacts, emergency contacts, land-ownership status, multi-plot details with GPS/lat-long, shade trees, and pestisida logs.                     |
| **GAP practice tracking**      | Per-farmer checklist of 21 Good Agricultural Practice items (pruning, weeding, harvesting, etc.) grouped into 5 categories, with Ya/Tidak/Kadang responses and optional notes.                |
| **Production & sales history** | Year-by-year production records with configurable units, plus product and market-channel tracking with percentages and buyer profiles.                                        |
| **Garden condition audit**     | Binary yes/no checklist of 10 conservation / risk conditions (erosion, landfires, wildlife conflict, protected-area buffer, etc.) with optional notes.                        |
| **Analytics dashboard** *(admin)* | Aggregate, read-only analytics across 7 categories — **GAP** (per-practice proportion bars), **Agronomi** (varieties, shade trees, age), **Produksi** (multi-year volume & productivity), **Pasar & Produk** (products, market channels), **Konservasi** (garden conditions, wildlife conflict, protected areas), **Wilayah** (demographics, institutions, policies), and **Peta** (Leaflet map of village & plot coordinates). Charts via `recharts`; free-text fields are grouped case-insensitively and placeholder "-" values excluded. |
| **Dark mode**                  | Class-based light/dark theme that follows the OS by default with a manual toggle (persisted in `localStorage`), applied before paint to avoid flashes. No `dark:` sprawl — the palette tokens are remapped in one place. |
| **Responsive navigation**      | Collapsible icon/expanded rail on desktop with remembered state; on small screens it becomes a hamburger-triggered drawer.                                                       |
| **Accessible & polished UI**   | Managed dialogs (focus trap, Esc, focus restore, ARIA), keyboard focus rings, reduced-motion support, per-route page titles, and skeleton loading states.                       |
| **Photo upload**               | Authenticated image upload (JPG/PNG/WebP/HEIC, 10 MB max) processed via Sharp and stored on Cloudflare R2; served back through an authenticated `/api/foto/[key]` proxy.     |
| **PDF exports**                | Per-record PDF generation via `@react-pdf/renderer` for both desa and petani, including embedded photos pulled through the auth-protected foto endpoint.                     |
| **DOCX exports**               | Per-record Microsoft Word (`.docx`) generation via the `docx` library for both desa and petani.                                                                               |
| **Search & pagination**        | Server-side search with `LIKE ILIKE` on petani and kelompok-tani lists; paginated farmer table (20 per page).                                                                  |
| **Collapsible sidebar**        | Icon-only / expanded navigation rail with remembered state (1-year cookie) and per-user avatar initials; hamburger drawer on mobile.                                          |

## Tech Stack

### Frontend

- **Next.js 16** — App Router with Turbopack, React Server Components, and Server Actions for all mutations.
- **React 19** — concurrent features, `useActionState` for form handling, Suspense boundaries.
- **TypeScript 5** — strict mode, path alias `@/*`.
- **Tailwind CSS 4** — utility-first styling via PostCSS, custom **jade-green** academic theme, and a class-based **dark mode** (token remapping, OS-aware).
- **recharts 3** — charts on the analytics dashboard (bar, horizontal bar, line, donut, stacked, and proportion bars).
- **Leaflet + React-Leaflet 5** — the geospatial village/plot map.
- **lucide-react 1.47** — icon library.
- **React Server Components** — server-rendered forms and data fetching; client components only where needed (`use client` for interactive UI).

### Backend & API

- **Next.js App Router** — API routes under `app/api/` handle auth, wilayah lookup, kelompok-tani fetch, photo upload, and photo serving.
- **NextAuth v5 (beta)** — credentials provider with bcrypt password verification, JWT strategy, and a custom callback that injects `id` and `role` into both the token and the session.
- **bcryptjs 3** — password hashing and verification.
- **zod 4** — input validation (via the generated Prisma types and form schemas).
- **Sharp** — server-side image processing (EXIF rotation, resize, WebP re-encode).
- **Middleware (`proxy.ts`)** — NextAuth-auth-guarded middleware that protects every route except `/login`, `/api/*`, and static assets.
- **Server Actions** — all CRUD mutations (create/edit/delete/export) run as `use server` functions, with `useActionState` for error handling on the client.

### Database

- **PostgreSQL 16** — primary datastore via a managed connection (Supabase connection pooler in production).
- **Prisma 6** — with the `@prisma/adapter-pg` (`PrismaPg`) engine-less adapter (no native query engine binary needed); schema, migrations, and seeding all driven by Prisma.
- **Hikari-free pooling** — the `PrismaPg` adapter uses the lightweight `pg` driver with built-in connection pooling.
- **6 migrations** — covering users, wilayah hierarchy, baseline desa, kelompok tani, and the full petani model (plots, naungan, GAP, produksi, produk, pasar, kondisi kebun).
- **Automatic seed** — `npm run seed` creates the admin user from env vars; `npm run seed:wilayah` populates the region hierarchy from a SQL dump.

### Storage

- **Cloudflare R2** — S3-compatible object storage for farmer photos, accessed via the `aws4fetch` library with signed requests.
- Photos are namespaced under `petani/<uuid>.webp` and served through an authenticated reverse proxy at `/api/foto/[key]` (blocks path traversal and keys outside the `petani/` prefix).

### Tooling

- **Turbopack** — incremental bundler (dev and build).
- **Vite-style dev server** — hot reload via `next dev`.
- **ESLint 9** with `eslint-config-next` — linting on save and in CI.

## Architecture

Database Kopi is a **monolithic Next.js application** using the App Router.
Server Actions and API Routes handle all data mutations and file operations;
Prisma sits on top of the `pg` driver (via the engine-less `PrismaPg` adapter)
for all database access. The NextAuth middleware (`proxy.ts`) wraps every route
except login and API endpoints, and the `/api/foto/[key]` endpoint acts as an
authenticated proxy to Cloudflare R2 so photos are never publicly served.
Admin analytics pages are React Server Components that aggregate data with
Prisma and hand plain objects to `recharts`/Leaflet client components.

```mermaid
flowchart TB
    subgraph Client["Web App — Next.js 16 + React 19 + Tailwind CSS"]
        UI["Login / Dashboard / Desa / Petani / Kelompok Tani / Exports"]
        AN["Analitik (admin) — recharts + Leaflet"]
    end

    subgraph Server["Next.js Server (App Router)"]
        MW["Middleware — NextAuth (protects all routes)"]
        SA["Server Actions — CRUD mutations"]
        RSC["RSC Analytics — Prisma aggregate queries"]
        API["API Routes — /api/auth, /api/upload, /api/foto, /api/wilayah, /api/kelompok-tani"]
        PDF["PDF / DOCX Export Handlers"]
        SHARP["Sharp — image processing"]
    end

    subgraph Data["Datastores & Services"]
        PG[(PostgreSQL 16)]
        R2[(Cloudflare R2)]
    end

    UI -->|navigates, submits forms| MW
    MW --> UI
    MW -->|guards| SA
    MW -->|guards| API
    MW -->|guards| RSC
    AN -->|"aggregated data"| RSC
    SA -->|"Prisma Client"| PG
    RSC -->|"Prisma Client"| PG
    API -->|"Prisma Client"| PG
    API --> SHARP
    SHARP -->|"processed images"| R2
    API <-->|"signed PUT/GET"| R2
    PDF -->|"Prisma fetch"| PG
    PDF -->|"auth-protected foto proxy"| API
```

## Project Structure

```text
Database Kopi/
├─ app/                              # Next.js App Router (TypeScript / TSX)
│  ├─ api/                           # API routes
│  │  ├─ auth/[...nextauth]/route.ts  # NextAuth handlers (GET, POST)
│  │  ├─ foto/[...key]/route.ts       # Authenticated R2 photo proxy (path-traversal guarded)
│  │  ├─ kelompok-tani/route.ts       # Fetch kelompok by desa kode
│  │  ├─ upload/route.ts              # Photo upload → Sharp process → R2 PUT
│  │  └─ wilayah/route.ts             # Cascading region lookup (parent → children)
│  ├─ (main)/                        # Authenticated app layout
│  │  ├─ admin/users/                 # Admin: manage enumerator users (create, reset, toggle)
│  │  ├─ analitik/                    # Admin-only analytics (RSC aggregate queries)
│  │  │  ├─ queries.ts                # Prisma aggregations (getRingkasan, getGapAdoption, ...)
│  │  │  ├─ _components/              # charts.tsx (recharts), analytics-ui.tsx, palette.ts, map.tsx
│  │  │  ├─ gap|agronomi|produksi|pasar|konservasi|wilayah|peta/page.tsx
│  │  │  └─ loading.tsx               # Skeleton loading state
│  │  ├─ desa/                       # Village baseline CRUD
│  │  │  ├─ [id]/
│  │  │  │  ├─ edit/                  # Edit form
│  │  │  │  ├─ export/
│  │  │  │  │  ├─ pdf/               # PDF export (React PDF renderer)
│  │  │  │  │  └─ docx/              # DOCX export (docx builder)
│  │  │  └─ page.tsx                 # Detail / view
│  │  │  ├─ page.tsx                  # List (admin: all; enumerator: own)
│  │  │  ├─ baru/page.tsx             # Create form
│  │  │  ├─ form.tsx, queries.ts, export-model.ts, ...
│  │  ├─ kelompok-tani/               # Farmer-group master data CRUD
│  │  ├─ petani/                     # Farmer records CRUD
│  │  │  ├─ [id]/
│  │  │  │  ├─ edit/                  # Full edit form (plots, naungan, GAP, produksi, produk, pasar, kondisi)
│  │  │  │  ├─ export/
│  │  │  │  │  ├─ pdf/               # PDF export (includes auth-protected foto links)
│  │  │  │  │  └─ docx/              # DOCX export
│  │  │  └─ page.tsx                 # Detail / view
│  │  │  ├─ baru/page.tsx             # Create form (auto-creates kelompok if needed)
│  │  │  ├─ form.tsx, plot-fields.tsx, gap-fields.tsx, ...
│  │  ├─ _components/                 # Shared UI primitives (Section, Grid, Field, Modal, Skeleton, ...)
│  │  ├─ layout-cls.ts                # Shared layout class constants
│  │  ├─ layout.tsx                   # Authenticated layout (NavRail + session check)
│  │  ├─ nav-rail.tsx                 # Collapsible rail + mobile drawer, role-gated admin links
│  │  ├─ number-wheel-guard.tsx       # Blurs number inputs on scroll to prevent accidental changes
│  │  └─ actions.ts                   # Logout action
│  ├─ _components/
│  │  └─ theme-toggle.tsx             # Light/dark toggle (localStorage + OS default)
│  ├─ login/                         # Login page (centered 2-column card) + actions
│  ├─ globals.css                    # Tailwind base + jade theme + dark-mode token remap
│  ├─ layout.tsx                     # Root layout (Geist font, metadata, anti-flash theme script)
│  └─ generated/prisma/              # Generated Prisma client (gitignored)
├─ lib/
│  ├─ prisma.ts                      # PrismaClient with PrismaPg adapter (global singleton)
│  └─ r2.ts                          # Cloudflare R2 client factory (cached AwsClient)
├─ prisma/
│  ├─ schema.prisma                  # Data model (User, Wilayah*, BaselineDesa, KelompokTani, Petani*)
│  ├─ prisma.config.ts               # Prisma config (engine: classic, env-driven URL)
│  ├─ seed.ts                        # Seed admin user from env vars (bcrypt-hashed)
│  ├─ seed-wilayah.ts                # Seed region hierarchy from SQL dump
│  ├─ seed-sample.ts                 # Sample data (5 desa/petani/kelompok, SAMPEL- prefix)
│  ├─ data/
│  │  └─ wilayah.sql                 # Full Indonesian region codes + names dump
│  └─ migrations/                    # 6 sequential migration folders
├─ public/
│  └─ caritas_icon.webp              # App logo / favicon
├─ auth.ts                          # NextAuth instance (Credentials provider + role callbacks)
├─ auth.config.ts                   # NextAuth config (pages, JWT strategy, callbacks)
├─ proxy.ts                         # NextAuth middleware (route protection)
├─ next.config.ts                   # Next.js config (Turbopack, output tracing for Prisma)
├─ tsconfig.json                    # Strict TS with @/* alias
├─ eslint.config.mjs                # ESLint 9 flat config
├─ CLAUDE.md                        # Agent/contributor guide (conventions, design rules)
├─ .env                             # Local dev environment (PostgreSQL + R2 dev bucket)
├─ .env.prod                        # Production environment (Supabase pooler + R2 prod bucket)
├─ package.json
└─ package-lock.json
```

## Getting Started

Database Kopi runs as a standard Next.js application — there's no Docker
compose or Makefile; just Node.js, PostgreSQL, and a Cloudflare R2 bucket.

### Prerequisites

- **Node.js 18+** (tested with Node 20+)
- **pnpm** or **npm** (the repo uses `package-lock.json`)
- **PostgreSQL 16** (local or managed — Supabase pooler works)
- **Cloudflare R2 bucket** with an access key pair (or use the local
  [MinIO](https://min.io/) S3-compatible emulator for dev)
- Git

### Configuration

Copy the example environment template, then fill in your values:

```shell
cp .env.example .env
```

| Variable               | Description                                                               | Default example                                 |
|------------------------|---------------------------------------------------------------------------|-------------------------------------------------|
| `DATABASE_URL`         | PostgreSQL connection string (**required**)                               | `postgresql://user:pass@host:5432/db`           |
| `AUTH_SECRET`          | NextAuth secret for JWT signing (**required**, use a strong random value) | —                                               |
| `ADMIN_USERNAME`       | Admin username for seeding (**required**)                                 | `caritas`                                       |
| `ADMIN_PASSWORD`       | Admin password for seeding (**required**)                                 | —                                               |
| `R2_ENDPOINT`          | Cloudflare R2 endpoint URL (**required**)                                 | `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID`     | R2 access key ID (**required**)                                           | —                                               |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key (**required**)                                       | —                                               |
| `R2_BUCKET_NAME`       | R2 bucket name for photo storage (**required**)                           | —                                               |
| `APP_URL`              | Public app URL (used for photo links in PDF exports)                      | `http://localhost:3000`                         |

### Development

1. Ensure PostgreSQL is running and your `DATABASE_URL` points to an empty (or
   acceptable-to-reset) database.

2. Create the database schema and seed initial data:

   ```shell
   npx prisma db push            # creates tables from schema (first run)
   npm run seed:all
   ```

3. Start the dev server:

   ```shell
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and log in with the
   admin credentials you set in the `.env` file.

### Production Build

```shell
npm run build               # runs prisma generate && next build
npm start                   # starts the production server
```

For a production deployment, serve on a platform that supports Next.js App
Router (Vercel, your own Node.js server, or a PM2-backed VPS). Ensure:

- `DATABASE_URL` points to a managed PostgreSQL instance (with connection
  pooling if needed).
- `APP_URL` is set to your public domain for correct PDF photo links.
- `AUTH_SECRET` is a strong, randomly generated string.
- Env files are never committed (`.env*` is in `.gitignore`).

## Usage

1. **Log in** with the username and password you set in the `.env` file
   (or credentials assigned by an admin).
2. From the **Dashboard**, open one of the sidebar links:
   - **Desa** — browse village baseline records, edit, or export to PDF/Word.
   - **Petani** — browse farmer records (search + pagination), edit, or export.
   - **Kelompok Tani** — manage farmer-group master data.
   - **Kelola Pengguna** *(admin only)* — create/reset enumerator accounts, toggle active status.
   - **Analitik** *(admin only)* — 7 read-only analytics pages:
     - **GAP** — per-practice adoption as Ya/Kadang/Tidak proportion bars.
     - **Agronomi** — varieties, cultivation systems, shade trees, plot age.
     - **Produksi** — multi-year volume (cherry / gabah kering / green bean) & productivity.
     - **Pasar & Produk** — products sold and market channels.
     - **Konservasi** — garden conditions, wildlife conflict, protected areas.
     - **Wilayah** — farmer distribution, demographics, institutions, policies.
     - **Peta** — Leaflet map of village and plot coordinates.
3. Click **"Input Data"** on any list page to create a new record.
4. Click the **PDF** or **Word** icon on any detail row to download an export.
5. Toggle **light/dark theme** from the button above the logout control in the
   sidebar (or top-right of the login card). It follows your OS by default and
   remembers your manual choice.

### Sample data

To explore the analytics with content, seed a small sample set (5 villages,
farmer groups, and farmers with plots, GAP, production, products, markets, and
conservation data):

```shell
npx tsx prisma/seed-sample.ts
```

Records are prefixed with `SAMPEL-` for easy cleanup.

## License

This project is licensed under the **Apache License 2.0** — see the
[LICENSE](./LICENSE) file for details. It was developed by **Andreas Manatar
Lumban Gaol** as a **PKL (Praktik Kerja Lapangan)** internship project in the
Department of Computer Science, Universitas Sumatera Utara.

© 2026 Andreas Manatar Lumban Gaol