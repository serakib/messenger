-- Orbit Messenger: initial Supabase schema
-- Apply in Supabase SQL Editor. All user data is protected by Row Level Security.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default 'New user',
  avatar_url text,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null or username ~ '^[a-zA-Z0-9_]{3,24}$'
  ),
  constraint profiles_bio_length check (char_length(bio) <= 160)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct' check (type in ('direct', 'group')),
  title text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_title_length check (title is null or char_length(title) <= 80)
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint messages_body_length check (char_length(body) between 1 and 5000)
);

create index if not exists conversation_members_user_idx
  on public.conversation_members(user_id, joined_at desc);
create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at desc);
create index if not exists conversations_updated_idx
  on public.conversations(updated_at desc);

-- SECURITY DEFINER helpers avoid recursive RLS checks on membership tables.
create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_conversation_creator(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and c.created_by = (select auth.uid())
  );
$$;

grant execute on function public.is_conversation_member(uuid) to authenticated;
grant execute on function public.is_conversation_creator(uuid) to authenticated;

-- Create a profile whenever a new Auth user signs up.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'New user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Automatically add the creator as owner of a new conversation.
create or replace function public.add_conversation_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.conversation_members (conversation_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_conversation_created on public.conversations;
create trigger on_conversation_created
  after insert on public.conversations
  for each row execute procedure public.add_conversation_creator();

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Profiles are visible to signed-in users; each user edits only their own profile.
drop policy if exists "Signed-in users can view profiles" on public.profiles;
create policy "Signed-in users can view profiles"
  on public.profiles for select to authenticated
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Conversation data is visible only to its members.
drop policy if exists "Members can view conversations" on public.conversations;
create policy "Members can view conversations"
  on public.conversations for select to authenticated
  using (public.is_conversation_member(id));

drop policy if exists "Users can create conversations" on public.conversations;
create policy "Users can create conversations"
  on public.conversations for insert to authenticated
  with check ((select auth.uid()) = created_by);

drop policy if exists "Owners can update conversations" on public.conversations;
create policy "Owners can update conversations"
  on public.conversations for update to authenticated
  using (public.is_conversation_creator(id))
  with check (public.is_conversation_creator(id));

drop policy if exists "Members can view conversation members" on public.conversation_members;
create policy "Members can view conversation members"
  on public.conversation_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_conversation_member(conversation_id));

drop policy if exists "Conversation creators can add members" on public.conversation_members;
create policy "Conversation creators can add members"
  on public.conversation_members for insert to authenticated
  with check (public.is_conversation_creator(conversation_id));

drop policy if exists "Creators or members can leave" on public.conversation_members;
create policy "Creators or members can leave"
  on public.conversation_members for delete to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_conversation_creator(conversation_id)
  );

-- Only members can read messages; users can send/edit/delete only their own messages.
drop policy if exists "Members can read messages" on public.messages;
create policy "Members can read messages"
  on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id));

drop policy if exists "Members can send messages as themselves" on public.messages;
create policy "Members can send messages as themselves"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_conversation_member(conversation_id)
  );

drop policy if exists "Authors can edit their messages" on public.messages;
create policy "Authors can edit their messages"
  on public.messages for update to authenticated
  using (sender_id = (select auth.uid()))
  with check (sender_id = (select auth.uid()));

drop policy if exists "Authors can delete their messages" on public.messages;
create policy "Authors can delete their messages"
  on public.messages for delete to authenticated
  using (sender_id = (select auth.uid()));

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.conversations to authenticated;
grant select, insert, delete on public.conversation_members to authenticated;
grant select, insert, update, delete on public.messages to authenticated;

-- Private attachment bucket. Store objects under <conversation-uuid>/<filename>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf','text/plain']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Conversation members can view attachments" on storage.objects;
create policy "Conversation members can view attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-attachments'
    and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Conversation members can upload attachments" on storage.objects;
create policy "Conversation members can upload attachments"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and owner_id = (select auth.uid())::text
    and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Owners can delete their attachments" on storage.objects;
create policy "Owners can delete their attachments"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'chat-attachments'
    and owner_id = (select auth.uid())::text
  );

-- Enable live message events. Ignore duplicate publication membership.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then
    raise notice 'supabase_realtime publication not found; enable Realtime for public.messages in the Supabase dashboard.';
end;
$$;
