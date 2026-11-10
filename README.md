# Orbit — Messenger

Orbit is a React-based messaging application prototype. The current release is a **frontend demo**, not yet a live messaging service.

## Live deployment

The app is built with Vite and deployed to GitHub Pages from the `main` branch. GitHub Pages hosting is free for public repositories.

## Current features

- Responsive inbox and conversation layout
- Demo contacts and seeded conversations
- Local in-memory message sending
- Contact details, people, calls, notifications and settings previews
- Light/dark theme and mobile layout

## Important limitations

The current app does **not** yet provide real accounts, server-side message delivery, durable message history, file uploads, push notifications, real voice/video calls, or end-to-end encryption. Demo contacts and messages are hard-coded. Messages sent in the UI are lost on refresh. Do not use this prototype for private or sensitive communication.

## Development

Requirements: Node.js LTS.

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
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
│   └── styles.css
└── .github/workflows/static.yml
```

## Free-first roadmap

1. Keep the frontend on GitHub Pages.
2. Add Supabase Auth for email-based accounts.
3. Add PostgreSQL tables and Row Level Security for profiles, conversations, memberships and messages.
4. Add Supabase Realtime for message updates and presence.
5. Add Supabase Storage with private buckets and strict policies for attachments.
6. Add reporting, blocking, rate limits and account controls.
7. Evaluate WebRTC calling separately; reliable global calling may require paid TURN infrastructure.

Supabase free-plan quotas and inactivity/pause policies can change. A free tier is suitable for a small project or prototype, not a guarantee of unlimited production hosting.
