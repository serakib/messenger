# Orbit — Messenger UI Demo

Orbit is a responsive **front-end UI demo** inspired by modern messaging apps. It is built with React, Vite, Lucide icons and plain CSS.

## What is included?
- Responsive desktop, tablet and mobile layout
- Inbox, search, pinned chat and unread badges
- Conversation switching and local demo message sending
- Contact details panel, shared-media preview and chat preferences
- People, Calls, Notifications, Settings and Profile screens
- New-conversation modal and call-preview modal
- Light/dark theme toggle
- Small toast notifications for demo-only actions

## Important: this is not a real messaging service
The demo does **not** connect to Firebase or a server. Messages you send only live in the current browser session. Authentication, real-time delivery, file uploads, push notifications, actual voice/video calls, end-to-end encryption, account deletion and backend-enforced limits are **not implemented**. The encryption notice is illustrative only; do not use it to send private information.

## Run it on your computer

1. Install **Node.js LTS** from https://nodejs.org/ .
2. Extract this ZIP file.
3. Open the extracted `messenger-ui-demo` folder in VS Code.
4. Open a terminal in that folder.
5. Run `npm install`.
6. Run `npm run dev`.
7. Open the local address Vite prints (usually `http://localhost:5173`).

To check the production build, run `npm run build`. The output will be created in the `dist` folder.

## Project structure

```text
messenger-ui-demo/
├── index.html
├── package.json
├── README.md
└── src/
    ├── App.jsx       # UI components and demo interactions
    ├── main.jsx      # React entry point
    └── styles.css    # Responsive layout, colors and themes
```

## Suggested next development stages
1. Add Firebase Authentication and protected profile data.
2. Add Firestore chat collections and real-time listeners.
3. Add Firebase Storage with strict access rules and file-size/expiry enforcement.
4. Add Cloud Functions or another trusted backend for daily quotas and scheduled file deletion.
5. Add WebRTC signaling and real call flows.
6. Test security rules and mobile behavior before publishing.

Keep Firebase credentials and privileged secrets out of client-side code. UI limits alone are not security controls.
