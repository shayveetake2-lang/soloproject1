import { storage } from './src/storage.js';
import { contactCodeForUser, deliverMessageByCode, findDrivers, getDirectInbox, getUserProfile, onSessionChanged, saveMessageAddress, saveUserProfile, signIn as signInWithFirebase, signOutUser, signUpWithProfile } from './src/firebase.js';

const toast = document.querySelector('#toast');
let toastTimeout;
let savedRoutes = JSON.parse(localStorage.getItem('veloceSavedRoutes') || '[]');

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

const quickMenuButton = document.querySelector('#quickMenuButton');
const quickMenu = document.querySelector('#quickMenu');

function closeQuickMenu() {
  quickMenu.hidden = true;
  quickMenuButton.setAttribute('aria-expanded', 'false');
}

quickMenuButton.addEventListener('click', () => {
  const isOpen = !quickMenu.hidden;
  quickMenu.hidden = isOpen;
  quickMenuButton.setAttribute('aria-expanded', String(!isOpen));
});

quickMenu.addEventListener('click', (event) => {
  const action = event.target.closest('[data-menu-action]')?.dataset.menuAction;
  if (!action) {
    closeQuickMenu();
    return;
  }
  event.preventDefault();
  closeQuickMenu();
  if (!signedIn) {
    loginButton.click();
    showToast('Sign in to use that menu action');
    return;
  }
  if (action === 'saved') document.querySelector('#savedDrivesButton').click();
  if (action === 'activity') document.querySelector('#activityButton').click();
  if (action === 'drivers') findUserButton.click();
  if (action === 'messages') document.querySelector('#messagesButton').click();
});

document.addEventListener('click', (event) => {
  if (!quickMenu.hidden && !quickMenu.contains(event.target) && !quickMenuButton.contains(event.target)) closeQuickMenu();
});

document.querySelectorAll('[data-save]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!signedIn) {
      loginModal.classList.add('open');
      loginModal.setAttribute('aria-hidden', 'false');
      showToast('Sign in to save favourite routes');
      return;
    }
    const card = button.closest('[data-route-card]');
    const routeName = card?.querySelector('h4')?.innerText.replace(/\n/g, ' ') || 'Featured route';
    button.classList.toggle('saved');
    button.textContent = button.classList.contains('saved') ? '♥' : '♡';
    const nextRoutes = button.classList.contains('saved') ? [...new Set([...savedRoutes, routeName])] : savedRoutes.filter((route) => route !== routeName);
    savedRoutes.splice(0, savedRoutes.length, ...nextRoutes);
    localStorage.setItem('veloceSavedRoutes', JSON.stringify(savedRoutes));
    void storage.set('veloceSavedRoutes', savedRoutes);
    if (typeof updateSavedDrives === 'function') updateSavedDrives();
    showToast(button.classList.contains('saved') ? 'Route saved to your drives' : 'Route removed from saved drives');
  });
});

document.querySelectorAll('[data-route-card]').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('[data-route-card]').forEach((item) => item.classList.remove('selected'));
    card.classList.add('selected');
    const routeName = card.querySelector('h4').innerText.replace(/\n/g, ' ');
    const routeLocation = card.querySelector('.route-location').textContent;
    const routeModal = document.querySelector('#routeModal');
    document.querySelector('#routeTitle').innerHTML = routeName.replace(' ', ' <br /><i>') + '</i>';
    document.querySelector('.route-dialog-head .eyebrow').textContent = `ROUTE DETAILS · ${routeLocation}`;
    document.querySelector('.route-facts strong').textContent = card.dataset.routeDistance;
    document.querySelectorAll('.route-facts strong')[1].textContent = card.dataset.routeTime;
    document.querySelectorAll('.route-facts strong')[2].textContent = '—';
    routeModal.classList.add('open');
    routeModal.setAttribute('aria-hidden', 'false');
    renderRouteMap(card.dataset.routeCard);
  });
});

const shareModal = document.querySelector('#shareModal');
const shareButton = document.querySelector('.share-button');
const copyShareLink = document.querySelector('#copyShareLink');
const nativeShare = document.querySelector('#nativeShare');
const shareUrl = window.location.href;

function closeShareDialog() {
  shareModal.classList.remove('open');
  shareModal.setAttribute('aria-hidden', 'true');
}

shareButton.addEventListener('click', () => {
  shareModal.classList.add('open');
  shareModal.setAttribute('aria-hidden', 'false');
});

document.querySelectorAll('[data-close-share]').forEach((button) => {
  button.addEventListener('click', closeShareDialog);
});

copyShareLink.addEventListener('click', async () => {
  await navigator.clipboard.writeText(shareUrl);
  copyShareLink.textContent = 'Copied';
  showToast('Drive link copied to your clipboard');
  setTimeout(() => { copyShareLink.textContent = 'Copy link'; }, 1800);
});

nativeShare.addEventListener('click', async () => {
  if (navigator.share) {
    await navigator.share({ title: 'The West Coast Loop', text: 'A scenic Auckland drive on Veloce.', url: shareUrl });
  } else {
    copyShareLink.click();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeQuickMenu();
    closeShareDialog();
    closeCarDialog();
    closeSavedDialog();
    closeActivityDialog();
    closeRouteDialog();
    closeLoginDialog();
    closeUserDialog();
    closeProfileDialog();
    closeSignupDialog();
    closeCarInfoDialog();
    closeAddRouteDialog();
    closeMessageDialog();
    closeServiceDialog();
  }
});

const carModal = document.querySelector('#carModal');
const carForm = document.querySelector('#carForm');
const addCarButton = document.querySelector('#addCarButton');
const garageLink = document.querySelector('.garage-link');
const carInfoModal = document.querySelector('#carInfoModal');
const serviceModal = document.querySelector('#serviceModal');
const serviceForm = document.querySelector('#serviceForm');
const resetModal = document.querySelector('#resetModal');
const resetForm = document.querySelector('#resetForm');

function closeCarDialog() {
  carModal.classList.remove('open');
  carModal.setAttribute('aria-hidden', 'true');
}

addCarButton.addEventListener('click', () => {
  if (!signedIn) {
    loginModal.classList.add('open');
    loginModal.setAttribute('aria-hidden', 'false');
    document.querySelector('#loginEmail').focus();
    showToast('Sign in to add a car');
    return;
  }
  carModal.classList.add('open');
  carModal.setAttribute('aria-hidden', 'false');
  document.querySelector('#carModel').focus();
});

function closeCarInfoDialog() {
  carInfoModal.classList.remove('open');
  carInfoModal.setAttribute('aria-hidden', 'true');
}

garageLink.addEventListener('click', (event) => {
  event.preventDefault();
  if (!currentUser || !currentUser.car) return;
  const car = currentUser.car;
  document.querySelector('#carInfoTitle').textContent = car.model;
  document.querySelector('#carInfoSubtitle').textContent = [car.year, car.colour].filter(Boolean).join(' · ');
  document.querySelector('#carModelInfo').textContent = car.model || '—';
  document.querySelector('#carYearInfo').textContent = car.year || '—';
  document.querySelector('#carColourInfo').textContent = car.colour || '—';
  document.querySelector('#carOilKmInfo').textContent = car.oilKm || '—';
  document.querySelector('#carOdometerInfo').textContent = car.odometer || '—';
  const serviceList = document.querySelector('#serviceHistoryList');
  const nextReminder = document.querySelector('#nextServiceReminder');
  nextReminder.hidden = !car.nextService;
  if (car.nextService) nextReminder.innerHTML = `<p class="eyebrow">UP NEXT</p><strong>${car.nextService.task}</strong><span>Due at ${car.nextService.dueKm} km</span>`;
  serviceList.innerHTML = car.serviceHistory?.length ? car.serviceHistory.slice().reverse().map((service) => `<div class="service-record"><strong>${service.name || service.note}</strong><span>${service.date} · ${service.odometer || 'Odometer not recorded'} km</span><small>${service.note || ''}</small></div>`).join('') : '<span class="no-service">No service records yet.</span>';
  carInfoModal.classList.add('open');
  carInfoModal.setAttribute('aria-hidden', 'false');
});

function closeServiceDialog() {
  serviceModal.classList.remove('open');
  serviceModal.setAttribute('aria-hidden', 'true');
}

document.querySelector('#addServiceButton').addEventListener('click', () => {
  if (!currentUser?.car) return;
  document.querySelector('#serviceDate').value = new Date().toISOString().slice(0, 10);
  document.querySelector('#serviceOdometer').value = currentUser.car.odometer || '';
  document.querySelector('#serviceName').value = '';
  document.querySelector('#nextServiceTask').value = currentUser.car.nextService?.task || '';
  document.querySelector('#nextServiceKm').value = currentUser.car.nextService?.dueKm || '';
  serviceModal.classList.add('open');
  serviceModal.setAttribute('aria-hidden', 'false');
});

document.querySelectorAll('[data-close-service]').forEach((button) => button.addEventListener('click', closeServiceDialog));

serviceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  currentUser.car.serviceHistory = currentUser.car.serviceHistory || [];
  currentUser.car.serviceHistory.push({ name: document.querySelector('#serviceName').value.trim(), date: new Date(document.querySelector('#serviceDate').value).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }), odometer: document.querySelector('#serviceOdometer').value, note: document.querySelector('#serviceNote').value.trim() });
  currentUser.car.nextService = { task: document.querySelector('#nextServiceTask').value.trim(), dueKm: document.querySelector('#nextServiceKm').value };
  saveUsers();
  closeServiceDialog();
  serviceForm.reset();
  garageLink.click();
  showToast('Service record added');
});

document.querySelectorAll('[data-close-car-info]').forEach((button) => {
  button.addEventListener('click', closeCarInfoDialog);
});

const addRouteModal = document.querySelector('#addRouteModal');
const addRouteForm = document.querySelector('#addRouteForm');

function closeAddRouteDialog() {
  addRouteModal.classList.remove('open');
  addRouteModal.setAttribute('aria-hidden', 'true');
}

document.querySelector('#addRouteButton').addEventListener('click', () => {
  addRouteModal.classList.add('open');
  addRouteModal.setAttribute('aria-hidden', 'false');
  document.querySelector('#newRouteName').focus();
});

document.querySelectorAll('[data-close-add-route]').forEach((button) => {
  button.addEventListener('click', closeAddRouteDialog);
});

addRouteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.querySelector('#newRouteName').value.trim();
  const area = document.querySelector('#newRouteArea').value.trim().toUpperCase();
  const distance = document.querySelector('#newRouteDistance').value.trim();
  const time = document.querySelector('#newRouteTime').value.trim();
  const tag = document.querySelector('#newRouteTag').value.trim();
  const card = document.createElement('article');
  card.className = 'route-card';
  card.dataset.routeCard = `custom-${Date.now()}`;
  card.dataset.routeDistance = `${distance} km`;
  card.dataset.routeTime = time;
  card.innerHTML = `<div class="card-image"><img src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80" alt="Scenic road for ${name}" /><span class="distance">New route</span><button class="card-save" data-save aria-label="Save route">♡</button></div><div class="card-content"><p class="route-location">${area} · ${distance} KM</p><h4>${name}</h4><div class="card-bottom"><span>NEW</span><span>${tag}</span></div></div>`;
  document.querySelector('.route-grid').append(card);
  card.querySelector('[data-save]').addEventListener('click', (clickEvent) => {
    clickEvent.stopPropagation();
    clickEvent.currentTarget.classList.toggle('saved');
    clickEvent.currentTarget.textContent = clickEvent.currentTarget.classList.contains('saved') ? '♥' : '♡';
  });
  card.addEventListener('click', () => {
    document.querySelectorAll('[data-route-card]').forEach((item) => item.classList.remove('selected'));
    card.classList.add('selected');
    document.querySelector('#routeTitle').textContent = name;
    document.querySelector('.route-dialog-head .eyebrow').textContent = `ROUTE DETAILS · ${area}`;
    document.querySelector('.route-facts strong').textContent = `${distance} km`;
    document.querySelectorAll('.route-facts strong')[1].textContent = time;
    document.querySelectorAll('.route-facts strong')[2].textContent = '—';
    routeModal.classList.add('open');
    routeModal.setAttribute('aria-hidden', 'false');
  });
  closeAddRouteDialog();
  addRouteForm.reset();
  showToast(`${name} added to your routes`);
});

document.querySelector('#editCarButton').addEventListener('click', () => {
  closeCarInfoDialog();
  carModal.classList.add('open');
  carModal.setAttribute('aria-hidden', 'false');
  document.querySelector('#carModel').focus();
});

document.querySelectorAll('[data-close-car]').forEach((button) => {
  button.addEventListener('click', closeCarDialog);
});

carForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const model = document.querySelector('#carModel').value.trim();
  const year = document.querySelector('#carYear').value.trim();
  const colour = document.querySelector('#carColour').value.trim();
  const oilKm = document.querySelector('#carOilKm').value.trim();
  const odometer = document.querySelector('#carOdometer').value.trim();
  const details = [year, colour].filter(Boolean).join(' · ');
  garageLink.querySelector('strong').textContent = model;
  garageLink.querySelector('small').textContent = details || 'Ready for a drive';
  if (currentUser) {
    currentUser.car = { model, year, colour, oilKm, odometer };
    saveUsers();
  }
  garageEntry.hidden = false;
  garageEmpty.hidden = true;
  closeCarDialog();
  carForm.reset();
  showToast(`${model} added to your garage`);
});

const savedModal = document.querySelector('#savedModal');
const savedDrivesButton = document.querySelector('#savedDrivesButton');

function closeSavedDialog() {
  savedModal.classList.remove('open');
  savedModal.setAttribute('aria-hidden', 'true');
}

savedDrivesButton.addEventListener('click', (event) => {
  event.preventDefault();
  savedModal.classList.add('open');
  savedModal.setAttribute('aria-hidden', 'false');
});

document.querySelectorAll('[data-close-saved]').forEach((button) => {
  button.addEventListener('click', closeSavedDialog);
});

document.querySelectorAll('[data-saved-route]').forEach((route) => {
  route.addEventListener('click', () => {
    closeSavedDialog();
    const routeName = route.dataset.savedRoute;
    const matchingCard = [...document.querySelectorAll('[data-route-card]')].find((card) => card.querySelector('h4').innerText.replace(/\n/g, ' ') === routeName);
    if (matchingCard) {
      document.querySelectorAll('[data-route-card]').forEach((card) => card.classList.remove('selected'));
      matchingCard.classList.add('selected');
      matchingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToast(`${routeName} selected`);
  });
});

const activityModal = document.querySelector('#activityModal');
const activityButton = document.querySelector('#activityButton');

function closeActivityDialog() {
  activityModal.classList.remove('open');
  activityModal.setAttribute('aria-hidden', 'true');
}

activityButton.addEventListener('click', (event) => {
  event.preventDefault();
  activityModal.classList.add('open');
  activityModal.setAttribute('aria-hidden', 'false');
});

document.querySelectorAll('[data-close-activity]').forEach((button) => {
  button.addEventListener('click', closeActivityDialog);
});

document.querySelectorAll('[data-activity-route]').forEach((activity) => {
  activity.addEventListener('click', () => {
    closeActivityDialog();
    showToast(`${activity.dataset.activityRoute} activity opened`);
  });
});

const routeModal = document.querySelector('#routeModal');
const routeArrow = document.querySelector('.arrow-button');
let routeMap;

const routeMapData = {
  gorge: {
    center: [-36.934, 174.637],
    points: [[-36.851, 174.764], [-36.918, 174.658], [-36.959, 174.552], [-36.934, 174.637]],
    stops: ['Auckland', 'Piha Beach', 'Karekare Falls', 'Waitakere']
  },
  coast: {
    center: [-36.963, 175.185],
    points: [[-36.851, 174.764], [-36.727, 175.083], [-36.963, 175.185], [-37.073, 175.478]],
    stops: ['Auckland', 'Kaiaua', 'Firth of Thames', 'Thames']
  },
  mountain: {
    center: [-37.002, 175.091],
    points: [[-36.851, 174.764], [-37.002, 175.091], [-37.093, 175.154], [-37.134, 175.175]],
    stops: ['Auckland', 'Ardmore', 'Hunua', 'Clevedon']
  },
  'north-shore': {
    center: [-36.575, 174.690],
    points: [[-36.851, 174.764], [-36.729, 174.696], [-36.609, 174.677], [-36.575, 174.690]],
    stops: ['Auckland', 'Albany', 'Orewa', 'Millwater']
  },
  whangaparaoa: {
    center: [-36.611, 174.750],
    points: [[-36.851, 174.764], [-36.729, 174.696], [-36.625, 174.735], [-36.611, 174.750]],
    stops: ['Auckland', 'Albany', 'Gulf Harbour', 'Army Bay']
  }
};

function renderRouteMap(routeId = 'gorge') {
  if (!window.L) return;
  const route = routeMapData[routeId] || routeMapData.gorge;
  if (!routeMap) {
    routeMap = L.map('routeMap', { scrollWheelZoom: false, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(routeMap);
  }
  routeMap.eachLayer((layer) => {
    if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) routeMap.removeLayer(layer);
  });
  L.polyline(route.points, { color: '#e36f4f', weight: 4, opacity: 0.9 }).addTo(routeMap);
  route.points.forEach((point, index) => {
    L.circleMarker(point, { radius: 7, color: '#f2efe9', weight: 2, fillColor: '#252a23', fillOpacity: 1 })
      .bindTooltip(route.stops[index] || 'Route stop', { direction: 'top' })
      .addTo(routeMap);
  });
  routeMap.fitBounds(route.points, { padding: [24, 24] });
  requestAnimationFrame(() => routeMap.invalidateSize());
}

function closeRouteDialog() {
  routeModal.classList.remove('open');
  routeModal.setAttribute('aria-hidden', 'true');
}

routeArrow.addEventListener('click', () => {
  routeModal.classList.add('open');
  routeModal.setAttribute('aria-hidden', 'false');
  renderRouteMap();
});

document.querySelectorAll('[data-close-route]').forEach((button) => {
  button.addEventListener('click', closeRouteDialog);
});

document.querySelector('#routeStart').addEventListener('click', () => {
  closeRouteDialog();
  document.querySelector('#sidebarTimerButton').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Route ready. Start your safe segment when stationary.');
});

document.querySelector('#routeInviteForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!signedIn || !currentUser) {
    loginButton.click();
    showToast('Sign in to invite a driver');
    return;
  }
  const inviteCode = document.querySelector('#routeInviteCode').value.trim().toUpperCase();
  if (!inviteCode) return;
  const routeName = document.querySelector('#routeTitle').innerText.replace(/\s+/g, ' ').trim();
  try {
    await deliverMessageByCode({
      sender: currentUser,
      recipientCode: inviteCode,
      text: `${currentUser.name} invited you to drive ${routeName}.`
    });
    document.querySelector('#routeInviteCode').value = '';
    showToast('Drive invitation sent');
  } catch (error) {
    showToast(error.message || 'Could not send the drive invitation');
  }
});

const loginModal = document.querySelector('#loginModal');
const loginButton = document.querySelector('#loginButton');
const loginTopButton = document.querySelector('#loginTopButton');
const ownProfileButton = document.querySelector('#ownProfileButton');
const loginForm = document.querySelector('#loginForm');
const loginName = document.querySelector('#ownProfileButton');
const profileAvatar = document.querySelector('.profile-mini .avatar');
const garageEntry = document.querySelector('#garageEntry');
const garageEmpty = document.querySelector('#garageEmpty');
const storedUsers = localStorage.getItem('veloceUsers');
const users = storedUsers ? JSON.parse(storedUsers) : [];
let signedIn = false;
let currentUser = null;
let inboxRefreshTimer;

function saveUsers() {
  localStorage.setItem('veloceUsers', JSON.stringify(users));
  if (currentUser?.firebaseUid) {
    const { passwordHash, ...profile } = currentUser;
    void saveUserProfile(currentUser.firebaseUid, profile);
  }
}

function renderSavedRuns() {
  const list = document.querySelector('#savedRunsList');
  if (!list) return;
  const runs = currentUser?.savedRuns || [];
  list.innerHTML = runs.length ? runs.slice().reverse().map((run, index) => `<div class="saved-run"><strong>${run.time}</strong><span>${run.segment}</span><small>${run.date}</small><button type="button" class="delete-run" data-run-index="${runs.length - 1 - index}" aria-label="Delete saved run">×</button></div>`).join('') : '<span class="no-runs">No runs saved yet.</span>';
  list.querySelectorAll('.delete-run').forEach((button) => {
    button.addEventListener('click', () => {
      currentUser.savedRuns.splice(Number(button.dataset.runIndex), 1);
      saveUsers();
      renderSavedRuns();
      showToast('Saved run deleted');
    });
  });
}

function updateSavedDrives() {
  const list = document.querySelector('#savedList');
  const empty = document.querySelector('#savedEmpty');
  const count = document.querySelector('#savedDrivesButton b');
  list.innerHTML = '';
  savedRoutes.forEach((route, index) => {
    const item = document.createElement('button');
    item.className = 'saved-drive';
    item.dataset.savedRoute = route;
    item.innerHTML = `<span class="saved-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${route}</strong><small>Saved Auckland drive</small></span><span class="saved-arrow">↗</span>`;
    list.append(item);
  });
  empty.hidden = savedRoutes.length > 0;
  count.textContent = savedRoutes.length;
  savedDrivesButton.hidden = !signedIn || savedRoutes.length === 0;
  list.querySelectorAll('[data-saved-route]').forEach((route) => {
    route.addEventListener('click', () => {
      closeSavedDialog();
      const matchingCard = [...document.querySelectorAll('[data-route-card]')].find((card) => card.querySelector('h4').innerText.replace(/\n/g, ' ') === route.dataset.savedRoute);
      if (matchingCard) matchingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast(`${route.dataset.savedRoute} selected`);
    });
  });
}

function closeLoginDialog() {
  loginModal.classList.remove('open');
  loginModal.setAttribute('aria-hidden', 'true');
}

loginButton.addEventListener('click', () => {
  if (signedIn) {
    window.location.href = 'profile.html';
    return;
  }
  loginModal.classList.add('open');
  loginModal.setAttribute('aria-hidden', 'false');
  document.querySelector('#loginEmail').focus();
});

loginTopButton.addEventListener('click', () => loginButton.click());

ownProfileButton.addEventListener('click', () => {
  if (signedIn) {
    window.location.href = 'profile.html';
  } else {
    loginButton.click();
  }
});

document.querySelectorAll('[data-close-login]').forEach((button) => {
  button.addEventListener('click', closeLoginDialog);
});

document.querySelector('#forgotPasswordButton').addEventListener('click', () => {
  closeLoginDialog();
  resetModal.classList.add('open');
  resetModal.setAttribute('aria-hidden', 'false');
  document.querySelector('#resetIdentifier').focus();
});

function closeResetDialog() {
  resetModal.classList.remove('open');
  resetModal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('[data-close-reset]').forEach((button) => button.addEventListener('click', closeResetDialog));

resetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showToast('Password reset is managed from Firebase Authentication.');
  closeResetDialog();
  resetForm.reset();
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = loginForm.querySelector('#loginEmail').value.trim();
  const password = loginForm.querySelector('#loginPassword').value;
  try {
    const credential = await signInWithFirebase(email, password);
    const profile = await getUserProfile(credential.user.uid);
    if (!profile) throw new Error('Profile not found');
    const user = { ...profile, email: credential.user.email, firebaseUid: credential.user.uid };
    users.splice(0, users.length, user);
    localStorage.setItem('veloceUsers', JSON.stringify(users));
    signIn(user.name, user);
    closeLoginDialog();
    loginForm.reset();
    showToast('You are now signed in to Veloce');
  } catch (error) {
    showToast('Incorrect email or password');
  }
});

const signupModal = document.querySelector('#signupModal');
const signupForm = document.querySelector('#signupForm');
const createAccountTop = document.querySelector('#createAccountTop');

function closeSignupDialog() {
  signupModal.classList.remove('open');
  signupModal.setAttribute('aria-hidden', 'true');
}

function openSignupDialog() {
  if (signedIn) {
    signOut();
    return;
  }
  closeLoginDialog();
  signupModal.classList.add('open');
  signupModal.setAttribute('aria-hidden', 'false');
  document.querySelector('#signupName').focus();
}

document.querySelector('#createAccountButton').addEventListener('click', openSignupDialog);
createAccountTop.addEventListener('click', openSignupDialog);

function signIn(name, user = null) {
  signedIn = true;
  currentUser = user;
  if (user) {
    if (!user.contactCode) {
      user.contactCode = contactCodeForUser(user.firebaseUid);
      void saveUserProfile(user.firebaseUid, { contactCode: user.contactCode });
    }
    void saveMessageAddress(user);
    localStorage.setItem('veloceSessionEmail', user.email);
    void loadRemoteStorage();
    clearInterval(inboxRefreshTimer);
    inboxRefreshTimer = setInterval(() => void refreshDirectInbox(), 15000);
  }
  loginName.textContent = name;
  document.querySelector('.profile-mini span').textContent = user?.contactCode ? `Auckland, NZ · ${user.contactCode}` : 'Auckland, NZ';
  loginButton.textContent = 'Edit profile';
  loginButton.hidden = true;
  loginTopButton.hidden = true;
  profileAvatar.textContent = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  createAccountTop.textContent = 'Log out';
  if (user && user.car) {
    garageLink.querySelector('strong').textContent = user.car.model;
    garageLink.querySelector('small').textContent = [user.car.year, user.car.colour].filter(Boolean).join(' · ') || 'Ready for a drive';
    garageEntry.hidden = false;
    garageEmpty.hidden = true;
  } else {
    garageEntry.hidden = true;
    garageEmpty.hidden = false;
    garageEmpty.textContent = 'Add a car to your garage.';
  }
  renderSavedRuns();
  updateSavedDrives();
  document.querySelector('#messagesButton').hidden = false;
}

function signOut() {
  signedIn = false;
  currentUser = null;
  clearInterval(inboxRefreshTimer);
  inboxRefreshTimer = undefined;
  localStorage.removeItem('veloceSessionEmail');
  void signOutUser();
  loginName.textContent = 'Not signed in';
  document.querySelector('.profile-mini span').textContent = 'Sign in to save your drives';
  profileAvatar.textContent = '—';
  loginButton.textContent = 'Log in';
  loginButton.hidden = false;
  loginTopButton.hidden = false;
  createAccountTop.innerHTML = 'Create account <span>＋</span>';
  garageEntry.hidden = true;
  garageEmpty.hidden = false;
  garageEmpty.textContent = 'Sign in or add a car to your garage.';
  savedDrivesButton.hidden = true;
  document.querySelector('#messagesButton').hidden = true;
  renderSavedRuns();
  showToast('You have been logged out');
}

async function loadRemoteStorage() {
  try {
    const state = await storage.load();
    if (Array.isArray(state.veloceSavedRoutes)) savedRoutes.splice(0, savedRoutes.length, ...state.veloceSavedRoutes);
    else if (savedRoutes.length) await storage.set('veloceSavedRoutes', savedRoutes);
    hydrateMessagingDirectory(state);
    await refreshDirectInbox(state);
    updateSavedDrives();
  } catch (error) {
    console.warn('Firestore storage unavailable; using local data.', error);
  }
}

async function refreshDirectInbox(state) {
  if (!currentUser?.firebaseUid) return;
  const inboxState = state || await storage.load();
  const inbox = await getDirectInbox(currentUser.firebaseUid);
  await syncDirectInbox(inboxState, inbox);
}

window.addEventListener('focus', () => {
  if (signedIn) void refreshDirectInbox();
});

onSessionChanged(async (firebaseUser) => {
  if (!firebaseUser) return;
  const profile = await getUserProfile(firebaseUser.uid);
  if (!profile) return;
  const user = { ...profile, email: firebaseUser.email, firebaseUid: firebaseUser.uid };
  users.splice(0, users.length, user);
  localStorage.setItem('veloceUsers', JSON.stringify(users));
  signIn(user.name, user);
});

document.querySelectorAll('[data-close-signup]').forEach((button) => {
  button.addEventListener('click', closeSignupDialog);
});

document.querySelector('#backToLoginButton').addEventListener('click', () => {
  closeSignupDialog();
  loginModal.classList.add('open');
  loginModal.setAttribute('aria-hidden', 'false');
  document.querySelector('#loginEmail').focus();
});

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.querySelector('#signupName').value.trim();
  const username = document.querySelector('#signupUsername').value.trim().toLowerCase();
  const email = document.querySelector('#signupEmail').value.trim();
  const password = document.querySelector('#signupPassword').value;
  try {
    const { user: firebaseUser, profile } = await signUpWithProfile({ email, password, name, username });
    // Strip Firestore sentinel values (serverTimestamp) before storing in localStorage
    const { createdAt: _c, updatedAt: _u, ...safeProfile } = profile;
    const user = { ...safeProfile, firebaseUid: firebaseUser.uid, car: null, carPhotos: [], savedRuns: [] };
    await saveUserProfile(firebaseUser.uid, user);
    users.splice(0, users.length, user);
    localStorage.setItem('veloceUsers', JSON.stringify(users));
    signIn(name, user);
    closeSignupDialog();
    signupForm.reset();
    showToast(`Welcome to Veloce, ${name}`);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      showToast('That email is already registered. Try logging in.');
    } else if (error.code === 'auth/weak-password') {
      showToast('Password must be at least 6 characters.');
    } else {
      showToast('Could not create that account. Try again.');
      console.error('Signup error:', error);
    }
  }
});


const userModal = document.querySelector('#userModal');
const findUserButton = document.querySelector('#findUserButton');
const userSearch = document.querySelector('#userSearch');
const driverSearchResults = document.querySelector('#driverSearchResults');
const noUsers = document.querySelector('#noUsers');

function renderDriverResults(container, drivers, onSelect) {
  container.innerHTML = '';
  drivers.forEach((driver) => {
    const row = document.createElement('button');
    row.className = 'user-row';
    const initials = (driver.name || 'V').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
    row.innerHTML = `<span class="avatar user-avatar">${initials}</span><span><strong></strong><small></small></span><span class="follow-label">View profile</span>`;
    row.querySelector('strong').textContent = driver.name || driver.username || 'Veloce driver';
    row.querySelector('small').textContent = `${driver.username ? `@${driver.username} · ` : ''}${driver.contactCode}`;
    row.addEventListener('click', () => onSelect(driver));
    container.append(row);
  });
}

async function openProfileFromDriver(driver) {
  closeUserDialog();
  document.querySelector('#profileAvatar').textContent = (driver.name || 'V').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  document.querySelector('#profileTitle').textContent = driver.name || driver.username || 'Veloce driver';
  document.querySelector('#profileLocation').textContent = driver.location || 'Veloce community';
  document.querySelector('#profileCar').textContent = '';
  document.querySelector('#profileDrives').textContent = '—';
  document.querySelector('#profileKm').textContent = '—';
  document.querySelector('#profileRoads').innerHTML = '';

  const profileFollow = document.querySelector('#profileFollow');
  profileFollow.dataset.profile = driver.contactCode;
  profileFollow.dataset.following = 'false';
  profileFollow.innerHTML = `Message ${driver.name || 'driver'} <span>✉</span>`;
  profileFollow.onclick = () => {
    closeProfileDialog();
    openMessageInbox(driver.contactCode, driver);
  };

  document.querySelector('#profileModal').classList.add('open');
  document.querySelector('#profileModal').setAttribute('aria-hidden', 'false');

  try {
    const fullProfile = await getUserProfile(driver.uid);
    if (fullProfile) {
      if (fullProfile.car) {
        document.querySelector('#profileCar').textContent = [fullProfile.car.year, fullProfile.car.make, fullProfile.car.model].filter(Boolean).join(' ') || fullProfile.car.model || '';
      }
    }
  } catch { /* profile details are best-effort */ }
}

async function searchDrivers(searchText, container, onSelect) {
  if (!signedIn) return [];
  const drivers = (await findDrivers(searchText)).filter((driver) => driver.uid !== currentUser.firebaseUid);
  renderDriverResults(container, drivers, onSelect);
  return drivers;
}

function closeUserDialog() {
  userModal.classList.remove('open');
  userModal.setAttribute('aria-hidden', 'true');
}

findUserButton.addEventListener('click', () => {
  if (!signedIn) {
    loginButton.click();
    showToast('Sign in to find a driver');
    return;
  }
  userModal.classList.add('open');
  userModal.setAttribute('aria-hidden', 'false');
  userSearch.focus();
});

document.querySelectorAll('[data-close-user]').forEach((button) => {
  button.addEventListener('click', closeUserDialog);
});

userSearch.addEventListener('input', () => {
  const query = userSearch.value.toLowerCase().trim();
  // hide the hardcoded static rows while a live search is active
  document.querySelectorAll('#userList .user-row').forEach((user) => {
    const matches = !query || user.dataset.user.toLowerCase().includes(query);
    user.hidden = !matches;
  });
  if (!query) {
    noUsers.classList.remove('visible');
    driverSearchResults.innerHTML = '';
    return;
  }
  void searchDrivers(query, driverSearchResults, (driver) => {
    openProfileFromDriver(driver);
  }).then((drivers) => {
    const staticVisible = [...document.querySelectorAll('#userList .user-row')].some((row) => !row.hidden);
    noUsers.classList.toggle('visible', drivers.length === 0 && !staticVisible);
  }).catch(() => {
    noUsers.classList.toggle('visible', true);
  });
});

document.querySelectorAll('.user-row').forEach((user) => {
  user.addEventListener('click', () => {
    const followButton = user.querySelector('.follow-label');
    const userName = user.querySelector('.user-name').textContent;
    const isFollowing = followButton.textContent === 'Following';
    followButton.textContent = isFollowing ? 'Follow' : 'Following';
    showToast(isFollowing ? `Unfollowed ${userName}` : `Now following ${userName}`);
  });
});

const profileModal = document.querySelector('#profileModal');

function closeProfileDialog() {
  profileModal.classList.remove('open');
  profileModal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('[data-close-profile]').forEach((button) => {
  button.addEventListener('click', closeProfileDialog);
});

document.querySelector('#profileMessage').addEventListener('click', () => {
  if (!signedIn) {
    closeProfileDialog();
    loginButton.click();
    showToast('Sign in to message drivers');
    return;
  }
  const contactCode = document.querySelector('#profileFollow').dataset.profile;
  if (contactCode) {
    closeProfileDialog();
    openMessageInbox(contactCode, { contactCode, name: document.querySelector('#profileTitle').textContent });
  }
});

const messageModal = document.querySelector('#messageModal');
const messageForm = document.querySelector('#messageForm');
const messageDriverSearch = document.querySelector('#messageDriverSearch');
const messageDriverResults = document.querySelector('#messageDriverResults');
let messageRecipient = '';
let messagingFriends = [];

function contactCodeForRecipient(recipient = messageRecipient) {
  const button = document.querySelector(`#messagePeople [data-message-recipient="${recipient}"]`);
  return button?.dataset.contactCode || messagingFriends.find((friend) => friend.id === recipient)?.contactCode || recipient.toUpperCase();
}

function addFriendButton(friend) {
  if (document.querySelector(`#messagePeople [data-message-recipient="${friend.id}"]`)) return;
  const button = document.createElement('button');
  button.dataset.messageRecipient = friend.id;
  button.dataset.contactCode = friend.contactCode;
  button.innerHTML = `${friend.name} <small>${friend.location || 'Veloce driver'}</small>`;
  button.addEventListener('click', () => openMessageInbox(friend.id));
  document.querySelector('#messagePeople').append(button);
}

function hydrateMessagingDirectory(state) {
  messagingFriends = Array.isArray(state.veloceFriends) ? state.veloceFriends : [];
  messagingFriends.forEach(addFriendButton);
  const declinedRequests = new Set(state.veloceDeclinedRequests || []);
  document.querySelectorAll('.message-request').forEach((request) => {
    request.hidden = declinedRequests.has(request.dataset.request) || messagingFriends.some((friend) => friend.id === request.dataset.request);
  });
}

function renderIncomingMessage(message) {
  if (document.querySelector(`#receivedList [data-message-recipient="${message.fromCode}"]`)) return;
  const button = document.createElement('button');
  button.dataset.messageRecipient = message.fromCode;
  button.dataset.contactCode = message.fromCode;
  button.innerHTML = `<strong>${escapeHtml(message.fromName || 'Veloce driver')}</strong><span>${escapeHtml(message.text)}</span><small>${escapeHtml(message.fromCode)}</small>`;
  button.addEventListener('click', () => openMessageInbox(message.fromCode));
  document.querySelector('#receivedList').prepend(button);
}

async function syncDirectInbox(state, inbox) {
  for (const message of inbox) {
    const key = messageStorageKey(message.fromCode);
    const messages = state[key] || [];
    if (!messages.some((item) => item.deliveryId === message.id)) {
      messages.push({
        deliveryId: message.id,
        from: 'driver',
        fromCode: message.fromCode,
        toCode: message.toCode,
        text: message.text,
        time: message.sentAt ? new Date(message.sentAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
      });
      state[key] = messages;
      await storage.set(key, messages);
    }
    renderIncomingMessage(message);
  }
}

function closeMessageDialog() {
  messageModal.classList.remove('open');
  messageModal.setAttribute('aria-hidden', 'true');
}

function messageStorageKey(recipient = messageRecipient) {
  const owner = currentUser?.firebaseUid || currentUser?.email?.toLowerCase() || 'guest';
  return `veloceMessages_${encodeURIComponent(owner)}_${recipient}`;
}

function localMessageStorageKey(recipient = messageRecipient) {
  return `veloceMessages_${recipient}`;
}

async function loadMessages(recipient = messageRecipient) {
  const storageKey = messageStorageKey(recipient);
  const localMessages = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem(localMessageStorageKey(recipient)) || '[]');
  try {
    const state = await storage.load();
    const messages = state[storageKey];
    if (Array.isArray(messages)) return messages;
    if (localMessages.length) await storage.set(storageKey, localMessages);
  } catch (error) {
    console.warn('Firestore storage unavailable; using local messages.', error);
  }
  return localMessages;
}

async function renderMessages() {
  const recipient = messageRecipient;
  const list = document.querySelector('#messageList');
  list.innerHTML = '<p class="no-messages">Loading messages...</p>';
  const messages = await loadMessages(recipient);
  if (recipient !== messageRecipient) return;
  list.innerHTML = messages.length ? messages.map((message) => {
    const label = message.from === 'me' ? 'You' : 'Driver';
    const code = message.from === 'me' ? message.toCode : message.fromCode;
    return `<p class="message-bubble ${message.from === 'me' ? 'from-me' : ''}">${escapeHtml(message.text)}<small>${escapeHtml(label)} · ${escapeHtml(message.time)}${code ? ` · ${escapeHtml(code)}` : ''}</small></p>`;
  }).join('') : '<p class="no-messages">Start a conversation about a drive.</p>';
}

function openMessageInbox(recipient = '', driver = null) {
  messageRecipient = recipient;
  const profile = driver || messagingFriends.find((friend) => friend.id === recipient);
  document.querySelector('#messageTitle').innerHTML = `Chat with<br /><i>${profile?.name || 'Driver'}</i>`;
  document.querySelector('#messageRecipientCode').value = contactCodeForRecipient(recipient);
  void renderMessages();
  void refreshDirectInbox().then(() => renderMessages());
  messageModal.classList.add('open');
  messageModal.setAttribute('aria-hidden', 'false');
  document.querySelector('#messageInput').focus();
}

messageDriverSearch.addEventListener('input', () => {
  void searchDrivers(messageDriverSearch.value, messageDriverResults, (driver) => {
    messageDriverSearch.value = '';
    messageDriverResults.innerHTML = '';
    openMessageInbox(driver.contactCode, driver);
  }).catch(() => {
    messageDriverResults.innerHTML = '';
  });
});

document.querySelectorAll('#receivedList [data-message-recipient]').forEach((button) => {
  button.addEventListener('click', () => openMessageInbox(button.dataset.messageRecipient));
});

document.querySelectorAll('.message-request').forEach((request) => {
  request.querySelector('.accept-request').addEventListener('click', async () => {
    const name = request.querySelector('strong').textContent;
    const friend = {
      id: request.dataset.request,
      name,
      location: 'New friend',
      contactCode: request.dataset.contactCode
    };
    messagingFriends = [...messagingFriends.filter((item) => item.id !== friend.id), friend];
    addFriendButton(friend);
    try {
      await storage.set('veloceFriends', messagingFriends);
    } catch (error) {
      console.warn('Could not save friend request decision.', error);
      showToast('Could not save this friend yet.');
      return;
    }
    request.remove();
    openMessageInbox(request.dataset.request);
    showToast(`${name} added to your friends`);
  });
  request.querySelector('.decline-request').addEventListener('click', async () => {
    try {
      const state = await storage.load();
      const declinedRequests = [...new Set([...(state.veloceDeclinedRequests || []), request.dataset.request])];
      await storage.set('veloceDeclinedRequests', declinedRequests);
    } catch (error) {
      console.warn('Could not save declined request.', error);
      showToast('Could not decline this request yet.');
      return;
    }
    request.remove();
    showToast('Message request declined');
  });
});

document.querySelector('#messagesButton').addEventListener('click', (event) => {
  event.preventDefault();
  openMessageInbox();
});
document.querySelectorAll('[data-message-recipient]').forEach((button) => {
  button.addEventListener('click', () => openMessageInbox(button.dataset.messageRecipient));
});

document.querySelectorAll('[data-close-message]').forEach((button) => button.addEventListener('click', closeMessageDialog));

messageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.querySelector('#messageInput');
  const text = input.value.trim();
  if (!text) return;
  const recipient = messageRecipient;
  const recipientCode = document.querySelector('#messageRecipientCode').value.trim().toUpperCase() || contactCodeForRecipient(recipient);
  const storageKey = messageStorageKey(recipient);
  const messages = await loadMessages(recipient);
  messages.push({
    from: 'me',
    fromCode: currentUser.contactCode,
    toCode: recipientCode,
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  localStorage.setItem(storageKey, JSON.stringify(messages));
  try {
    await storage.set(storageKey, messages);
  } catch (error) {
    console.warn('Firestore storage unavailable; message saved locally.', error);
    showToast('Message saved locally. It will not sync until Firestore is available.');
    input.value = '';
    void renderMessages();
    return;
  }
  try {
    await deliverMessageByCode({ sender: currentUser, recipientCode, text });
  } catch (error) {
    console.warn('Could not deliver direct message.', error);
    showToast(error.message || 'Message saved, but could not be delivered.');
  }
  input.value = '';
  void renderMessages();
});

const timerButton = document.querySelector('#sidebarTimerButton');
const timerLabel = document.querySelector('#sidebarTimerLabel');
const trackerSegment = document.querySelector('#trackerSegment');
const trackerRoute = document.querySelector('#trackerRoute');
const trackerArea = document.querySelector('#trackerArea');
const routesByArea = {
  'West Auckland': ['Waitākere West Backroads', 'Huia Road Harbour Loop', 'Coatesville River Run'],
  'North Shore': ['Albany to Orewa', 'Peninsula Coastal Run', 'Army Bay Peninsula Loop'],
  'East Auckland': ['Firth of Thames Coastal Run', 'Clevedon Valley Run', 'Beachlands Coast Road'],
  'South Auckland': ['Ardmore Switchbacks', 'South Auckland Open Road', 'Waiuku Harbour Run']
};

trackerArea.addEventListener('change', () => {
  trackerRoute.innerHTML = routesByArea[trackerArea.value].map((route) => `<option>${route}</option>`).join('');
});
let timerRunning = false;
let timerSeconds = 0;
let timerInterval;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

timerButton.addEventListener('click', () => {
  timerRunning = !timerRunning;
  timerButton.classList.toggle('running', timerRunning);
  if (timerRunning) {
    timerSeconds = 0;
    timerLabel.textContent = 'Running  ' + formatTime(timerSeconds);
    timerInterval = setInterval(() => {
      timerSeconds += 1;
      timerLabel.textContent = 'Running  ' + formatTime(timerSeconds);
    }, 1000);
  } else {
    clearInterval(timerInterval);
    timerLabel.textContent = 'Save run  ' + formatTime(timerSeconds);
    if (currentUser) {
      currentUser.savedRuns = currentUser.savedRuns || [];
      currentUser.savedRuns.push({ time: formatTime(timerSeconds), segment: `${trackerRoute.value} · ${trackerSegment.value}`, date: new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }) });
      saveUsers();
      renderSavedRuns();
    }
    showToast(`Personal run saved: ${formatTime(timerSeconds)}`);
  }
});
