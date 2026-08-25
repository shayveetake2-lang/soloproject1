import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { storage } from './storage.js';
import '../style.css';
import '../hero-overrides.css';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('Loading profile...');
  useEffect(() => { storage.load().then((state) => { const found = (state.veloceUsers || []).find((item) => item.email === state.veloceSessionEmail); setUser(found || null); setStatus(found ? '' : 'Please sign in first.'); }); }, []);
  if (!user) return <main className="profile-directory"><p className="eyebrow">YOUR VELOCE ACCOUNT</p><h1>Profile.</h1><p>{status}</p></main>;
  async function save(event) { event.preventDefault(); const form = new FormData(event.currentTarget); const next = { ...user, name: form.get('name'), username: form.get('username'), email: form.get('email'), location: form.get('location') }; const state = await storage.load(); const users = (state.veloceUsers || []).map((item) => item.email === user.email ? next : item); await storage.set('veloceUsers', users); await storage.set('veloceSessionEmail', next.email); setUser(next); setStatus('Profile saved.'); }
  return <main className="profile-directory"><section className="profile-edit-shell"><div className="profile-edit-heading"><p className="eyebrow">YOUR VELOCE ACCOUNT</p><h1>Edit your<br /><em>profile.</em></h1><span>{status}</span></div><form className="car-form profile-form" onSubmit={save}><label>YOUR NAME<input name="name" defaultValue={user.name} required /></label><label>USERNAME<input name="username" defaultValue={user.username} required /></label><label>EMAIL<input name="email" type="email" defaultValue={user.email} required /></label><label>LOCATION<input name="location" defaultValue={user.location} required /></label><button className="native-share">Save profile</button></form></section></main>;
}

function FeedPage() {
  const [photos, setPhotos] = useState([]);
  useEffect(() => { storage.load().then((state) => setPhotos((state.veloceUsers || []).flatMap((user) => (user.carPhotos || []).filter((photo) => photo.shared).map((photo) => ({ ...photo, owner: user.name }))))); }, []);
  return <main className="feed-directory"><section className="routes-intro feed-intro"><p className="eyebrow">FROM THE COMMUNITY</p><h1>Good drives<br /><em>shared.</em></h1></section><section className="community-pictures"><h2>Community pictures.</h2><div className="community-picture-grid">{photos.length ? photos.map((photo, index) => <article className="community-picture-card" key={index}><img src={photo.data} alt={photo.caption || 'Community car'} /><div><strong>{photo.caption || 'Garage photo'}</strong><small>{photo.owner}</small></div></article>) : <div className="photo-empty">Shared garage photos will appear here.</div>}</div></section></main>;
}

function ForumPage() {
  const [topics, setTopics] = useState([]); const [title, setTitle] = useState('');
  return <main className="forum-directory"><section className="forum-intro"><p className="eyebrow">THE VELOCE COMMUNITY</p><h1>Talk about<br /><em>the road.</em></h1><form onSubmit={(event) => { event.preventDefault(); if (title.trim()) { setTopics([{ title }, ...topics]); setTitle(''); } }}><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Start a topic" required /><button className="forum-new">Post topic</button></form></section><section className="forum-list">{topics.map((topic, index) => <article className="forum-topic" key={index}><span className="topic-icon">✦</span><h2>{topic.title}</h2><span className="topic-time">Just now</span></article>)}</section></main>;
}

const path = window.location.pathname;
document.querySelector('body > main')?.remove();
document.querySelectorAll('body > .share-modal, body > .toast').forEach((element) => element.remove());
createRoot(document.getElementById('root')).render(path.endsWith('profile.html') ? <ProfilePage /> : path.endsWith('feed.html') ? <FeedPage /> : <ForumPage />);
