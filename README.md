# StudyHelper

AI-powered study web app. Upload notes (PDF, DOCX, TXT) or paste text to generate summaries, flashcards, quizzes, and chat with your material.

## Tech stack

- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Storage, RLS)
- Anthropic Claude API (server-side only)
- Zod + React Hook Form

## Phase status

- Phase 1: Project setup, Tailwind/shadcn, Supabase clients, auth pages, protected layout, dark mode
- **Phase 2 (current):** DB migration + RLS, dashboard create/list/delete study sets
- Phase 3: File upload and text extraction
- Phase 4: Summary generation
- Phase 5: Flashcards
- Phase 6: Quiz
- Phase 7: Chat with streaming
- Phase 8: Language, export, rate limiting, polish, deploy

## Prerequisites

1. Node.js 18+
2. A [Supabase](https://supabase.com) project
3. (Later phases) An [Anthropic](https://console.anthropic.com) API key

## Setup

```bash
npm install
cp .env.example .env.local
```

On Windows Command Prompt use `copy .env.example .env.local` instead of `cp`.

Fill in `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only; used in later phases) |
| `ANTHROPIC_API_KEY` | Claude API key (Phase 4+) |
| `ANTHROPIC_MODEL` | Model id, e.g. `claude-sonnet-4-20250514` |

### Supabase Auth

In the Supabase dashboard:

1. **Authentication → Providers**
   - Enable **Email**
   - For local testing, disable **Confirm email** so you can log in immediately
   - Enable **Google** (optional) and set Client ID / Secret
2. **Authentication → URL configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### Database (Phase 2)

1. Open Supabase → **SQL Editor**
2. Paste the full contents of  
   `supabase/migrations/20260310000000_init_schema.sql`
3. Run the script

This creates all tables (`profiles`, `study_sets`, `summaries`, `flashcards`, `quizzes`, `quiz_questions`, `quiz_attempts`, `chat_messages`), helper functions, the signup → profile trigger, and RLS policies so users can only access their own data.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Always run npm commands from the project folder (the one that contains `package.json`).

## Phase 1 — how to test

1. Visit `/` → redirects to `/login` when signed out.
2. Open `/signup`, create an account with email/password.
3. Confirm you land on `/dashboard`.
4. Toggle light/dark/system theme.
5. Log out, then log in again.

## Phase 2 — how to test

1. Apply the SQL migration (see above).
2. Log in and open `/dashboard`.
3. Click **New study set**, enter a title, choose English or Khmer, create.
4. Confirm the set appears with date and zero item counts.
5. Open the set → placeholder page at `/set/[id]`.
6. Return to dashboard and delete the set → it disappears.
7. (Optional) In another browser/account, confirm you cannot see another user’s sets (RLS).

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # serve production build
npm run lint    # ESLint
```

## Project structure

```
app/           # App Router pages, layouts, server actions
components/    # UI, auth, dashboard, layout
lib/           # supabase, validators, study-set helpers
types/         # shared TypeScript types
supabase/      # SQL migrations
```

## Deploy (Vercel)

Deferred to Phase 8. Target platform: Vercel with the env vars above.
