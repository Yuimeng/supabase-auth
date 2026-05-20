import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user?.id)
    .single()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5">
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="h-14 w-14 rounded-full border-2 border-border-primary object-cover"
          />
        )}
        <div>
          <h1 className="font-heading text-2xl font-light tracking-tight text-text-primary">
            Welcome, {profile?.username}!
          </h1>
          <p className="mt-1 text-sm text-text-muted">{user?.email}</p>
        </div>
      </div>
    </div>
  )
}
