# Firebase One-Click Deploy

## One-time setup (local)
1. Login:
   - `npx firebase-tools login`
2. Confirm project:
   - `npx firebase-tools projects:list`
   - default project is already set in `.firebaserc` as `skaterflow`

## One-click deploy (local)
- `npm run deploy`

This builds the app and deploys `dist/` to Firebase Hosting.

## Optional beta preview channel
- `npm run deploy:beta`

This publishes to a temporary `beta` Hosting channel URL.

## Permanent auto-deploy from GitHub
This repo includes:
- `.github/workflows/firebase-hosting-deploy.yml`

One-time GitHub secret setup:
1. Generate CI token:
   - `npx firebase-tools login:ci`
2. In GitHub repo:
   - Settings -> Secrets and variables -> Actions
   - Add secret `FIREBASE_TOKEN` with that token

After that:
- Push to `main` deploys automatically.
- You can also run the workflow manually from GitHub Actions.
