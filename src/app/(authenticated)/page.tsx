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
    <div>
      <h1 className="flex items-center gap-3 text-3xl font-bold">
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="h-10 w-10 rounded-full object-cover"
          />
        )}
        Welcome, {profile?.username}!
      </h1>
      <p className="mt-2 text-gray-600">You are signed in as {user?.email}</p>
      <div className="mt-8">
        <a
          href="/settings"
          className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Settings
        </a>
      </div>
    </div>
  )
}
