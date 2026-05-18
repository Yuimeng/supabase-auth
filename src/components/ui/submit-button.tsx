'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ children = 'Save Changes' }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-bg-primary transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Saving...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
