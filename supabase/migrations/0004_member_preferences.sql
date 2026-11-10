-- Orbit Messenger: per-user conversation preferences
-- Apply after 0003_security_hardening.sql.

alter table public.conversation_members
  add column if not exists is_pinned boolean not null default false,
  add column if not exists is_muted boolean not null default false,
  add column if not exists is_archived boolean not null default false;

grant update (last_read_at, is_pinned, is_muted, is_archived)
  on public.conversation_members to authenticated;
