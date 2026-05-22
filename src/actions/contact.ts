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
    return { error: 'Contact info and message are required' }
  }

  if (contactInfo.length > 100) {
    return { error: 'Contact info must be 100 characters or less' }
  }

  if (message.length > 1000) {
    return { error: 'Message must be 1000 characters or less' }
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

  revalidatePath('/', 'layout')
  return { error: null }
}

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
