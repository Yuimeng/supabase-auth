create policy "Users can delete own messages"
  on public.messages for delete
  using (auth.uid() = user_id);
