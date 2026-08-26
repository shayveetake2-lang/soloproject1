# Run Veloce with Firebase

## One-time Firebase console setup

1. Open the [Firebase console](https://console.firebase.google.com/) and select `veloce-b89bf`.
2. Open **Build > Firestore Database**, choose **Create database**, select a region, and start in **Test mode** while developing. Replace the test rules before deployment.
3. Open **Build > Authentication > Sign-in method**, enable **Email/Password**, and save.
4. Open **Project settings > General > Your apps**. Add a Web app if one does not exist, then copy its Firebase configuration values.
5. Open **Project settings > Service accounts**, choose **Generate new private key**, and save the downloaded file in this project as `firebase-service-account.json`. Keep it private.

## Configure this project

1. In a terminal at the project root, create the local environment file:

   ```sh
   cp .env.example .env
   ```

2. Open `.env` and fill `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID` from the Web app configuration. The `veloce-b89bf` values already in the template are correct. Leave `FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json` unchanged.
3. Verify that `firebase-service-account.json` is in the project root. Both `.env` and this private key are ignored by Git.

## Start locally

1. Install JavaScript packages once:

   ```sh
   npm install
   ```

2. Install the Python API packages once:

   ```sh
   npm run setup:python
   ```

3. Start the Firestore API in the first terminal:

   ```sh
   npm run dev:api
   ```

   Wait for `Veloce Firestore server running at http://localhost:8000`.

4. Start Vite in a second terminal:

   ```sh
   npm run dev
   ```

5. Open the localhost URL Vite prints, normally `http://localhost:5173`.

## Verify

Run this before committing or deploying:

```sh
npm run check
```

The legacy interface uses the Python API to store its shared state in Firestore. `src/firebase.js` contains the browser Firebase helpers: `addCarToGarage(userId, carData)` creates `users/{userId}/garage/{carId}`, and `signUpWithProfile(...)` creates an Email/Password account plus its `users/{userId}` profile document.