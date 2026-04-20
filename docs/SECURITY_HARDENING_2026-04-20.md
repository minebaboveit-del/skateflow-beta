# AthleteFlow Security Hardening (April 20, 2026)

This project now includes stricter Firebase rule scaffolding and cloud sync request hardening.

## What changed in code

- Cloud sync requests now attempt to attach:
  - `Authorization: Bearer <Firebase ID token>`
  - `X-Firebase-AppCheck: <App Check token>` (if configured)
- New Firebase rule files:
  - `firestore.rules`
  - `storage.rules`
- `firebase.json` now points to those rules.

## Required Firebase console setup

1. Enable **Authentication**
- Turn on at least one provider for sync (recommended: Anonymous for beta).

2. Authorized domains
- Firebase Console -> Authentication -> Settings -> Authorized domains
- Add:
  - `skaterflow.web.app`
  - `skaterflow.firebaseapp.com`
  - your active preview domain (for beta testing)
- Remove `localhost` in production.

3. App Check (recommended)
- Create reCAPTCHA Enterprise site key for web domains.
- Set env var before build/deploy:
  - `VITE_FIREBASE_APPCHECK_SITE_KEY=...`
- Enforce App Check for Firestore and Storage after monitoring.

4. Deploy rules
- `npx firebase-tools deploy --only firestore:rules,storage --project skaterflow`

## Custom claims role model

Rules expect `request.auth.token.role` values:

- `owner`
- `coach`
- `dad`
- `proskater`
- `media`
- `skater`

Write access for sync state is limited to:
- `owner`, `coach`, `dad`, `proskater` (or `admin: true`)

## Example: set custom claims (Node Admin SDK)

```js
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp({ credential: applicationDefault() });

await getAuth().setCustomUserClaims("FIREBASE_UID", {
  role: "coach",
  admin: false,
});
```

## Notes

- Firestore rules are currently locked to the default sync doc path:
  - `skateflow/sharedState`
- If app `documentPath` changes, update `firestore.rules` to match.
- For strict production posture, keep cloud sync write roles minimal and audit claim assignment.
