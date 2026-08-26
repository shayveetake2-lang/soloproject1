# Run Veloce with Firebase

## One-time Firebase console setup

1. Open the [Firebase console](https://console.firebase.google.com/) and select `veloce-b89bf`.
2. Open **Build > Firestore Database**, choose **Create database**, select a region, and start in **Test mode** while developing. Replace the test rules before deployment.
3. Open **Build > Authentication > Sign-in method**, enable **Email/Password**, and save.
4. Open **Project settings > General > Your apps**. Add a Web app if one does not exist, then copy its Firebase configuration values.

## Configure this project

1. In a terminal at the project root, create the local environment file:

   ```sh
   cp .env.example .env
   ```

2. Open `.env` and fill `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID` from the Web app configuration. The `veloce-b89bf` values already in the template are correct.

## Start locally

1. Install JavaScript packages once:

   ```sh
   npm install
   ```

2. Start Vite:

   ```sh
   npm run dev
   ```

3. Open the localhost URL Vite prints, normally `http://localhost:5173`.

## Verify

Run this before committing or deploying:

```sh
npm run check
```

The interface uses Firebase Authentication and Firestore directly. `src/firebase.js` contains the browser Firebase helpers: `addCarToGarage(userId, carData)` creates `users/{userId}/garage/{carId}`, and `signUpWithProfile(...)` creates an Email/Password account plus its `users/{userId}` profile document.

## Cloudflare Pages deployment

The deployed app uses Firebase Authentication and direct per-user Firestore documents. Forum photos are public image URLs stored in Firestore; the source image must already be hosted at a public URL.

1. In the Firebase console, open **Firestore Database > Rules**, replace the rules with the contents of `firestore.rules`, then publish them.
2. In Cloudflare, go to **Workers & Pages > Create > Pages > Connect to Git** and select this GitHub repository.
3. Set the build command to `npm run build` and the build output directory to `dist`.
4. Add these Cloudflare Pages **Environment Variables** from your local `.env`: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and `VITE_FIREBASE_MEASUREMENT_ID`.
5. Deploy. Cloudflare will provide a public `pages.dev` URL that you can share for testing.