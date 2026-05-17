-- Add fields for GitHub OAuth users
alter table public.profiles
  add column github_username text,
  add column updated_at timestamptz default now() not null;

-- Update trigger to handle GitHub users with username conflict resolution
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  raw_username text;
  final_username text;
  suffix int := 1;
begin
  -- GitHub sends preferred_username, email/password sends username from metadata
  raw_username := coalesce(
    new.raw_user_meta_data ->> 'preferred_username',
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  );

  -- Resolve username conflicts by appending incrementing suffix
  final_username := raw_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    final_username := raw_username || suffix::text;
    suffix := suffix + 1;
  end loop;

  insert into public.profiles (id, username, avatar_url, github_username, updated_at)
  values (
    new.id,
    final_username,
    new.raw_user_meta_data ->> 'avatar_url',
    case when new.raw_user_meta_data ? 'preferred_username'
         then new.raw_user_meta_data ->> 'preferred_username'
         else null
    end,
    now()
  );
  return new;
end;
$$;
