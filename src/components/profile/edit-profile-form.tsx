'use client'

import { useActionState, useRef, useState } from 'react'
import { updateProfile } from '@/actions/profile'
import { SubmitButton } from '@/components/ui/submit-button'

export function EditProfileForm({
  currentUsername,
  currentAvatarUrl,
}: {
  currentUsername: string
  currentAvatarUrl: string | null
}) {
  const [state, action] = useActionState(updateProfile, { error: null })
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = () => {
    const file = fileRef.current?.files?.[0]
    if (preview) URL.revokeObjectURL(preview)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  const displayUrl = preview || currentAvatarUrl

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          defaultValue={currentUsername}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Avatar</label>
        {displayUrl && (
          <img
            src={displayUrl}
            alt="Avatar preview"
            className="mt-2 h-20 w-20 rounded-full object-cover"
          />
        )}
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton>Save Changes</SubmitButton>
    </form>
  )
}
