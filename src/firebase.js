import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'veloce-b89bf',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'appId'];

if (requiredConfig.some((key) => !firebaseConfig[key])) {
  throw new Error('Firebase web configuration is incomplete. Set the VITE_FIREBASE_* values in .env.');
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export async function addCarToGarage(userId, carData) {
  if (!userId) throw new Error('A Firebase user ID is required.');
  return addDoc(collection(db, 'users', userId, 'garage'), {
    ...carData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function signUpWithProfile({ email, password, name, username, location = 'Auckland, NZ' }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const profile = {
    email: credential.user.email,
    name,
    username: username.toLowerCase(),
    location,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, 'users', credential.user.uid), profile);
  return { user: credential.user, profile };
}