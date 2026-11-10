-- Orbit Messenger: security hardening and foreign-key indexes

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_conversation_creator(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and c.created_by = (select auth.uid())
  );
$$;

revoke all on function private.is_conversation_member(uuid) from public, anon;
revoke all on function private.is_conversation_creator(uuid) from public, anon;
grant execute on function private.is_conversation_member(uuid) to authenticated;
grant execute on function private.is_conversation_creator(uuid) to authenticated;

drop policy if exists "Members can view conversations" on public.conversations;
create policy "Members can view conversations"
  on public.conversations for select to authenticated
  using (private.is_conversation_member(id));

drop policy if exists "Owners can update conversations" on public.conversations;
create policy "Owners can update conversations"
  on public.conversations for update to authenticated
  using (private.is_conversation_creator(id))
  with check (private.is_conversation_creator(id));

drop policy if exists "Creators can delete conversations" on public.conversations;
create policy "Creators can delete conversations"
  on public.conversations for delete to authenticated
  using (private.is_conversation_creator(id));

drop policy if exists "Members can view conversation members" on public.conversation_members;
create policy "Members can view conversation members"
  on public.conversation_members for select to authenticated
  using (user_id = (select auth.uid()) or private.is_conversation_member(conversation_id));

drop policy if exists "Conversation creators can add members" on public.conversation_members;
create policy "Conversation creators can add members"
  on public.conversation_members for insert to authenticated
  with check (private.is_conversation_creator(conversation_id));

drop policy if exists "Creators or members can leave" on public.conversation_members;
create policy "Creators or members can leave"
  on public.conversation_members for delete to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_conversation_creator(conversation_id)
  );

drop policy if exists "Members can read messages" on public.messages;
create policy "Members can read messages"
  on public.messages for select to authenticated
  using (private.is_conversation_member(conversation_id));

drop policy if exists "Members can send messages as themselves" on public.messages;
create policy "Members can send messages as themselves"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.is_conversation_member(conversation_id)
  );

drop policy if exists "Authors can edit their messages" on public.messages;
create policy "Authors can edit their messages"
  on public.messages for update to authenticated
  using (sender_id = (select auth.uid()))
  with check (
    sender_id = (select auth.uid())
    and private.is_conversation_member(conversation_id)
  );

drop policy if exists "Conversation members can view attachments" on storage.objects;
create policy "Conversation members can view attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-attachments'
    and private.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Conversation members can upload attachments" on storage.objects;
create policy "Conversation members can upload attachments"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and owner_id = (select auth.uid())::text
    and private.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Owners can delete their attachments" on storage.objects;
create policy "Owners can delete their attachments"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'chat-attachments'
    and owner_id = (select auth.uid())::text
    and private.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );

revoke all on function public.add_conversation_creator() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop function public.is_conversation_member(uuid);
drop function public.is_conversation_creator(uuid);

create index if not exists conversations_created_by_idx
  on public.conversations(created_by);
create index if not exists messages_sender_idx
  on public.messages(sender_id);
