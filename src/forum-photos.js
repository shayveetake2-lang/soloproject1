import { auth, createForumPhoto, db } from './firebase.js';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import './forum-photos.css';

const forum = document.querySelector('.forum-directory');
const list = document.querySelector('#forumList');

const section = document.createElement('section');
section.className = 'community-pictures';
section.innerHTML = `
  <div class="section-heading compact"><div><p class="eyebrow">COMMUNITY PHOTOS</p><h2>Forum pictures.</h2></div></div>
  <form class="car-form" id="forumPhotoForm"><label>PUBLIC IMAGE URL<input id="forumPhotoUrl" type="url" required placeholder="https://example.com/photo.jpg" /></label><label>PHOTO CAPTION<input id="forumPhotoCaption" type="text" maxlength="120" placeholder="What are we looking at?" /></label><button class="text-button" type="submit">Post picture <span>＋</span></button></form>
  <div class="community-picture-grid" id="forumPhotoGrid"><div class="photo-empty">Forum photos will appear here.</div></div>
`;
forum.insertBefore(section, list);

const form = section.querySelector('#forumPhotoForm');
const urlInput = section.querySelector('#forumPhotoUrl');
const captionInput = section.querySelector('#forumPhotoCaption');
const grid = section.querySelector('#forumPhotoGrid');

async function renderPhotos() {
  const snapshot = await getDocs(query(collection(db, 'forumPhotos'), orderBy('createdAt', 'desc')));
  grid.innerHTML = snapshot.empty ? '<div class="photo-empty">Forum photos will appear here.</div>' : '';
  snapshot.forEach((photoDocument) => {
    const photo = photoDocument.data();
    const card = globalThis.document.createElement('article');
    card.className = 'community-picture-card';
    card.innerHTML = `<img src="${photo.imageUrl}" alt="${photo.caption || 'Forum photo'}" /><div><strong>${photo.caption || 'Forum photo'}</strong><small>${photo.authorName || 'Veloce driver'}</small></div>`;
    grid.append(card);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!auth.currentUser) {
    window.location.href = 'index.html';
    return;
  }
  try {
    await createForumPhoto({ user: auth.currentUser, imageUrl: urlInput.value.trim(), caption: captionInput.value.trim() });
    urlInput.value = '';
    captionInput.value = '';
    await renderPhotos();
  } catch (error) {
    window.alert(error.message || 'Could not post that picture.');
  }
});

renderPhotos().catch((error) => {
  console.error('Could not load public forum photos.', error);
  grid.innerHTML = '<div class="photo-empty">Forum photos are unavailable right now.</div>';
});