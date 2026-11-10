# Free-first backend setup (Supabase)

This repository is not connected to a backend yet. This guide prepares the backend foundation without putting secrets in Git.

## Why Supabase?

The app needs authentication, durable storage, a database and realtime updates. Supabase Free provides these in one service and is a practical starting point for a small community. Free-plan limits and inactivity policies can change; it is not unlimited production hosting.

## One-time setup

1. Create a project at https://supabase.com/dashboard (Free plan is enough to start).
2. Choose a strong database password and keep it private.
3. Open **SQL Editor → New query**.
4. Run the SQL files in order in the Supabase SQL Editor:\n   - `supabase/migrations/0001_initial_schema.sql`\n   - `supabase/migrations/0002_message_attachments.sql`
5. Open **Project Settings → API** and copy the Project URL and publishable/anon key.
6. In GitHub, open **Settings → Secrets and variables → Actions → Variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your publishable/anon key

   These are public client configuration values, not service-role secrets. Never add a service-role key to frontend code or GitHub Pages.
7. In Supabase **Authentication → URL Configuration**, set the Site URL to:
   `https://serakib.github.io/messenger/`
   Add the same URL to the allowed Redirect URLs.
8. Keep email confirmation enabled for real accounts. Configure SMTP before expecting reliable email delivery; Supabase's built-in email sender is limited and intended for testing.

## Database foundation included

The migration creates:
- User profiles linked to Supabase Auth
- Direct/group conversation records
- Conversation membership and owner role
- Persistent messages with membership-based Row Level Security
- A private attachment bucket with a 10 MB per-file limit and basic MIME allow-list
- Realtime publication for messages

RLS is enabled. Do not disable it to make the app appear to work. Test with two separate accounts before inviting users.

## Current status

The repository now includes a Supabase client, Auth helpers, and data-service functions for conversations, messages, realtime inserts, read positions and private attachments. The existing React screens are still a demo and are not yet connected to those services. Creating the Supabase project and running the migration are required before real login or messaging can work. The SQL is a starting schema and should receive a security review and tests before handling sensitive conversations. The app does not implement end-to-end encryption, push notifications, or audio/video calling.

## Free-tier cautions

- GitHub Pages hosts only the frontend; it is not a backend.
- Supabase quotas apply to database, storage, bandwidth and monthly active users.
- A free project may be paused after inactivity.
- Push notifications and reliable global audio/video calling need additional infrastructure and browser permissions.
- This app does not currently implement end-to-end encryption. Database access control is not the same as end-to-end encryption.
