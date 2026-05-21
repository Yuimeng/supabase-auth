create table public.messages (
  id           bigint generated always as identity primary key,
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  contact_info text        not null,
  message      text        not null,
  created_at   timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

create index idx_messages_user_id on public.messages(user_id);
