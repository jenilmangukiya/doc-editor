# Project Submission Checklist

This file lists all deliverables and materials included in this submission folder for the Ajaia Document Editor project.

---

## 1. Included Deliverables
- **Source Code**: Full React + Next.js App Router project in the root workspace directory.
- **`README.md`**: Step-by-step instructions on setting up, configuring, seeding, and running the project locally.
- **`ARCHITECTURE.md`**: Explanation of system design decisions, user credentials setup, access level structure, and schema table isolation tradeoffs.
- **`AI_WORKFLOW.md`**: Description of AI assistance tools, speed-up areas, output adjustments, and verification steps.
- **Database Schema**: Configured via Drizzle ORM to use `ajaia_` table creator scopes, protecting other tables in your shared Neon instance.

---

## 2. Core Functional Check
- **[x] Light Theme**: Colors locked to slate white.
- **[x] Credentials Login Page**: Interactive sign-in page at `/login` with full redirect handling.
- **[x] Demo Autofill Links**: Demo account links populate form inputs and log in on click.
- **[x] Auto-Registration on Login**: Entering a non-existent email automatically signs up and saves the user to `ajaia_users` in the database.
- **[x] Create Document**: Start custom text editor documents from dashboard.
- **[x] Rename Document**: Interactive auto-saving titles inside the editor.
- **[x] Formatting Options**: Bold, Italic, Underline, Headings (H1/H2/H3), Bulleted Lists, and Numbered Lists.
- **[x] Access Management**: Owners can share with other mock users and specify "Can View" (read-only) vs "Can Edit" (read-write) access.
- **[x] File Import**: Drop zones parse `.txt`, `.md`, and `.docx` (Mammoth) directly into new database documents.
- **[x] Auto-Saving**: Keystroke auto-saving debounced at 1.2 seconds with status indicators.
- **[x] Export Formats**: Dedicated Export button supports downloading documents in PDF (using print stylesheets) and Markdown (parsing TipTap HTML into markdown syntax) formats client-side.

---

## 3. Demo Testing Credentials
You can log in via `/login` using these quick-autofill buttons:
- **Alice**: `alice@example.com`
- **Bob**: `bob@example.com`
- **Charlie**: `charlie@example.com`
Or type in **any custom email** to automatically create it in the database and log in.
No passwords or registration steps are needed.
