# Architecture & Prioritization Note

This document explains the technical architecture, design decisions, and tradeoffs made for the Ajaia Document Editor project.

---

## 1. Prioritization & Product Tradeoffs

Within the 4-6 hour constraint, we prioritized building a **fully working, cohesive collaborative workflow** over standard enterprise features:

* **Email-based Login & Autofill Demo Accounts**: We implemented an authentication system where users enter their email. To make testing seamless, we added **Quick Demo Account** buttons (for Alice, Bob, Charlie) that autofill credentials and log in instantly.
* **Auto-Registration (Sign up on-the-fly)**: To satisfy the database entry requirements, when a custom email is typed, the server automatically queries the database; if not found, it inserts a new user record inside `ajaia_users` and logs them in.
* **Locked Light / White Theme**: Standard templates support media-query based dark mode, which can cause style hydration mismatches and inconsistent user layouts under dark mode operating systems. We disabled dark mode overrides in `globals.css` and locked colors to a clean light slate (`#f8fafc`) theme.
* **Access Control & Permissions**: We prioritized access controls. A document owner can specify `READ` (read-only) or `WRITE` (edit) permissions for shared users. We built client-side validation (turning TipTap's `editable={false}` for readers) and server-side validation (validating headers and rejecting PUT updates for readers).
* **Document Import over Attachments**: Uploading files as simple attachments is basic. We built a server-side parser that converts `.docx` (via `mammoth`), `.md` (via a lightweight regex-based HTML translator), and `.txt` files directly into rich-text TipTap documents, saving them as new editable drafts instantly.
* **Client-Side Export Formats (PDF & Markdown)**: Added client-side export capabilities to allow immediate document retrieval. Exporting as PDF triggers native browser print dialogs styled via print media CSS rules to format pure content without site wrapper buttons. Exporting as Markdown parses TipTap's HTML tree back to standard Markdown text on-the-fly and downloads it directly.
* **Debounced Auto-Save**: Real-time WebSockets (Yjs/ShareDB) require custom coordinate backends and can exceed free-tier quotas. We implemented a robust, debounced database sync (1.2s delay from last keystroke) with visual status states ("Saving...", "Saved", "Save failed") which fulfills the editing experience reliably.

---

## 2. Technical Stack & Data Model

We utilized **Next.js 15 (App Router)** as it provides high-performance server-side rendering, integrated serverless API routes, and first-class TypeScript support.

### Drizzle ORM & Neon Postgres
We chose Drizzle ORM because it offers lightweight type safety, rapid schema pushing (`drizzle-kit push`), and is optimized for serverless database environments like Neon.

```
                  +-----------------------+
                  |      ajaia_users      |
                  +-----------------------+
                              | (1)
                              |
                              | (1:N)
                              v
                  +-----------------------+
                  |    ajaia_documents    |
                  +-----------------------+
                              | (1)
                              |
                              | (1:N)
                              v
                  +-----------------------+
                  |  ajaia_document_shares|
                  +-----------------------+
```

### Table Isolation (pgTableCreator)
Since the provided Neon database is a shared instance containing tables from other projects (e.g. `User`, `Subscription`), we used Drizzle's `pgTableCreator` to automatically prefix all of our tables with `ajaia_` (e.g. `ajaia_users`, `ajaia_documents`, `ajaia_document_shares`).
Additionally, we defined `tablesFilter: ["ajaia_*"]` in `drizzle.config.ts` so Drizzle Kit strictly ignores your other tables during schema synchronization.

---

## 3. Component Details

1. **UserContext (`src/context/UserContext.tsx`)**: Exposes the active user, manages login/logout states, and redirects to `/login` if unauthenticated.
2. **Login View (`src/app/login/page.tsx`)**: Offers autofill buttons for Alice, Bob, and Charlie. Triggers auto-signup in the API.
3. **Login API (`src/app/api/login/route.ts`)**: Locates the user. Inserts a new user if not found.
4. **Dashboard UI (`src/app/page.tsx`)**: Fetches document items, displays them in clean lists, filters by ownership status, and houses the file drop zone.
5. **Editor Component (`src/app/documents/[id]/page.tsx`)**: Integrates the TipTap editor. Customizes formatting buttons (Bold, Italic, Underline, H1, H2, H3, lists). Houses the client-side Markdown converter, native PDF print controls, and debounced `fetch()` triggers for title and content updating.
6. **Import Handler (`src/app/api/import/route.ts`)**: Accepts `multipart/form-data`, matches file extensions, converts text format to markup structures, saves to DB, and returns the document ID.

