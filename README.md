# Orbit — Messenger

Orbit is a mobile-responsive React messenger interface with a local demo mode and an optional Supabase-backed account and messaging flow.

## Live deployment

https://serakib.github.io/messenger/

The app is built with Vite and deployed to GitHub Pages from the `main` branch.

## Available in the current release

- WhatsApp-inspired three-column workspace with a mobile conversation view
- Default dark theme, with a light-theme option
- Contact search and All / Unread / Groups filters
- Working local pin, mute and archive controls
- Local demo message history persisted in the browser
- Account sign-up/sign-in UI
- Supabase profile discovery, direct conversations and group conversations when configured
- Supabase message history and Realtime message inserts
- Private attachment upload and signed download links (10 MB maximum)
- Contact details, profile editing, settings, keyboard shortcuts and responsive navigation

## Backend setup

The repository includes the SQL schema, Supabase client, Auth helpers and chat services. To activate real accounts and cross-device messaging:

1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial_schema.sql`.
3. Run `supabase/migrations/0002_message_attachments.sql`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as GitHub Actions repository Variables. Use the Supabase `sb_publishable_...` key, never a secret/service-role key.
5. Set the Supabase Auth Site URL and Redirect URL to `https://serakib.github.io/messenger/`.

See [the complete setup guide](docs/FREE_HOSTING_SETUP.md).

Never put a Supabase service-role key in browser code or GitHub Pages.

## Not yet implemented

- Audio/video calling
- Browser push notifications
- End-to-end encryption
- Typing indicators and online presence
- Group creation and group administration
- Message editing/deletion, reactions and reply threads
- A production moderation/reporting workflow

The sample contacts are fictional demo data. Until Supabase is configured and users sign in, messages are stored only in the current browser. Do not use demo mode for private or sensitive communication.

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
