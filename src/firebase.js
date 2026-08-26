import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

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
export const onSessionChanged = (callback) => onAuthStateChanged(auth, callback);
export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signOutUser = () => signOut(auth);

export async function getUserProfile(userId) {
  const snapshot = await getDoc(doc(db, 'users', userId));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveUserProfile(userId, profile) {
  await setDoc(doc(db, 'users', userId), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
}

export async function createForumPhoto({ user, imageUrl, caption }) {
  const parsedUrl = new URL(imageUrl);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Use a public http or https image URL.');
  const id = crypto.randomUUID();
  await setDoc(doc(db, 'forumPhotos', id), {
    authorId: user.uid,
    authorName: user.displayName || user.email,
    caption: caption || 'Shared from Veloce',
    imageUrl: parsedUrl.href,
    createdAt: serverTimestamp()
  });
  return id;
}

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