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
