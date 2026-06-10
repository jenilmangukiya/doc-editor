# AI-Native Workflow Note

This document summarizes how AI assisted in building the Ajaia Document Editor, detailing areas of acceleration, overrides, and verification.

---

## 1. AI Tools Utilized
- **Antigravity (Gemini 3.5 Flash)**: Used for writing boilerplate, generating database queries, styling components, and planning execution steps.

---

## 2. Where AI Materially Sped up Work
- **Boilerplate & Layouts**: Generated clean, responsive dashboard components with Tailwind CSS class styling, including grid elements and loaders.
- **Login Flow Design**: Guided context logic and router navigation redirections, helping establish a secure user state on the client side.
- **Drizzle Joins**: Handled Drizzle ORM query syntax, joining the document, user, and shares tables together in a single efficient SQL query.
- **TipTap Core Configuration**: Configured toolbar command handlers, active-state highlighting, and history actions.
- **Mammoth & File Parsing**: Sourced Mammoth-to-HTML bindings, and generated custom markdown regex patterns to convert headers and bullet points.
- **Export Converters**: Generated CSS `@media print` layout overrides for PDF print-to-file rendering and custom client-side HTML-to-Markdown converters to package files for direct download.

---

## 3. Rejected or Modified AI Outputs
- **Standard Table Names Refactored**: The initial AI plan suggested using standard tables (e.g. `users`, `documents`). Upon running a search query on your Neon database, we discovered active tables from another project. We rejected standard tables and configured Drizzle `pgTableCreator` to use `ajaia_` prefixes, and injected `tablesFilter: ["ajaia_*"]` into `drizzle.config.ts` to isolate migration flows.
- **Playwright Tests Canceled**: We created E2E tests, but upon receiving your direct feedback ("No need to write test cases"), we stopped Playwright browser configuration, cleaned up configuration files, and saved engineering hours.
- **Dark Mode CSS Overrides**: Next.js defaults to dark-mode overrides on systems with dark configurations. We removed the dark `@media` settings from `globals.css` to ensure the layout remains white/slate across all environments.
- **Next.js 15 Async Params**: Default AI templates often retrieve route params synchronously (e.g. `params.id`). In Next.js 15, `params` is asynchronous. We updated the Page component to use `React.use(params)` to conform with Next.js 15 conventions.

---

## 4. Verification Methods
- **Database Connection Tests**: Proactively checked local PostgreSQL services using `pg_isready` and tested your remote Neon connection string using `psql` shell commands.
- **Drizzle Kit Pushing**: Verified structural integrity by applying schemas via CLI (`npx drizzle-kit push`).
- **Seeding Verification**: Compiled and executed `src/db/seed.ts` via `tsx` to ensure mock rows were successfully written to the Neon Postgres serverless table.
