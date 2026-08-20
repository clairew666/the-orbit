# THE ORBIT

THE ORBIT is an installable habit tracker, calendar and growing plant companion. It is built with Next.js and stores each person’s information locally on their device.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify the production app

```bash
npm run build
npm run start
```

## Deploy on Vercel

1. Create a GitHub repository and upload this project.
2. In Vercel, choose **Add New → Project**.
3. Import the GitHub repository.
4. Keep the detected **Next.js** framework and default build settings.
5. Choose **Deploy**.

Vercel will provide a public `vercel.app` address. Future pushes to the repository automatically create new deployments.

## Install as an app

- **iPhone or iPad:** open the deployed address in Safari, use **Share**, then choose **Add to Home Screen**.
- **Android or Chromebook:** open the browser menu and choose **Install app** or **Add to Home screen**.
- **Mac or Windows:** use the install icon in the browser address bar or app menu.

The PWA manifest, icons, safe-area layout and offline cache are included in `public/`.

## Data model

Habits, appointments, achievements and plant progress are stored in LocalStorage. Each browser or installed copy has its own private data. Cloud accounts and cross-device syncing are not included yet.
