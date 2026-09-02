import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCI0U9bTQXM6zAlAy4FG5GLkbT-gmi3LwI",
  authDomain: "veloce-b89bf.firebaseapp.com",
  projectId: "veloce-b89bf",
  storageBucket: "veloce-b89bf.firebasestorage.app",
  messagingSenderId: "1776886231",
  appId: "1:1776886231:web:5e64f62acd425b56112b92"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function bootstrap() {
  const email = 'shayveetake2@gmail.com';
  
  let user;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, '123456789');
    user = cred.user;
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      const cred = await createUserWithEmailAndPassword(auth, email, '123456789');
      user = cred.user;
    } else {
      throw err;
    }
  }

  await setDoc(doc(db, 'admins', user.uid), { email, name: 'Admin', uid: user.uid });
  console.log('Admin bootstrapped: ' + user.uid);
  process.exit(0);
}
bootstrap();
