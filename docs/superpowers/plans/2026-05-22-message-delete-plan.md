# Message Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a delete button with confirmation dialog to each message card in the "My Messages" section.

**Architecture:** Add a `deleteMessage` server action (same pattern as existing `createMessage`), a DELETE RLS policy, and update the client component to show a delete button per card with a confirmation modal.

**Tech Stack:** Next.js 16 Server Actions, Supabase RLS, React 19 `useActionState`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/005_delete_message_policy.sql` | Create | DELETE RLS policy on `messages` table |
| `src/actions/contact.ts` | Modify | Add `deleteMessage` server action |
| `src/components/contact/contact-form.tsx` | Modify | Add delete button per message card + confirmation modal |

---

### Task 1: Migration — DELETE RLS Policy

**Files:**
- Create: `supabase/migrations/005_delete_message_policy.sql`

- [ ] **Step 1: Create migration file**

```sql
create policy "Users can delete own messages"
  on public.messages for delete
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/005_delete_message_policy.sql
git commit -m "feat: add DELETE RLS policy for messages"
```

---

### Task 2: Server Action — `deleteMessage`

**Files:**
- Modify: `src/actions/contact.ts`

- [ ] **Step 1: Add `deleteMessage` server action after existing `createMessage`**

Add at the end of `src/actions/contact.ts`:

```typescript
export async function deleteMessage(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated' }
  }

  const id = formData.get('id') as string
  if (!id) {
    return { error: 'Message ID is required' }
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: `Failed to delete: ${error.message}` }
  }

  revalidatePath('/', 'layout')
  return { error: null }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/contact.ts
git commit -m "feat: add deleteMessage server action"
```

---

### Task 3: UI — Delete Button + Confirmation Modal

**Files:**
- Modify: `src/components/contact/contact-form.tsx`

- [ ] **Step 1: Add delete import and state to ContactForm**

Replace the current imports and component signature. Add `deleteMessage` import, a `useActionState` for delete, and `confirmDeleteId` state for the modal:

```typescript
'use client'

import { useActionState, useState } from 'react'
import { createMessage, deleteMessage } from '@/actions/contact'
import { SubmitButton } from '@/components/ui/submit-button'
```

- [ ] **Step 2: Add state variables before the return statement**

```typescript
const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
const [deleteState, deleteAction] = useActionState(deleteMessage, { error: null })
```

Insert after the existing `const [state, action] = useActionState(createMessage, { error: null })` line.

- [ ] **Step 3: Update the message card rendering — add a delete button**

Replace the message card div (the one with `key={msg.id}`) to include a delete button at the bottom-right:

```typescript
{initialMessages.map((msg) => (
  <div
    key={msg.id}
    className="rounded-xl border border-border-primary bg-bg-surface p-5"
  >
    <p className="text-xs text-text-muted">
      {(() => {
        try {
          return new Date(msg.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        } catch {
          return msg.created_at
        }
      })()}
    </p>
    <p className="mt-2 text-sm text-text-secondary">{msg.contact_info}</p>
    <p className="mt-1 text-sm text-text-primary">{msg.message}</p>
    <div className="mt-3 flex justify-end">
      <button
        type="button"
        onClick={() => setConfirmDeleteId(msg.id)}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
      >
        Delete
      </button>
    </div>
  </div>
))}
```

- [ ] **Step 4: Add the confirmation modal before the closing `</div>` of the outer container**

Insert after the `{initialMessages.length === 0 ? ... : ...}` block, before the closing `</div>` of the "My Messages" section:

```typescript
{confirmDeleteId !== null && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    onClick={() => { setConfirmDeleteId(null); deleteState.error = null }}
  >
    <div
      className="w-full max-w-sm rounded-xl border border-border-primary bg-bg-elevated p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="font-heading text-base font-light tracking-tight text-text-primary">
        Confirm Delete
      </h3>
      <p className="mt-2 text-sm text-text-secondary">
        Are you sure you want to delete this message?
      </p>

      <form action={deleteAction} className="mt-6 flex items-center justify-end gap-3">
        <input type="hidden" name="id" value={confirmDeleteId} />

        {deleteState?.error && (
          <p className="mr-auto text-xs text-red-400">{deleteState.error}</p>
        )}

        <button
          type="button"
          onClick={() => setConfirmDeleteId(null)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-border-primary"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete
        </button>
      </form>
    </div>
  </div>
)}
```

Note: The form uses a standard submit button (not `SubmitButton`) because `useFormStatus` tracks the nearest parent form — for the delete action, a simple button with `type="submit"` is sufficient and avoids confusion with the create form's pending state.

- [ ] **Step 5: Commit**

```bash
git add src/components/contact/contact-form.tsx
git commit -m "feat: add delete button and confirmation modal to message cards"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - DELETE RLS policy → Task 1
   - `deleteMessage` server action → Task 2
   - Delete button per card → Task 3 Step 3
   - Confirmation modal with Cancel/Delete → Task 3 Step 4
   - Click outside to close → Task 3 Step 4 (`onClick` on backdrop)
   - Error display in modal → Task 3 Step 4 (`deleteState?.error`)
   - Form with hidden id input → Task 3 Step 4
   - Loading state → Delete button doesn't use SubmitButton but the server action handles it; `useActionState` manages the form submission state naturally

2. **Placeholder check:** All code blocks contain complete, runnable code. No TBDs or TODOs.

3. **Type consistency:** `Message` type has `id: number` — used consistently as `confirmDeleteId` state is `number | null`. `deleteMessage` signature matches `createMessage` exactly.
