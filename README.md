# Thinking Spree — Consultant Suite

Internal consultant workspace for Thinking Spree. Manage incubators, ventures, and generate AI-drafted pre-sprint / post-sprint emails — all gated behind Google sign-in.

**Stack**

- **Vite + React 18 + TypeScript** (single-page app)
- **Supabase** — Postgres database + Google OAuth
- **Google Gemini** (`gemini-1.5-flash`) — email generation via a Vercel serverless function
- **Tailwind CSS** + custom consulting palette (ivory · navy · brass)
- **Lucide** icons · **Sonner** toasts

---

## What was changed from the original dashboard

1. **Add Incubator form** — the `type` field has been removed. The dialog now shows an inline banner explaining that the incubator accepts ventures of all sectors and stages, so there's no upfront type restriction.
2. **Google login** — the entire app is gated behind a Supabase-managed Google OAuth flow.
3. **Live data** — the dashboard reads real incubators and ventures from Supabase per signed-in user, with Row Level Security so users only see their own data.
4. **AI email generation** — a "Generate Email with AI" dialog drafts pre-sprint and post-sprint emails using Gemini, with optional context, copy-to-clipboard, and "Save Draft" persistence.
5. **Deployable** — Vercel-ready. Frontend + serverless API in one project.

---

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Copy env and fill in keys
cp .env.example .env.local

# 3. Run dev server
npm run dev
```

Open http://localhost:5173

> Note: `npm run dev` runs the frontend only. The `/api/generate-email` route is a Vercel function — to test AI emails locally, either run `vercel dev` (after `npm i -g vercel`), or deploy to Vercel preview.

---

## Setup walkthrough

### 1. Create a Supabase project

1. Go to https://supabase.com → New Project.
2. Once created, open **SQL Editor** → New query → paste `supabase/schema.sql` → Run. This creates the `incubators`, `ventures`, and `email_drafts` tables with Row Level Security policies that restrict every row to its owner.
3. Open **Project Settings → API** → copy the **Project URL** and **anon public** key.

### 2. Enable Google OAuth in Supabase

1. In Supabase, open **Authentication → Providers → Google** → toggle on.
2. You need a Google OAuth client. Go to https://console.cloud.google.com → create a project → **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorized redirect URI: paste the **callback URL** that Supabase shows on the Google provider page (looks like `https://YOUR-PROJECT.supabase.co/auth/v1/callback`).
3. Copy the **Client ID** and **Client Secret** back into Supabase's Google provider settings → save.
4. In Supabase **Authentication → URL Configuration**:
   - Site URL: your deployed URL (e.g. `https://your-app.vercel.app`)
   - Add Redirect URLs: `http://localhost:5173` (for local dev) and your Vercel URL.

### 3. Get a Gemini API key

1. Go to https://aistudio.google.com/apikey → Create API key.
2. Copy the key — you'll add it to Vercel as `GEMINI_API_KEY` (server-only, never exposed to the browser).

### 4. Fill `.env.local`

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your anon key
GEMINI_API_KEY=AI...your gemini key
```

---

## Deploy to Vercel

### Option A — via dashboard (recommended)

1. Push this project to GitHub.
2. Go to https://vercel.com → **Add New → Project** → import the repo.
3. Vercel auto-detects Vite. Click **Deploy**.
4. After the first deploy, go to **Project Settings → Environment Variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Redeploy (Deployments → ⋯ → Redeploy).
6. Copy your Vercel URL and add it to Supabase **Authentication → URL Configuration → Site URL** + Redirect URLs.

### Option B — via CLI

```bash
npm i -g vercel
vercel        # follow prompts
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add GEMINI_API_KEY
vercel --prod
```

---

## Project structure

```
.
├── api/
│   └── generate-email.ts         # Vercel serverless function (Gemini)
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/thinkingspree-logo.jpg
│   ├── components/
│   │   ├── AddIncubatorDialog.tsx  # 'type' removed; banner explains "all"
│   │   ├── AddVentureDialog.tsx
│   │   ├── EmailGeneratorDialog.tsx
│   │   ├── Dialog.tsx
│   │   └── ui.tsx                  # Button, Input, Textarea, Label
│   ├── context/AuthContext.tsx     # Supabase Google OAuth
│   ├── lib/
│   │   ├── ai.ts                   # fetch /api/generate-email
│   │   ├── supabase.ts             # client + TS types
│   │   └── utils.ts
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   └── LoginPage.tsx
│   ├── App.tsx                     # auth gate
│   ├── main.tsx
│   └── styles.css
├── supabase/schema.sql
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---

## How AI emails work

`EmailGeneratorDialog` collects:
- email **kind** (pre or post sprint)
- the selected **venture** (with sector, stage, incubator info)
- optional **context** notes

It POSTs to `/api/generate-email`. The serverless function builds a structured prompt and calls Gemini with `responseMimeType: application/json`, returning `{ subject, body }`. The user can edit, copy, or save the draft to the `email_drafts` table.

The Gemini API key never leaves the server — only the anon Supabase key is exposed to the browser, which is safe by design (RLS protects user data).

---

## Scripts

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `npm run dev`    | Vite dev server on port 5173       |
| `npm run build`  | Type-check + production build      |
| `npm run preview`| Preview production build locally   |

---

Thinking Spree · Consultant Suite v4.1 · Internal use only.
