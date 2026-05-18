import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { linkGithub } from '@/actions/auth'
import { EditProfileForm } from '@/components/profile/edit-profile-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, github_username, avatar_url')
    .eq('id', user.id)
    .single()

  const hasGithub = !!profile?.github_username

  return (
    <div className="space-y-12">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-light tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="text-sm text-text-muted">Manage your profile and connected accounts</p>
      </div>

      <section className="rounded-xl border border-border-primary bg-bg-surface p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-heading text-[11px] font-semibold tracking-[0.2em] text-text-muted uppercase">
            Profile
          </span>
          <span className="ml-auto h-px flex-1 bg-border-primary/50" />
        </div>
        <EditProfileForm
          currentUsername={profile?.username ?? ''}
          currentEmail={user.email ?? ''}
          currentAvatarUrl={profile?.avatar_url ?? null}
        />
      </section>

      <section className="rounded-xl border border-border-primary bg-bg-surface p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-heading text-[11px] font-semibold tracking-[0.2em] text-text-muted uppercase">
            Connections
          </span>
          <span className="ml-auto h-px flex-1 bg-border-primary/50" />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border-primary bg-bg-elevated p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#24292e]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">GitHub</p>
              {hasGithub ? (
                <p className="text-xs text-text-muted">Connected as {profile?.github_username}</p>
              ) : (
                <p className="text-xs text-text-muted">Not connected</p>
              )}
            </div>
          </div>
          {hasGithub ? (
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Active
            </span>
          ) : (
            <form action={linkGithub}>
              <button
                type="submit"
                className="rounded-lg border border-border-primary bg-bg-surface px-4 py-2 text-xs font-medium text-text-secondary transition-all hover:border-accent/50 hover:text-accent"
              >
                Connect
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
