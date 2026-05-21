# Contact & Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a contact-info + message section to the authenticated home page.

**Architecture:** New `messages` table in Supabase. Server action handles insert. Client component with `useActionState` wraps the form. Home page (server component) fetches messages and passes them to the form component.

**Tech Stack:** Next.js 16 (App Router), Supabase, Tailwind CSS v4, React 19 `useActionState`

---

### Task 1: Migration — Create `messages` table

**Files:**
- Create: `supabase/migrations/004_contact_messages.sql`

- [ ] **Step 1: Write migration**

```sql
create table public.messages (
  id           bigint generated always as identity primary key,
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  contact_info text        not null,
  message      text        not null,
  created_at   timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on public.messages for insert
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/004_contact_messages.sql
git commit -m "feat: add messages table for contact &留言 feature"
```

---

### Task 2: Server Action — `createMessage`

**Files:**
- Create: `src/actions/contact.ts`

- [ ] **Step 1: Write the server action**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createMessage(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated' }
  }

  const contactInfo = (formData.get('contactInfo') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()

  if (!contactInfo || !message) {
    return { error: '联系方式 and 留言 are required' }
  }

  const { error } = await supabase
    .from('messages')
    .insert({
      user_id: user.id,
      contact_info: contactInfo,
      message,
    })

  if (error) {
    return { error: `Failed to save: ${error.message}` }
  }

  revalidatePath('/')
  return { error: null }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/contact.ts
git commit -m "feat: add createMessage server action"
```

---

### Task 3: Client Component — `ContactForm`

**Files:**
- Create: `src/components/contact/contact-form.tsx`

- [ ] **Step 1: Write the component**

```typescript
'use client'

import { useActionState } from 'react'
import { createMessage } from '@/actions/contact'
import { SubmitButton } from '@/components/ui/submit-button'

type Message = {
  id: number
  contact_info: string
  message: string
  created_at: string
}

export function ContactForm({ initialMessages }: { initialMessages: Message[] }) {
  const [state, action] = useActionState(createMessage, { error: null })

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border-primary bg-bg-elevated p-6">
        <h2 className="mb-5 font-heading text-lg font-light tracking-tight text-text-primary">
          Contact &amp; Message
        </h2>

        <form action={action} className="space-y-5">
          <div>
            <label
              htmlFor="contactInfo"
              className="block text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase"
            >
              Contact Info
            </label>
            <textarea
              id="contactInfo"
              name="contactInfo"
              required
              rows={2}
              className="mt-1.5 block w-full rounded-lg border border-border-primary bg-bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
              placeholder="WeChat, phone, email, etc."
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={3}
              className="mt-1.5 block w-full rounded-lg border border-border-primary bg-bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
              placeholder="Write your message..."
            />
          </div>

          {state?.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{state.error}</p>
            </div>
          )}

          <SubmitButton>Send</SubmitButton>
        </form>
      </div>

      <div>
        <h3 className="mb-4 font-heading text-base font-light tracking-tight text-text-primary">
          My Messages
        </h3>

        {initialMessages.length === 0 ? (
          <p className="rounded-xl border border-border-primary bg-bg-elevated px-5 py-8 text-center text-sm text-text-muted">
            No messages yet. Write one above!
          </p>
        ) : (
          <div className="space-y-3">
            {initialMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl border border-border-primary bg-bg-surface p-5"
              >
                <p className="text-xs text-text-muted">
                  {new Date(msg.created_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="mt-2 text-sm text-text-secondary">{msg.contact_info}</p>
                <p className="mt-1 text-sm text-text-primary">{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/contact/contact-form.tsx
git commit -m "feat: add ContactForm client component"
```

---

### Task 4: Update Home Page — fetch messages and render form

**Files:**
- Modify: `src/app/(authenticated)/page.tsx`

- [ ] **Step 1: Update `page.tsx` to fetch messages and render ContactForm**

Current file reads:
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user?.id)
    .single()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5">
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="h-14 w-14 rounded-full border-2 border-border-primary object-cover"
          />
        )}
        <div>
          <h1 className="font-heading text-2xl font-light tracking-tight text-text-primary">
            Welcome, {profile?.username}!
          </h1>
          <p className="mt-1 text-sm text-text-muted">{user?.email}</p>
        </div>
      </div>
    </div>
  )
}
```

Replace with:
```typescript
import { createClient } from '@/lib/supabase/server'
import { ContactForm } from '@/components/contact/contact-form'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user?.id)
    .single()

  const { data: messages } = await supabase
    .from('messages')
    .select('id, contact_info, message, created_at')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5">
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="h-14 w-14 rounded-full border-2 border-border-primary object-cover"
          />
        )}
        <div>
          <h1 className="font-heading text-2xl font-light tracking-tight text-text-primary">
            Welcome, {profile?.username}!
          </h1>
          <p className="mt-1 text-sm text-text-muted">{user?.email}</p>
        </div>
      </div>

      <ContactForm initialMessages={messages ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(authenticated\)/page.tsx
git commit -m "feat: integrate ContactForm into home page"
```
