# Contact & Messages — Home Page Feature Design

## Overview

Add a contact-info and message section to the authenticated home page, allowing logged-in users to share their preferred contact method and leave messages. Data is stored in a new Supabase `messages` table.

## Database

### New Table: `messages`

```sql
create table messages (
  id           bigint generated always as identity primary key,
  user_id      uuid        not null references profiles(id) on delete cascade,
  contact_info text        not null,
  message      text        not null,
  created_at   timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Users can view own messages"
  on messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on messages for insert
  with check (auth.uid() = user_id);
```

- `contact_info`: free-text field — users can enter WeChat, phone, email, etc.
- `message`: the message content
- RLS ensures users can only see and insert their own messages.

## UI Layout

The home page gains a new section below the existing welcome area:

```
┌──────────────────────────────┐
│  [Avatar]  Welcome, user!    │  ← existing
│            user@email.com    │
├──────────────────────────────┤
│                              │
│  Contact & Message           │  ← new card
│  ┌────────────────────────┐  │
│  │ Contact Info           │  │
│  │ [textarea placeholder] │  │
│  │                        │  │
│  │ Message                │  │
│  │ [textarea placeholder] │  │
│  │                        │  │
│  │    [Submit]            │  │
│  └────────────────────────┘  │
│                              │
│  My Messages                 │  ← message history
│  ┌────────────────────────┐  │
│  │ May 20, 14:30          │  │
│  │ WeChat: xxx ...        │  │
│  ├────────────────────────┤  │
│  │ May 19, 09:00          │  │
│  │ Email: ...             │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### Component Architecture

- `src/app/(authenticated)/page.tsx` — Server Component, fetches user + profile + messages
- `src/components/contact/contact-form.tsx` — Client Component, form with `useActionState`
- `src/actions/contact.ts` — Server Action, inserts message into `messages` table

### Data Flow

1. **Page load**: `page.tsx` queries `messages` table filtered by `user_id`, passes list to `contact-form`
2. **Form submit**: `contact-form` calls `createMessage` server action
3. **Server Action**: validates non-empty fields, inserts row, calls `revalidatePath('/')`
4. **Re-render**: fresh message list returned from server component

### States

| State | Behavior |
|-------|----------|
| Empty | Show "还没有留言" placeholder in message history |
| Submitting | Button disabled with "发送中..." text |
| Validation error | Show inline error message if fields are empty |
| Server error | Show error banner (same pattern as profile edit) |
| Success | Clear form, revalidate path to update list |

### Visual Style

Follows existing Studio dark theme:
- Card: `bg-bg-elevated` with `border-border-primary` border
- Inputs: matching existing form styles
- Submit button: `bg-accent` (gold #f5b342)
- Message items: `bg-bg-surface` with subtle border
- Font: DM Sans (body) + Sora (headings)

## Migration

A new migration file at `supabase/migrations/<timestamp>_contact_messages.sql` creating the `messages` table with RLS policies.

## Future Considerations (Not Implementing Now)

- Edit/delete existing messages
- Pagination for many messages
- Admin view of all messages
