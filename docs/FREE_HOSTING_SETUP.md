# Free-first backend setup (Supabase)

The repository includes a Supabase-backed sign-in, profile, conversation, Realtime-message and private-attachment flow. It runs in local demo mode until you create a Supabase project, apply both migrations and add the GitHub Actions variables.

## Why Supabase?

The app needs authentication, durable storage, a database and realtime updates. Supabase Free provides these in one service and is a practical starting point for a small community. Free-plan limits and inactivity policies can change; it is not unlimited production hosting.

## One-time setup

1. Create a project at https://supabase.com/dashboard (Free plan is enough to start).
2. Choose a strong database password and keep it private.
3. Open **SQL Editor → New query**.
4. Run the SQL files in order in the Supabase SQL Editor:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_message_attachments.sql`
5. Open **Project Settings → API Keys** (or the project's **Connect** dialog) and copy the **Project URL** and **Publishable key** (`sb_publishable_...`).
6. In GitHub, open **Settings → Secrets and variables → Actions → Variables → New repository variable** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your publishable key (`sb_publishable_...`)

   These are public client configuration values. The publishable key is designed for browser apps and is constrained by the database grants and Row Level Security policies. Never use a `sb_secret_...` key, `service_role` key, or database password in this frontend or in GitHub Pages.
7. In Supabase **Authentication → URL Configuration**, set the Site URL to:
   `https://serakib.github.io/messenger/`
   Add the same URL to the allowed Redirect URLs.
8. Open **Authentication → Providers → Email** and keep Email enabled. Keep email confirmation enabled. For production, configure a trusted SMTP sender; the built-in sender is restricted and intended for light testing.
9. Back in GitHub, open **Actions → Build and deploy Orbit to GitHub Pages → Run workflow** and run it on `main`. Updating repository Variables alone does not trigger a new build.

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

The repository includes a Supabase client, Auth helpers, and UI-connected data services for profiles, conversations, messages, Realtime inserts, read positions and private attachments. Until the project variables and SQL migrations are configured, the app stays in local demo mode. After setup, test with two separate accounts to verify real cross-account delivery. The SQL is a starting schema and should receive a security review and tests before handling sensitive conversations. The app does not implement end-to-end encryption, push notifications, or audio/video calling.

## Free-tier cautions

- GitHub Pages hosts only the frontend; it is not a backend.
- Supabase quotas apply to database, storage, bandwidth and monthly active users.
- A free project may be paused after inactivity.
- Push notifications and reliable global audio/video calling need additional infrastructure and browser permissions.
- This app does not currently implement end-to-end encryption. Database access control is not the same as end-to-end encryption.
