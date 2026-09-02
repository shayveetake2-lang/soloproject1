import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

initializeApp();

const auth = getAuth();
const db = getFirestore();

async function requireAdmin(request) {
  const token = request.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error('Authentication is required.');
  const decodedToken = await auth.verifyIdToken(token);
  if (decodedToken.admin !== true) throw new Error('Administrator access is required.');
  return decodedToken;
}

async function getAdmins() {
  const result = await auth.listUsers(1000);
  const adminUsers = result.users.filter((user) => user.customClaims?.admin === true);
  const profiles = await Promise.all(adminUsers.map((user) => db.doc(`users/${user.uid}`).get()));
  return adminUsers.map((user, index) => ({
    uid: user.uid,
    email: user.email,
    name: profiles[index].data()?.name || user.displayName || user.email
  }));
}

function sendError(response, error) {
  const message = error instanceof Error ? error.message : 'The admin request failed.';
  const status = /required|Authentication/.test(message) ? 403 : 400;
  response.status(status).json({ error: message });
}

export const adminPanel = onRequest({ cors: true }, async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Use POST for admin requests.' });
    return;
  }

  let caller;
  try {
    caller = await requireAdmin(request);
  } catch (error) {
    sendError(response, error);
    return;
  }

  try {
    const { action } = request.body || {};
    if (action === 'listAdmins') {
      response.json({ admins: await getAdmins() });
      return;
    }

    if (action === 'createAdmin') {
      const { email, password, name, username } = request.body;
      if (![email, password, name, username].every((value) => typeof value === 'string' && value.trim())) {
        throw new Error('Name, username, email, and password are required.');
      }
      if (password.length < 8) throw new Error('Passwords must be at least 8 characters.');
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = username.trim().toLowerCase();
      const user = await auth.createUser({ email: normalizedEmail, password, displayName: name.trim() });
      await auth.setCustomUserClaims(user.uid, { admin: true });
      const contactCode = `VEL-${user.uid.slice(0, 8).toUpperCase()}`;
      await db.doc(`users/${user.uid}`).set({
        email: normalizedEmail,
        name: name.trim(),
        username: normalizedUsername,
        location: 'Auckland, NZ',
        contactCode,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      await db.doc(`messageAddresses/${contactCode}`).set({
        uid: user.uid,
        name: name.trim(),
        username: normalizedUsername,
        email: normalizedEmail,
        location: 'Auckland, NZ',
        contactCode
      });
      response.status(201).json({ uid: user.uid });
      return;
    }

    if (action === 'removeAdmin') {
      const { uid } = request.body;
      if (typeof uid !== 'string' || !uid) throw new Error('An administrator ID is required.');
      if (uid === caller.uid) throw new Error('You cannot remove your own administrator access.');
      const user = await auth.getUser(uid);
      if (user.customClaims?.admin !== true) throw new Error('That account is not an administrator.');
      const admins = await getAdmins();
      if (admins.length <= 1) throw new Error('At least one administrator must remain.');
      const { admin, ...remainingClaims } = user.customClaims || {};
      await auth.setCustomUserClaims(uid, remainingClaims);
      response.status(204).end();
      return;
    }

    throw new Error('Unknown admin action.');
  } catch (error) {
    console.error('Admin panel request failed:', error);
    sendError(response, error);
  }
});