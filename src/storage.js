import { auth, db } from './firebase.js';
import { deleteField, doc, getDoc, setDoc } from 'firebase/firestore';

function getStateDocument() {
  if (!auth.currentUser) throw new Error('Sign in before accessing your saved data.');
  return doc(db, 'users', auth.currentUser.uid, 'private', 'state');
}

export const storage = {
  async load() {
    const snapshot = await getDoc(getStateDocument());
    return snapshot.exists() ? snapshot.data() : {};
  },
  async set(key, value) {
    await setDoc(getStateDocument(), { [key]: value }, { merge: true });
  },
  async remove(key) {
    await setDoc(getStateDocument(), { [key]: deleteField() }, { merge: true });
  }
};
