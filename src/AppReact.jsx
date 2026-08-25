import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { storage } from './storage.js';

const routes = [
  { id: 'gorge', area: 'PIHA', name: 'Waitakere West Backroads', distance: '64 km', time: '2-3 hrs', points: [[-36.851, 174.764], [-36.918, 174.658], [-36.959, 174.552], [-36.934, 174.637]] },
  { id: 'coast', area: 'KAIAUA COAST', name: 'Firth of Thames Coastal Run', distance: '108 km', time: '2-3 hrs', points: [[-36.851, 174.764], [-36.727, 175.083], [-36.963, 175.185], [-37.073, 175.478]] },
  { id: 'mountain', area: 'HUNUA RANGES', name: 'Ardmore Switchbacks', distance: '82 km', time: '2 hrs', points: [[-36.851, 174.764], [-37.002, 175.091], [-37.093, 175.154], [-37.134, 175.175]] },
  { id: 'north-shore', area: 'NORTH SHORE', name: 'Albany to Orewa', distance: '46 km', time: '1-2 hrs', points: [[-36.851, 174.764], [-36.729, 174.696], [-36.609, 174.677], [-36.575, 174.690]] }
];

function RouteMap({ route }) {
  const node = useRef(null);
  useEffect(() => {
    const map = L.map(node.current, { scrollWheelZoom: false }).fitBounds(route.points, { padding: [24, 24] });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    L.polyline(route.points, { color: '#e36f4f', weight: 4 }).addTo(map);
    route.points.forEach((point) => L.circleMarker(point, { radius: 7, color: '#f2efe9', weight: 2, fillColor: '#252a23', fillOpacity: 1 }).addTo(map));
    return () => map.remove();
  }, [route]);
  return <div className="route-map" ref={node} aria-label={`Map of ${route.name}`} />;
}

export default function AppReact() {
  const [state, setState] = useState({ users: [], savedRoutes: [], sessionEmail: null });
  const [selected, setSelected] = useState(routes[0]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const user = state.users.find((item) => item.email === state.sessionEmail);

  useEffect(() => { storage.load().then((data) => setState({ users: data.veloceUsers || [], savedRoutes: data.veloceSavedRoutes || [], sessionEmail: data.veloceSessionEmail || null })).catch(() => setNotice('Start server.py before opening the app.')); }, []);
  async function login(event) { event.preventDefault(); const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)); const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''); const account = state.users.find((item) => item.email?.toLowerCase() === email.trim().toLowerCase() && item.passwordHash === hash); if (!account) { setNotice('Incorrect email or password.'); return; } await storage.set('veloceSessionEmail', account.email); setState({ ...state, sessionEmail: account.email }); setLoginOpen(false); }
  async function toggleSaved(route) { if (!user) { setLoginOpen(true); return; } const savedRoutes = state.savedRoutes.includes(route.name) ? state.savedRoutes.filter((name) => name !== route.name) : [...state.savedRoutes, route.name]; setState({ ...state, savedRoutes }); await storage.set('veloceSavedRoutes', savedRoutes); }
  async function logout() { await storage.remove('veloceSessionEmail'); setState({ ...state, sessionEmail: null }); }

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">V</span><span>veloce</span></div><div className="profile-mini"><div className="avatar">{user ? user.name.slice(0, 2).toUpperCase() : '-'}</div><div><strong>{user?.name || 'Not signed in'}</strong><span>{user ? 'Auckland, NZ' : 'Sign in to save your drives'}</span></div><button className="login-link" onClick={user ? logout : () => setLoginOpen(true)}>{user ? 'Log out' : 'Log in'}</button></div><nav className="main-nav"><a className="nav-link active" href="#discover">Discover</a><a className="nav-link" href="#routes">Routes</a><a className="nav-link" href="routes.html">Route directory</a><a className="nav-link" href="feed.html">Community feed</a><a className="nav-link" href="forum.html">Forum</a>{user && <a className="nav-link" href="profile.html">Edit profile</a>}</nav></aside><main className="main-content" id="discover"><header className="topbar"><div className="breadcrumb">EXPLORE / <span>AUCKLAND</span></div><button className="create-account-top" onClick={() => user ? logout() : setLoginOpen(true)}>{user ? 'Log out' : 'Log in'}</button></header><section className="intro-row"><div><p className="eyebrow">THURSDAY, AUGUST 20</p><h1>Take the long way<br /><em>home.</em></h1></div></section><section className="section-heading"><div><p className="eyebrow">CURATED FOR YOUR GARAGE</p><h3>Good roads, close by.</h3></div></section><section className="route-grid" id="routes">{routes.map((route) => <article className={`route-card ${selected.id === route.id ? 'selected' : ''}`} key={route.id} onClick={() => setSelected(route)}><div className="card-content"><p className="route-location">{route.area} · {route.distance}</p><h4>{route.name}</h4><div className="card-bottom"><span>{route.time}</span><button className="card-save" onClick={(event) => { event.stopPropagation(); toggleSaved(route); }}>{state.savedRoutes.includes(route.name) ? '♥' : '♡'}</button></div></div></article>)}</section><section className="route-dialog"><div className="route-dialog-head"><div><p className="eyebrow">ROUTE DETAILS · {selected.area}</p><h2>{selected.name}</h2></div></div><RouteMap route={selected} /><div className="route-facts"><div><strong>{selected.distance}</strong><span>DISTANCE</span></div><div><strong>{selected.time}</strong><span>DRIVE TIME</span></div><div><strong>410 m</strong><span>ELEVATION</span></div></div></section>{notice && <div className="toast show">{notice}</div>}</main>{loginOpen && <div className="share-modal open"><div className="share-backdrop" onClick={() => setLoginOpen(false)} /><section className="share-dialog"><p className="eyebrow">WELCOME BACK</p><h2>Log<br /><i>in.</i></h2><form className="car-form" onSubmit={login}><label>EMAIL<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>PASSWORD<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="native-share">Log in</button></form></section></div>}</div>;
}
