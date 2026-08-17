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

const cache = new Map();
const remoteCache = new Map();
const unsubs = [];
let app = null, auth = null, db = null, initialized = false, connected = false;

const ARRAY_COLLECTIONS = {
  asgard_messages: 'messages',
  asgard_games: 'games',
  asgard_achievements: 'achievements',
  asgard_achievement_awards: 'achievement_awards',
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
    mentions: Array.isArray(message?.mentions) ? message.mentions.map(String) : [],
    mentionCallsigns: Array.isArray(message?.mentionCallsigns) ? message.mentionCallsigns.map(String) : [],
    date: message?.date || new Date().toISOString()
  });
  if (!payload.text && !payload.mediaUrl) return;
  await setDoc(doc(db, 'messages', payload.id), payload, { merge:false });
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
  await setPersistence(auth, browserLocalPersistence);
  initialized = true;
  return { online:true, configured:true };
}
async function connectSession() {
  if (!auth?.currentUser) throw new Error('Usuário não autenticado.');
  const profile = await hydrate();
  // Realtime listeners are not allowed to make login fail.
  setupRealtime().catch(reportError);
  return profile;
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

async function createProduct(product) {
  const me = auth?.currentUser;
  if (!me) throw new Error('Sessão expirada.');
  const role = await currentRole();
  if (role !== 'admin') throw new Error('Somente o ADMIN pode criar produtos.');
  const id = String(product?.id || `${Date.now()}_${me.uid}`);
  const payload = cleanFirestoreObject({ ...stripInternal(product || {}), id, createdBy: product?.createdBy || me.uid, createdAt: product?.createdAt || new Date().toISOString() });
  await setDoc(doc(db, 'products', id), payload, { merge:false });
  await readCollection('asgard_products', 'products', role);
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
  await readCollection('asgard_products', 'products', role);
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
  await readCollection('asgard_products', 'products', role);
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
  await readCollection('asgard_achievements', 'achievements', role);
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
  await readCollection('asgard_achievements', 'achievements', role);
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
  const now = new Date().toISOString();

  const batch = writeBatch(db);
  batch.set(achievementRef, { completedBy, updatedAt:now }, { merge:true });

  const existingAwardsSnap = await getDocs(query(collection(db, 'achievement_awards'), where('achievementId', '==', id)));
  const existingAwardUsers = new Set();
  existingAwardsSnap.forEach(d => {
    const data = d.data() || {};
    const uid = String(data.userId || '');
    if (uid) existingAwardUsers.add(uid);
    if (uid && !selectedSet.has(uid)) batch.delete(d.ref);
  });
  for (const uid of completedBy) {
    const awardId = `${id}__${uid}`;
    batch.set(doc(db, 'achievement_awards', awardId), {
      id: awardId, achievementId:id, userId:uid, awardedAt:now, awardedBy:me.uid
    }, { merge:true });
  }

  for (const uid of newlyAwarded) {
    const profileRef = doc(db, 'profiles', uid);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) continue;
    const profile = profileSnap.data() || {};
    const existing = Array.isArray(profile.achievementNotifications) ? profile.achievementNotifications : [];
    const notification = {
      id: `achievement_${id}_${Date.now()}_${uid}`, achievementId:id,
      title: achievement.title || 'Nova conquista', description:achievement.description || '',
      awardedAt:now, awardedBy:me.uid, readAt:null
    };
    const next = [notification, ...existing.filter(n => n && n.id !== notification.id)].slice(0, 40);
    batch.set(profileRef, { achievementNotifications: next }, { merge:true });
  }

  await batch.commit();
  await readCollection('asgard_achievements', 'achievements', role);
  await readCollection('asgard_achievement_awards', 'achievement_awards', role);
  await readUsers();
  return { completedBy, newlyAwarded };
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
  await readCollection('asgard_achievements', 'achievements', role);
  await readCollection('asgard_achievement_awards', 'achievement_awards', role);
  return true;
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
  init, connectSession, readMyProfile, get, set, hasConfig, removeSession,
  signIn, register, getCurrentUser, waitForAuth, addMessage, updateChatLastRead, updateContribution,
  createProduct, updateProduct, removeProduct,
  createAchievement, updateAchievement, setAchievementRecipients, markAchievementNotificationRead, removeAchievement,
  isOnline: () => initialized
};
