# ManageBac Clone

A multi-tenant, curriculum-first school management platform modelled on
[ManageBac](https://www.managebac.com), built for the IB continuum (PYP / MYP / DP).
It covers the full teaching → assessment → reporting → community loop across four
user roles (admin, teacher, student, parent).

The product design is reverse-engineered from a live ManageBac instance; see
[`BLUEPRINT.md`](BLUEPRINT.md) for the data model and module breakdown, and
[`notes/exploration-notes.md`](notes/exploration-notes.md) for the raw research.

## Tech stack

- **Next.js 16** (App Router, React Server Components, server actions)
- **PostgreSQL** + **Prisma 6** ORM
- **Tailwind CSS 4**
- Cookie-based sessions (HMAC-signed), bcrypt passwords — no external auth service

## Features

| Area | What's included |
|---|---|
| **Foundation** | Multi-tenant schools (subdomain), programmes (PYP/MYP/DP), grade-level matrix, academic years & terms, 5 roles, school-scoped login |
| **Classes** | Roster, class pages (overview, tasks, units, gradebook, term grades, discussions, members) |
| **Tasks** | Assessment models (points/criteria/binary/observation), categories, file dropbox with EARLY/LATE/WAITING status |
| **Gradebook** | Task grid + MYP term grades (criteria A–D → 1–7 → local equivalent, ATL ratings), auto-save |
| **Curriculum** | Unit planner with per-programme section templates; tasks link to units |
| **IB core** | CAS / Service as Action / Service Learning worksheets; PBL projects (Personal Project, EE…) with supervisor workspace; student portfolios |
| **Reporting** | Proofing & review matrix → report-card generation (immutable snapshots) → publish → print-friendly report cards |
| **Community** | Class discussions (threads + replies) |
| **Wellbeing** | Student profiles + behaviour & discipline notes |
| **Insights** | Academic analytics (achievement snapshot, grade distribution, subject averages) + engagement analytics |
| **Parents** | Parent portal: children overview, grades, tasks, activities, reports, behaviour notes (read-only) |

## Getting started

### Prerequisites

- Node.js 20+ and [pnpm](https://pnpm.io) (or npm)
- PostgreSQL 14+ running locally

### Setup

```bash
cd webapp
pnpm install                      # or: npm install

# Create the database
createdb managebac_dev

# Configure environment
cp .env.example .env              # then edit DATABASE_URL / AUTH_SECRET

# Apply the schema
npx prisma migrate deploy         # or: npx prisma migrate dev

# Seed demo data (run in order)
npx tsx prisma/seed.ts            # school, programmes, users, classes
npx tsx prisma/seed-phase2.ts     # task categories, tasks, grades
npx tsx prisma/seed-phase3a.ts    # units + CAS/SA activities
npx tsx prisma/seed-g10-students.ts
npx tsx prisma/seed-phase3b.ts    # Personal Project + portfolio evidence
npx tsx prisma/seed-term-grades.ts
npx tsx prisma/seed-behaviour.ts
npx tsx prisma/seed-discussions.ts

# Run
npm run dev                       # http://localhost:3000
```

> **Note:** the app resolves the tenant from the host subdomain and falls back
> to the `demo` school on `localhost`, so no DNS setup is needed for local dev.

### Demo logins

All demo accounts use the password **`Demo123!`**:

| Role | Email |
|---|---|
| Admin | `admin@demo.school` |
| Teacher | `t.biology@demo.school` |
| Student | `dia9001@student.demo.school` |
| Parent | `parent1@demo.school` |

## Project structure

```
webapp/
├── prisma/
│   ├── schema.prisma      # data model
│   └── seed*.ts           # demo data seeders
└── src/
    ├── app/
    │   ├── (app)/         # authenticated app (dashboard, classes, reporting, …)
    │   ├── login/         # auth
    │   └── api/           # file download routes (submissions, portfolio)
    └── lib/               # db client, session, tenant, domain helpers (myp, projects, analytics…)
```

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Secret for signing session cookies |
