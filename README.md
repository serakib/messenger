# Orbit — Messenger

Orbit is a mobile-responsive React messenger interface with a local demo mode and a Supabase-backed account and messaging flow.

## Live deployment

https://serakib.github.io/messenger/

The app is built with Vite and deployed to GitHub Pages from the `main` branch.

## Available in the current release

- WhatsApp-inspired three-column workspace with a mobile conversation view
- Default dark theme, with a light-theme option
- Contact search and All / Unread / Groups filters
- Working local pin, mute and archive controls
- Email/password sign-up and sign-in
- Phone-number sign-in and sign-up UI with SMS OTP verification (requires a configured Supabase SMS provider)
- Supabase profile discovery, direct conversations and group conversations when configured
- Supabase message history and Realtime message inserts
- Private attachment upload and signed download links (10 MB maximum)
- Contact details, profile editing, settings, keyboard shortcuts and responsive navigation

## Backend setup

The Supabase project for this deployment has been created and the three schema migrations have been applied. To recreate the database in a new Supabase project, run these files in order:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_message_attachments.sql`
3. `supabase/migrations/0003_security_hardening.sql`

The GitHub Pages workflow contains the project's public Supabase URL and publishable client key as build defaults. Optional GitHub Actions repository Variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` can override them. These are public browser configuration values; never use a `sb_secret_...` key, `service_role` key, or database password in this frontend or in GitHub Pages.

In Supabase **Authentication → URL Configuration**, set the Site URL and allowed Redirect URL to:

`https://serakib.github.io/messenger/`

Keep the Email provider enabled. For real sign-up tests, use email addresses that can receive the confirmation link.

Never put a Supabase service-role key in browser code or GitHub Pages.

## Not yet implemented

- Audio/video calling
- Browser push notifications
- End-to-end encryption
- Typing indicators and online presence
- Group administration
- Message editing/deletion, reactions and reply threads
- A production moderation/reporting workflow

The app requires an authenticated Orbit account to access conversations and member search. It does not create sample chats or fake call/notification activity. Audio/video calling, browser push notifications and end-to-end encryption are not implemented.

## Development

Requirements: Node.js LTS.

```bash
npm install
npm run dev
npm run build
```

## Project structure

```text
.
├── index.html
├── package.json
├── vite.config.js
├── scr/
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   ├── lib/
│   └── services/
├── supabase/migrations/
└── .github/workflows/static.yml
```
