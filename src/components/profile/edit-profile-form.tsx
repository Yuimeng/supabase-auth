'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { updateProfile } from '@/actions/profile'
import { SubmitButton } from '@/components/ui/submit-button'
import { Toast } from '@/components/ui/toast'

export function EditProfileForm({
  currentUsername,
  currentEmail,
  currentAvatarUrl,
}: {
  currentUsername: string
  currentEmail: string
  currentAvatarUrl: string | null
}) {
  const [state, action, isPending] = useActionState(updateProfile, { error: null })
  const [preview, setPreview] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const prevIsPending = useRef(false)

  const onCloseSuccess = useCallback(() => setShowSuccess(false), [])

  useEffect(() => {
    if (prevIsPending.current && !isPending && state.error === null) {
      setShowSuccess(true)
    }
    prevIsPending.current = isPending
  }, [isPending, state.error])

  const handleFileChange = () => {
    const file = fileRef.current?.files?.[0]
    if (preview) URL.revokeObjectURL(preview)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  const displayUrl = preview || currentAvatarUrl

  return (
    <>
      <Toast message="Profile updated" show={showSuccess} onClose={onCloseSuccess} />
      <form action={action} className="space-y-6">
      <div className="flex items-start gap-6">
        <div className="relative shrink-0">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-border-primary">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <svg className="h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              defaultValue={currentUsername}
              required
              className="mt-1.5 block w-full rounded-lg border border-border-primary bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
              placeholder="your-username"
            />
          </div>
          <div>
            <p className="text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">
              Email
            </p>
            <p className="mt-1.5 text-sm text-text-secondary">{currentEmail}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border-primary pt-6">
        <label className="text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">
          Avatar image
        </label>
        <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border-primary px-4 py-3 text-sm text-text-muted transition-colors hover:border-accent/40 hover:text-text-secondary">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span>Choose an image</span>
          <input
            ref={fileRef}
            type="file"
            name="avatar"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {state?.error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{state.error}</p>
        </div>
      )}

      <SubmitButton />
    </form>
    </>
  )
}
