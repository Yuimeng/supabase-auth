# Profile Edit Page Design

## Overview

Add edit functionality to the existing `/settings` page, allowing authenticated users to modify their `username` and `avatar_url` fields. Avatar images are uploaded via file input and stored in Supabase Storage.

## Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js App Router (React 19) |
| Database | Supabase PostgreSQL (existing `profiles` table) |
| Storage | Supabase Storage (`avatars` bucket) |
| Mutation | Server Action (`updateProfile`) |
| Form State | `useActionState` (existing pattern) |

## Data Flow

```
User fills form + selects file
  → client-side validation
  → Server Action (updateProfile)
    → validate username
    → check username uniqueness (exclude self)
    → upload file to avatars/{userId}/avatar (upsert)
    → update profiles row
    → revalidatePath('/settings')
  → page re-renders with fresh data
```

## Storage Setup

New `avatars` bucket, public read access.

Delete access for users to overwrite their own avatar:

```sql
-- Public read
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Authenticated users can upload their own avatar
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

-- Users can update their own avatar (upsert)
create policy "Users can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] )
  with check ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] );
```

Upload path: `avatars/{userId}/avatar` (fixed path, upsert overwrites)

## Server Action

**File:** `src/actions/profile.ts` (new, separate from auth actions)

Action: `updateProfile(prevState, formData) → { error: string | null }`

| Field | Type | Validation |
|-------|------|-----------|
| username | `FormData` text | 2-20 chars, `/^[a-zA-Z0-9_]+$/`, unique (exclude self) |
| avatar | `FormData` file | Optional, image type check |

Process:
1. Extract username and avatar file from FormData
2. Validate username format (same regex as registration)
3. Check username uniqueness in profiles — exclude current user's id
4. If avatar file provided: upload to `avatars/{userId}/avatar` with upsert, get public URL
5. Update `profiles` table: set new username and/or avatar_url
6. `revalidatePath('/settings')`
7. Return `{ error: null }` on success, or `{ error: message }` on failure

## UI Component

**File:** `src/components/profile/edit-profile-form.tsx` (new, client component)

- Uses `useActionState(updateProfile, { error: null })`
- Text input for username (prefilled with current value)
- Current avatar displayed as thumbnail
- File input (`<input type="file" accept="image/*">`) for new avatar
- Save button (reuse `SubmitButton` pattern, or inline pending state)
- Inline error display when `state.error` is set

## Page Changes

**File:** `src/app/(authenticated)/settings/page.tsx`

Replace the read-only Profile section with the new `EditProfileForm` component. Pass current profile data as props. Keep the Linked Accounts section unchanged.

## Files Summary

| File | Action |
|------|--------|
| `src/actions/profile.ts` | Create (server action) |
| `src/components/profile/edit-profile-form.tsx` | Create (client form) |
| `src/app/(authenticated)/settings/page.tsx` | Modify (use EditProfileForm) |

## Manual Steps

1. Create `avatars` bucket in Supabase Dashboard
2. Execute the RLS policy SQL above
