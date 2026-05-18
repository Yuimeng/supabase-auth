import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/actions/auth'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-grid">
      <header className="border-b border-border-primary/50">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="font-heading text-xs font-semibold tracking-[0.25em] text-text-muted uppercase">
            Studio
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
    </div>
  )
}
