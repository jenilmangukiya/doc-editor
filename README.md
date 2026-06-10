# Ajaia Docs - Collaborative Document Editor

A lightweight, premium collaborative document editor inspired by Google Docs, built with **Next.js**, **Neon Serverless Postgres**, **Drizzle ORM**, and the **TipTap Rich Text Editor**.

---

## Live Deployment
- **Deployment URL**: *(To be completed upon deployment)*
- **Database**: Host on Neon Serverless Postgres.

---

## Features
- **Always Light / White Theme**: Locked color variables in `globals.css` and disabled media-query overrides. Looks clean and bright regardless of OS dark mode preferences.
- **Login / Signup System**:
  - Unauthenticated visits automatically redirect to `/login`.
  - Sign in using an email. If the email doesn't exist in the database, the server automatically registers the account in the database and logs in!
  - **Quick Demo Login Buttons**: Click on Alice, Bob, or Charlie demo buttons to auto-populate email/password and log in instantly.
  - Navbar features a profile indicator and a **Log Out** button to return to the login interface and switch accounts easily.
- **Rich Text Editing (TipTap)**: Support for Bold, Italic, Underline, Headings (H1, H2, H3), and bulleted/numbered lists.
- **Auto-Save Database Sync**: Title and content updates auto-save dynamically on typing and input blur, with visual feedback indicators ("Saving...", "Saved", "Save failed").
- **Multi-user Permission Sharing Model**:
  - Documents have owners.
  - Owners can grant read-only (`READ`) or edit-write (`WRITE`) access to other users.
  - Owners can revoke access at any time.
  - Non-owners see a "Read Only" badge and cannot edit content, rename the document, or manage sharing options.
- **File Upload & Parsing (Import)**: Import content from files directly into new documents.
  - `.docx` documents: Parsed using `mammoth` into clean HTML structure.
  - `.md` markdown: Parsed via custom inline regex rules into heading styles and list structures.
  - `.txt` plain text: Splitted and wrapped in readable paragraphs.
- **Export to PDF & Markdown**: Export active documents directly from the editor:
  - Export as PDF uses a print stylesheet to strip application headers, sidebars, and formatting toolbars, leaving a clean page for high-fidelity PDF prints.
  - Export as Markdown translates TipTap's HTML layout back into standard markdown syntax on-the-fly and triggers download as a `.md` file client-side.

---

## Tech Stack
- **Framework**: Next.js (App Router, Tailwind CSS v4, TypeScript)
- **Database & ORM**: Neon Serverless Postgres, Drizzle ORM
- **Rich Text Editor**: TipTap Core + React
- **File Parser**: Mammoth.js (docx parsing)
- **Icons**: Lucide React

---

## Local Setup Instructions

### Prerequisites
- Node.js (v20+)
- npm (v10+)

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` (or `.env`) file in the root directory:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-odd-water-aoumuyt3-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
```
*(The database has already been configured with `ajaia_` table filters and seeded with the mock users Alice, Bob, and Charlie).*

### 3. Run Schema Migrations (If setting up a new DB)
```bash
npx drizzle-kit push
```

### 4. Seed Database (If setting up a new DB)
```bash
npx tsx src/db/seed.ts
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Evaluation Guidelines
1. **Testing Login System**: Open the app. You will be redirected to the login page.
   - Click the **Alice** demo login link. You will be logged in instantly.
2. **Testing Auto-Registration**:
   - Log out. Enter a new, non-existent email (e.g., `newguy@example.com`).
   - Click Login. The server will automatically create `newguy@example.com` in the DB and log you in.
3. **Testing Sharing**:
   - Log in as Alice, create a new document, write content, and rename it.
   - Click **Share**, select **Bob**, set permission to **Can View**, and click **Add**.
   - Log out, then log back in as **Bob**.
   - Navigate to the **Shared with Me** tab. Open the document. Bob will see a `Read Only` badge and his editing privileges will be disabled.
4. **Testing File Upload**:
   - On the dashboard sidebar, select or drop a `.txt`, `.md`, or `.docx` file.
   - It will automatically parse on the server, create a document, and redirect you to the editor.
