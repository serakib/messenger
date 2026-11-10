-- Orbit Messenger: per-user favourite conversations
-- Apply after 0004_member_preferences.sql.

alter table public.conversation_members
  add column if not exists is_favorite boolean not null default false;

grant update (is_favorite)
  on public.conversation_members to authenticated;
