-- Orbit Messenger: message attachment metadata
-- Run this after 0001_initial_schema.sql.

alter table public.messages
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime text,
  add column if not exists attachment_size bigint;

alter table public.messages
  drop constraint if exists messages_body_length;

alter table public.messages
  drop constraint if exists messages_content_valid;

alter table public.messages
  add constraint messages_content_valid check (
    char_length(body) <= 5000
    and (char_length(body) >= 1 or attachment_path is not null)
    and (
      attachment_path is null
      or (
        attachment_path like conversation_id::text || '/%'
        and attachment_name is not null
        and attachment_name <> ''
        and attachment_mime is not null
        and attachment_mime in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain')
        and attachment_size is not null
        and attachment_size between 1 and 10485760
      )
    )
  );

grant insert (
  conversation_id,
  sender_id,
  body,
  attachment_path,
  attachment_name,
  attachment_mime,
  attachment_size
) on public.messages to authenticated;
