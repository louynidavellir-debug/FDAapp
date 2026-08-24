/* Filhos de Asgard - Firebase Auth + Cloud Firestore adapter */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged, deleteUser
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch, updateDoc,
  arrayUnion, arrayRemove, onSnapshot, runTransaction, serverTimestamp, query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import {
  getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const cache = new Map();
const remoteCache = new Map();
const unsubs = [];
let app = null, auth = null, db = null, storage = null, initialized = false, connected = false;
let sessionRole = null;
let contributionSettings = { valor:50, pixKey:'5579996427351' };
let contributionMonths = {};

const ACHIEVEMENT_PROFILE_BACKGROUND_MAP = [
  ['lobo de asgard', 'reward-lobo-asgard'],
  ['cacador noturno', 'reward-cacador-noturno'],
  ['ceifador', 'reward-ceifador'],
  ['olho de odin', 'reward-olho-odin'],
  ['100 baixas', 'reward-100-baixas'],
  ['primeira vitoria', 'reward-primeira-vitoria'],
  ['veterano de asgard', 'reward-veterano-asgard']
];
function normalizeAchievementTitle(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ').trim().toLowerCase();
}
function profileBackgroundForAchievementTitle(title) {
  const key = normalizeAchievementTitle(title);
  return (ACHIEVEMENT_PROFILE_BACKGROUND_MAP.find(([name]) => name === key) || [])[1] || null;
}

const ARRAY_COLLECTIONS = {
  asgard_messages: 'messages',
  asgard_games: 'games',
  asgard_achievements: 'achievements',
  asgard_achievement_awards: 'achievement_awards',
  asgard_achievement_progress: 'achievement_progress',
  asgard_activity: 'activities',
  asgard_announcements: 'announcements',
  asgard_products: 'products',
  asgard_orders: 'orders',
  asgard_guest_confirmations: 'guest_confirmations'
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
  if (sessionRole) return sessionRole;
  const local = (cache.get('asgard_users') || []).find(u => u?.id === me.uid)?.role;
  if (local) return (sessionRole = local);
  const snap = await getDoc(doc(db, 'profiles', me.uid));
  return snap.exists() ? (sessionRole = (snap.data()?.role || null)) : null;
}
async function readMyProfile() {
  const me = auth?.currentUser;
  if (!me) throw new Error('Usuário não autenticado.');
  const snap = await getDoc(doc(db, 'profiles', me.uid));
  if (!snap.exists()) throw new Error('Perfil não encontrado no Firestore.');
  const profile = { id: snap.id, ...snap.data() };
  const current = cache.get('asgard_users') || [];
  const next = [profile, ...current.filter(u => u && u.id !== profile.id)];
  cache.set('asgard_users', next);
  try { localStorage.setItem('asgard_users', JSON.stringify(next)); } catch (_) {}
  emit('asgard_users');
  return profile;
}
function collectionSource(colName, role) {
  if (colName === 'guest_confirmations' && auth?.currentUser?.isAnonymous) {
    return collection(db, colName);
  }
  if (colName === 'orders' && role !== 'admin') {
    return query(collection(db, 'orders'), where('compradorId', '==', auth.currentUser.uid));
  }
  // Performance: keep high-volume realtime feeds bounded. Firestore remains source of truth,
  // while the client only subscribes to the recent window needed by the UI.
  if (colName === 'messages') return query(collection(db, colName), orderBy('date', 'desc'), limit(200));
  if (colName === 'activities') return query(collection(db, colName), orderBy('date', 'desc'), limit(80));
  return collection(db, colName);
}
function contributionSource(role) {
  if (role !== 'admin') {
    return query(collection(db, 'contributions'), where('userId', '==', auth.currentUser.uid));
  }
  return collection(db, 'contributions');
}
function mirrorContributions() {
  const value = { valor:Number(contributionSettings.valor ?? 50), pixKey:contributionSettings.pixKey || '5579996427351', months:contributionMonths || {} };
  remoteCache.set('asgard_contributions', value);
  mirror('asgard_contributions', value);
}
async function readContributions(role = null) {
  const settingsSnap = await getDoc(doc(db, 'settings', 'contributions'));
  contributionSettings = settingsSnap.exists() ? settingsSnap.data() : { valor:50, pixKey:'5579996427351' };
  const snap = await getDocs(contributionSource(role));
  const months = {};
  snap.forEach(d => {
    const r = d.data();
    if (!r.monthKey || !r.userId) return;
    if (!months[r.monthKey]) months[r.monthKey] = {};
    const { monthKey, userId, ...entry } = r;
    months[monthKey][userId] = entry;
  });
  contributionMonths = months;
  mirrorContributions();
}

async function hydrate() {
  // Only the signed-in user's own profile is critical for login.
  // Every shared/optional collection is loaded independently so one Firestore
  // rule/index problem can never lock every operator out of the app.
  const mine = await readMyProfile();
  const role = mine?.role || null;
  const jobs = [
    readUsers().catch(err => { reportError(err); return null; }),
    ...Object.entries(ARRAY_COLLECTIONS).map(([k,c]) =>
      readCollection(k,c,role).catch(err => { reportError(err); return null; })
    ),
    readContributions(role).catch(err => { reportError(err); return null; })
  ];
  await Promise.all(jobs);
  return mine;
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
async function setupRealtime(roleHint = null) {
  if (connected) return;
  connected = true;
  // Reuse the role already obtained with the authenticated profile whenever possible.
  // This avoids an extra profile read during every login.
  const role = roleHint || await currentRole();
  sessionRole = role || sessionRole;
  unsubs.push(onSnapshot(collection(db, 'profiles'), snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    remoteCache.set('asgard_users', rows);
    mirror('asgard_users', rows);
  }, reportError));
  Object.entries(ARRAY_COLLECTIONS).forEach(([k,c]) => watchCollection(k,c,role));
  // Keep contributions fully realtime without re-querying the whole collection on every change.
  // The old implementation reacted to each snapshot by calling getDocs() again, effectively
  // doubling reads and increasing the risk of quota exhaustion.
  unsubs.push(onSnapshot(doc(db, 'settings', 'contributions'), snap => {
    contributionSettings = snap.exists() ? snap.data() : { valor:50, pixKey:'5579996427351' };
    mirrorContributions();
  }, reportError));
  unsubs.push(onSnapshot(contributionSource(role), snap => {
    const months = {};
    snap.forEach(d => {
      const r = d.data() || {};
      if (!r.monthKey || !r.userId) return;
      if (!months[r.monthKey]) months[r.monthKey] = {};
      const { monthKey, userId, ...entry } = r;
      months[monthKey][userId] = entry;
    });
    contributionMonths = months;
    mirrorContributions();
  }, reportError));
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

async function updateUserRole(userId, newRole) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  if (await currentRole() !== 'admin') throw new Error('Somente ADMIN pode alterar funções.');
  const uid=String(userId||'');
  const role=String(newRole||'').toLowerCase();
  if(!uid || !['operador','admin'].includes(role)) throw new Error('Função inválida.');
  if(uid===me.uid) throw new Error('Sua própria função não pode ser alterada por este painel.');

  const ref=doc(db,'profiles',uid);
  const snap=await getDoc(ref);
  if(!snap.exists()) throw new Error('Perfil não encontrado.');
  await updateDoc(ref,{role,updatedAt:new Date().toISOString()});

  const current=cache.get('asgard_users')||[];
  const next=current.map(u=>String(u.id)===uid?{...u,role}:u);
  cache.set('asgard_users',next);
  remoteCache.set('asgard_users',next);
  mirror('asgard_users',next);
  return {userId:uid,role};
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
  if (!connected) await readContributions(role);
  return payload;
}


async function uploadChatMedia(file, messageId, onProgress = null) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Usuário não autenticado.');
  if (!storage) throw new Error('Firebase Storage não inicializado.');
  if (!(file instanceof File)) throw new Error('Arquivo inválido.');

  const mime = String(file.type || '').toLowerCase();
  const isImage = mime.startsWith('image/');
  const isVideo = mime.startsWith('video/');
  if (!isImage && !isVideo) throw new Error('Envie somente fotos ou vídeos.');

  const maxBytes = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error(isImage ? 'A imagem deve ter no máximo 10 MB.' : 'O vídeo deve ter no máximo 50 MB.');
  }

  const id = String(messageId || `${Date.now()}_${me.uid}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const originalName = String(file.name || (isImage ? 'imagem' : 'video'));
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || (isImage ? 'imagem' : 'video');
  const path = `chat-media/${me.uid}/${id}/${Date.now()}_${safeName}`;
  const task = uploadBytesResumable(storageRef(storage, path), file, {
    contentType: mime,
    customMetadata: { ownerUid: me.uid, messageId: id }
  });

  return await new Promise((resolve, reject) => {
    task.on('state_changed', snap => {
      const pct = snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
      try { if (typeof onProgress === 'function') onProgress(pct); } catch (_) {}
    }, reject, async () => {
      try {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({
          mediaUrl: url,
          mediaName: originalName,
          mimeType: mime,
          type: isImage ? 'image' : 'video',
          storagePath: path,
          size: file.size
        });
      } catch (err) { reject(err); }
    });
  });
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
    storagePath: message?.storagePath || '',
    mediaSize: Number(message?.mediaSize || 0),
    mentions: Array.isArray(message?.mentions) ? message.mentions.map(String) : [],
    mentionCallsigns: Array.isArray(message?.mentionCallsigns) ? message.mentionCallsigns.map(String) : [],
    date: message?.date || new Date().toISOString()
  });
  if (!payload.text && !payload.mediaUrl) return;
  await setDoc(doc(db, 'messages', payload.id), payload, { merge:false });
}



async function updatePresence(isOnline = true) {
  const me = auth?.currentUser;
  if (!me) return false;
  const now = new Date().toISOString();
  await setDoc(doc(db, 'profiles', me.uid), {
    online: Boolean(isOnline),
    lastSeen: now
  }, { merge:true });
  return { online:Boolean(isOnline), lastSeen:now };
}

async function updateChatLastRead(date) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Usuário não autenticado.');
  const value = String(date || new Date().toISOString());
  await setDoc(doc(db, 'profiles', me.uid), { chatLastReadAt: value }, { merge:true });
  return value;
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
  // Login only waits for the operator's own profile. Shared collections are populated
  // by Firestore realtime listeners immediately afterwards. The previous flow fetched
  // every collection with getDocs() and then fetched them again for onSnapshot(),
  // doubling initial reads and making login unnecessarily slow.
  const profile = await readMyProfile();
  sessionRole = profile?.role || null;
  setupRealtime(sessionRole).catch(reportError);
  return profile;
}
async function connectGuestSession(guestName = '') {
  const me = auth?.currentUser;
  if (!me || !me.isAnonymous) throw new Error('Sessão de convidado inválida.');
  const safeName = String(guestName || localStorage.getItem('asgard_guest_name') || '').trim().slice(0,60);
  if (!safeName) throw new Error('Informe seu nome.');
  localStorage.setItem('asgard_guest_name', safeName);

  // Convidado assina somente Jogos + confirmações de convidados. Não fazemos getDocs()
  // imediatamente antes dos listeners, evitando duplicar leituras no primeiro acesso.
  sessionRole = 'guest';
  if (!connected) {
    connected = true;
    watchCollection('asgard_games', 'games', 'guest');
    watchCollection('asgard_guest_confirmations', 'guest_confirmations', 'guest');
  }
  return { id:me.uid, name:safeName, callsign:safeName, role:'guest', isGuest:true };
}
async function signInGuest(name) {
  const safeName = String(name || '').trim().replace(/\s+/g,' ').slice(0,60);
  if (safeName.length < 2) throw new Error('Informe um nome válido.');
  const cred = await signInAnonymously(auth);
  localStorage.setItem('asgard_guest_name', safeName);
  return { user:cred.user, profile:await connectGuestSession(safeName) };
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


async function createAnnouncement(announcement) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin') throw new Error('Somente o ADMIN pode publicar avisos.');
  const id = String(announcement?.id || `${Date.now()}_${me.uid}`);
  const payload = cleanFirestoreObject({
    id,
    text: String(announcement?.text || '').trim(),
    date: announcement?.date || new Date().toISOString(),
    createdBy: me.uid
  });
  if (!payload.text) throw new Error('Digite o aviso.');
  await setDoc(doc(db, 'announcements', id), payload, { merge:false });
  if (!connected) await readCollection('asgard_announcements', 'announcements', role);
  return payload;
}

async function updateAnnouncement(announcementId, patch) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin') throw new Error('Somente o ADMIN pode editar avisos.');
  const id = String(announcementId || '');
  const text = String(patch?.text || '').trim();
  if (!id || !text) throw new Error('Aviso inválido.');
  await setDoc(doc(db, 'announcements', id), cleanFirestoreObject({ text, updatedAt:new Date().toISOString(), updatedBy:me.uid }), { merge:true });
  if (!connected) await readCollection('asgard_announcements', 'announcements', role);
  return true;
}

async function removeAnnouncement(announcementId) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin') throw new Error('Somente o ADMIN pode excluir avisos.');
  const id = String(announcementId || '');
  if (!id) throw new Error('Aviso inválido.');
  await deleteDoc(doc(db, 'announcements', id));
  if (!connected) await readCollection('asgard_announcements', 'announcements', role);
  return true;
}

async function createProduct(product) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin') throw new Error('Somente o ADMIN pode criar produtos.');
  const id = String(product?.id || `${Date.now()}_${me.uid}`);
  const payload = cleanFirestoreObject({ ...stripInternal(product || {}), id, createdBy: product?.createdBy || me.uid, createdAt: product?.createdAt || new Date().toISOString() });
  await setDoc(doc(db, 'products', id), payload, { merge:false });
  if (!connected) await readCollection('asgard_products', 'products', role);
  return payload;
}

async function updateProduct(productId, patch) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin') throw new Error('Somente o ADMIN pode editar produtos.');
  const id = String(productId || '');
  if (!id) throw new Error('Produto inválido.');
  await setDoc(doc(db, 'products', id), cleanFirestoreObject({ ...patch, id, updatedAt:new Date().toISOString() }), { merge:true });
  if (!connected) await readCollection('asgard_products', 'products', role);
  return true;
}

async function removeProduct(productId) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin') throw new Error('Somente o ADMIN pode excluir produtos.');
  const id = String(productId || '');
  if (!id) throw new Error('Produto inválido.');
  await deleteDoc(doc(db, 'products', id));
  if (!connected) await readCollection('asgard_products', 'products', role);
  return true;
}


async function createAchievement(achievement) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin') throw new Error('Somente o ADMIN pode criar conquistas.');
  const id = String(achievement?.id || `${Date.now()}_${me.uid}`);
  const payload = cleanFirestoreObject({
    ...stripInternal(achievement || {}),
    id,
    completedBy: Array.isArray(achievement?.completedBy) ? achievement.completedBy.map(String) : [],
    createdBy: achievement?.createdBy || me.uid,
    createdAt: achievement?.createdAt || new Date().toISOString()
  });
  await setDoc(doc(db, 'achievements', id), payload, { merge:false });
  if (!connected) await readCollection('asgard_achievements', 'achievements', role);
  return payload;
}

async function updateAchievement(achievementId, patch) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin') throw new Error('Somente o ADMIN pode editar conquistas.');
  const id = String(achievementId || '');
  if (!id) throw new Error('Conquista inválida.');
  const payload = cleanFirestoreObject({ ...stripInternal(patch || {}), id, updatedAt:new Date().toISOString() });
  await setDoc(doc(db, 'achievements', id), payload, { merge:true });
  if (!connected) await readCollection('asgard_achievements', 'achievements', role);
  return true;
}

async function setAchievementRecipients(achievementId, userIds) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin') throw new Error('Somente o ADMIN pode conceder insígnias.');

  const id = String(achievementId || '');
  if (!id) throw new Error('Conquista inválida.');

  const achievementRef = doc(db, 'achievements', id);
  const achievementSnap = await getDoc(achievementRef);
  if (!achievementSnap.exists()) throw new Error('Conquista não encontrada.');

  const achievement = achievementSnap.data() || {};
  const previous = new Set((Array.isArray(achievement.completedBy) ? achievement.completedBy : []).map(String));
  const completedBy = [...new Set((Array.isArray(userIds) ? userIds : []).map(String).filter(Boolean))];
  const selectedSet = new Set(completedBy);
  const newlyAwarded = completedBy.filter(uid => !previous.has(uid));
  const revoked = [...previous].filter(uid => !selectedSet.has(uid));
  const now = new Date().toISOString();

  // V32: esta é a gravação essencial. Ela é feita sozinha para não ser
  // cancelada por permissões de coleções auxiliares.
  await setDoc(achievementRef, { completedBy, updatedAt:now }, { merge:true });

  // As escritas abaixo são complementares. Se uma regra antiga do Firestore
  // ainda bloquear achievement_awards ou profiles, a concessão principal
  // continua salva em achievements.completedBy.
  try {
    const awardBatch = writeBatch(db);
    const existingAwardsSnap = await getDocs(query(collection(db, 'achievement_awards'), where('achievementId', '==', id)));
    existingAwardsSnap.forEach(d => {
      const data = d.data() || {};
      const uid = String(data.userId || '');
      if (uid && !selectedSet.has(uid)) awardBatch.delete(d.ref);
    });
    for (const uid of completedBy) {
      const awardId = `${id}__${uid}`;
      awardBatch.set(doc(db, 'achievement_awards', awardId), {
        id:awardId, achievementId:id, userId:uid, awardedAt:now, awardedBy:me.uid
      }, { merge:true });
    }
    await awardBatch.commit();
  } catch (err) {
    console.warn('[Asgard] Espelho achievement_awards não pôde ser sincronizado:', err);
  }

  const rewardBackground = profileBackgroundForAchievementTitle(achievement.title);
  try {
    if (rewardBackground) {
      for (const uid of completedBy) {
        await setDoc(doc(db,'profiles',uid), {
          unlockedProfileBackgrounds: arrayUnion(rewardBackground),
          updatedAt:now
        }, {merge:true});
      }
      for (const uid of revoked) {
        const profileRef=doc(db,'profiles',uid);
        const profileSnap=await getDoc(profileRef);
        if(!profileSnap.exists()) continue;
        const profile=profileSnap.data()||{};
        const patch={unlockedProfileBackgrounds:arrayRemove(rewardBackground),updatedAt:now};
        if(String(profile.profileBackground||'')===rewardBackground) patch.profileBackground='asgard';
        await setDoc(profileRef,patch,{merge:true});
      }
    }

    for (const uid of newlyAwarded) {
      const profileRef=doc(db,'profiles',uid);
      const profileSnap=await getDoc(profileRef);
      if(!profileSnap.exists()) continue;
      const profile=profileSnap.data()||{};
      const existing=Array.isArray(profile.achievementNotifications)?profile.achievementNotifications:[];
      const notification={
        id:`achievement_${id}_${Date.now()}_${uid}`,
        achievementId:id,
        title:achievement.title||'Nova conquista',
        description:achievement.description||'',
        awardedAt:now,
        awardedBy:me.uid,
        readAt:null
      };
      const next=[notification,...existing.filter(n=>n&&n.id!==notification.id)].slice(0,40);
      await setDoc(profileRef,{achievementNotifications:next,updatedAt:now},{merge:true});
    }
  } catch (err) {
    console.warn('[Asgard] Recompensa/notificação auxiliar não pôde ser sincronizada:', err);
  }

  if (!connected) await readCollection('asgard_achievements', 'achievements', role);
  try { if (!connected) await readCollection('asgard_achievement_awards', 'achievement_awards', role); } catch (_) {}
  try { await readUsers(); } catch (_) {}
  return { completedBy, newlyAwarded, revoked };
}

async function markAchievementNotificationRead(notificationId) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const id = String(notificationId || '');
  if (!id) return false;
  const profileRef = doc(db, 'profiles', me.uid);
  const snap = await getDoc(profileRef);
  if (!snap.exists()) return false;
  const profile = snap.data() || {};
  const notifications = (Array.isArray(profile.achievementNotifications) ? profile.achievementNotifications : []).map(n =>
    n?.id === id ? { ...n, readAt: n.readAt || new Date().toISOString() } : n
  );
  await setDoc(profileRef, { achievementNotifications: notifications }, { merge:true });
  await readUsers();
  return true;
}

async function removeAchievement(achievementId) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin') throw new Error('Somente o ADMIN pode excluir conquistas.');
  const id = String(achievementId || '');
  if (!id) throw new Error('Conquista inválida.');
  const batch = writeBatch(db);
  batch.delete(doc(db, 'achievements', id));
  const awardsSnap = await getDocs(query(collection(db, 'achievement_awards'), where('achievementId', '==', id)));
  awardsSnap.forEach(d => batch.delete(d.ref));
  await batch.commit();
  if (!connected) await readCollection('asgard_achievements', 'achievements', role);
  if (!connected) await readCollection('asgard_achievement_awards', 'achievement_awards', role);
  return true;
}


async function appendActivity(text, type = 'general', meta = {}) {
  const me = auth?.currentUser;
  if (!me) return false;
  const value = String(text || '').trim().slice(0, 250);
  if (!value) return false;
  // Prefer the profile already held by the realtime cache. Activity logging happens
  // frequently and should not perform an extra Firestore read for every click/action.
  let profile = (cache.get('asgard_users') || []).find(u => u?.id === me.uid) || null;
  if (!profile) {
    const profileSnap = await getDoc(doc(db, 'profiles', me.uid));
    profile = profileSnap.exists() ? profileSnap.data() || {} : {};
  }
  const now = new Date().toISOString();
  const id = `${Date.now()}_${me.uid}_${Math.random().toString(36).slice(2,7)}`;
  const allowedType = ['general','auth','member','achievement','game','store','order','contribution','admin'].includes(String(type)) ? String(type) : 'general';
  const payload = cleanFirestoreObject({
    id,
    text:value,
    type:allowedType,
    date:now,
    actorUid:me.uid,
    actorCallsign:String(profile.callsign || meta.actorCallsign || 'Operador').slice(0,40),
    entityId:meta?.entityId ? String(meta.entityId).slice(0,120) : '',
    entityType:meta?.entityType ? String(meta.entityType).slice(0,40) : ''
  });
  await setDoc(doc(db, 'activities', id), payload, { merge:false });
  return payload;
}


// ===== GAMES: transactional persistence =====
// Games are long-lived shared records. Dedicated operations avoid replacing the
// whole games collection and prevent simultaneous confirmations from overwriting
// each other (last-write-wins race).
async function createGame(game) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  if (await currentRole() !== 'admin') throw new Error('Somente o ADMIN pode criar jogos.');
  const id = String(game?.id || `${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
  // Participação é ilimitada. Campos legados de capacidade são descartados para
  // impedir que versões antigas do app reintroduzam um teto de participantes.
  const gameData = { ...game };
  ['maxPlayers','maxParticipants','playerLimit','participantLimit','capacity','vagas','maxOperadores'].forEach(k => delete gameData[k]);
  const payload = cleanFirestoreObject({
    ...gameData,
    id,
    createdBy: me.uid,
    confirmed: Array.isArray(game?.confirmed) ? game.confirmed : [],
    checkedIn: Array.isArray(game?.checkedIn) ? game.checkedIn : [],
    completed: false,
    operationMonth: operationMonthKey(game),
    createdAt: game?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  await setDoc(doc(db, 'games', id), payload, { merge:false });
  return payload;
}

async function updateGame(gameId, patch) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  if (await currentRole() !== 'admin') throw new Error('Somente o ADMIN pode editar jogos.');
  const id = String(gameId || '');
  if (!id) throw new Error('Jogo inválido.');
  const safe = { ...patch };
  delete safe.id; delete safe.createdBy; delete safe.confirmed; delete safe.checkedIn; delete safe.completed;
  // Não existe capacidade máxima por jogo/operação.
  ['maxPlayers','maxParticipants','playerLimit','participantLimit','capacity','vagas','maxOperadores'].forEach(k => delete safe[k]);
  const ref = doc(db, 'games', id);
  const currentSnap = await getDoc(ref);
  if (!currentSnap.exists()) throw new Error('Jogo não encontrado.');
  const current = currentSnap.data() || {};
  if (safe.date) {
    const nextMonth = operationMonthKey({ date:safe.date });
    const currentMonth = operationMonthKey(current);
    if (nextMonth && currentMonth && nextMonth !== currentMonth && Array.isArray(current.confirmed) && current.confirmed.length) {
      throw new Error('Não é possível mover a operação para outro mês enquanto houver operadores confirmados.');
    }
    safe.operationMonth = nextMonth;
  }
  await setDoc(ref, cleanFirestoreObject({ ...safe, updatedAt:new Date().toISOString() }), { merge:true });
  return true;
}

async function removeGame(gameId) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  if (await currentRole() !== 'admin') throw new Error('Somente o ADMIN pode excluir jogos.');
  const id = String(gameId || '');
  const guestSnap = await getDocs(query(collection(db,'guest_confirmations'), where('gameId','==',id)));
  const batch = writeBatch(db);
  guestSnap.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'games', id));
  await batch.commit();
  return true;
}

function operationMonthKey(game) {
  const date = String(game?.date || '');
  const m = date.match(/^(\d{4}-\d{2})/);
  return m ? m[1] : null;
}

async function toggleGameConfirmation(gameId, guestName = '') {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const id = String(gameId || '');
  const ref = doc(db, 'games', id);

  if (me.isAnonymous) {
    const safeName = String(guestName || localStorage.getItem('asgard_guest_name') || '').trim().replace(/\s+/g,' ').slice(0,60);
    if (safeName.length < 2) throw new Error('Nome de convidado inválido.');
    const guestRef = doc(db, 'guest_confirmations', `${id}_${me.uid}`);
    return await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Jogo não encontrado.');
      const game = snap.data() || {};
      if (game.completed === true) throw new Error('Esta operação já foi concluída.');
      const confirmed = Array.isArray(game.confirmed) ? [...game.confirmed] : [];
      const checkedIn = Array.isArray(game.checkedIn) ? [...game.checkedIn] : [];
      const idx = confirmed.indexOf(me.uid);
      if (idx >= 0) {
        if (checkedIn.includes(me.uid)) throw new Error('Seu check-in já foi realizado. Solicite ao ADMIN para alterar a presença.');
        confirmed.splice(idx,1);
        tx.update(ref, { confirmed, updatedAt:new Date().toISOString() });
        tx.delete(guestRef);
        return false;
      }
      confirmed.push(me.uid);
      tx.update(ref, { confirmed, updatedAt:new Date().toISOString() });
      tx.set(guestRef, {
        id:`${id}_${me.uid}`, gameId:id, userId:me.uid, name:safeName,
        createdAt:new Date().toISOString()
      }, { merge:false });
      return true;
    });
  }

  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Jogo não encontrado.');
  const game = snap.data() || {};
  if (game.completed === true) throw new Error('Esta operação já foi concluída.');
  const confirmed = Array.isArray(game.confirmed) ? game.confirmed : [];
  const checkedIn = Array.isArray(game.checkedIn) ? game.checkedIn : [];
  const alreadyConfirmed = confirmed.includes(me.uid);
  if (alreadyConfirmed) {
    if (checkedIn.includes(me.uid)) throw new Error('Seu check-in já foi realizado. Solicite ao ADMIN para alterar a presença.');
    await updateDoc(ref, { confirmed:arrayRemove(me.uid), updatedAt:new Date().toISOString() });
    return false;
  }
  await updateDoc(ref, { confirmed:arrayUnion(me.uid), updatedAt:new Date().toISOString() });
  return true;
}

async function setGameCheckin(gameId, userId) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  if (await currentRole() !== 'admin') throw new Error('Somente o ADMIN pode fazer check-in.');
  const ref = doc(db, 'games', String(gameId || ''));
  return await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Jogo não encontrado.');
    const game = snap.data() || {};
    if (game.completed === true) throw new Error('Esta operação já foi concluída.');
    const confirmed = Array.isArray(game.confirmed) ? [...game.confirmed] : [];
    if (!confirmed.includes(userId)) throw new Error('O operador precisa confirmar presença antes do check-in.');
    const checkedIn = Array.isArray(game.checkedIn) ? [...game.checkedIn] : [];
    const idx = checkedIn.indexOf(userId);
    let checkedNow;
    if (idx >= 0) { checkedIn.splice(idx, 1); checkedNow = false; }
    else { checkedIn.push(userId); checkedNow = true; }
    tx.update(ref, { checkedIn, updatedAt:new Date().toISOString() });
    return checkedNow;
  });
}

async function setGameCompleted(gameId, completed = true) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  if (await currentRole() !== 'admin') throw new Error('Somente o ADMIN pode concluir operações.');
  await setDoc(doc(db, 'games', String(gameId || '')), {
    completed: !!completed,
    completedAt: completed ? new Date().toISOString() : null,
    completedBy: completed ? me.uid : null,
    updatedAt: new Date().toISOString()
  }, { merge:true });
  return true;
}


async function setAchievementStage(achievementId, userId, stageValue, target) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  if (await currentRole() !== 'admin') throw new Error('Somente o ADMIN pode alterar o progresso.');

  const aid=String(achievementId||''), uid=String(userId||'');
  if(!aid||!uid) throw new Error('Conquista ou operador inválido.');

  const max=Math.max(1,Number(target)||1);
  const value=Math.max(0,Math.min(max,Number(stageValue)||0));
  const now=new Date().toISOString();
  const achievementRef=doc(db,'achievements',aid);
  const snap=await getDoc(achievementRef);
  if(!snap.exists()) throw new Error('Conquista não encontrada.');

  // V31: grava o estágio manual dentro da própria conquista.
  // /achievements já é uma área administrativa consolidada nas regras antigas,
  // então o ADMIN não depende mais da permissão da coleção achievement_progress.
  await setDoc(achievementRef,{
    progressByUser:{
      [uid]:{
        value,
        target:max,
        updatedAt:now,
        updatedBy:me.uid
      }
    },
    updatedAt:now
  },{merge:true});

  return {achievementId:aid,userId:uid,stageValue:value,target:max};
}


async function updateFeaturedAchievements(ids) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const cleanIds = [...new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean))].slice(0, 3);
  await setDoc(doc(db, 'profiles', me.uid), { featuredAchievementIds: cleanIds, updatedAt:new Date().toISOString() }, { merge:true });
  const current = cache.get('asgard_users') || [];
  const next = current.map(u => String(u.id) === String(me.uid) ? { ...u, featuredAchievementIds: cleanIds } : u);
  cache.set('asgard_users', next);
  remoteCache.set('asgard_users', next);
  mirror('asgard_users', next);
  return cleanIds;
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
  init, connectSession, connectGuestSession, readMyProfile, get, set, hasConfig, removeSession,
  signIn, signInGuest, register, getCurrentUser, waitForAuth, updatePresence, addMessage, uploadChatMedia, updateChatLastRead, updateContribution, updateUserRole,
  createAnnouncement, updateAnnouncement, removeAnnouncement,
  createProduct, updateProduct, removeProduct,
  createAchievement, updateAchievement, setAchievementRecipients, setAchievementStage, markAchievementNotificationRead, removeAchievement, updateFeaturedAchievements,
  appendActivity,
  createGame, updateGame, removeGame, toggleGameConfirmation, setGameCheckin, setGameCompleted,
  isOnline: () => initialized
};
