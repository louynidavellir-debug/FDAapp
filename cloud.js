/* Filhos de Asgard - Firebase Auth + Cloud Firestore adapter */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch,
  onSnapshot, runTransaction, serverTimestamp, query, where
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const cache = new Map();
const remoteCache = new Map();
const unsubs = [];
let app = null, auth = null, db = null, storage = null, initialized = false, connected = false;

const ARRAY_COLLECTIONS = {
  asgard_messages: 'messages',
  asgard_games: 'games',
  asgard_achievements: 'achievements',
  asgard_activity: 'activities',
  asgard_announcements: 'announcements',
  asgard_products: 'products',
  asgard_orders: 'orders'
};

function cfg() { return window.ASGARD_FIREBASE_CONFIG || {}; }
function hasConfig() {
  const c = cfg();
  return Boolean(c.apiKey && c.authDomain && c.projectId && c.appId);
}
function emit(key) { window.dispatchEvent(new CustomEvent('asgard:sync', { detail: { key } })); }
function mirror(key, value) {
  cache.set(key, value);
  // localStorage is only an offline UI cache. Firestore remains the source of truth.
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  emit(key);
}
function loadLocalCache() {
  ['asgard_users', ...Object.keys(ARRAY_COLLECTIONS), 'asgard_contributions'].forEach(k => {
    try { const v = localStorage.getItem(k); if (v) cache.set(k, JSON.parse(v)); } catch (_) {}
  });
}
function callsignEmail(callsign) {
  return `${String(callsign || '').trim().toLowerCase()}@login.filhosdeasgard.app`;
}
function cleanFirestoreObject(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([k,v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out;
}
function stripInternal(obj) {
  if (!obj) return obj;
  const { _index, _cloudId, ...rest } = obj;
  return rest;
}
function stableId(item, index, key) {
  if (item?.id) return String(item.id);
  if (item?._cloudId) return String(item._cloudId);
  const basis = `${key}|${item?.date || item?.createdAt || ''}|${item?.text || ''}|${index}`;
  let h = 2166136261;
  for (let i=0;i<basis.length;i++) { h ^= basis.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `auto_${(h >>> 0).toString(36)}`;
}

async function readCollection(key, colName, role = null) {
  const snap = await getDocs(collectionSource(colName, role));
  const rows = snap.docs.map(d => ({ ...d.data(), _cloudId: d.id }))
    .sort((a,b) => colName === 'messages'
      ? String(a.date || '').localeCompare(String(b.date || ''))
      : (a._index ?? 0) - (b._index ?? 0))
    .map(stripInternal);
  remoteCache.set(key, rows);
  mirror(key, rows);
}
async function readUsers() {
  const snap = await getDocs(collection(db, 'profiles'));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a,b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  remoteCache.set('asgard_users', rows);
  mirror('asgard_users', rows);
}
async function currentRole() {
  const me = auth?.currentUser;
  if (!me) return null;
  const snap = await getDoc(doc(db, 'profiles', me.uid));
  return snap.exists() ? snap.data()?.role || null : null;
}
function collectionSource(colName, role) {
  if (colName === 'orders' && role !== 'admin') {
    return query(collection(db, 'orders'), where('compradorId', '==', auth.currentUser.uid));
  }
  return collection(db, colName);
}
function contributionSource(role) {
  if (role !== 'admin') {
    return query(collection(db, 'contributions'), where('userId', '==', auth.currentUser.uid));
  }
  return collection(db, 'contributions');
}
async function readContributions(role = null) {
  const settingsSnap = await getDoc(doc(db, 'settings', 'contributions'));
  const settings = settingsSnap.exists() ? settingsSnap.data() : { valor: 50, pixKey: '5579996427351' };
  const snap = await getDocs(contributionSource(role));
  const months = {};
  snap.forEach(d => {
    const r = d.data();
    if (!r.monthKey || !r.userId) return;
    if (!months[r.monthKey]) months[r.monthKey] = {};
    const { monthKey, userId, ...entry } = r;
    months[monthKey][userId] = entry;
  });
  const value = { valor: Number(settings.valor ?? 50), pixKey: settings.pixKey || '5579996427351', months };
  remoteCache.set('asgard_contributions', value);
  mirror('asgard_contributions', value);
}
async function hydrate() {
  // Read the signed-in user's profile first so permission-sensitive queries
  // (notably orders) can be scoped correctly for operators. Firestore rules
  // are not filters: an unscoped query would be rejected even after Auth succeeds.
  await readUsers();
  const role = await currentRole();
  await Promise.all([
    ...Object.entries(ARRAY_COLLECTIONS).map(([k,c]) => readCollection(k,c,role)),
    readContributions(role)
  ]);
}

function watchCollection(key, colName, role = null) {
  const unsub = onSnapshot(collectionSource(colName, role), snap => {
    const rows = snap.docs.map(d => ({ ...d.data(), _cloudId: d.id }))
    .sort((a,b) => colName === 'messages'
      ? String(a.date || '').localeCompare(String(b.date || ''))
      : (a._index ?? 0) - (b._index ?? 0))
    .map(stripInternal);
    remoteCache.set(key, rows);
    mirror(key, rows);
  }, reportError);
  unsubs.push(unsub);
}
async function setupRealtime() {
  if (connected) return;
  connected = true;
  const role = await currentRole();
  unsubs.push(onSnapshot(collection(db, 'profiles'), snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    remoteCache.set('asgard_users', rows);
    mirror('asgard_users', rows);
  }, reportError));
  Object.entries(ARRAY_COLLECTIONS).forEach(([k,c]) => watchCollection(k,c,role));
  unsubs.push(onSnapshot(doc(db, 'settings', 'contributions'), () => readContributions(role).catch(reportError), reportError));
  unsubs.push(onSnapshot(contributionSource(role), () => readContributions(role).catch(reportError), reportError));
}
function reportError(err) {
  console.error('[Asgard Firebase]', err);
  window.dispatchEvent(new CustomEvent('asgard:cloud-error', { detail: err }));
}

async function persistArray(key, value) {
  const colName = ARRAY_COLLECTIONS[key];
  const current = remoteCache.get(key) || [];
  const desired = Array.isArray(value) ? value : [];
  const oldMap = new Map(current.map((x,i) => [stableId(x,i,key), x]));
  const newMap = new Map(desired.map((x,i) => [stableId(x,i,key), x]));
  const batch = writeBatch(db);
  let writes = 0;
  for (const [id] of oldMap) {
    if (!newMap.has(id)) { batch.delete(doc(db,colName,id)); writes++; }
  }
  desired.forEach((item,index) => {
    const id = stableId(item,index,key);
    const old = oldMap.get(id);
    if (!old || JSON.stringify(stripInternal(old)) !== JSON.stringify(stripInternal(item))) {
      batch.set(doc(db,colName,id), cleanFirestoreObject({ ...stripInternal(item), _index:index }), { merge:false });
      writes++;
    }
  });
  if (writes) await batch.commit();
  remoteCache.set(key, desired);
  mirror(key, desired);
}

async function persistUsers(users) {
  const me = auth.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const current = remoteCache.get('asgard_users') || cache.get('asgard_users') || [];
  const mine = current.find(u => u.id === me.uid);
  const isAdmin = mine?.role === 'admin';
  const batch = writeBatch(db);
  if (isAdmin) {
    const oldIds = new Set(current.map(u => u.id));
    const newIds = new Set(users.map(u => u.id));
    for (const id of oldIds) if (!newIds.has(id)) batch.delete(doc(db,'profiles',id));
    users.forEach(u => batch.set(doc(db,'profiles',u.id), cleanFirestoreObject(u), { merge:true }));
  } else {
    const u = users.find(x => x.id === me.uid);
    if (!u) throw new Error('Perfil inválido.');
    batch.set(doc(db,'profiles',me.uid), cleanFirestoreObject(u), { merge:true });
  }
  await batch.commit();
  remoteCache.set('asgard_users', users);
  mirror('asgard_users', users);
}

async function persistContributions(data) {
  const me = auth.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const users = cache.get('asgard_users') || [];
  const isAdmin = users.find(u => u.id === me.uid)?.role === 'admin';
  const old = remoteCache.get('asgard_contributions') || { valor:50,pixKey:'5579996427351',months:{} };
  const batch = writeBatch(db);
  if (isAdmin && (old.valor !== data.valor || old.pixKey !== data.pixKey)) {
    batch.set(doc(db,'settings','contributions'), { valor:Number(data.valor ?? 50), pixKey:data.pixKey || '' }, { merge:true });
  }
  const months = data.months || {};
  const oldMonths = old.months || {};
  const allMonths = new Set([...Object.keys(oldMonths), ...Object.keys(months)]);
  for (const monthKey of allMonths) {
    const before = oldMonths[monthKey] || {};
    const after = months[monthKey] || {};
    const ids = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const userId of ids) {
      if (!isAdmin && userId !== me.uid) continue;
      const ref = doc(db,'contributions',`${monthKey}_${userId}`);
      if (!(userId in after)) batch.delete(ref);
      else if (JSON.stringify(before[userId]) !== JSON.stringify(after[userId])) {
        batch.set(ref, cleanFirestoreObject({ monthKey, userId, ...after[userId] }), { merge:false });
      }
    }
  }
  await batch.commit();
  remoteCache.set('asgard_contributions', data);
  mirror('asgard_contributions', data);
}



async function updateContribution(userId, monthKey, patch) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin' && userId !== me.uid) throw new Error('Sem permissão para alterar esta contribuição.');
  const ref = doc(db, 'contributions', `${monthKey}_${userId}`);
  const existing = await getDoc(ref);
  const base = existing.exists() ? existing.data() : { monthKey, userId, status:'Pendente', confirmedAt:null, comprovante:null };
  const payload = cleanFirestoreObject({ ...base, ...patch, monthKey, userId });
  await setDoc(ref, payload, { merge:true });
  await readContributions(role);
  return payload;
}

async function addMessage(message) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Usuário não autenticado.');
  const payload = cleanFirestoreObject({
    id: String(message?.id || `${Date.now()}_${me.uid}`),
    userId: me.uid,
    callsign: String(message?.callsign || '').trim(),
    text: String(message?.text || '').trim(),
    type: String(message?.type || 'text'),
    mediaUrl: message?.mediaUrl || '',
    mediaName: message?.mediaName || '',
    mimeType: message?.mimeType || '',
    date: message?.date || new Date().toISOString()
  });
  if (!payload.text && !payload.mediaUrl) return;
  await setDoc(doc(db, 'messages', payload.id), payload, { merge:false });
}

async function uploadChatMedia(file, kind = 'file') {
  const me = auth?.currentUser;
  if (!me) throw new Error('Usuário não autenticado.');
  if (!storage) throw new Error('Firebase Storage não inicializado.');
  const safe = String(file.name || kind).replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `chat/${me.uid}/${Date.now()}_${safe}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file, { contentType: file.type || 'application/octet-stream' });
  return await getDownloadURL(ref);
}

async function init() {
  loadLocalCache();
  if (!hasConfig()) return { online:false, configured:false };
  app = initializeApp(cfg());
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  await setPersistence(auth, browserLocalPersistence);
  initialized = true;
  return { online:true, configured:true };
}
async function connectSession() {
  if (!auth?.currentUser) throw new Error('Usuário não autenticado.');
  await hydrate();
  await setupRealtime();
}
async function signIn(callsign, password) {
  const cred = await signInWithEmailAndPassword(auth, callsignEmail(callsign), password);
  return cred.user;
}
async function register(callsign, name, password) {
  const cred = await createUserWithEmailAndPassword(auth, callsignEmail(callsign), password);
  const uid = cred.user.uid;
  try {
    await runTransaction(db, async tx => {
      const bootstrapRef = doc(db,'system','bootstrap');
      const profileRef = doc(db,'profiles',uid);
      const boot = await tx.get(bootstrapRef);
      const isFirst = !boot.exists();
      if (isFirst) tx.set(bootstrapRef, { ownerUid:uid, createdAt:new Date().toISOString() });
      tx.set(profileRef, {
        id:uid, callsign, name, role:isFirst ? 'admin' : 'operador', funcao:isFirst ? 'Comando' : 'Recruta',
        primaria:'', secundaria:'', loadout:'', avatar:'', fotoPrimaria:'', fotoSecundaria:'', fotoLoadout:'',
        createdAt:new Date().toISOString(), online:true, lastSeen:new Date().toISOString()
      });
    });
  } catch (err) {
    try { await deleteUser(cred.user); } catch (_) {}
    throw err;
  }
  return cred.user;
}
function getCurrentUser() { return auth?.currentUser || null; }
function waitForAuth() {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => { unsub(); resolve(user); });
  });
}
async function removeSession() {
  if (auth) await signOut(auth);
  localStorage.removeItem('asgard_session');
  connected = false;
  while (unsubs.length) { try { unsubs.pop()(); } catch (_) {} }
}
function get(key) {
  if (key === 'asgard_session') return auth?.currentUser ? { userId:auth.currentUser.uid } : null;
  return cache.get(key) ?? null;
}
function set(key, value) {
  if (key === 'asgard_session') return;
  // Optimistic UI cache; Firestore write follows immediately.
  mirror(key, value);
  let task;
  if (key === 'asgard_users') task = persistUsers(value);
  else if (key === 'asgard_contributions') task = persistContributions(value);
  else if (ARRAY_COLLECTIONS[key]) task = persistArray(key, value);
  else task = Promise.resolve();
  task.catch(reportError);
}

window.AsgardCloud = {
  init, connectSession, get, set, hasConfig, removeSession,
  signIn, register, getCurrentUser, waitForAuth, addMessage, uploadChatMedia, updateContribution,
  isOnline: () => initialized
};
