# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Next.js 16** (App Router) with Turbopack
- **React 19** with TypeScript
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) for auth and database
- **pnpm** as package manager (lock file present; npm also works)

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
```

No test framework is configured.

## Architecture

### Three-Tier Supabase Clients

Three client factories in `src/lib/supabase/`:
- `client.ts` — `createBrowserClient` for client components
- `server.ts` — `createServerClient` with `cookies()` for Server Components/Actions
- `middleware.ts` — `createServerClient` with request/response cookie adapters

The server client's `setAll` callback silently catches errors because `cookieStore.set()` throws in Server Components — cookies are only modified in Server Actions or Route Handlers.

### Route Protection (Middleware)

`src/middleware.ts` refreshes the session on every request via `getUser()` and gates access:
- Authenticated users visiting `/login` or `/register` → redirect to `/`
- Unauthenticated users visiting non-public paths → redirect to `/login`
- Public paths: `/login`, `/register`, `/auth/*`

### Route Groups

- `(auth)/` — Public pages (login, register) with centered card layout
- `(authenticated)/` — Protected pages (home, settings) with header + sign-out button; layout performs its own server-side auth check (defense-in-depth)

### Server Actions Pattern

All mutations in `src/actions/` follow the same pattern:
1. Create Supabase server client
2. Perform operation
3. Call `revalidatePath`/`redirect`
4. Return `{ error: string | null }` for client consumption

Client components consume these via React 19's `useActionState` (not the older `useFormState`).

### Database

Migrations in `supabase/migrations/` create a `profiles` table with an `on_auth_user_created` trigger that auto-inserts a profile row when a user signs up. The trigger handles username conflicts by appending incrementing suffixes.

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

## Design Specs

Detailed specs and implementation plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/` (written in Chinese).
