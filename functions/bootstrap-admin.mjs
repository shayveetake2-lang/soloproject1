import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this command.');
}
if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters.');

initializeApp({ credential: applicationDefault() });

const auth = getAuth();
const db = getFirestore();
let user;

try {
  user = await auth.getUserByEmail(email);
} catch (error) {
  if (error.code !== 'auth/user-not-found') throw error;
  user = await auth.createUser({ email, password, displayName: 'Admin' });
}

await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
const contactCode = `VEL-${user.uid.slice(0, 8).toUpperCase()}`;
await db.doc(`users/${user.uid}`).set({
  email,
  name: 'Admin',
  username: 'admin',
  location: 'Auckland, NZ',
  contactCode,
  updatedAt: FieldValue.serverTimestamp()
}, { merge: true });
await db.doc(`messageAddresses/${contactCode}`).set({
  uid: user.uid,
  name: 'Admin',
  username: 'admin',
  email,
  location: 'Auckland, NZ',
  contactCode
}, { merge: true });

console.log(`Administrator ready: ${email} (${user.uid})`);