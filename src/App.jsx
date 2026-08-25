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
  const mapNode = useRef(null);
  useEffect(() => {
    const map = L.map(mapNode.current, { scrollWheelZoom: false }).fitBounds(route.points, { padding: [24, 24] });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    L.polyline(route.points, { color: '#e36f4f', weight: 4 }).addTo(map);
    route.points.forEach((point) => L.circleMarker(point, { radius: 7, color: '#f2efe9', weight: 2, fillColor: '#252a23', fillOpacity: 1 }).addTo(map));
    return () => map.remove();
  }, [route]);
  return <div ref={mapNode} className="route-map" aria-label={`Map of ${route.name}`} />;
}

export default function App() {
  const [data, setData] = useState({ users: [], savedRoutes: [], sessionEmail: null });
  const [selectedRoute, setSelectedRoute] = useState(routes[0]);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const user = data.users.find((item) => item.email === data.sessionEmail);

  useEffect(() => { storage.load().then((state) => setData({ users: state.veloceUsers || [], savedRoutes: state.veloceSavedRoutes || [], sessionEmail: state.veloceSessionEmail || null })).catch(() => setMessage('Start server.py to connect the database.')); }, []);
  useEffect(() => { if (!running) return undefined; const timer = setInterval(() => setSeconds((value) => value + 1), 1000); return () => clearInterval(timer); }, [running]);

  async function toggleSaved(route) {
    if (!user) { setShowLogin(true); return; }
    const savedRoutes = data.savedRoutes.includes(route.name) ? data.savedRoutes.filter((name) => name !== route.name) : [...data.savedRoutes, route.name];
    setData({ ...data, savedRoutes });
    await storage.set('veloceSavedRoutes', savedRoutes);
  }

  async function login(event) {
    event.preventDefault();
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const passwordHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const account = data.users.find((item) => (item.email || '').toLowerCase() === email.trim().toLowerCase() && item.passwordHash === passwordHash);
    if (!account) { setMessage('Incorrect email or password.'); return; }
    await storage.set('veloceSessionEmail', account.email);
    setData({ ...data, sessionEmail: account.email });
    setShowLogin(false);
  }

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">V</span><span>veloce</span></div><div className="profile-mini"><div className="avatar">{user ? user.name.slice(0, 2).toUpperCase() : '-'}</div><div><strong>{user?.name || 'Not signed in'}</strong><span>{user ? 'Auckland, NZ' : 'Sign in to save your drives'}</span></div><button className="login-link" onClick={() => user ? storage.remove('veloceSessionEmail').then(() => setData({ ...data, sessionEmail: null })) : setShowLogin(true)}>{user ? 'Log out' : 'Log in'}</button></div><nav className="main-nav"><a className="nav-link active" href="#discover">✦ Discover</a><a className="nav-link" href="#routes">◷ Routes</a></nav><section className="sidebar-tracker"><p className="nav-label">SEGMENT TRACKER</p><strong>Test your lines.<br /><i>Keep it clean.</i></strong><p>Personal times only. No leaderboards, no pressure.</p><button className={running ? 'running' : ''} onClick={() => { setRunning(!running); if (running) setMessage(`Personal run saved: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`); }}>{running ? `Running ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Start safe run'}</button></section></aside>
    <main className="main-content" id="discover"><header className="topbar"><div className="breadcrumb">EXPLORE / <span>AUCKLAND</span></div></header><section className="intro-row"><div><p className="eyebrow">THURSDAY, AUGUST 20</p><h1>Take the long way<br /><em>home.</em></h1></div></section><section className="section-heading"><div><p className="eyebrow">CURATED FOR YOUR GARAGE</p><h3>Good roads, close by.</h3></div></section><section className="route-grid" id="routes">{routes.map((route) => <article className={`route-card ${selectedRoute.id === route.id ? 'selected' : ''}`} key={route.id} onClick={() => setSelectedRoute(route)}><div className="card-content"><p className="route-location">{route.area} · {route.distance}</p><h4>{route.name}</h4><div className="card-bottom"><span>{route.time}</span><button className="card-save" onClick={(event) => { event.stopPropagation(); toggleSaved(route); }}>{data.savedRoutes.includes(route.name) ? '♥' : '♡'}</button></div></div></article>)}</section><section className="route-dialog"><div className="route-dialog-head"><div><p className="eyebrow">ROUTE DETAILS · {selectedRoute.area}</p><h2>{selectedRoute.name}</h2></div><span className="route-rating">★ 4.9</span></div><RouteMap route={selectedRoute} /><div className="route-facts"><div><strong>{selectedRoute.distance}</strong><span>DISTANCE</span></div><div><strong>{selectedRoute.time}</strong><span>DRIVE TIME</span></div><div><strong>410 m</strong><span>ELEVATION</span></div></div></section>{message && <div className="toast show">{message}</div>}</main>{showLogin && <div className="share-modal open"><div className="share-backdrop" onClick={() => setShowLogin(false)} /><section className="share-dialog"><p className="eyebrow">WELCOME BACK</p><h2>Log<br /><i>in.</i></h2><form className="car-form" onSubmit={login}><label>EMAIL<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><button className="native-share">Log in</button></form></section></div>}</div>;
}
