# Supabase backend setup — Orbit Messenger

This guide describes the Supabase project connected to the Orbit Messenger deployment.

## Project status

The Supabase project is already created, its database schema is installed, and the project is linked to the GitHub Pages build. You do not need to create another project.

## Recreate the database (only for a new/empty project)

Run these SQL files in order from **SQL Editor → New query**:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_message_attachments.sql`
3. `supabase/migrations/0003_security_hardening.sql`
4. `supabase/migrations/0004_member_preferences.sql`
5. `supabase/migrations/0005_member_favourites.sql`

The migrations create:
- User profiles connected to Supabase Auth
- Direct and group conversations with membership and owner roles
- Persistent messages with membership-based Row Level Security
- A private attachment bucket with a 10 MB per-file limit and MIME allow-list
- Realtime message publication
- Email/password Auth and Phone OTP UI integration (SMS provider is configured separately)
- Private-schema security helpers, trigger-function permission restrictions, and foreign-key indexes
- Per-user pin, favourite, mute and archive preferences stored with conversation membership

RLS must remain enabled. Do not disable it to make the app appear to work.

## Authentication configuration

Email authentication is enabled by default in Supabase. Keep **Email** enabled under **Authentication → Sign In / Providers**.

Open Supabase **Authentication → URL Configuration** and set:

- **Site URL:** `https://serakib.github.io/messenger/`
- **Redirect URLs:** add `https://serakib.github.io/messenger/`

Keep email confirmation enabled. For production email delivery, configure a trusted SMTP sender.

### Optional phone-number login (SMS OTP)

Orbit now offers both Email and Phone OTP on its account screen. Phone login uses a six-digit one-time code rather than a permanent phone password.

To activate real SMS delivery:

1. Open **Authentication → Sign In / Providers → Phone** in the Supabase Dashboard.
2. Enable Phone sign-in.
3. Configure an SMS provider supported by Supabase (for example, Twilio or Vonage) and enter its credentials in the Supabase Dashboard.
4. Save the provider settings and test with a phone number you control, using international format such as `+8801XXXXXXXXX`.

Supabase does not send production SMS without an SMS provider. SMS providers may charge per message. Keep provider credentials in Supabase's provider settings; never put them in GitHub, frontend code, or chat. Until this is configured, the Phone OTP form is present but SMS requests will fail with the provider/configuration error returned by Supabase.

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
