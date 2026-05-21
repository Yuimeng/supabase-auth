-- Enable Row Level Security on profiles
alter table public.profiles enable row level security;

-- Anyone can read profiles (needed for displaying usernames, avatars, etc.)
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can delete their own profile
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);
