# Final Project 2026

A mock pharmacy inventory and dispensing system built as an npm workspaces monorepo. The project combines a TypeScript/Express API, a React/Vite frontend, shared database packages, and end-to-end test coverage for the stock flows, inventory views, and product management screens. This project will serve as our final project in the subjects of Software Engineering Project Management, Software Requirements and Specification, Software Component Design, and Software Testing.

## What's Inside

- Inventory management for medicine batches and stock levels
- Stock in and stock out workflows, including dispense handling
- Product browsing and search
- Dashboard charts and summary views
- Audit logging for traceability of inventory mutations
- Automated tests for the API and browser flows
- Storybook for UI development and component review

## Repository Layout

- `apps/api` - Express API, Drizzle schema, migrations, and Jest tests
- `apps/web` - React frontend, Playwright E2E tests, and Storybook
- `packages/db` - Shared database package used by the app packages

## Setup

1. Install dependencies from the repository root:

```bash
npm install
```

2. Create your environment files.

The API expects:

- `DATABASE_URL` for development
- `TEST_DATABASE_URL` for tests

3. Run the apps.

```bash
npm run dev
```

If you want to run a single workspace directly:

```bash
npm --workspace apps/api run dev
npm --workspace apps/web run dev
```

## Available Scripts

Root scripts:

```bash
npm run dev
npm run build
```

API scripts:

```bash
npm --workspace apps/api run dev
npm --workspace apps/api run build
npm --workspace apps/api run start
npm --workspace apps/api test
npm --workspace apps/api run db:generate
npm --workspace apps/api run db:migrate
npm --workspace apps/api run db:studio
npm --workspace apps/api run db:seed:medicines
```

Web scripts:

```bash
npm --workspace apps/web run dev
npm --workspace apps/web run build
npm --workspace apps/web run lint
npm --workspace apps/web run preview
npm --workspace apps/web run test:e2e
npm --workspace apps/web run test:e2e:ui
npm --workspace apps/web run test:e2e:headed
npm --workspace apps/web run storybook
npm --workspace apps/web run build-storybook
```

## Testing

- API tests use Jest with `--runInBand` and `--detectOpenHandles` for stability.
- The test environment should point at a separate `TEST_DATABASE_URL` so development data is not affected.
- Playwright E2E tests live in `apps/web/e2e` and start the monorepo dev workflow.

## Database

The project uses Drizzle for schema management and migrations. The shared database package lives in `packages/db`, while the API workspace defines the application tables and contains the migration and seed scripts.

Common database commands:

```bash
npm --workspace apps/api run db:generate
npm --workspace apps/api run db:migrate
npm --workspace apps/api run db:studio
```

## Notes

- The root workspace is managed with Turbo and npm workspaces.
- API and web documentation files in each workspace include additional setup notes.
- The inventory flow is designed around batches, transactions, and audit trails so changes remain traceable.
