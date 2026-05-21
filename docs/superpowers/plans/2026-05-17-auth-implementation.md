# Auth System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete email/password authentication system using Next.js App Router + Supabase SSR + TypeScript.

**Architecture:** Three-tier Supabase SSR client pattern (browser/server/middleware) with middleware-based session management. Server Actions handle auth mutations. Custom form components with `useActionState` for error/loading state.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, @supabase/supabase-js, @supabase/ssr, Supabase PostgreSQL

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `.env.local`
- Create: `.gitignore` entries

- [ ] **Step 1: Scaffold Next.js project**

Run from `C:\Users\ok\Desktop\code\nextjs\supabase-auth`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-git
```

Expected: App Router scaffold with `src/` directory, TypeScript, Tailwind CSS configured.

- [ ] **Step 2: Install Supabase dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Create environment file**

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Supabase dependencies"
```

---

### Task 2: Supabase Client Layer

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Create browser client**

`src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server client**

`src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create middleware client**

`src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function createClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response: supabaseResponse }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase SSR client layer (browser/server/middleware)"
```

---

### Task 3: Database Migration

**Files:**
- Create: `supabase/migrations/001_create_profiles.sql`

- [ ] **Step 1: Create migration file**

`supabase/migrations/001_create_profiles.sql`:

```sql
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  username    text unique not null,
  avatar_url  text,
  created_at  timestamptz default now() not null
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add profiles table with auto-create trigger"
```

---

### Task 4: Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware file**

`src/middleware.ts`:

```typescript
import { createClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip internal Next.js requests
  if (pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  const { supabase, response } = await createClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  // Auth pages: redirect to home if already logged in
  if ((pathname === '/login' || pathname === '/register') && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Protected pages: redirect to login if not authenticated
  const isPublicPath =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/auth/')

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware for session refresh and route protection"
```

---

### Task 5: Auth Server Actions

**Files:**
- Create: `src/actions/auth.ts`

- [ ] **Step 1: Create auth actions**

`src/actions/auth.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Server-side validation
  if (!email || !password || !username) {
    return { error: 'All fields are required' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Invalid email format' }
  }

  if (!/^[a-zA-Z0-9_]{2,20}$/.test(username)) {
    return { error: 'Username must be 2-20 characters (letters, numbers, underscores)' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  // Check username uniqueness
  const { data: existing } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return { error: 'Username is already taken' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signIn(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/auth.ts
git commit -m "feat: add auth server actions (signUp/signIn/signOut)"
```

---

### Task 6: UI Components

**Files:**
- Create: `src/components/ui/submit-button.tsx`

- [ ] **Step 1: Create SubmitButton**

`src/components/ui/submit-button.tsx`:

```tsx
'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Loading...' : children}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/submit-button.tsx
git commit -m "feat: add SubmitButton with loading state"
```

---

### Task 7: Auth Form Components

**Files:**
- Create: `src/components/auth/login-form.tsx`
- Create: `src/components/auth/register-form.tsx`
- Create: `src/components/auth/oauth-providers.tsx`

- [ ] **Step 1: Create LoginForm**

`src/components/auth/login-form.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import { signIn } from '@/actions/auth'
import { SubmitButton } from '@/components/ui/submit-button'

export function LoginForm() {
  const [state, action] = useActionState(signIn, { error: null })

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton>Sign In</SubmitButton>
      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <a href="/register" className="text-blue-600 hover:underline">
          Sign up
        </a>
      </p>
    </form>
  )
}
```

- [ ] **Step 2: Create RegisterForm**

`src/components/auth/register-form.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import { signUp } from '@/actions/auth'
import { SubmitButton } from '@/components/ui/submit-button'

export function RegisterForm() {
  const [state, action] = useActionState(signUp, { error: null })

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton>Create Account</SubmitButton>
      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </p>
    </form>
  )
}
```

- [ ] **Step 3: Create OAuthProviders placeholder**

`src/components/auth/oauth-providers.tsx`:

```tsx
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
      <button
        disabled
        className="w-full cursor-not-allowed rounded-md border px-4 py-2 text-sm text-gray-400"
      >
        GitHub / Google (Coming Soon)
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/
git commit -m "feat: add auth form components (login/register/oauth-placeholder)"
```

---

### Task 8: Pages and Layouts

**Files:**
- Modify: `src/app/layout.tsx` (root layout)
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(authenticated)/layout.tsx`
- Create: `src/app/(authenticated)/page.tsx`
- Create: `src/app/auth/confirm/route.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update root layout**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Supabase Auth',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Create auth group layout**

`src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create login page**

`src/app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from '@/components/auth/login-form'
import { OAuthProviders } from '@/components/auth/oauth-providers'

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold">Sign In</h1>
      <LoginForm />
      <OAuthProviders />
    </>
  )
}
```

- [ ] **Step 4: Create register page**

`src/app/(auth)/register/page.tsx`:

```tsx
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold">Create Account</h1>
      <RegisterForm />
    </>
  )
}
```

- [ ] **Step 5: Create authenticated group layout**

`src/app/(authenticated)/layout.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/actions/auth'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="font-semibold">Supabase Auth</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 6: Create home page**

`src/app/(authenticated)/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user?.id)
    .single()

  return (
    <div>
      <h1 className="text-3xl font-bold">Welcome, {profile?.username}!</h1>
      <p className="mt-2 text-gray-600">You are signed in as {user?.email}</p>
    </div>
  )
}
```

- [ ] **Step 7: Create email confirm placeholder route**

`src/app/auth/confirm/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Email confirmation will be implemented when email verification is enabled' })
}
```

- [ ] **Step 8: Update globals.css**

Ensure `src/app/globals.css` has Tailwind directives. If scaffolded with create-next-app with `--tailwind`, this should already be set up. Verify it contains:

```css
@import "tailwindcss";
```

- [ ] **Step 9: Commit**

```bash
git add src/app/
git commit -m "feat: add pages and layouts for auth flow"
```

---

## Supabase Project Setup (Manual Steps)

These are not code tasks but required manual configuration:

1. **Create Supabase project** at https://supabase.com
2. Copy project URL and anon key to `.env.local`
3. **Disable email confirmation**: Go to Authentication > Providers > Email > Disable "Confirm email"
4. **Run migration**: Either run the SQL from `supabase/migrations/001_create_profiles.sql` in the Supabase SQL Editor, or use Supabase CLI: `supabase migration up`

## Verification

After all tasks are complete:

1. Run `npm run dev` and visit `/register`
2. Create an account with email + username + password
3. Verify redirect to home page showing "Welcome, {username}!"
4. Sign out, verify redirect to `/login`
5. Sign in with the same credentials
6. Verify session persists on page refresh
7. Visit `/login` while authenticated — verify redirect to `/`
