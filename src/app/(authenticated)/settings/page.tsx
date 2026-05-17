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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Profile</h2>
        <EditProfileForm
          currentUsername={profile?.username ?? ''}
          currentAvatarUrl={profile?.avatar_url ?? null}
        />
        <div className="mt-4 border-t pt-4">
          <p className="text-sm text-gray-500">
            <span className="font-medium">Email:</span> {user.email}
          </p>
        </div>
      </section>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Linked Accounts</h2>
        {hasGithub ? (
          <p className="text-sm text-gray-700">
            <span className="font-medium">GitHub:</span> {profile?.github_username}
          </p>
        ) : (
          <form action={linkGithub}>
            <button
              type="submit"
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Link GitHub Account
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
