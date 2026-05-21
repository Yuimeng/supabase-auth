# GitHub OAuth & Account Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GitHub OAuth login and existing-account binding to the existing email/password auth system.

**Architecture:** Extend the existing Supabase SSR auth system with a new OAuth callback route, two new Server Actions (signInWithGithub, linkGithub), and an updated profiles trigger to handle GitHub usernames. No new dependencies.

**Tech Stack:** Next.js 16, Supabase Auth SSR, GitHub OAuth, PostgreSQL trigger functions

---

### Task 1: Database Migration — Profiles Extension & Trigger Update

**Files:**
- Create: `supabase/migrations/002_github_oauth.sql`

- [ ] **Step 1: Create migration SQL**

`supabase/migrations/002_github_oauth.sql`:

```sql
-- Add fields for GitHub OAuth users
alter table public.profiles
  add column github_username text,
  add column updated_at timestamptz default now() not null;

-- Update trigger to handle GitHub users with username conflict resolution
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  raw_username text;
  final_username text;
  suffix int := 1;
begin
  -- GitHub sends preferred_username, email/password sends username from metadata
  raw_username := coalesce(
    new.raw_user_meta_data ->> 'preferred_username',
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  );

  -- Resolve username conflicts by appending incrementing suffix
  final_username := raw_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    final_username := raw_username || suffix::text;
    suffix := suffix + 1;
  end loop;

  insert into public.profiles (id, username, avatar_url, github_username, updated_at)
  values (
    new.id,
    final_username,
    new.raw_user_meta_data ->> 'avatar_url',
    case when new.raw_user_meta_data ? 'preferred_username'
         then new.raw_user_meta_data ->> 'preferred_username'
         else null
    end,
    now()
  );
  return new;
end;
$$;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/002_github_oauth.sql
git commit -m "feat: add profiles migration for GitHub OAuth fields and updated trigger"
```

---

### Task 2: Auth OAuth Callback Route

**Files:**
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Create callback route**

`src/app/auth/callback/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx next build --webpack 2>&1 | grep -E "(Compiled|error|Error|✓)"
```

Expected: Compiled successfully, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/callback/route.ts
git commit -m "feat: add OAuth callback route for exchanging code for session"
```

---

### Task 3: Server Actions — GitHub Login & Link

**Files:**
- Modify: `src/actions/auth.ts`

- [ ] **Step 1: Add GitHub Server Actions**

Add these two functions at the end of `src/actions/auth.ts` (before any closing, after the `signOut` function):

```typescript
export async function signInWithGithub() {
  const supabase = await createClient()
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (data.url) {
    redirect(data.url)
  }
}

export async function linkGithub() {
  const supabase = await createClient()
  const { data } = await supabase.auth.linkIdentity({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (data.url) {
    redirect(data.url)
  }
}
```

Note: `redirect` is already imported at the top of the file.

- [ ] **Step 2: Run TypeScript check**

```bash
npx next build --webpack 2>&1 | grep -E "(Compiled|error|Error|✓)"
```

Expected: Compiled successfully.

- [ ] **Step 3: Commit**

```bash
git add src/actions/auth.ts
git commit -m "feat: add signInWithGithub and linkGithub server actions"
```

---

### Task 4: OAuthProviders Component — Replace Placeholder

**Files:**
- Modify: `src/components/auth/oauth-providers.tsx`

- [ ] **Step 1: Replace with functional GitHub button**

Replace the entire content of `src/components/auth/oauth-providers.tsx`:

```tsx
'use client'

import { signInWithGithub } from '@/actions/auth'

export function OAuthProviders() {
  return (
    <div className="space-y-2">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>
      <form action={signInWithGithub}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Sign in with GitHub
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx next build --webpack 2>&1 | grep -E "(Compiled|error|Error|✓)"
```

Expected: Compiled successfully.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/oauth-providers.tsx
git commit -m "feat: replace OAuth placeholder with functional GitHub sign-in button"
```

---

### Task 5: Settings Page — Account Binding UI

**Files:**
- Create: `src/app/(authenticated)/settings/page.tsx`

- [ ] **Step 1: Create settings page**

`src/app/(authenticated)/settings/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { linkGithub } from '@/actions/auth'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, github_username, avatar_url')
    .eq('id', user.id)
    .single()

  const hasGithub = !!profile?.github_username

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Profile</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-24 text-gray-500">Username</dt>
            <dd>{profile?.username}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 text-gray-500">Email</dt>
            <dd>{user.email}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Linked Accounts</h2>
        {hasGithub ? (
          <p className="text-sm text-gray-700">
            <span className="font-medium">GitHub:</span> {profile?.github_username}
          </p>
        ) : (
          <form action={linkGithub}>
            <button
              type="submit"
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Link GitHub Account
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx next build --webpack 2>&1 | grep -E "(Compiled|error|Error|✓)"
```

Expected: Compiled successfully.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/settings/page.tsx
git commit -m "feat: add settings page with GitHub account binding"
```

---

### Task 6: Environment Variable

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add NEXT_PUBLIC_SITE_URL**

Append to `.env.local`:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 2: Commit**

```bash
git add .env.local
git commit -m "chore: add NEXT_PUBLIC_SITE_URL for OAuth redirect"
```

---

## Verification

After all tasks:

1. **Build check:** `npx next build --webpack` — should compile with no errors
2. **Route check:** Verify these routes exist:
   - `GET /auth/callback` — OAuth callback handler
   - `GET /settings` — Settings page (requires auth)
3. **Manual test:**
   - Start dev server: `npm run dev`
   - Visit `/login` — see "Sign in with GitHub" button
   - Click it — should redirect to GitHub OAuth (will fail without GitHub App configured)
   - Sign in with email/password — visit `/settings` — should show profile and "Link GitHub Account" button

## Supabase Dashboard Configuration (Manual)

1. Go to Authentication → Providers → GitHub → Enable
2. Enter GitHub OAuth App Client ID and Client Secret
3. Enable "Automatically linking accounts"
4. Create GitHub OAuth App at GitHub Settings → Developer settings → OAuth Apps
   - Authorization callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
5. Run the migration SQL in Supabase SQL Editor
