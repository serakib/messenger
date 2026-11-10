# Supabase backend setup — Orbit Messenger

This guide describes the Supabase project connected to the Orbit Messenger deployment.

## Project status

The Supabase project is already created, its database schema is installed, and the project is linked to the GitHub Pages build. You do not need to create another project.

## Recreate the database (only for a new/empty project)

Run these SQL files in order from **SQL Editor → New query**:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_message_attachments.sql`
3. `supabase/migrations/0003_security_hardening.sql`

The migrations create:
- User profiles connected to Supabase Auth
- Direct and group conversations with membership and owner roles
- Persistent messages with membership-based Row Level Security
- A private attachment bucket with a 10 MB per-file limit and MIME allow-list
- Realtime message publication
- Private-schema security helpers, trigger-function permission restrictions, and foreign-key indexes

RLS must remain enabled. Do not disable it to make the app appear to work.

## One remaining dashboard configuration

Open Supabase **Authentication → URL Configuration** and set:

- **Site URL:** `https://serakib.github.io/messenger/`
- **Redirect URLs:** add `https://serakib.github.io/messenger/`

Then open **Authentication → Providers → Email** and confirm Email is enabled. Keep email confirmation enabled. For production email delivery, configure a trusted SMTP sender.

## GitHub Pages configuration

The GitHub Actions workflow includes the public Project URL and `sb_publishable_...` key as build defaults, so the app can connect without manually creating repository variables. For key rotation or separate deployment environments, add optional repository Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Repository Variables override the workflow defaults. A publishable key is intended for browser use and must be protected by database grants and RLS. Never place an `sb_secret_...` key, `service_role` key, or database password in frontend code or GitHub Pages.

A push to `main` triggers the Pages build and deployment.

## Security and feature limitations

The database uses per-user and per-conversation RLS policies. Membership-check helpers are in a non-public schema and are not meant to be called through the Data API. The private file bucket allows access only to signed-in conversation members.

The application does not currently implement end-to-end encryption, browser push notifications, or audio/video calling. RLS and TLS are not substitutes for end-to-end encryption. Test with two separate confirmed accounts before inviting other users.

## Free-tier notes

GitHub Pages hosts the frontend only. Supabase quotas apply to database, storage, bandwidth and monthly active users; free projects may be paused after inactivity. Limits and plan policies can change.
