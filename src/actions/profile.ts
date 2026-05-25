'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated' }
  }

  const username = (formData.get('username') as string)?.trim()
  const avatarFile = formData.get('avatar') as File | null

  if (!username) {
    return { error: 'Username is required' }
  }

  if (!/^[a-zA-Z0-9_]{2,20}$/.test(username)) {
    return { error: 'Username must be 2-20 characters (letters, numbers, underscores)' }
  }

  // Check username uniqueness (exclude current user)
  const { data: existing } = await supabase
    .from('profiles')
    .select('username')
    .neq('id', user.id)
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return { error: 'Username is already taken' }
  }

  let avatarUrl: string | undefined

  const AVATAR_MAX_SIZE = parseInt(process.env.NEXT_PUBLIC_AVATAR_MAX_SIZE ?? '') || 2 * 1024 * 1024

  if (avatarFile && avatarFile.size > 0) {
    if (!avatarFile.type.startsWith('image/')) {
      return { error: 'Avatar must be an image file' }
    }
    if (avatarFile.size > AVATAR_MAX_SIZE) {
      return { error: `Avatar must be ${Math.round(AVATAR_MAX_SIZE / 1024 / 1024 * 10) / 10}MB or less` }
    }

    const fileExt = avatarFile.name.split('.').pop() ?? 'jpg'
    const filePath = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true })

    if (uploadError) {
      return { error: `Failed to upload avatar: ${uploadError.message}` }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    avatarUrl = publicUrl
  }

  const updates: Record<string, string> = { username }
  if (avatarUrl !== undefined) {
    updates.avatar_url = avatarUrl
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (updateError) {
    return { error: `Failed to update profile: ${updateError.message}` }
  }

  revalidatePath('/settings')
  return { error: null }
}
