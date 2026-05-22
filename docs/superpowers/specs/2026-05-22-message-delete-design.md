# Message Delete — "My Messages" Delete Feature Design

## Overview

Add a delete function to the "My Messages" section on the authenticated home page, allowing users to permanently remove their own messages with a confirmation step.

## Database

### New RLS Policy

Add a DELETE policy to the existing `messages` table:

```sql
create policy "Users can delete own messages"
  on public.messages for delete
  using (auth.uid() = user_id);
```

This ensures users can only delete their own messages. The `on delete cascade` from `profiles` already handles cleanup when a user is deleted.

## Server Action

### `deleteMessage`

Add to `src/actions/contact.ts`:

- Signature: `(prev: { error: string | null }, formData: FormData) => Promise<{ error: string | null }>`
- Authenticates user via `getUser()`
- Reads `id` from form data
- Calls `supabase.from('messages').delete().eq('id', id).eq('user_id', user.id)`
- Calls `revalidatePath('/', 'layout')` on success
- Follows the exact same pattern as existing `createMessage`

## UI Changes

### Delete button

Each message card in `contact-form.tsx` gets a small red "Delete" button at the bottom-right.

### Confirmation Modal

A simple overlay dialog when Delete is clicked:

```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │  Confirm Delete           │  │
│  │                           │  │
│  │  Are you sure you want    │  │
│  │  to delete this message?  │  │
│  │                           │  │
│  │  [Cancel]  [Delete]       │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

- **Cancel**: closes the modal
- **Delete**: submits the form to `deleteMessage` server action
- Clicking outside the modal also closes it

### Form per message

Each message card's delete button is wrapped in a `<form>` with a hidden `<input name="id">` containing the message ID. Uses `useActionState` consistent with the existing form pattern.

## Data Flow

```
Delete button click → Modal opens
  → User clicks "Delete" → deleteMessage server action
  → supabase.from('messages').delete() → RLS check passes
  → revalidatePath('/', 'layout') → server component re-fetches messages
  → Updated list renders without deleted message
```

## Component Architecture

| File | Change |
|------|--------|
| `src/actions/contact.ts` | Add `deleteMessage` server action |
| `src/components/contact/contact-form.tsx` | Add delete button per card + confirmation modal |
| `supabase/migrations/004_contact_messages.sql` | Add DELETE RLS policy (new migration file for the policy addition) |

## States

| State | Behavior |
|-------|----------|
| Delete pending | Modal shows, Delete button shows loading state |
| Success | Modal closes, list re-renders without deleted item |
| Server error | Error displayed in modal, user can retry |
| Cancel | Modal closes, no action taken |

## Migration

A new migration file at `supabase/migrations/<timestamp>_delete_message_policy.sql` adding the DELETE RLS policy.
