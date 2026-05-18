'use client'

import { useActionState } from 'react'
import { signIn } from '@/actions/auth'
import { SubmitButton } from '@/components/ui/submit-button'
export function LoginForm() {
  const [state, action] = useActionState(signIn, { error: null })

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="block w-full rounded-lg border border-border-primary bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="block w-full rounded-lg border border-border-primary bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
          placeholder="••••••••"
        />
      </div>
      {state?.error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{state.error}</p>
        </div>
      )}
      <SubmitButton>Sign In</SubmitButton>
      <p className="text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <a href="/register" className="font-medium text-accent transition-colors hover:text-accent-hover">
          Sign up
        </a>
      </p>
    </form>
  )
}
