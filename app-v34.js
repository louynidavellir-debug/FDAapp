// ============================================================
// Filhos de Asgard Airsoft Team - PWA App
// ============================================================

(function() {
    'use strict';

    // ===== STORAGE KEYS =====
    const DB_USERS = 'asgard_users';
    const DB_MESSAGES = 'asgard_messages';
    const DB_GAMES = 'asgard_games';
    const DB_ACHIEVEMENTS = 'asgard_achievements';
    const DB_ACHIEVEMENT_AWARDS = 'asgard_achievement_awards';
    const DB_ACHIEVEMENT_PROGRESS = 'asgard_achievement_progress';
    const DB_SESSION = 'asgard_session';
    const DB_ACTIVITY = 'asgard_activity';
    const DB_ANNOUNCEMENTS = 'asgard_announcements';
    const DB_PRODUCTS = 'asgard_products';
    const DB_ORDERS = 'asgard_orders';
    const DB_CONTRIBUTIONS = 'asgard_contributions';
    const DEFAULT_WHATSAPP = '5579996427351'; // 79 99642-7351

    // ===== HELPERS =====
    function getStore(key) {
        if (window.AsgardCloud) return window.AsgardCloud.get(key);
        try { return JSON.parse(localStorage.getItem(key)) || null; }
        catch { return null; }
    }

    function setStore(key, data) {
        if (window.AsgardCloud) { window.AsgardCloud.set(key, data); return; }
        localStorage.setItem(key, JSON.stringify(data));
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function formatTime(date) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function formatDateTime(dateStr) {
        const d = new Date(dateStr);
        return formatDate(dateStr) + ' ' + formatTime(d);
    }

    // ===== INIT DATA =====
    function initData() {
        // Firestore is the source of truth. Do not create local users or passwords.
        if (!getStore(DB_MESSAGES)) setStore(DB_MESSAGES, []);
        if (!getStore(DB_GAMES)) setStore(DB_GAMES, []);
        if (!getStore(DB_ACHIEVEMENT_PROGRESS)) setStore(DB_ACHIEVEMENT_PROGRESS, []);
        if (!getStore(DB_ACHIEVEMENTS)) setStore(DB_ACHIEVEMENTS, []);
        if (!getStore(DB_ACTIVITY)) setStore(DB_ACTIVITY, []);
        if (!getStore(DB_ANNOUNCEMENTS)) setStore(DB_ANNOUNCEMENTS, [
            { id: generateId(), text: 'Bem-vindo à equipe Filhos de Asgard!', date: new Date().toISOString() }
        ]);
        if (!getStore(DB_PRODUCTS)) setStore(DB_PRODUCTS, []);
        if (!getStore(DB_ORDERS)) setStore(DB_ORDERS, []);
        if (!getStore(DB_CONTRIBUTIONS)) setStore(DB_CONTRIBUTIONS, {
            valor: 50.00,
            pixKey: 'fda.filhosdeasgard.airsoft@gmail.com',
            months: {}
        });
    }

    // Migrate existing users — ensure photo fields exist
    function migrateUserPhotos() {
        const users = getStore(DB_USERS) || [];
        let changed = false;
        users.forEach(u => {
            if (u.avatar === undefined) { u.avatar = ''; changed = true; }
            if (u.fotoPrimaria === undefined) { u.fotoPrimaria = ''; changed = true; }
            if (u.fotoSecundaria === undefined) { u.fotoSecundaria = ''; changed = true; }
            if (u.fotoLoadout === undefined) { u.fotoLoadout = ''; changed = true; }
        });
        if (changed) setStore(DB_USERS, users);
    }


    // ===== V21 PREDEFINED ACHIEVEMENT CATALOG =====
    // New achievements are created without badge artwork. ADMIN can attach the patch image later.
    const PREDEFINED_ACHIEVEMENTS_V21 = [
        { id:'rare-frequencia-asgard', title:'Frequência de Asgard', rarity:'rara', progressTarget:12, progressMetric:'validated_games', progressScope:'training', description:'Concluir 12 treinamentos em que comunicação por rádio, chamadas, confirmação e transmissão objetiva de informações sejam parte do requisito validado.' },
        { id:'rare-rastro-skadi', title:'Rastro de Skadi', rarity:'rara', progressTarget:12, progressMetric:'validated_games', progressScope:'training', description:'Concluir 12 treinamentos envolvendo movimentação tática, progressão, cobertura e deslocamento coordenado em equipe.' },
        { id:'rare-escudo-tyr', title:'Escudo de Tyr', rarity:'rara', progressTarget:12, progressMetric:'validated_games', progressScope:'training', description:'Concluir 12 treinamentos envolvendo defesa de posição, cobertura de setor e manutenção de perímetro.' },
        { id:'rare-ruptura-asgard', title:'Ruptura de Asgard', rarity:'rara', progressTarget:12, progressMetric:'validated_games', progressScope:'training', description:'Concluir 12 treinamentos envolvendo entrada, tomada de posição ou objetivo e progressão coordenada.' },

        { id:'epic-atirador-designado', title:'Atirador Designado', rarity:'epica', progressTarget:24, progressMetric:'validated_games', progressScope:'operation', description:'Atuar oficialmente como DMR ou atirador designado em 24 operações, com validação do comando em cada operação válida.' },
        { id:'epic-medico-batalha', title:'Médico de Batalha', rarity:'epica', progressTarget:24, progressMetric:'validated_games', progressScope:'operation', description:'Exercer a função de médico em 24 operações que utilizem essa mecânica, com validação do comando.' },
        { id:'epic-voz-comando', title:'Voz do Comando', rarity:'epica', progressTarget:24, progressMetric:'validated_games', progressScope:'operation', description:'Exercer função relevante de comunicação e coordenação via rádio em 24 operações, com validação do comando.' },
        { id:'epic-lider-esquadrao', title:'Líder de Esquadrão', rarity:'epica', progressTarget:24, progressMetric:'validated_games', progressScope:'operation', description:'Comandar ou liderar um esquadrão em 24 operações, com validação do comando.' },

        { id:'epic-special-juramento-asgard', title:'Juramento de Asgard', rarity:'epica', progressTarget:1, progressMetric:'team_tenure_years', progressScope:'tenure', specialClass:'Épica especial', description:'Completar 1 ano como membro dos Filhos de Asgard.' },
        { id:'epic-special-veterano-asgard', title:'Veterano de Asgard', rarity:'epica', progressTarget:2, progressMetric:'team_tenure_years', progressScope:'tenure', specialClass:'Épica especial', description:'Completar 2 anos como membro dos Filhos de Asgard.' },

        { id:'legend-einherjar', title:'Einherjar', rarity:'lendaria', progressTarget:3, progressMetric:'team_tenure_years', progressScope:'tenure', description:'Completar 3 anos como membro dos Filhos de Asgard.' },
        { id:'legend-guardiao-asgard', title:'Guardião de Asgard', rarity:'lendaria', progressTarget:4, progressMetric:'team_tenure_years', progressScope:'tenure', description:'Completar 4 anos como membro dos Filhos de Asgard.' },
        { id:'legend-sangue-odin', title:'Sangue de Odin', rarity:'lendaria', progressTarget:5, progressMetric:'team_tenure_years', progressScope:'tenure', description:'Completar 5 anos como membro dos Filhos de Asgard.' },
        { id:'legend-imortal-valhalla', title:'Imortal de Valhalla', rarity:'lendaria', progressTarget:7, progressMetric:'team_tenure_years', progressScope:'tenure', description:'Completar 7 anos como membro dos Filhos de Asgard.' }
    ];

    function normalizeCatalogTitleV21(value) {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    }

    let seededAchievementsV21 = false;
    async function seedPredefinedAchievementsV21() {
        if (seededAchievementsV21 || currentUser?.role !== 'admin') return;
        seededAchievementsV21 = true;
        try {
            const existing = getStore(DB_ACHIEVEMENTS) || [];
            const existingTitles = new Set(existing.map(a => normalizeCatalogTitleV21(a.title)));
            const missing = PREDEFINED_ACHIEVEMENTS_V21.filter(a => !existingTitles.has(normalizeCatalogTitleV21(a.title)));
            if (!missing.length) return;

            for (const template of missing) {
                const achievement = {
                    ...template,
                    badge:'',
                    completedBy:[],
                    createdBy:currentUser.id,
                    createdAt:new Date().toISOString(),
                    predefinedCatalog:'v22'
                };
                if (window.AsgardCloud?.createAchievement) await window.AsgardCloud.createAchievement(achievement);
                else {
                    const list = getStore(DB_ACHIEVEMENTS) || [];
                    list.push(achievement);
                    setStore(DB_ACHIEVEMENTS, list);
                }
            }
            showToast(`${missing.length} nova${missing.length===1?' conquista cadastrada':'s conquistas cadastradas'}.`, 'success');
        } catch (err) {
            console.error('Falha ao cadastrar catálogo V21:', err);
            seededAchievementsV21 = false;
        }
    }

    // ===== DOM ELEMENTS =====
    const $ = id => document.getElementById(id);

    // Screens
    const splashScreen = $('splash-screen');
    const authScreen = $('auth-screen');

    // ===== V17 SOUND SYSTEM =====
    const SFX={click:'./assets/sfx/ui-click.wav',confirm:'./assets/sfx/confirm.wav',message:'./assets/sfx/message.wav',error:'./assets/sfx/error.wav',login:'./assets/sfx/login.wav',unlock:'./assets/sfx/unlock.wav',achievement:'./assets/sfx/achievement.wav',ready:'./assets/sfx/ready.wav'};
    const soundState={enabled:localStorage.getItem('asgard_sfx_enabled')!=='0',volume:Math.max(0,Math.min(1,Number(localStorage.getItem('asgard_sfx_volume')??.55))),unlocked:false}; const sfxPool=new Map();
    function unlockSfx(){soundState.unlocked=true} document.addEventListener('pointerdown',unlockSfx,{once:true,passive:true});document.addEventListener('keydown',unlockSfx,{once:true});
    function playSfx(n,g=1){if(!soundState.enabled||!soundState.unlocked||!SFX[n])return;try{let b=sfxPool.get(n);if(!b){b=new Audio(SFX[n]);b.preload='auto';sfxPool.set(n,b)}let a=b.cloneNode();a.volume=Math.max(0,Math.min(1,soundState.volume*g));a.play().catch(()=>{})}catch(_){}}
    function setSfxEnabled(v){soundState.enabled=!!v;localStorage.setItem('asgard_sfx_enabled',soundState.enabled?'1':'0')}
    function setSfxVolume(v){soundState.volume=Math.max(0,Math.min(1,Number(v)||0));localStorage.setItem('asgard_sfx_volume',String(soundState.volume))}
    document.addEventListener('click',e=>{const b=e.target.closest('button,.nav-item,[role="button"]');if(b&&!b.disabled&&!b.closest('#achievement-unlock-overlay'))playSfx('click',.4)},true);


    // ===== V18 MOBILE-FIRST REFINEMENT SYSTEM =====
    const hapticState = {
        enabled: localStorage.getItem('asgard_haptics_enabled') !== '0'
    };
    function haptic(pattern=12) {
        if (!hapticState.enabled || !navigator.vibrate) return;
        try { navigator.vibrate(pattern); } catch (_) {}
    }
    function setHapticsEnabled(value) {
        hapticState.enabled = !!value;
        localStorage.setItem('asgard_haptics_enabled', hapticState.enabled ? '1' : '0');
    }

    let appSyncingV18 = false;
    function setAppSyncingV18(value, label='Sincronizando') {
        appSyncingV18 = !!value;
        document.body.classList.toggle('is-syncing-v18', appSyncingV18);
        const connection = document.querySelector('.connection-status');
        if (connection && appSyncingV18) {
            connection.classList.remove('offline');
            connection.classList.add('warning');
            const l = connection.querySelector('.connection-label');
            if (l) l.textContent = label;
        } else if (typeof updateConnectionUiV2 === 'function') {
            updateConnectionUiV2();
        }
    }

    function showPageSkeletonV18(page) {
        const target = $('page-' + page);
        if (!target || target.classList.contains('skeleton-pulse-v18')) return;
        target.classList.add('skeleton-pulse-v18');
        clearTimeout(target._skeletonTimerV18);
        target._skeletonTimerV18 = setTimeout(() => target.classList.remove('skeleton-pulse-v18'), 280);
    }

    function animateActionV18(element, type='success') {
        if (!element) return;
        element.classList.remove('action-success-v18','action-error-v18');
        void element.offsetWidth;
        element.classList.add(type === 'error' ? 'action-error-v18' : 'action-success-v18');
        setTimeout(() => element.classList.remove('action-success-v18','action-error-v18'), 520);
    }

    function enhanceImagesV18(scope=document) {
        scope.querySelectorAll('img').forEach(img => {
            if (!img.closest('#splash-screen') && !img.closest('.operator-hero-avatar')) {
                if (!img.loading) img.loading = 'lazy';
                img.decoding = 'async';
            }
        });
    }

    const lazyMutationObserverV18 = new MutationObserver(records => {
        for (const r of records) for (const n of r.addedNodes) if (n.nodeType === 1) enhanceImagesV18(n);
    });
    lazyMutationObserverV18.observe(document.documentElement, {childList:true,subtree:true});

    function updateNavBadgesV18() {
        const gamesBadge = $('games-badge');
        if (gamesBadge && currentUser && currentUser.role !== 'guest') {
            const games = getStore(DB_GAMES) || [];
            const active = games.filter(g => !g.completed && new Date(`${g.date}T${g.time||'23:59'}`) >= new Date());
            const unseenKey = `asgard_games_seen_${currentUser.id}`;
            const seenAt = Number(localStorage.getItem(unseenKey) || 0);
            const fresh = active.filter(g => {
                const t = Date.parse(g.createdAt || g.updatedAt || `${g.date}T${g.time||'00:00'}`) || 0;
                return t > seenAt;
            }).length;
            gamesBadge.textContent = fresh > 99 ? '99+' : String(fresh);
            gamesBadge.classList.toggle('hidden', fresh === 0);
        }
    }

    // ===== V16 CINEMATIC / REAL-STAGE SPLASH =====
    const splashStatus = $('splash-status');
    const splashPercent = $('splash-percent');
    const splashLoaderBar = $('splash-loader-bar');
    const splashDetail = $('splash-detail');
    const splashReady = $('splash-ready');
    let splashProgress = 8;
    let splashStartedAt = performance.now();
    let splashExitPromise = null;

    function setSplashStage(progress, status, detail) {
        splashProgress = Math.max(splashProgress, Math.min(100, Number(progress) || 0));
        if (splashStatus && status) splashStatus.textContent = status;
        if (splashDetail && detail) splashDetail.textContent = detail;
        if (splashPercent) splashPercent.textContent = `${Math.round(splashProgress).toString().padStart(2,'0')}%`;
        if (splashLoaderBar) splashLoaderBar.style.width = `${splashProgress}%`;
    }

    async function finishSplash(targetScreen, afterShow) {
        if (splashExitPromise) return splashExitPromise;
        splashExitPromise = (async () => {
            setSplashStage(100, 'SISTEMA PRONTO', 'Sincronização concluída'); playSfx('ready',.7);
            splashReady?.classList.add('visible');
            // Fast cached sessions should not be artificially delayed.
            const elapsed = performance.now() - splashStartedAt;
            const wait = elapsed < 650 ? 650 - elapsed : 120;
            await new Promise(r => setTimeout(r, wait));
            splashScreen.classList.add('fade-out');
            await new Promise(r => setTimeout(r, 360));
            showScreen(targetScreen);
            if (typeof afterShow === 'function') afterShow();
        })();
        return splashExitPromise;
    }

    function splashFailure(message) {
        setSplashStage(Math.max(splashProgress, 72), 'CONEXÃO INTERROMPIDA', message || 'Verifique sua conexão');
        splashScreen?.classList.add('splash-error');
    }
    const appScreen = $('app-screen');

    // Auth
    const loginForm = $('login-form');
    const registerForm = $('register-form');
    const guestForm = $('guest-form');
    const loginCallsign = $('login-callsign');
    const loginPin = $('login-pin');
    const regCallsign = $('reg-callsign');
    const regName = $('reg-name');
    const regPin = $('reg-pin');
    const regPinConfirm = $('reg-pin-confirm');
    const btnLogin = $('btn-login');
    const btnRegister = $('btn-register');
    const btnGuestLogin = $('btn-guest-login');
    const guestName = $('guest-name');
    const showGuest = $('show-guest');
    const showLoginFromGuest = $('show-login-from-guest');
    const showRegister = $('show-register');
    const showLogin = $('show-login');
    const authMessage = $('auth-message');

    // App
    const sidebar = $('sidebar');
    const sidebarOverlay = $('sidebar-overlay');
    const btnMenu = $('btn-menu');
    const topbarCallsign = $('topbar-callsign');
    const topbarRole = $('topbar-role');
    const pageTitle = $('page-title');
    const btnLogout = $('btn-logout');

    // Pages
    const pages = document.querySelectorAll('.page');
    const navItems = document.querySelectorAll('.nav-item');

    // Dashboard
    const statMembers = $('stat-members');
    const statOnline = $('stat-online');
    const statOnlineDetail = $('stat-online-detail');
    const profilePresence = $('profile-presence');
    const statGames = $('stat-games');
    const nextGameInfo = $('next-game-info');
    const announcements = $('announcements');
    const announcementAdminBox = $('announcement-admin-box');
    const announcementInput = $('announcement-input');
    const btnAddAnnouncement = $('btn-add-announcement');
    const recentActivity = $('recent-activity');

    // Profile
    const profileCallsign = $('profile-callsign');
    const profileRole = $('profile-role');
    const profileName = $('profile-name');
    const profileCallsignText = $('profile-callsign-text');
    const profileFuncao = $('profile-funcao');
    const profilePrimaria = $('profile-primaria');
    const profileSecundaria = $('profile-secundaria');
    const profileLoadout = $('profile-loadout');
    const profileSince = $('profile-since');
    const avatarText = $('avatar-text');
    const avatarSvg = $('avatar-svg');
    const avatarImg = $('avatar-img');
    const avatarWrapper = $('profile-avatar-wrapper');
    const avatarUploadOverlay = $('avatar-upload-overlay');
    const avatarFileInput = $('avatar-file-input');
    const eqPhotoPrimariaImg = $('eq-photo-primaria-img');
    const eqPhotoPrimariaPlaceholder = $('eq-photo-primaria-placeholder');
    const eqPhotoSecundariaImg = $('eq-photo-secundaria-img');
    const eqPhotoSecundariaPlaceholder = $('eq-photo-secundaria-placeholder');
    const eqPhotoLoadoutImg = $('eq-photo-loadout-img');
    const eqPhotoLoadoutPlaceholder = $('eq-photo-loadout-placeholder');
    const editProfileModal = $('edit-profile-modal');
    const editName = $('edit-name');
    const editFuncao = $('edit-funcao');
    const editPrimaria = $('edit-primaria');
    const editSecundaria = $('edit-secundaria');
    const editLoadout = $('edit-loadout');
    const editPhotoPrimariaInput = $('edit-photo-primaria-input');
    const editPhotoPrimariaPreview = $('edit-photo-primaria-preview');
    const editPhotoSecundariaInput = $('edit-photo-secundaria-input');
    const editPhotoSecundariaPreview = $('edit-photo-secundaria-preview');
    const editPhotoLoadoutInput = $('edit-photo-loadout-input');
    const editPhotoLoadoutPreview = $('edit-photo-loadout-preview');
    const btnEditProfile = $('btn-edit-profile');
    const btnSaveProfile = $('btn-save-profile');
    const btnCancelProfile = $('btn-cancel-profile');
    const profileCard = $('profile-card');
    const btnChangeProfileBg = $('btn-change-profile-bg');
    const profileBackgroundModal = $('profile-background-modal');
    const profileBackgroundGallery = $('profile-background-gallery');
    const profileBackgroundPreview = $('profile-background-preview');
    const btnApplyProfileBg = $('btn-apply-profile-bg');
    const btnCancelProfileBg = $('btn-cancel-profile-bg');
    const btnCloseProfileBg = $('btn-close-profile-bg');

    const PROFILE_BACKGROUNDS = [
        // Temas livres: disponíveis para qualquer operador.
        { id:'asgard', name:'Asgard', subtitle:'Ciano tático', icon:'ᚨ', category:'free' },
        { id:'nidavellir', name:'Nidavellir', subtitle:'Forja dos anões', icon:'⚒', category:'free' },
        { id:'niflheim', name:'Niflheim', subtitle:'Gelo e névoa', icon:'❄', category:'free' },
        { id:'muspelheim', name:'Muspelheim', subtitle:'Fogo e cinzas', icon:'🔥', category:'free' },
        { id:'yggdrasil', name:'Yggdrasil', subtitle:'Raízes do mundo', icon:'ᛉ', category:'free' },
        { id:'bifrost', name:'Bifrost', subtitle:'Ponte dos reinos', icon:'◈', category:'free' },
        { id:'valhalla', name:'Valhalla', subtitle:'Salão dos guerreiros', icon:'⚔', category:'free' },
        { id:'raven', name:'Corvos de Odin', subtitle:'Sombras e runas', icon:'ᚱ', category:'free' },

        // Fundos de recompensa: liberados automaticamente quando a conquista vinculada é recebida.
        { id:'reward-lobo-asgard', name:'Lobo de Asgard', subtitle:'Recompensa de conquista', icon:'🐺', category:'achievement', unlockTitle:'Lobo de Asgard' },
        { id:'reward-berserker', name:'Berserker', subtitle:'Recompensa de conquista', icon:'🪓', category:'achievement', unlockTitle:'Berserker' },
        { id:'reward-cacador-noturno', name:'Caçador Noturno', subtitle:'Recompensa de conquista', icon:'🌑', category:'achievement', unlockTitle:'Caçador Noturno' },
        { id:'reward-guardiao-dos-caidos', name:'Guardião dos Caídos', subtitle:'Recompensa de conquista', icon:'🛡', category:'achievement', unlockTitle:'Guardião dos Caídos' },
        { id:'reward-ceifador', name:'Ceifador', subtitle:'Recompensa de conquista', icon:'☠', category:'achievement', unlockTitle:'Ceifador' },
        { id:'reward-olho-odin', name:'Olho de Odin', subtitle:'Recompensa de conquista', icon:'◉', category:'achievement', unlockTitle:'Olho de Odin' },
        { id:'reward-100-baixas', name:'100 Baixas', subtitle:'Recompensa de conquista', icon:'🏅', category:'achievement', unlockTitle:'100 Baixas' },
        { id:'reward-50-operacoes', name:'50 Operações', subtitle:'Recompensa de conquista', icon:'⚔', category:'achievement', unlockTitle:'50 Operações' },
        { id:'reward-25-operacoes', name:'25 Operações', subtitle:'Recompensa de conquista', icon:'🛡', category:'achievement', unlockTitle:'25 Operações' },
        { id:'reward-voz-de-asgard', name:'Voz de Asgard', subtitle:'Recompensa de conquista', icon:'📻', category:'achievement', unlockTitle:'Voz de Asgard' },
        { id:'reward-primeira-vitoria', name:'Primeira Vitória', subtitle:'Recompensa de conquista', icon:'🏆', category:'achievement', unlockTitle:'Primeira Vitoria' },
        { id:'reward-veterano-asgard', name:'Veterano de Asgard', subtitle:'Recompensa de conquista', icon:'⚔', category:'achievement', unlockTitle:'Veterano de Asgard' }
    ];
    const PROFILE_BACKGROUND_IDS = new Set(PROFILE_BACKGROUNDS.map(bg => bg.id));
    function normalizeProfileBackground(value) {
        return PROFILE_BACKGROUND_IDS.has(String(value || '')) ? String(value) : 'asgard';
    }
    function normalizeAchievementUnlockKey(value) {
        return String(value || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .trim().toLowerCase();
    }
    function getBackgroundUnlockAchievement(bg) {
        if (!bg?.unlockTitle) return null;
        const target = normalizeAchievementUnlockKey(bg.unlockTitle);
        return (getStore(DB_ACHIEVEMENTS) || []).find(a => normalizeAchievementUnlockKey(a?.title) === target) || null;
    }
    function isProfileBackgroundUnlocked(bg, user = currentUser) {
        if (!bg || bg.category !== 'achievement') return true;
        if (!user?.id) return false;

        // Fundos de recompensa usam SOMENTE o registro ativo de concessão.
        // O documento achievement_awards é criado quando o ADMIN marca o operador como
        // concluinte e é excluído quando ele é desmarcado. Campos legados do perfil,
        // notificações, destaques e completedBy não concedem acesso à galeria.
        const achievement = getBackgroundUnlockAchievement(bg);
        if (!achievement) return false;
        const awards = getStore(DB_ACHIEVEMENT_AWARDS) || [];
        return awards.some(award =>
            String(award?.achievementId || '') === String(achievement.id || '') &&
            String(award?.userId || '') === String(user.id)
        );
    }

    function getUsableProfileBackgroundId(user = currentUser, requestedId = user?.profileBackground) {
        const bg = getProfileBackgroundMeta(requestedId);
        return isProfileBackgroundUnlocked(bg, user) ? bg.id : 'asgard';
    }
    function getProfileBackgroundMeta(id) {
        return PROFILE_BACKGROUNDS.find(bg => bg.id === normalizeProfileBackground(id)) || PROFILE_BACKGROUNDS[0];
    }

    // Espelha automaticamente o MESMO fundo visual usado no Perfil em qualquer
    // superfície do app (Dashboard, Membros etc.). Assim fundos atuais e futuros
    // não precisam ser cadastrados manualmente três vezes.
    const profileBackgroundComputedCache = new Map();
    function getComputedProfileBackgroundStyle(backgroundId) {
        const id = normalizeProfileBackground(backgroundId);
        if (profileBackgroundComputedCache.has(id)) return profileBackgroundComputedCache.get(id);

        const probe = document.createElement('div');
        probe.className = 'profile-card profile-bg-probe-v15';
        probe.dataset.profileBg = id;
        probe.setAttribute('aria-hidden', 'true');
        document.body.appendChild(probe);

        const cs = window.getComputedStyle(probe);
        const style = {
            backgroundImage: cs.backgroundImage,
            backgroundColor: cs.backgroundColor,
            backgroundPosition: cs.backgroundPosition,
            backgroundSize: cs.backgroundSize,
            backgroundRepeat: cs.backgroundRepeat
        };
        probe.remove();
        profileBackgroundComputedCache.set(id, style);
        return style;
    }

    function applyProfileBackgroundVisual(element, user) {
        if (!element || !user) return;
        const bgId = getUsableProfileBackgroundId(user, user.profileBackground);
        element.dataset.profileBg = bgId;
        const visual = getComputedProfileBackgroundStyle(bgId);
        element.style.backgroundImage = visual.backgroundImage;
        element.style.backgroundColor = visual.backgroundColor;
        element.style.backgroundPosition = visual.backgroundPosition;
        element.style.backgroundSize = visual.backgroundSize;
        element.style.backgroundRepeat = visual.backgroundRepeat;
    }

    // Temp storage for photos being edited (base64)
    let pendingAvatar = null;
    let pendingFotoPrimaria = null;
    let pendingFotoSecundaria = null;
    let pendingFotoLoadout = null;
    let pendingProfileBackground = null;
    let galleryProfileBackground = 'asgard';

    // Members
    const membersList = $('members-list');
    const memberSearch = $('member-search');
    const adminMembersActions = $('admin-members-actions');
    const btnPromoteMember = $('btn-promote-member');
    const btnRemoveMember = $('btn-remove-member');
    const memberRoleModal = $('member-role-modal');
    const memberRoleModalTitle = $('member-role-modal-title');
    const memberRolePerson = $('member-role-person');
    const btnSaveMemberRole = $('btn-save-member-role');
    const btnCancelMemberRole = $('btn-cancel-member-role');

    // Arsenal
    const arsenalGallery = $('arsenal-gallery');
    const arsenalSearch = $('arsenal-search');
    const arsenalFilter = $('arsenal-filter');
    const arsenalSummary = $('arsenal-summary');

    // Achievements
    const achievementsGrid = $('achievements-grid');
    const achievementsSummary = $('achievements-summary');
    const featuredAchievementsPanel = $('featured-achievements-panel');
    const featuredAchievementsList = $('featured-achievements-list');
    const featuredAchievementsCount = $('featured-achievements-count');
    const btnCreateAchievement = $('btn-create-achievement');
    const achievementModal = $('achievement-modal');
    const achievementModalTitle = $('achievement-modal-title');
    const achievementTitle = $('achievement-title');
    const achievementDescription = $('achievement-description');
    const achievementProgressTarget = $('achievement-progress-target');
    const achievementRarity = $('achievement-rarity');
    const achievementBadgeInput = $('achievement-badge-input');
    const achievementBadgePreview = $('achievement-badge-preview');
    const btnSaveAchievement = $('btn-save-achievement');
    const btnCancelAchievement = $('btn-cancel-achievement');
    const achievementMembersModal = $('achievement-members-modal');
    const achievementMembersTitle = $('achievement-members-title');
    const achievementMembersList = $('achievement-members-list');
    const btnSaveAchievementMembers = $('btn-save-achievement-members');
    const btnCancelAchievementMembers = $('btn-cancel-achievement-members');
    const profileAchievements = $('profile-achievements');
    const achievementNewBadge = $('achievement-new-badge');
    const achievementUnlockedModal = $('achievement-unlocked-modal');
    const achievementUnlockedBadge = $('achievement-unlocked-badge');
    const achievementUnlockedTitle = $('achievement-unlocked-title');
    const achievementUnlockedRarity = $('achievement-unlocked-rarity');
    const achievementUnlockedDescription = $('achievement-unlocked-description');
    const btnViewAchievement = $('btn-view-achievement');
    const btnCloseAchievementUnlocked = $('btn-close-achievement-unlocked');
    let activeAchievementNotification = null;
    let achievementNotificationBusy = false;

    // Chat
    const chatMessages = $('chat-messages');
    const chatInput = $('chat-input');
    const btnSendMsg = $('btn-send-msg');
    const chatBadge = $('chat-badge');
    const chatOnlineUsers = $('chat-online-users');
    const btnChatAttach = $('btn-chat-attach');
    const chatMediaInput = $('chat-media-input');
    const chatUploadStatus = $('chat-upload-status');
    const chatUploadLabel = $('chat-upload-label');
    const chatUploadPercent = $('chat-upload-percent');
    const chatUploadProgressBar = $('chat-upload-progress-bar');
    const btnChatEmoji = $('btn-chat-emoji');
    const chatEmojiPicker = $('chat-emoji-picker');
    const chatMentionSuggestions = $('chat-mention-suggestions');

    // Games
    const gamesList = $('games-list');
    const btnCreateGame = $('btn-create-game');
    const createGameModal = $('create-game-modal');
    const gameModalTitle = $('game-modal-title');
    const gameType = $('game-type');
    const gameTitle = $('game-title');
    const gameDate = $('game-date');
    const gameTime = $('game-time');
    const gameLocation = $('game-location');
    const gameDescription = $('game-description');
    const btnSaveGame = $('btn-save-game');
    const btnCancelGame = $('btn-cancel-game');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Loja
    const productsList = $('products-list');
    const productSearch = $('product-search');
    const btnCreateProduct = $('btn-create-product');
    const createProductModal = $('create-product-modal');
    const createProductNome = $('create-product-nome');
    const createProductDescricao = $('create-product-descricao');
    const createProductPreco = $('create-product-preco');
    const createProductCategoria = $('create-product-categoria');
    const createProductFotoInput = $('create-product-foto-input');
    const createProductFotoPreview = $('create-product-foto-preview');
    const btnSaveProduct = $('btn-save-product');
    const btnCancelProduct = $('btn-cancel-product');
    const editProductModal = $('edit-product-modal');
    const editProductNome = $('edit-product-nome');
    const editProductDescricao = $('edit-product-descricao');
    const editProductPreco = $('edit-product-preco');
    const editProductCategoria = $('edit-product-categoria');
    const editProductFotoInput = $('edit-product-foto-input');
    const editProductFotoPreview = $('edit-product-foto-preview');
    const btnSaveEditProduct = $('btn-save-edit-product');
    const btnCancelEditProduct = $('btn-cancel-edit-product');
    const productsEmpty = $('products-empty');
    const productFilterBtns = document.querySelectorAll('.product-filter-btn');

    // Cart
    const cartBadge = $('cart-badge');
    const cartModal = $('cart-modal');
    const cartItemsList = $('cart-items-list');
    const cartTotalEl = $('cart-total');
    const checkoutNome = $('checkout-nome');
    const checkoutEndereco = $('checkout-endereco');
    const checkoutTelefone = $('checkout-telefone');
    const checkoutObservacao = $('checkout-observacao');
    const btnWhatsappCheckout = $('btn-whatsapp-checkout');
    const btnCancelCart = $('btn-cancel-cart');
    const btnOpenCart = $('btn-open-cart');
    const cartBadgeLoja = $('cart-badge-loja');

    // Vendas
    const vendasTotalPedidos = $('vendas-total-pedidos');
    const vendasReceita = $('vendas-receita');
    const vendasPendentes = $('vendas-pendentes');
    const vendasEntregues = $('vendas-entregues');
    const vendasFilterStatus = $('vendas-filter-status');
    const vendasOrdersList = $('vendas-orders-list');

    // Painel Admin
    const adminTabs = document.querySelectorAll('.admin-tab');
    const adminPanels = document.querySelectorAll('.admin-tab-panel');
    const adminGameHistory = $('admin-game-history');
    const adminHistorySearch = $('admin-history-search');
    const adminAuditList = $('admin-audit-list');
    const adminAlertList = $('admin-alert-list');
    const adminAlertSummary = $('admin-alert-summary');
    const adminAlertBadge = $('admin-alert-badge');
    const adminAlertTabCount = $('admin-alert-tab-count');
    let adminUpdateAvailable = false;

    // Contribuição
    const contribuicaoMonth = $('contribuicao-month');
    const contribuicaoValor = $('contribuicao-valor');
    const contribuicaoPixKey = $('contribuicao-pix-key');
    const contribTotal = $('contrib-total');
    const contribPagos = $('contrib-pagos');
    const contribPendentes = $('contrib-pendentes');
    const contribAtrasados = $('contrib-atrasados');
    const contribuicaoMembers = $('contribuicao-members');
    const contribuicaoQrCanvas = $('contribuicao-qr-canvas');
    const contribuicaoQrFallback = $('contribuicao-qr-fallback');
    const btnCopyPix = $('btn-copy-pix');
    const btnEditValor = $('btn-edit-valor');
    const comprovanteFileInput = $('comprovante-file-input');
    const comprovanteViewModal = $('comprovante-view-modal');
    const comprovanteViewImg = $('comprovante-view-img');
    const btnCloseComprovanteView = $('btn-close-comprovante-view');
    let pendingComprovanteUserId = null;
    const editValorModal = $('edit-valor-modal');
    const editValorInput = $('edit-valor-input');
    const editPixInput = $('edit-pix-input');
    const btnSaveValor = $('btn-save-valor');
    const btnCancelValor = $('btn-cancel-valor');

    // Toast
    const toast = $('toast');

    // ===== STATE =====
    let currentUser = null;
    let selectedMemberId = null;
    let viewedProfileUserId = null;
    let currentFilter = 'all';
    let editingGameId = null;
    let chatPollInterval = null;
    let pendingProductPhoto = null;
    let editingProductId = null;
    let currentProductCategory = 'all';
    let cart = [];

    // ===== TOAST =====
    function showToast(message, type = 'info') {
        if (typeof type !== 'undefined') { if (type === 'error') haptic([24,35,24]); else if (type === 'success') haptic(12); }

        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    function fallbackCopyText(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast('Chave PIX copiada!', 'success');
        } catch (e) {
            showToast('Falha ao copiar. Copie manualmente.', 'error');
        }
        document.body.removeChild(ta);
    }

    // ===== AUTH MESSAGES =====
    function showAuthMessage(msg, type = 'error') {
        authMessage.textContent = msg;
        authMessage.className = `message ${type}`;
        authMessage.classList.remove('hidden');
        setTimeout(() => authMessage.classList.add('hidden'), 4000);
    }

    // ===== PIN DOTS =====
    function updatePinDots(inputId, dotsId) {
        const input = $(inputId);
        const dots = $(dotsId);
        if (!input || !dots) return;
        const spans = dots.querySelectorAll('span');
        spans.forEach((s, i) => {
            s.classList.toggle('filled', i < input.value.length);
        });
    }

    ['login-pin', 'reg-pin', 'reg-pin-confirm'].forEach(id => {
        const el = $(id);
        if (el) {
            el.addEventListener('input', () => {
                const dotsId = id + '-dots';
                updatePinDots(id, dotsId);
            });
            // Only allow digits
            el.addEventListener('keypress', (e) => {
                if (!/\d/.test(e.key)) e.preventDefault();
            });
        }
    });

    // ===== SCREEN TRANSITIONS =====
    function showScreen(screenId) {
        [splashScreen, authScreen, appScreen].forEach(s => {
            if (s) s.classList.add('hidden');
        });
        const screen = $(screenId);
        if (screen) screen.classList.remove('hidden');
    }

    // ===== FLAME EFFECT ON LOGIN =====
    function createParticles() {
        const container = $('auth-particles');
        if (!container) return;
        container.innerHTML = '';

        // Flame wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'flame-wrapper';

        // Base glow
        const base = document.createElement('div');
        base.className = 'flame-base';
        wrapper.appendChild(base);

        // Generate flame tongues
        const flameConfigs = [
            // center flames
            { left: '35%', width: 80, height: 200, color: 'rgba(0, 229, 255, 0.35)', blur: 10, dur: 2.8, delay: 0, flicker: true, sway: 12 },
            { left: '42%', width: 100, height: 260, color: 'rgba(0, 200, 230, 0.30)', blur: 14, dur: 3.2, delay: 0.4, flicker: true, sway: 18 },
            { left: '50%', width: 120, height: 320, color: 'rgba(0, 229, 255, 0.40)', blur: 12, dur: 3.0, delay: 0.8, flicker: true, sway: 10 },
            { left: '58%', width: 100, height: 280, color: 'rgba(0, 200, 230, 0.28)', blur: 16, dur: 3.4, delay: 1.2, flicker: true, sway: 20 },
            { left: '65%', width: 80, height: 210, color: 'rgba(0, 229, 255, 0.32)', blur: 10, dur: 2.6, delay: 0.6, flicker: true, sway: 14 },
            // outer / wider flames
            { left: '20%', width: 140, height: 300, color: 'rgba(0, 160, 190, 0.18)', blur: 22, dur: 4.0, delay: 0.2, flicker: true, sway: 25 },
            { left: '75%', width: 140, height: 310, color: 'rgba(0, 160, 190, 0.16)', blur: 22, dur: 4.2, delay: 1.0, flicker: true, sway: 30 },
            // subtle wide background flames
            { left: '5%', width: 200, height: 250, color: 'rgba(0, 130, 160, 0.10)', blur: 35, dur: 5.0, delay: 0.5, flicker: false, sway: 0 },
            { left: '85%', width: 200, height: 240, color: 'rgba(0, 130, 160, 0.08)', blur: 35, dur: 5.5, delay: 1.5, flicker: false, sway: 0 },
            // inner bright core flames
            { left: '46%', width: 60, height: 180, color: 'rgba(0, 255, 255, 0.22)', blur: 6, dur: 2.2, delay: 0.3, flicker: true, sway: 8 },
            { left: '53%', width: 55, height: 160, color: 'rgba(0, 255, 255, 0.20)', blur: 6, dur: 2.4, delay: 0.9, flicker: true, sway: 6 },
        ];

        flameConfigs.forEach(cfg => {
            const tongue = document.createElement('div');
            tongue.className = 'flame-tongue' + (cfg.flicker ? ' flicker' : '');
            tongue.style.left = cfg.left;
            tongue.style.width = cfg.width + 'px';
            tongue.style.height = cfg.height + 'px';
            tongue.style.background = `radial-gradient(ellipse at 50% 100%, ${cfg.color} 0%, transparent 70%)`;
            tongue.style.setProperty('--flame-blur', cfg.blur + 'px');
            tongue.style.setProperty('--flame-dur', cfg.dur + 's');
            tongue.style.setProperty('--flame-delay', cfg.delay + 's');
            tongue.style.setProperty('--flame-peak-opacity', '0.6');
            tongue.style.setProperty('--sway-amount', cfg.sway + 'px');
            tongue.style.transform = 'translateX(-50%)';
            wrapper.appendChild(tongue);
        });

        // Generate embers / sparks
        for (let i = 0; i < 25; i++) {
            const ember = document.createElement('div');
            ember.className = 'flame-ember';
            ember.style.left = (25 + Math.random() * 50) + '%';
            ember.style.setProperty('--ember-dur', (3 + Math.random() * 4) + 's');
            ember.style.setProperty('--ember-delay', (Math.random() * 5) + 's');
            ember.style.setProperty('--ember-drift', (Math.random() > 0.5 ? '' : '-') + (10 + Math.random() * 30) + 'px');
            ember.style.animationDelay = ember.style.getPropertyValue('--ember-delay');
            ember.style.width = (2 + Math.random() * 2) + 'px';
            ember.style.height = ember.style.width;
            wrapper.appendChild(ember);
        }

        container.appendChild(wrapper);
    }

    // ===== AUTH LOGIC =====
    function toggleAuthForm(showRegisterForm) {
        guestForm?.classList.add('hidden');
        if (showRegisterForm) {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        } else {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        }
        authMessage.classList.add('hidden');
    }

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm(true);
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm(false);
    });

    showGuest?.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        guestForm.classList.remove('hidden');
        authMessage.classList.add('hidden');
        setTimeout(() => guestName?.focus(), 50);
    });

    showLoginFromGuest?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm(false);
    });

    btnGuestLogin?.addEventListener('click', async () => {
        const name = guestName.value.trim().replace(/\s+/g, ' ');
        if (name.length < 2) { showAuthMessage('Informe seu nome'); return; }
        if (!window.AsgardCloud?.hasConfig()) { showAuthMessage('Firebase não configurado.'); return; }
        btnGuestLogin.disabled = true;
        try {
            const result = await window.AsgardCloud.signInGuest(name);
            currentUser = result.profile;
            showToast(`Bem-vindo, ${currentUser.name}!`, 'success');
            enterApp();
        } catch (err) {
            console.error(err);
            const code = String(err?.code || '');
            const msg = code.includes('operation-not-allowed')
                ? 'Acesso de convidado ainda não foi ativado no Firebase Authentication.'
                : (err?.message || 'Não foi possível entrar como convidado.');
            showAuthMessage(msg);
        } finally { btnGuestLogin.disabled = false; }
    });

    // ===== PRESENÇA ONLINE =====
    // Um operador só é considerado online enquanto o app estiver realmente aberto/visível.
    // O heartbeat evita status preso em "online" se o navegador/app for encerrado abruptamente.
    const PRESENCE_HEARTBEAT_MS = 4 * 60 * 1000;
    const PRESENCE_STALE_MS = 6 * 60 * 1000;
    const PRESENCE_UI_REFRESH_MS = 15000;
    let presenceHeartbeat = null;
    let presenceUiTimer = null;
    let lastPresenceSentState = null;
    let lastPresenceSentAt = 0;

    function isUserOnline(user) {
        if (!user || user.online !== true || !user.lastSeen) return false;
        const seen = new Date(user.lastSeen).getTime();
        return Number.isFinite(seen) && (Date.now() - seen) <= PRESENCE_STALE_MS;
    }

    async function pushPresence(isOnline, force = false) {
        if (!currentUser || !window.AsgardCloud?.updatePresence) return;
        const desired = Boolean(isOnline);
        const now = Date.now();
        // Presence used to write every 20 s, which can consume Firestore's daily
        // write quota very quickly with several operators online. Keep immediate
        // enter/leave updates, but throttle repeated heartbeats and duplicate
        // pagehide/beforeunload events.
        const minGap = desired ? PRESENCE_HEARTBEAT_MS - 5000 : 10000;
        if (!force && lastPresenceSentState === desired && (now - lastPresenceSentAt) < minGap) return;
        try {
            const result = await window.AsgardCloud.updatePresence(desired);
            lastPresenceSentState = desired;
            lastPresenceSentAt = now;
            if (result) {
                currentUser.online = result.online;
                currentUser.lastSeen = result.lastSeen;
            }
        } catch (err) {
            console.warn('[Presence]', err);
        }
    }

    function startPresenceTracking() {
        stopPresenceTracking(false);
        const active = !document.hidden;
        pushPresence(active);
        if (active) {
            presenceHeartbeat = setInterval(() => {
                if (!document.hidden && currentUser) pushPresence(true);
            }, PRESENCE_HEARTBEAT_MS);
        }
    }

    function stopPresenceTracking(markOffline = true) {
        if (presenceHeartbeat) { clearInterval(presenceHeartbeat); presenceHeartbeat = null; }
        if (markOffline && currentUser) pushPresence(false);
    }


    function refreshPresenceViews() {
        if (!currentUser) return;
        // Recalcula o status usando lastSeen para que todos vejam a mudança
        // mesmo quando um dispositivo fecha abruptamente e não consegue gravar offline.
        renderNotificationCenterV2(); updateNavBadgesV18();
        const active = document.querySelector('.page:not(.hidden)');
        const id = active?.id || '';
        if (id === 'page-dashboard') { refreshDashboard(); refreshDashboardV2(); }
        if (id === 'page-members') refreshMembers();
        if (id === 'page-profile') { refreshProfile(); renderProfileStatsV2((getViewedProfileUser() || currentUser).id); }
        if (id === 'page-chat') refreshChat();
    }

    function startPresenceUiSync() {
        stopPresenceUiSync();
        refreshPresenceViews();
        presenceUiTimer = setInterval(refreshPresenceViews, PRESENCE_UI_REFRESH_MS);
    }

    function stopPresenceUiSync() {
        if (presenceUiTimer) { clearInterval(presenceUiTimer); presenceUiTimer = null; }
    }

    document.addEventListener('visibilitychange', () => {
        if (!currentUser) return;
        if (document.hidden) {
            stopPresenceTracking(true);
        } else {
            startPresenceTracking();
        }
    });

    window.addEventListener('pagehide', () => {
        if (currentUser) pushPresence(false);
    });
    window.addEventListener('beforeunload', () => {
        if (currentUser) pushPresence(false);
    });

    btnLogin.addEventListener('click', async () => {
        const callsign = loginCallsign.value.trim().toUpperCase();
        const pin = loginPin.value.trim();
        if (!callsign) { showAuthMessage('Insira seu callsign'); return; }
        if (pin.length < 6) { showAuthMessage('A senha deve ter pelo menos 6 caracteres'); return; }
        if (!window.AsgardCloud?.hasConfig()) { showAuthMessage('Firebase não configurado. Preencha firebase-config.js.'); return; }
        btnLogin.disabled = true;
        try {
            const authUser = await window.AsgardCloud.signIn(callsign, pin);
            const sessionProfile = await window.AsgardCloud.connectSession();
            const users = getStore(DB_USERS) || [];
            const user = sessionProfile || users.find(u => u.id === authUser.uid);
            if (!user) throw new Error('Perfil não encontrado no Firestore.');
            // Enter first. Presence/activity writes are best-effort and must never
            // turn a valid authentication into a blocked login.
            currentUser = { ...user, online:true, lastSeen:new Date().toISOString() };
            try { await pushPresence(true); } catch (presenceErr) { console.warn('Presence update skipped', presenceErr); }
            try { addActivity(`${currentUser.callsign} entrou online`); } catch (activityErr) { console.warn('Activity skipped', activityErr); }
            showToast(`Bem-vindo, ${user.callsign}!`, 'success');
            enterApp();
        } catch (err) {
            console.error(err);
            const code = err?.code || '';
            const msg = code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')
                ? 'Callsign ou senha incorretos'
                : code.includes('permission-denied')
                    ? 'Login aceito, mas o Firestore bloqueou o acesso. Atualize o app e tente novamente.'
                    : (err?.message || 'Não foi possível concluir o login');
            showAuthMessage(msg);
        } finally { btnLogin.disabled = false; }
    });

    btnRegister.addEventListener('click', async () => {
        const callsign = regCallsign.value.trim().toUpperCase();
        const name = regName.value.trim();
        const pin = regPin.value.trim();
        const pinConfirm = regPinConfirm.value.trim();
        if (!callsign) { showAuthMessage('Escolha um callsign'); return; }
        if (callsign.length < 2) { showAuthMessage('Callsign deve ter pelo menos 2 caracteres'); return; }
        if (!/^[A-Z0-9_-]+$/.test(callsign)) { showAuthMessage('Use apenas letras, números, _ ou - no callsign'); return; }
        if (!name) { showAuthMessage('Informe seu nome'); return; }
        if (pin.length < 6) { showAuthMessage('A senha deve ter pelo menos 6 caracteres'); return; }
        if (pin !== pinConfirm) { showAuthMessage('As senhas não conferem'); return; }
        if (!window.AsgardCloud?.hasConfig()) { showAuthMessage('Firebase não configurado. Preencha firebase-config.js.'); return; }
        btnRegister.disabled = true;
        try {
            const authUser = await window.AsgardCloud.register(callsign, name, pin);
            await window.AsgardCloud.connectSession();
            const users = getStore(DB_USERS) || [];
            currentUser = users.find(u => u.id === authUser.uid);
            if (!currentUser) throw new Error('Perfil criado, mas ainda não sincronizado. Tente entrar novamente.');
            currentUser.online = true;
            currentUser.lastSeen = new Date().toISOString();
            await pushPresence(true);
            addActivity(`${callsign} se registrou na equipe`);
            showToast(`Registro concluído! Bem-vindo, ${callsign}!`, 'success');
            enterApp();
        } catch (err) {
            console.error(err);
            const code = err?.code || '';
            const msg = code.includes('email-already-in-use') ? 'Este callsign já está em uso' :
                        code.includes('weak-password') ? 'Escolha uma senha mais forte' :
                        (err.message || 'Não foi possível criar a conta');
            showAuthMessage(msg);
        } finally { btnRegister.disabled = false; }
    });

    // ===== SESSION RESTORE =====
    async function checkSession() {
        if (!window.AsgardCloud?.hasConfig()) {
            splashFailure('Backend não configurado');
            await finishSplash('auth-screen', () => showAuthMessage('Backend não configurado. Abra firebase-config.js e cole a configuração do Firebase.'));
            return;
        }
        try {
            setSplashStage(48, 'SINCRONIZANDO OPERADOR', 'Validando autenticação');
            const authUser = await window.AsgardCloud.waitForAuth();
            if (authUser) {
                if (authUser.isAnonymous) {
                    const savedGuestName = localStorage.getItem('asgard_guest_name') || '';
                    if (savedGuestName) {
                        currentUser = await window.AsgardCloud.connectGuestSession(savedGuestName);
                        enterApp();
                        return;
                    }
                    await window.AsgardCloud.removeSession();
                } else {
                    setSplashStage(66, 'SINCRONIZANDO OPERADOR', 'Carregando perfil e permissões');
                    await window.AsgardCloud.connectSession();
                    setSplashStage(84, 'CARREGANDO OPERAÇÕES', 'Atualizando dados da equipe');
                    const users = getStore(DB_USERS) || [];
                    const user = users.find(u => u.id === authUser.uid);
                    if (user) {
                        currentUser = user;
                        await pushPresence(true);
                        enterApp();
                        return;
                    }
                    await window.AsgardCloud.removeSession();
                }
            }
        } catch (err) {
            console.error(err);
            splashFailure('Não foi possível restaurar a sessão');
        }
        await finishSplash('auth-screen');
    }

    // ===== ENTER APP =====
    function enterApp() {
        setSplashStage(94, 'CARREGANDO OPERAÇÕES', 'Preparando interface');
        finishSplash('app-screen', () => {
            updateUIForRole();
            updateTopbar();
            if (currentUser?.role === 'guest') {
                navigateTo('games');
                updateConnectionUiV2();
            } else {
                navigateTo('dashboard');
                startPresenceTracking();
                startPresenceUiSync();
                startChatPoll();
                updateAchievementNotificationBadge();
                renderNotificationCenterV2(); updateConnectionUiV2(); updateNavBadgesV18();
                if (currentUser?.role === 'admin') setTimeout(seedPredefinedAchievementsV21, 250);
                const restorePage = sessionStorage.getItem('asgard_restore_page') || sessionStorage.getItem('asgard_last_page');
                sessionStorage.removeItem('asgard_restore_page');
                if (restorePage && restorePage !== 'dashboard') setTimeout(() => navigateTo(restorePage, true), 60);
                setTimeout(maybeShowAchievementNotification, 350);
            }
        }, 600);
    }

    // ===== UPDATE UI FOR ROLE =====
    function updateUIForRole() {
        const isGuest = currentUser?.role === 'guest';
        document.body.classList.toggle('guest-mode', isGuest);
        navItems.forEach(item => {
            if (isGuest) item.classList.toggle('hidden', item.dataset.page !== 'games');
            else if (!item.classList.contains('admin-only')) item.classList.remove('hidden');
        });
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            if (String(currentUser.role||'').toLowerCase() === 'admin') el.classList.remove('hidden');
            else el.classList.add('hidden');
        });
        if ($('notification-bell')) $('notification-bell').classList.toggle('hidden', isGuest);
    }

    // ===== TOPBAR =====
    function updateTopbar() {
        topbarCallsign.textContent = currentUser.callsign || currentUser.name || 'Convidado';
        topbarRole.textContent = String(currentUser.role||'').toLowerCase() === 'admin' ? 'ADMIN' : currentUser.role === 'guest' ? 'CONVIDADO' : 'OPERADOR';
        topbarRole.className = `role-badge ${currentUser.role}`;
    }

    // ===== NAVIGATION =====
    let activePageName = '';
    let lastNavigationAt = 0;
    function navigateTo(page, forceRefresh = false) {
        if (currentUser?.role === 'guest' && page !== 'games') page = 'games';
        if (page === 'admin' && currentUser?.role !== 'admin') page = 'dashboard';
        const now = performance.now();
        // Ignore accidental double taps on the same sidebar item. This also avoids
        // rebuilding large lists repeatedly on slower phones.
        if (!forceRefresh && activePageName === page && (now - lastNavigationAt) < 280) {
            closeSidebar();
            return;
        }
        lastNavigationAt = now;
        const target = $('page-' + page);
        if (!target) {
            console.warn('[Navigation] Página inexistente:', page);
            showToast('Esta seção não está disponível.', 'error');
            return;
        }
        showPageSkeletonV18(page);
        pages.forEach(p => {
            p.classList.add('hidden');
            p.classList.remove('page-enter-v18');
        });
        target.classList.remove('hidden');
        requestAnimationFrame(() => target.classList.add('page-enter-v18'));
        activePageName = page;
        sessionStorage.setItem('asgard_last_page', page);
        if (page === 'games' && currentUser) {
            localStorage.setItem(`asgard_games_seen_${currentUser.id}`, String(Date.now()));
            updateNavBadgesV18();
        }

        navItems.forEach(n => {
            n.classList.toggle('active', n.dataset.page === page);
        });

        const titles = {
            dashboard: 'Dashboard',
            profile: 'Meu Perfil',
            members: 'Membros',
            arsenal: 'Arsenal',
            achievements: 'Conquistas',
            chat: 'Chat',
            games: 'Jogos',
            loja: 'Loja',
            contribuicao: 'Contribuição',
            configuracoes: 'Configurações',
            admin: 'Painel Admin'
        };
        pageTitle.textContent = titles[page] || 'Dashboard';

        // Refresh page data
        if (page === 'dashboard') { refreshDashboard(); refreshDashboardV2(); }
        if (page === 'profile') {
            const viewedUser = getViewedProfileUser();
            pageTitle.textContent = viewedProfileUserId && viewedUser && viewedUser.id !== currentUser.id
                ? `Perfil • ${viewedUser.callsign}`
                : 'Meu Perfil';
            refreshProfile();
            renderProfileStatsV2((getViewedProfileUser() || currentUser).id);
        }
        if (page === 'members') refreshMembers();
        if (page === 'arsenal') refreshArsenal();
        if (page === 'achievements') refreshAchievements();
        if (page === 'chat') {
            createChatEmbers();
            refreshChat();
            markChatAsRead().catch(err => console.error('[Chat read]', err));
        }
        if (page === 'games') refreshGames();
        if (page === 'loja') { refreshProducts(); renderMyOrdersV2(); }
        if (page === 'admin') refreshAdminPanel();
        if (page === 'contribuicao') refreshContribuicao();

        // Close mobile sidebar
        closeSidebar();
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            if (item.dataset.page === 'profile') viewedProfileUserId = null;
            if (item.dataset.page === 'chat' && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
            navigateTo(item.dataset.page);
        });
    });

    // ===== SIDEBAR MOBILE =====
    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.remove('hidden');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.add('hidden');
    }

    btnMenu.addEventListener('click', openSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // ===== LOGOUT =====
    btnLogout.addEventListener('click', async () => {
        const wasGuest = currentUser?.role === 'guest';
        stopPresenceUiSync();
        stopPresenceTracking(false);
        if (!wasGuest) {
            await pushPresence(false);
            addActivity(`${currentUser.callsign} saiu`);
        }
        await window.AsgardCloud?.removeSession();
        if (wasGuest) localStorage.removeItem('asgard_guest_name');
        currentUser = null;
        document.body.classList.remove('guest-mode');
        stopChatPoll();

        loginCallsign.value = '';
        loginPin.value = '';
        updatePinDots('login-pin', 'login-pin-dots');

        showScreen('auth-screen');
        toggleAuthForm(false);
        showToast('Logout realizado', 'info');
    });

    // ===== DASHBOARD =====
    function refreshDashboard() {
        const users = getStore(DB_USERS) || [];
        const games = getStore(DB_GAMES) || [];
        const activities = getStore(DB_ACTIVITY) || [];
        const anns = getStore(DB_ANNOUNCEMENTS) || [];

        statMembers.textContent = users.length;
        const onlineCount = users.filter(isUserOnline).length;
        statOnline.textContent = onlineCount;
        if (statOnlineDetail) statOnlineDetail.textContent = `${onlineCount} ${onlineCount === 1 ? 'operador ativo' : 'operadores ativos'}`;
        statGames.textContent = games.filter(g => !g.completed).length;

        // Next game
        const upcomingGames = games
            .filter(g => new Date(g.date + 'T' + (g.time || '00:00')) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcomingGames.length > 0) {
            const g = upcomingGames[0];
            nextGameInfo.innerHTML = `
                <div class="game-type-badge ${g.type}">${g.type}</div>
                <div class="game-title" style="margin-top:8px">${g.title}</div>
                <div class="game-meta" style="margin-top:8px">
                    <span class="game-meta-item"><span class="meta-icon">📅</span> ${formatDate(g.date)}</span>
                    <span class="game-meta-item"><span class="meta-icon">⏰</span> ${g.time || '—'}</span>
                    <span class="game-meta-item"><span class="meta-icon">📍</span> ${g.location || '—'}</span>
                </div>
            `;
        } else {
            nextGameInfo.innerHTML = '<p class="empty-state">Nenhum jogo agendado</p>';
        }

        // Announcements — todos podem ler, somente ADMIN pode criar/editar/excluir.
        if (announcementAdminBox) {
            announcementAdminBox.classList.toggle('hidden', currentUser?.role !== 'admin');
        }
        if (anns.length > 0) {
            announcements.innerHTML = anns.slice().reverse().map(a => {
                const adminActions = currentUser?.role === 'admin'
                    ? `<div class="announcement-actions">
                         <button type="button" class="announcement-edit-btn" data-announcement-edit="${a.id}">Editar</button>
                         <button type="button" class="announcement-delete-btn" data-announcement-delete="${a.id}">Excluir</button>
                       </div>`
                    : '';
                return `<div class="announcement-item" data-announcement-id="${a.id}">
                    <div class="announcement-text">${escapeHtml(a.text || '')}</div>
                    <div class="announcement-meta">${formatDateTime(a.date)}</div>
                    ${adminActions}
                </div>`;
            }).join('');
        } else {
            announcements.innerHTML = '<p class="empty-state">Sem avisos</p>';
        }

        // Feed de atividade em tempo real
        if (activities.length > 0) {
            const activityIcon = { achievement:'🏆', game:'🎯', store:'🛒', order:'📦', contribution:'💳', admin:'🛡️', auth:'🟢', member:'👤', general:'⚡' };
            recentActivity.innerHTML = activities.slice().sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,12).map(a => {
                const icon = activityIcon[a.type] || activityIcon[inferActivityType(a.text)] || '⚡';
                return `<article class="activity-feed-item activity-${escapeHtml(a.type || 'general')}">
                    <span class="activity-feed-icon">${icon}</span>
                    <div class="activity-feed-copy"><strong>${escapeHtml(a.text || '')}</strong><small>${formatDateTime(a.date)}</small></div>
                </article>`;
            }).join('');
        } else {
            recentActivity.innerHTML = '<p class="empty-state">Sem atividade recente.</p>';
        }
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function requireAdminForAnnouncements() {
        if (!currentUser || String(currentUser.role||'').toLowerCase() !== 'admin') {
            showToast('Somente o ADMIN pode editar os avisos', 'error');
            return false;
        }
        return true;
    }

    async function saveNewAnnouncement() {
        if (!requireAdminForAnnouncements()) return;
        const value = String(announcementInput?.value || '').trim();
        if (!value) { showToast('Digite o aviso', 'error'); return; }
        try {
            if (window.AsgardCloud?.createAnnouncement) {
                await window.AsgardCloud.createAnnouncement({ id: generateId(), text: value, date: new Date().toISOString() });
            } else {
                const anns = getStore(DB_ANNOUNCEMENTS) || [];
                anns.push({ id: generateId(), text: value, date: new Date().toISOString(), createdBy: currentUser.id });
                setStore(DB_ANNOUNCEMENTS, anns);
            }
            if (announcementInput) announcementInput.value = '';
            refreshDashboard();
            showToast('Aviso publicado', 'success');
        } catch (err) {
            console.error('[Avisos] Falha ao publicar:', err);
            showToast(err?.message || 'Não foi possível publicar o aviso', 'error');
        }
    }

    async function editAnnouncement(id) {
        if (!requireAdminForAnnouncements()) return;
        const anns = getStore(DB_ANNOUNCEMENTS) || [];
        const item = anns.find(a => String(a.id) === String(id));
        if (!item) return;
        const next = window.prompt('Editar aviso:', item.text || '');
        if (next === null) return;
        const clean = next.trim();
        if (!clean) { showToast('O aviso não pode ficar vazio', 'error'); return; }
        try {
            if (window.AsgardCloud?.updateAnnouncement) await window.AsgardCloud.updateAnnouncement(id, { text: clean });
            else {
                item.text = clean; item.updatedAt = new Date().toISOString(); item.updatedBy = currentUser.id;
                setStore(DB_ANNOUNCEMENTS, anns);
            }
            refreshDashboard();
            showToast('Aviso atualizado', 'success');
        } catch (err) { showToast(err?.message || 'Não foi possível atualizar o aviso', 'error'); }
    }

    async function deleteAnnouncement(id) {
        if (!requireAdminForAnnouncements()) return;
        if (!window.confirm('Excluir este aviso?')) return;
        try {
            if (window.AsgardCloud?.removeAnnouncement) await window.AsgardCloud.removeAnnouncement(id);
            else {
                const anns = (getStore(DB_ANNOUNCEMENTS) || []).filter(a => String(a.id) !== String(id));
                setStore(DB_ANNOUNCEMENTS, anns);
            }
            refreshDashboard();
            showToast('Aviso excluído', 'success');
        } catch (err) { showToast(err?.message || 'Não foi possível excluir o aviso', 'error'); }
    }

    btnAddAnnouncement?.addEventListener('click', saveNewAnnouncement);
    announcementInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveNewAnnouncement();
    });
    announcements?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-announcement-edit]');
        if (editBtn) { editAnnouncement(editBtn.dataset.announcementEdit); return; }
        const deleteBtn = e.target.closest('[data-announcement-delete]');
        if (deleteBtn) deleteAnnouncement(deleteBtn.dataset.announcementDelete);
    });

    // ===== IMAGE RESIZE UTILITY =====
    function resizeImage(file, maxWidth, quality, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;
                if (w > maxWidth) {
                    h = Math.round(h * (maxWidth / w));
                    w = maxWidth;
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', quality || 0.6);
                callback(dataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ===== PHOTO LIGHTBOX =====
    function openPhotoLightbox(src, options = {}) {
        const lb = document.createElement('div');
        lb.className = 'photo-lightbox';
        const title = options.title ? `<h3 class="photo-lightbox-title">${escapeHtml(options.title)}</h3>` : '';
        const description = options.description ? `<p class="photo-lightbox-description">${escapeHtml(options.description)}</p>` : '';
        lb.innerHTML = `
            <div class="photo-lightbox-content" role="dialog" aria-modal="true">
                <button type="button" class="photo-lightbox-close" aria-label="Fechar">×</button>
                <img src="${src}" alt="${escapeHtml(options.alt || options.title || 'Foto')}"/>
                ${(title || description) ? `<div class="photo-lightbox-info">${title}${description}</div>` : ''}
            </div>`;
        lb.addEventListener('click', (e) => { if (e.target === lb) lb.remove(); });
        lb.querySelector('.photo-lightbox-close')?.addEventListener('click', () => lb.remove());
        document.body.appendChild(lb);
    }

    // ===== AVATAR UPLOAD =====
    avatarWrapper.addEventListener('click', () => {
        if (viewedProfileUserId && viewedProfileUserId !== currentUser.id) return;
        avatarFileInput.click();
    });
    avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        resizeImage(file, 200, 0.7, (dataUrl) => {
            pendingAvatar = dataUrl;
            // Save immediately to user data
            const users = getStore(DB_USERS) || [];
            const user = users.find(u => u.id === currentUser.id);
            if (user) {
                user.avatar = dataUrl;
                setStore(DB_USERS, users);
                currentUser = user;
                refreshProfile();
                showToast('Foto de perfil atualizada!', 'success');
            }
            avatarFileInput.value = '';
        });
    });

    // ===== EQUIPMENT PHOTO CLICKS (profile view) =====
    $('eq-photo-primaria-box').addEventListener('click', () => {
        const user = getViewedProfileUser();
        if (user && user.fotoPrimaria) openPhotoLightbox(user.fotoPrimaria);
    });
    $('eq-photo-secundaria-box').addEventListener('click', () => {
        const user = getViewedProfileUser();
        if (user && user.fotoSecundaria) openPhotoLightbox(user.fotoSecundaria);
    });
    $('eq-photo-loadout-box').addEventListener('click', () => {
        const user = getViewedProfileUser();
        if (user && user.fotoLoadout) openPhotoLightbox(user.fotoLoadout);
    });

    // ===== EDIT MODAL EQUIPMENT PHOTO UPLOADS =====
    editPhotoPrimariaInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        resizeImage(file, 400, 0.6, (dataUrl) => {
            pendingFotoPrimaria = dataUrl;
            editPhotoPrimariaPreview.src = dataUrl;
            editPhotoPrimariaPreview.classList.remove('hidden');
            editPhotoPrimariaInput.value = '';
        });
    });
    editPhotoSecundariaInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        resizeImage(file, 400, 0.6, (dataUrl) => {
            pendingFotoSecundaria = dataUrl;
            editPhotoSecundariaPreview.src = dataUrl;
            editPhotoSecundariaPreview.classList.remove('hidden');
            editPhotoSecundariaInput.value = '';
        });
    });
    editPhotoLoadoutInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        resizeImage(file, 400, 0.6, (dataUrl) => {
            pendingFotoLoadout = dataUrl;
            editPhotoLoadoutPreview.src = dataUrl;
            editPhotoLoadoutPreview.classList.remove('hidden');
            editPhotoLoadoutInput.value = '';
        });
    });

    // ===== PROFILE =====
    function getViewedProfileUser() {
        if (!currentUser) return null;
        if (!viewedProfileUserId || viewedProfileUserId === currentUser.id) return currentUser;
        const users = getStore(DB_USERS) || [];
        return users.find(u => u.id === viewedProfileUserId) || currentUser;
    }

    function refreshProfile() {
        const profileUser = getViewedProfileUser();
        if (!profileUser) return;
        const isOwnProfile = profileUser.id === currentUser.id;

        profileCallsign.textContent = profileUser.callsign || '—';
        profileRole.textContent = profileUser.role === 'admin' ? 'ADMIN' : 'OPERADOR';
        profileRole.className = `role-badge large ${profileUser.role || 'operador'}`;
        if (profilePresence) {
            const online = isUserOnline(profileUser);
            profilePresence.className = `profile-presence ${online ? 'online' : 'offline'}`;
            const text = profilePresence.querySelector('.presence-text');
            if (text) text.textContent = online ? 'Online agora' : 'Offline';
            profilePresence.title = online ? 'Operador está dentro do app' : 'Operador não está ativo no app';
        }
        profileName.textContent = profileUser.name || '—';
        profileCallsignText.textContent = profileUser.callsign || '—';
        profileFuncao.textContent = profileUser.funcao || 'Operador';
        profilePrimaria.textContent = profileUser.primaria || '—';
        profileSecundaria.textContent = profileUser.secundaria || '—';
        profileLoadout.textContent = profileUser.loadout || '—';
        profileSince.textContent = formatDate(profileUser.createdAt);
        if (profileCard) profileCard.dataset.profileBg = getUsableProfileBackgroundId(profileUser, profileUser.profileBackground);
        renderProfileAchievements(profileUser.id);

        // Editing/upload controls are only available on the signed-in user's own profile.
        btnEditProfile.classList.toggle('hidden', !isOwnProfile);
        const backMembersBtn = $('btn-back-members');
        if (backMembersBtn) backMembersBtn.classList.toggle('hidden', isOwnProfile);
        avatarWrapper.classList.toggle('view-only', !isOwnProfile);
        avatarUploadOverlay.classList.toggle('hidden', !isOwnProfile);

        // Avatar photo
        if (profileUser.avatar) {
            avatarSvg.classList.add('hidden');
            avatarImg.src = profileUser.avatar;
            avatarImg.classList.remove('hidden');
        } else {
            avatarSvg.classList.remove('hidden');
            avatarImg.classList.add('hidden');
            avatarText.textContent = (profileUser.callsign || '?').charAt(0);
        }

        // Equipment photos
        const equipment = [
            [profileUser.fotoPrimaria, eqPhotoPrimariaImg, eqPhotoPrimariaPlaceholder],
            [profileUser.fotoSecundaria, eqPhotoSecundariaImg, eqPhotoSecundariaPlaceholder],
            [profileUser.fotoLoadout, eqPhotoLoadoutImg, eqPhotoLoadoutPlaceholder]
        ];
        equipment.forEach(([src, img, placeholder]) => {
            if (src) {
                img.src = src;
                img.classList.remove('hidden');
                placeholder.classList.add('hidden');
            } else {
                img.removeAttribute('src');
                img.classList.add('hidden');
                placeholder.classList.remove('hidden');
            }
        });
        renderProfileStatsV2(profileUser.id);
    }

    const btnBackMembers = $('btn-back-members');
    if (btnBackMembers) {
        btnBackMembers.addEventListener('click', () => {
            viewedProfileUserId = null;
            navigateTo('members');
        });
    }

    btnEditProfile.addEventListener('click', () => {
        if (viewedProfileUserId && viewedProfileUserId !== currentUser.id) return;
        editName.value = currentUser.name;
        editFuncao.value = currentUser.funcao || '';
        editPrimaria.value = currentUser.primaria || '';
        editSecundaria.value = currentUser.secundaria || '';
        editLoadout.value = currentUser.loadout || '';
        // Reset pending photos
        pendingAvatar = null;
        pendingFotoPrimaria = null;
        pendingFotoSecundaria = null;
        pendingFotoLoadout = null;
        pendingProfileBackground = getUsableProfileBackgroundId(currentUser, currentUser.profileBackground);
        galleryProfileBackground = pendingProfileBackground;
        // Show existing equipment photo previews
        if (currentUser.fotoPrimaria) {
            editPhotoPrimariaPreview.src = currentUser.fotoPrimaria;
            editPhotoPrimariaPreview.classList.remove('hidden');
        } else {
            editPhotoPrimariaPreview.classList.add('hidden');
        }
        if (currentUser.fotoSecundaria) {
            editPhotoSecundariaPreview.src = currentUser.fotoSecundaria;
            editPhotoSecundariaPreview.classList.remove('hidden');
        } else {
            editPhotoSecundariaPreview.classList.add('hidden');
        }
        if (currentUser.fotoLoadout) {
            editPhotoLoadoutPreview.src = currentUser.fotoLoadout;
            editPhotoLoadoutPreview.classList.remove('hidden');
        } else {
            editPhotoLoadoutPreview.classList.add('hidden');
        }
        editProfileModal.classList.remove('hidden');
    });

    function renderProfileBackgroundGallery() {
        if (!profileBackgroundGallery) return;
        const renderGroup = (title, items) => `
            <div class="profile-background-group-title">${title}</div>
            ${items.map(bg => {
                const unlocked = isProfileBackgroundUnlocked(bg, currentUser);
                const selected = galleryProfileBackground === bg.id;
                const achievement = bg.unlockTitle ? getBackgroundUnlockAchievement(bg) : null;
                const unlockText = bg.category === 'achievement'
                    ? (unlocked ? `Desbloqueado por: ${bg.unlockTitle}` : `🔒 Exige: ${bg.unlockTitle}`)
                    : bg.subtitle;
                return `<button type="button" class="profile-background-option ${selected ? 'selected' : ''} ${unlocked ? 'unlocked' : 'locked'}" data-bg-id="${bg.id}" data-unlocked="${unlocked ? '1' : '0'}" role="radio" aria-checked="${selected}" aria-disabled="${unlocked ? 'false' : 'true'}">
                    <span class="profile-background-thumb" data-profile-bg="${bg.id}"><b>${bg.icon}</b>${bg.category === 'achievement' ? `<em>${unlocked ? 'DESBLOQUEADO' : 'BLOQUEADO'}</em>` : ''}</span>
                    <span class="profile-background-option-copy"><strong>${escapeHtml(bg.name)}</strong><small>${escapeHtml(unlockText)}</small>${bg.category === 'achievement' && !achievement ? '<small class="profile-bg-missing">Conquista ainda não cadastrada</small>' : ''}</span>
                    <span class="profile-background-check">${unlocked ? '✓' : '🔒'}</span>
                </button>`;
            }).join('')}`;
        const free = PROFILE_BACKGROUNDS.filter(bg => bg.category !== 'achievement');
        const rewards = PROFILE_BACKGROUNDS.filter(bg => bg.category === 'achievement');
        profileBackgroundGallery.innerHTML = renderGroup('TEMAS LIVRES', free) + renderGroup('DESBLOQUEÁVEIS POR CONQUISTAS', rewards);
        profileBackgroundGallery.querySelectorAll('[data-bg-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const bg = PROFILE_BACKGROUNDS.find(x => x.id === btn.dataset.bgId);
                if (!bg) return;
                if (!isProfileBackgroundUnlocked(bg, currentUser)) {
                    showToast(`Desbloqueie a conquista “${bg.unlockTitle}” para usar este plano de fundo.`, 'error');
                    return;
                }
                galleryProfileBackground = normalizeProfileBackground(bg.id);
                if (profileBackgroundPreview) profileBackgroundPreview.dataset.profileBg = galleryProfileBackground;
                renderProfileBackgroundGallery();
            });
        });
        if (profileBackgroundPreview) profileBackgroundPreview.dataset.profileBg = galleryProfileBackground;
        const selectedBg = getProfileBackgroundMeta(galleryProfileBackground);
        if (btnApplyProfileBg) {
            const canApply = isProfileBackgroundUnlocked(selectedBg, currentUser);
            btnApplyProfileBg.disabled = !canApply;
            btnApplyProfileBg.textContent = canApply ? 'Aplicar plano de fundo' : 'Plano de fundo bloqueado';
        }
    }

    function openProfileBackgroundGallery() {
        galleryProfileBackground = getUsableProfileBackgroundId(currentUser, pendingProfileBackground || currentUser?.profileBackground);
        renderProfileBackgroundGallery();
        profileBackgroundModal?.classList.remove('hidden');
    }

    function closeProfileBackgroundGallery() {
        profileBackgroundModal?.classList.add('hidden');
    }

    btnChangeProfileBg?.addEventListener('click', openProfileBackgroundGallery);
    btnCancelProfileBg?.addEventListener('click', closeProfileBackgroundGallery);
    btnCloseProfileBg?.addEventListener('click', closeProfileBackgroundGallery);
    profileBackgroundModal?.addEventListener('click', (e) => { if (e.target === profileBackgroundModal) closeProfileBackgroundGallery(); });
    btnApplyProfileBg?.addEventListener('click', () => {
        const bg = getProfileBackgroundMeta(galleryProfileBackground);
        if (!isProfileBackgroundUnlocked(bg, currentUser)) {
            showToast(`Este plano de fundo exige a conquista “${bg.unlockTitle}”.`, 'error');
            return;
        }
        pendingProfileBackground = normalizeProfileBackground(galleryProfileBackground);
        closeProfileBackgroundGallery();
        showToast('Plano de fundo selecionado. Salve o perfil para confirmar.', 'success');
    });

    btnCancelProfile.addEventListener('click', () => {
        pendingProfileBackground = null;
        closeProfileBackgroundGallery();
        editProfileModal.classList.add('hidden');
    });

    btnSaveProfile.addEventListener('click', () => {
        const name = editName.value.trim();
        const funcao = editFuncao.value.trim();
        const primaria = editPrimaria.value.trim();
        const secundaria = editSecundaria.value.trim();
        const loadout = editLoadout.value.trim();

        if (!name) { showToast('Nome é obrigatório', 'error'); return; }

        const users = getStore(DB_USERS) || [];
        const user = users.find(u => u.id === currentUser.id);
        if (user) {
            user.name = name;
            user.funcao = funcao;
            user.primaria = primaria;
            user.secundaria = secundaria;
            user.loadout = loadout;
            // Save equipment photos (use pending if new, otherwise keep existing)
            if (pendingFotoPrimaria !== null) user.fotoPrimaria = pendingFotoPrimaria;
            if (pendingFotoSecundaria !== null) user.fotoSecundaria = pendingFotoSecundaria;
            if (pendingFotoLoadout !== null) user.fotoLoadout = pendingFotoLoadout;
            if (pendingProfileBackground !== null) {
                const selectedBg = getProfileBackgroundMeta(pendingProfileBackground);
                if (isProfileBackgroundUnlocked(selectedBg, currentUser)) user.profileBackground = normalizeProfileBackground(pendingProfileBackground);
                else showToast('O plano de fundo selecionado não está desbloqueado.', 'error');
            }
            setStore(DB_USERS, users);
            currentUser = user;
            pendingFotoPrimaria = null;
            pendingFotoSecundaria = null;
            pendingFotoLoadout = null;
            pendingProfileBackground = null;
            refreshProfile();
            updateTopbar();
            showToast('Perfil atualizado!', 'success');
        }
        editProfileModal.classList.add('hidden');
    });

    // Click outside modal to close
    editProfileModal.addEventListener('click', (e) => {
        if (e.target === editProfileModal) editProfileModal.classList.add('hidden');
    });

    // ===== MEMBERS =====
    function refreshMembers() {
        const users = getStore(DB_USERS) || [];
        const searchTerm = memberSearch.value.trim().toUpperCase();
        const filtered = searchTerm
            ? users.filter(u => u.callsign.includes(searchTerm) || u.name.toUpperCase().includes(searchTerm))
            : users;

        membersList.innerHTML = filtered.length === 0
            ? '<p class="empty-state">Nenhum membro encontrado</p>'
            : filtered.map(u => `
                <div class="member-card ${selectedMemberId === u.id ? 'selected' : ''}" data-id="${u.id}" data-profile-bg="${escapeHtml(getUsableProfileBackgroundId(u, u.profileBackground))}" role="button" tabindex="0" aria-label="Abrir perfil de ${escapeHtml(u.callsign)}">
                    <div class="member-avatar" data-avatar-fallback="${escapeHtml((u.callsign || '?').charAt(0))}">${u.avatar ? `<img src="${escapeHtml(u.avatar)}" alt="Foto de perfil de ${escapeHtml(u.callsign || 'operador')}" loading="lazy">` : escapeHtml((u.callsign || '?').charAt(0))}</div>
                    <div class="member-info">
                        <div class="member-callsign">${escapeHtml(u.callsign || 'SEM CALLSIGN')}</div>
                        <div class="member-name-preview">${escapeHtml(u.name || '')}</div>
                        <div class="member-role role-badge ${u.role}">${u.role === 'admin' ? 'ADMIN' : 'OPERADOR'}</div>
                    </div>
                    ${String(currentUser.role||'').toLowerCase() === 'admin' && u.id !== currentUser.id ? `<button type="button" class="member-manage-btn" data-manage-id="${u.id}" title="Gerenciar membro">Gerenciar</button>` : ''}
                    <div class="member-presence ${isUserOnline(u) ? 'online' : 'offline'}" title="${isUserOnline(u) ? 'Operador online agora' : 'Operador offline'}">
                        <span class="member-status ${isUserOnline(u) ? 'online' : 'offline'}"></span>
                        <span>${isUserOnline(u) ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
            `).join('');

        // Aplica o plano de fundo do respectivo operador ao card de Membros.
        membersList.querySelectorAll('.member-card').forEach(card => {
            const user = users.find(u => String(u.id) === String(card.dataset.id));
            if (user) applyProfileBackgroundVisual(card, user);
        });

        // If a saved profile photo cannot be loaded, fall back to the callsign initial.
        membersList.querySelectorAll('.member-avatar img').forEach(img => {
            img.addEventListener('error', () => {
                const avatar = img.closest('.member-avatar');
                if (avatar) avatar.textContent = avatar.dataset.avatarFallback || '?';
            }, { once: true });
        });

        // Clicking a member opens that member's public team profile.
        const openMemberProfile = (card) => {
            viewedProfileUserId = card.dataset.id;
            selectedMemberId = null;
            adminMembersActions.classList.add('hidden');
            navigateTo('profile');
        };
        membersList.querySelectorAll('.member-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.member-manage-btn')) return;
                openMemberProfile(card);
            });
            card.addEventListener('keydown', (e) => {
                if (e.target.closest('.member-manage-btn')) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openMemberProfile(card);
                }
            });
        });

        // Admins keep the existing promote/remove flow through a dedicated manage button.
        membersList.querySelectorAll('.member-manage-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                openMemberRoleManagerV24(button.dataset.manageId);
            });
        });

        // Hide admin actions if not admin
        if (String(currentUser.role||'').toLowerCase() !== 'admin') {
            adminMembersActions.classList.add('hidden');
        }
    }

    memberSearch.addEventListener('input', refreshMembers);

    function openMemberRoleManagerV24(userId) {
        if (currentUser?.role !== 'admin') { showToast('Somente ADMIN pode alterar funções.', 'error'); return; }
        const users=getStore(DB_USERS)||[];
        const user=users.find(u=>String(u.id)===String(userId));
        if(!user){showToast('Membro não encontrado.','error');return;}
        if(String(user.id)===String(currentUser.id)){showToast('Sua própria função não pode ser alterada por este painel.','info');return;}
        selectedMemberId=String(user.id);
        memberRoleModalTitle.textContent=`Gerenciar • ${user.callsign || user.name || 'Membro'}`;
        memberRolePerson.innerHTML=`<div class="member-role-avatar">${user.avatar?`<img src="${escapeHtml(user.avatar)}" alt="">`:escapeHtml((user.callsign||'?').charAt(0))}</div><div><strong>${escapeHtml(user.callsign||'SEM CALLSIGN')}</strong><small>${escapeHtml(user.name||'')}</small></div><span class="role-badge ${user.role==='admin'?'admin':'operador'}">${user.role==='admin'?'ADMIN':'OPERADOR'}</span>`;
        memberRoleModal.querySelectorAll('input[name="member-role-choice"]').forEach(r=>r.checked=r.value===(user.role==='admin'?'admin':'operador'));
        memberRoleModal.classList.remove('hidden');
    }

    function closeMemberRoleManagerV24(){
        memberRoleModal?.classList.add('hidden');
        if(memberRoleModal) memberRoleModal.querySelectorAll('input[name="member-role-choice"]').forEach(r=>r.checked=false);
    }

    btnPromoteMember.addEventListener('click', () => {
        if (!selectedMemberId) { showToast('Selecione um membro', 'error'); return; }
        openMemberRoleManagerV24(selectedMemberId);
    });

    btnCancelMemberRole?.addEventListener('click', closeMemberRoleManagerV24);
    memberRoleModal?.addEventListener('click',e=>{if(e.target===memberRoleModal)closeMemberRoleManagerV24();});

    btnSaveMemberRole?.addEventListener('click', async () => {
        if(currentUser?.role!=='admin'||!selectedMemberId)return;
        const selectedRole=memberRoleModal?.querySelector('input[name="member-role-choice"]:checked')?.value;
        if(!['operador','admin'].includes(selectedRole)){showToast('Escolha OPERADOR ou ADMIN.','error');return;}
        const users=getStore(DB_USERS)||[];
        const user=users.find(u=>String(u.id)===String(selectedMemberId));
        if(!user){showToast('Membro não encontrado.','error');return;}
        const oldRole=user.role==='admin'?'admin':'operador';
        if(oldRole===selectedRole){closeMemberRoleManagerV24();showToast('A função já está definida assim.','info');return;}

        btnSaveMemberRole.disabled=true;
        try{
            if(window.AsgardCloud?.updateUserRole){
                await window.AsgardCloud.updateUserRole(user.id,selectedRole);
            } else {
                user.role=selectedRole;
                setStore(DB_USERS,users);
            }
            user.role=selectedRole;
            setStore(DB_USERS,users);
            addActivity(`${currentUser.callsign} alterou ${user.callsign} de ${oldRole==='admin'?'ADMIN':'OPERADOR'} para ${selectedRole==='admin'?'ADMIN':'OPERADOR'}`);
            showToast(`${user.callsign} agora é ${selectedRole==='admin'?'ADMIN':'OPERADOR'}.`,'success');
            closeMemberRoleManagerV24();
            selectedMemberId=null;
            adminMembersActions.classList.add('hidden');
            refreshMembers();
        }catch(err){
            console.error(err);
            showToast(err?.message||'Não foi possível alterar a função.','error');
        }finally{btnSaveMemberRole.disabled=false;}
    });

    btnRemoveMember.addEventListener('click', () => {
        if (!selectedMemberId) { showToast('Selecione um membro', 'error'); return; }
        const users = getStore(DB_USERS) || [];
        const user = users.find(u => u.id === selectedMemberId);
        if (user) {
            if (user.id === currentUser.id) {
                showToast('Você não pode remover a si mesmo', 'error');
                return;
            }
            const idx = users.indexOf(user);
            users.splice(idx, 1);
            setStore(DB_USERS, users);
            addActivity(`${currentUser.callsign} removeu ${user.callsign} da equipe`);
            showToast(`${user.callsign} removido`, 'info');
            selectedMemberId = null;
            adminMembersActions.classList.add('hidden');
            refreshMembers();
        }
    });

    // ===== ARSENAL =====
    function refreshArsenal() {
        if (!arsenalGallery) return;
        const users = getStore(DB_USERS) || [];
        const term = (arsenalSearch?.value || '').trim().toUpperCase();
        const filter = arsenalFilter?.value || 'all';
        const weapons = [];

        users.forEach(user => {
            const memberText = `${user.callsign || ''} ${user.name || ''}`.toUpperCase();
            const entries = [
                { type: 'primaria', label: 'PRIMÁRIA', name: user.primaria, photo: user.fotoPrimaria },
                { type: 'secundaria', label: 'SECUNDÁRIA', name: user.secundaria, photo: user.fotoSecundaria }
            ];
            entries.forEach(weapon => {
                const weaponName = (weapon.name || '').trim();
                const sniperLike = /sniper|dmr|m40|vsr|l96|mb0|srs|tac-41|bar-10|sr25|mk12/i.test(weaponName);
                if (filter === 'sniper' && !sniperLike) return;
                if (filter !== 'all' && filter !== 'sniper' && filter !== weapon.type) return;

                const searchable = `${memberText} ${weaponName}`.toUpperCase();
                if (term && !searchable.includes(term)) return;
                // Show a card when a member has at least identified the weapon or uploaded its photo.
                if (!weaponName && !weapon.photo) return;
                weapons.push({ ...weapon, user });
            });
        });

        const membersWithWeapons = new Set(weapons.map(w => w.user.id)).size;
        if (arsenalSummary) {
            arsenalSummary.innerHTML = `
                <span><strong>${weapons.length}</strong> arma${weapons.length === 1 ? '' : 's'} cadastrada${weapons.length === 1 ? '' : 's'}</span>
                <span class="arsenal-summary-sep">•</span>
                <span><strong>${membersWithWeapons}</strong> membro${membersWithWeapons === 1 ? '' : 's'}</span>
            `;
        }

        if (!weapons.length) {
            arsenalGallery.innerHTML = `<div class="arsenal-empty">
                <div class="arsenal-empty-icon">⌖</div>
                <h3>Nenhuma arma encontrada</h3>
                <p>As armas aparecem aqui quando os membros preenchem Primária ou Secundária em seus perfis.</p>
            </div>`;
            return;
        }

        arsenalGallery.innerHTML = weapons.map((weapon, index) => {
            const u = weapon.user;
            const photo = weapon.photo
                ? `<img class="arsenal-weapon-img" src="${weapon.photo}" alt="${escapeHtml(weapon.name || weapon.label)} de ${escapeHtml(u.callsign || '')}" loading="lazy">`
                : `<div class="arsenal-weapon-placeholder"><span>⌖</span><small>SEM FOTO</small></div>`;
            const avatar = u.avatar
                ? `<img src="${u.avatar}" alt="${escapeHtml(u.callsign || '')}">`
                : `<span>${escapeHtml((u.callsign || '?').charAt(0))}</span>`;
            return `
                <article class="arsenal-card" data-user-id="${u.id}" data-weapon-index="${index}" tabindex="0">
                    <div class="arsenal-photo" data-photo="${weapon.photo ? '1' : '0'}">
                        ${photo}
                        <span class="arsenal-type ${weapon.type}">${weapon.label}</span>
                        ${weapon.photo ? '<span class="arsenal-zoom">↗ Ampliar</span>' : ''}
                    </div>
                    <div class="arsenal-card-body">
                        <div class="arsenal-weapon-name">${escapeHtml(weapon.name || 'Arma não identificada')}</div>
                        <button type="button" class="arsenal-member" data-profile-id="${u.id}" title="Abrir perfil de ${escapeHtml(u.callsign || '')}">
                            <span class="arsenal-member-avatar">${avatar}</span>
                            <span class="arsenal-member-text">
                                <strong>${escapeHtml(u.callsign || 'SEM CALLSIGN')}</strong>
                                <small>${escapeHtml(u.name || 'Membro da equipe')}</small>
                            </span>
                            <span class="arsenal-profile-arrow">›</span>
                        </button>
                    </div>
                </article>`;
        }).join('');

        arsenalGallery.querySelectorAll('.arsenal-photo[data-photo="1"]').forEach((photoBox, index) => {
            photoBox.addEventListener('click', (e) => {
                e.stopPropagation();
                const cards = [...arsenalGallery.querySelectorAll('.arsenal-card')];
                const card = photoBox.closest('.arsenal-card');
                const weaponIndex = Number(card?.dataset.weaponIndex);
                const weapon = weapons[weaponIndex];
                if (weapon?.photo) openPhotoLightbox(weapon.photo);
            });
        });
        arsenalGallery.querySelectorAll('.arsenal-member').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                viewedProfileUserId = button.dataset.profileId;
                navigateTo('profile');
            });
        });
    }

    if (arsenalSearch) arsenalSearch.addEventListener('input', refreshArsenal);
    if (arsenalFilter) arsenalFilter.addEventListener('change', refreshArsenal);

    // ===== ACHIEVEMENTS =====
    let editingAchievementId = null;
    let managingAchievementId = null;
    let pendingAchievementBadge = null;

    function getUnreadAchievementNotifications() {
        if (!currentUser) return [];
        return (Array.isArray(currentUser.achievementNotifications) ? currentUser.achievementNotifications : [])
            .filter(n => n && !n.readAt)
            .sort((a,b) => String(a.awardedAt || '').localeCompare(String(b.awardedAt || '')));
    }

    function updateAchievementNotificationBadge() {
        const count = getUnreadAchievementNotifications().length;
        if (!achievementNewBadge) return;
        achievementNewBadge.textContent = count > 99 ? '99+' : String(count || '');
        achievementNewBadge.classList.toggle('visible', count > 0);
    }

    function showAchievementSystemNotification(n) {
        if (!n?.id || !('Notification' in window) || Notification.permission !== 'granted') return;
        const key = `asgard_achievement_system_notified_${currentUser?.id || ''}_${n.id}`;
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, '1');
        navigator.serviceWorker?.ready.then(reg => reg.showNotification('🏆 Nova conquista desbloqueada!', {
            body: `${n.title || 'Nova conquista'}${n.description ? ` — ${String(n.description).slice(0, 100)}` : ''}`,
            icon: './icons/icon-192-v17.png',
            badge: './icons/icon-192-v17.png',
            tag: `achievement-${n.id}`,
            data: { page: 'achievements', achievementId: n.achievementId || '' }
        })).catch(() => {});
    }

    const ACHIEVEMENT_RARITY_META = {
        comum: { label:'COMUM' },
        incomum: { label:'INCOMUM' },
        rara: { label:'RARA' },
        epica: { label:'ÉPICA' },
        lendaria: { label:'LENDÁRIA' }
    };

    function achievementAnimationSeenKey(notificationId) {
        return `asgard_achievement_animation_seen_${currentUser?.id || 'anon'}_${notificationId || ''}`;
    }

    function seedAchievementParticles() {
        const host = achievementUnlockedModal?.querySelector('.achievement-unlocked-particles');
        if (!host) return;
        host.innerHTML = '';
        const total = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 28;
        for (let i = 0; i < total; i++) {
            const p = document.createElement('i');
            const angle = (Math.PI * 2 * i / total) + ((i % 3) * .11);
            const distance = 110 + (i % 6) * 24;
            p.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            p.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
            p.style.setProperty('--delay', `${(i % 8) * 28}ms`);
            p.style.setProperty('--size', `${2 + (i % 4)}px`);
            host.appendChild(p);
        }
    }

    function maybeShowAchievementNotification() {
        updateAchievementNotificationBadge();
        if (!currentUser || achievementNotificationBusy || !achievementUnlockedModal?.classList.contains('hidden')) return;
        const unread = getUnreadAchievementNotifications();
        if (!unread.length) return;
        const n = unread.find(item => !localStorage.getItem(achievementAnimationSeenKey(item.id)));
        if (!n) return;
        activeAchievementNotification = n;
        const achievement = (getStore(DB_ACHIEVEMENTS) || []).find(a => a.id === n.achievementId);
        const title = achievement?.title || n.title || 'Nova conquista';
        const description = achievement?.description || n.description || 'Você recebeu uma nova insígnia.';
        const badge = achievement?.badge || '';
        const rarity = String(achievement?.rarity || n.rarity || 'comum').toLowerCase();
        const rarityMeta = ACHIEVEMENT_RARITY_META[rarity] || ACHIEVEMENT_RARITY_META.comum;
        achievementUnlockedTitle.textContent = title;
        if (achievementUnlockedRarity) achievementUnlockedRarity.textContent = rarityMeta.label;
        achievementUnlockedDescription.textContent = description;
        achievementUnlockedBadge.innerHTML = badge
            ? `<img src="${badge}" alt="Insígnia ${escapeHtml(title)}">`
            : '<span>🏅</span>';
        achievementUnlockedModal.dataset.rarity = rarity in ACHIEVEMENT_RARITY_META ? rarity : 'comum';
        n.title = title;
        n.description = description;
        localStorage.setItem(achievementAnimationSeenKey(n.id), new Date().toISOString());
        seedAchievementParticles();
        achievementUnlockedModal.classList.remove('hidden');
        achievementUnlockedModal.classList.remove('achievement-animation-restart');
        void achievementUnlockedModal.offsetWidth;
        achievementUnlockedModal.classList.add('achievement-animation-restart');
        showAchievementSystemNotification(n);
    }

    async function markActiveAchievementNotificationRead(targetPage = null) {
        const n = activeAchievementNotification;
        if (!n || achievementNotificationBusy) return;
        achievementNotificationBusy = true;
        try {
            if (window.AsgardCloud?.markAchievementNotificationRead) {
                await window.AsgardCloud.markAchievementNotificationRead(n.id);
            } else {
                const users = getStore(DB_USERS) || [];
                const me = users.find(u => u.id === currentUser.id);
                if (me) {
                    me.achievementNotifications = (me.achievementNotifications || []).map(x => x?.id === n.id ? { ...x, readAt:new Date().toISOString() } : x);
                    setStore(DB_USERS, users);
                    currentUser = me;
                }
            }
        } catch (err) {
            console.error('[Achievement notification]', err);
        } finally {
            achievementUnlockedModal?.classList.add('hidden');
            achievementUnlockedModal?.classList.remove('achievement-animation-restart');
            activeAchievementNotification = null;
            achievementNotificationBusy = false;
            updateAchievementNotificationBadge();
            if (targetPage === 'profile') {
                viewedProfileUserId = null;
                navigateTo('profile');
            } else if (targetPage === 'achievements') {
                navigateTo('achievements');
            }
            setTimeout(maybeShowAchievementNotification, 180);
        }
    }

    if (btnCloseAchievementUnlocked) btnCloseAchievementUnlocked.addEventListener('click', () => markActiveAchievementNotificationRead(null));
    if (btnViewAchievement) btnViewAchievement.addEventListener('click', () => markActiveAchievementNotificationRead('profile'));
    if (achievementUnlockedModal) achievementUnlockedModal.addEventListener('click', e => {
        if (e.target === achievementUnlockedModal) markActiveAchievementNotificationRead(null);
    });

    function getAchievementBadgeMarkup(achievement, className = '') {
        if (achievement?.badge) {
            return `<img class="${className}" src="${achievement.badge}" alt="Insígnia ${escapeHtml(achievement.title || '')}" loading="lazy">`;
        }
        return `<div class="achievement-badge-placeholder ${className}">🏅</div>`;
    }

    function getAwardedAchievementIds(userId) {
        const awards = getStore(DB_ACHIEVEMENT_AWARDS) || [];
        const ids = new Set(awards.filter(x => String(x.userId || '') === String(userId || '')).map(x => String(x.achievementId || '')));
        (getStore(DB_ACHIEVEMENTS) || []).forEach(a => {
            if ((a.completedBy || []).map(String).includes(String(userId || ''))) ids.add(String(a.id || ''));
        });
        return ids;
    }

    function getFeaturedAchievementIds(user) {
        const awarded = getAwardedAchievementIds(user?.id);
        return [...new Set((Array.isArray(user?.featuredAchievementIds) ? user.featuredAchievementIds : []).map(String))]
            .filter(id => awarded.has(id))
            .slice(0, 3);
    }

    async function toggleFeaturedAchievement(achievementId) {
        if (!currentUser) return;
        const id = String(achievementId || '');
        if (!getAwardedAchievementIds(currentUser.id).has(id)) {
            showToast('Você só pode destacar insígnias que já conquistou.', 'error');
            return;
        }
        const selected = getFeaturedAchievementIds(currentUser);
        const exists = selected.includes(id);
        let next;
        if (exists) next = selected.filter(x => x !== id);
        else {
            if (selected.length >= 3) { showToast('Você pode destacar no máximo 3 insígnias.', 'error'); return; }
            next = [...selected, id];
        }
        try {
            if (window.AsgardCloud?.updateFeaturedAchievements) {
                await window.AsgardCloud.updateFeaturedAchievements(next);
            } else {
                const users = getStore(DB_USERS) || [];
                const me = users.find(u => String(u.id) === String(currentUser.id));
                if (me) { me.featuredAchievementIds = next; setStore(DB_USERS, users); currentUser = me; }
            }
            currentUser.featuredAchievementIds = next;
            const users = getStore(DB_USERS) || [];
            const me = users.find(u => String(u.id) === String(currentUser.id));
            if (me) me.featuredAchievementIds = next;
            renderFeaturedAchievementsSelector();
            renderProfileAchievements(currentUser.id);
            refreshAchievements();
            showToast(exists ? 'Insígnia removida do destaque.' : 'Insígnia destacada no perfil!', 'success');
        } catch (err) {
            console.error(err);
            showToast(err?.message || 'Não foi possível salvar as insígnias em destaque.', 'error');
        }
    }

    function renderFeaturedAchievementsSelector() {
        if (!featuredAchievementsList || !currentUser) return;
        const selectedIds = getFeaturedAchievementIds(currentUser);
        if (featuredAchievementsCount) featuredAchievementsCount.textContent = `${selectedIds.length}/3`;
        const achievements = (getStore(DB_ACHIEVEMENTS) || []).filter(a => selectedIds.includes(String(a.id || '')));
        if (!achievements.length) {
            featuredAchievementsList.innerHTML = '<span class="profile-achievements-empty">Nenhuma insígnia selecionada. Use o botão “Destacar no perfil” em uma conquista recebida.</span>';
            return;
        }
        featuredAchievementsList.innerHTML = achievements.map(a => `
            <button type="button" class="featured-achievement-chip" data-id="${a.id}" title="Remover ${escapeHtml(a.title || 'conquista')} do destaque">
                ${a.badge ? `<img src="${a.badge}" alt="${escapeHtml(a.title || 'Insígnia')}">` : '<span>🏅</span>'}
                <span>${escapeHtml(a.title || 'Conquista')}</span>
                <b>×</b>
            </button>`).join('');
        featuredAchievementsList.querySelectorAll('.featured-achievement-chip').forEach(btn => btn.addEventListener('click', () => toggleFeaturedAchievement(btn.dataset.id)));
    }

    function renderProfileAchievements(userId) {
        if (!profileAchievements) return;
        const users = getStore(DB_USERS) || [];
        const profileUser = users.find(u => String(u.id) === String(userId));
        const selectedIds = getFeaturedAchievementIds(profileUser || { id:userId });
        const achievements = (getStore(DB_ACHIEVEMENTS) || []).filter(a => selectedIds.includes(String(a.id || '')));
        if (!achievements.length) {
            profileAchievements.innerHTML = '<span class="profile-achievements-empty">Nenhuma insígnia em destaque.</span>';
            return;
        }
        profileAchievements.innerHTML = achievements.map(a => `
            <button type="button" class="profile-badge ${String(userId) === String(currentUser?.id) && getUnreadAchievementNotifications().some(n => n.achievementId === a.id) ? 'new-achievement' : ''}" data-achievement-id="${a.id}" title="${escapeHtml(a.title || 'Conquista')}">
                ${a.badge ? `<img src="${a.badge}" alt="${escapeHtml(a.title || 'Insígnia')}">` : '<span>🏅</span>'}
                <small>${escapeHtml(a.title || 'Conquista')}</small>
            </button>
        `).join('');
        profileAchievements.querySelectorAll('.profile-badge').forEach(btn => {
            btn.addEventListener('click', () => {
                const achievement = (getStore(DB_ACHIEVEMENTS) || []).find(a => a.id === btn.dataset.achievementId);
                if (achievement?.badge) openPhotoLightbox(achievement.badge, { title: achievement.title || 'Conquista', description: `${RARITY_LABELS[String(achievement.rarity || 'comum').toLowerCase()] || 'COMUM'} • ${achievement.description || ''}`, alt: `Insígnia ${achievement.title || 'conquistada'}` });
            });
        });
    }

    // ===== V19 ACHIEVEMENT PROGRESS =====
    // Automatic progress is shown only when a measurable rule can be derived safely
    // from the achievement itself. No progress is invented for subjective/manual badges.
    function getAchievementProgressV19(achievement, user) {
        if (!achievement || !user) return null;
        const text = `${achievement.title || ''} ${achievement.description || ''}`.toLowerCase();
        let target = Number(achievement.progressTarget || achievement.target || achievement.goal || 0);
        let metric = String(achievement.progressMetric || achievement.metric || '').toLowerCase();

        // Backward-compatible inference for existing operation-count achievements.
        if (!target) {
            const m = text.match(/\b(100|75|50|40|30|25|20|15|10|5|4|3|2)\s*(?:opera(?:ç|c)(?:ão|oes|ões)|partidas?|jogos?)\b/i);
            if (m) { target = Number(m[1]); metric = 'operations'; }
        }
        // "Primeira vitória" is measurable from completed games with the operator present.
        if (!target && /primeira\s+vit[oó]ria/.test(text)) { target = 1; metric = 'wins'; }

        const uid = String(user.id);
        if (metric === 'validated_games') {
            const records = getStore(DB_ACHIEVEMENT_PROGRESS) || [];
            const current = new Set(records.filter(r => String(r.userId) === uid && String(r.achievementId) === String(achievement.id)).map(r => String(r.gameId))).size;
            if (!Number.isFinite(target) || target <= 0) return null;
            const safe = Math.max(0, Math.min(target, current));
            return { current:safe, target, percent:Math.min(100, Math.round((safe/target)*100)), unit:'partidas' };
        }
        if (metric === 'team_tenure_years') {
            const sinceRaw = user.teamSince || user.memberSince || user.joinedAt || user.joinDate || user.createdAt;
            const since = sinceRaw ? new Date(sinceRaw) : null;
            if (!since || Number.isNaN(since.getTime()) || !Number.isFinite(target) || target <= 0) return null;
            const now = new Date();
            let years = now.getFullYear() - since.getFullYear();
            const anniversary = new Date(now.getFullYear(), since.getMonth(), since.getDate());
            if (now < anniversary) years--;
            years = Math.max(0, years);
            const safe = Math.min(target, years);
            return { current:safe, target, percent:Math.min(100, Math.round((safe/target)*100)), unit:'anos' };
        }
        const games = getStore(DB_GAMES) || [];
        const attended = games.filter(g => {
            const ids = []
                .concat(Array.isArray(g.confirmed) ? g.confirmed : [])
                .concat(Array.isArray(g.present) ? g.present : [])
                .concat(Array.isArray(g.attendees) ? g.attendees : [])
                .map(x => String(typeof x === 'object' ? (x.userId || x.id || '') : x));
            return ids.includes(uid) && !!g.completed;
        });

        let current = 0;
        if (metric === 'operations' || metric === 'games' || metric === 'matches') current = attended.length;
        else if (metric === 'wins' || metric === 'victories') {
            current = attended.filter(g => g.victory === true || g.result === 'victory' || g.result === 'win' || g.winner === true).length;
        } else if (metric === 'kills' || metric === 'baixas') {
            // Only use an explicitly stored user statistic; do not fabricate kill counts.
            current = Number(user.kills ?? user.baixas ?? user.stats?.kills ?? user.stats?.baixas ?? NaN);
            if (!Number.isFinite(current)) return null;
        } else return null;

        if (!Number.isFinite(target) || target <= 0) return null;
        current = Math.max(0, Math.min(target, Number(current) || 0));
        return { current, target, percent: Math.min(100, Math.round((current / target) * 100)) };
    }

    function refreshAchievements() {
        if (!achievementsGrid) return;
        const achievements = (getStore(DB_ACHIEVEMENTS) || []).slice()
            .sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        const users = getStore(DB_USERS) || [];
        const awards = getStore(DB_ACHIEVEMENT_AWARDS) || [];
        const myAwardedIds = getAwardedAchievementIds(currentUser?.id);
        const myCount = achievements.filter(a => myAwardedIds.has(String(a.id || ''))).length;
        if (achievementsSummary) {
            achievementsSummary.innerHTML = `
                <span><strong>${achievements.length}</strong> conquista${achievements.length === 1 ? '' : 's'} disponível${achievements.length === 1 ? '' : 'is'}</span>
                <span class="achievements-summary-sep">•</span>
                <span>Você conquistou <strong>${myCount}</strong></span>`;
        }
        renderFeaturedAchievementsSelector();
        if (!achievements.length) {
            achievementsGrid.innerHTML = `<div class="achievements-empty">
                <div class="achievements-empty-icon">🏅</div>
                <h3>Nenhuma conquista disponível</h3>
                <p>Quando o ADMIN criar uma conquista, ela aparecerá aqui para toda a equipe.</p>
            </div>`;
            return;
        }
        achievementsGrid.innerHTML = achievements.map(a => {
            const awardRecipients = awards.filter(x => String(x.achievementId || '') === String(a.id || '')).map(x => String(x.userId || ''));
            const completed = [...new Set([...(Array.isArray(a.completedBy) ? a.completedBy.map(String) : []), ...awardRecipients])];
            const mine = completed.includes(String(currentUser.id));
            const awardedUsers = completed.map(id => users.find(u => String(u.id) === String(id))).filter(Boolean);
            const names = awardedUsers.slice(0, 5).map(u => escapeHtml(u.callsign || u.name || 'Operador')).join(', ');
            const extra = Math.max(0, awardedUsers.length - 5);
            return `
                <article class="achievement-card ${mine ? 'achievement-earned' : ''}" data-achievement-id="${a.id}">
                    <div class="achievement-badge-wrap" data-badge="${a.badge ? '1' : '0'}" data-id="${a.id}">
                        ${getAchievementBadgeMarkup(a, 'achievement-badge-image')}
                        ${mine ? '<span class="achievement-earned-ribbon">CONQUISTADA</span>' : ''}
                    </div>
                    <div class="achievement-card-body">
                        <h3>${escapeHtml(a.title || 'Conquista')}</h3>
                        <p>${escapeHtml(a.description || 'Sem descrição.')}</p>
                        ${(() => {
                            if (mine) return `<div class="achievement-progress-v19 is-complete"><div class="achievement-progress-head"><span>Progresso</span><strong>CONCLUÍDA</strong></div><div class="achievement-progress-track"><span style="width:100%"></span></div></div>`;
                            const progress = getAchievementProgressV19(a, currentUser);
                            if (!progress) return `<div class="achievement-progress-v19 is-manual"><div class="achievement-progress-head"><span>Progresso</span><strong>Critério especial</strong></div><small>Esta conquista depende de validação do comando.</small></div>`;
                            return `<div class="achievement-progress-v19"><div class="achievement-progress-head"><span>Progresso</span><strong>${progress.current} / ${progress.target}${progress.unit === 'anos' ? ' anos' : ''}</strong></div><div class="achievement-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${progress.target}" aria-valuenow="${progress.current}" aria-label="Progresso de ${escapeHtml(a.title || 'conquista')}"><span style="width:${progress.percent}%"></span></div><small>${progress.percent >= 75 ? 'Muito perto de conquistar' : progress.percent >= 40 ? 'Bom progresso' : progress.percent > 0 ? 'Em progresso' : 'Ainda não iniciada'}</small></div>`;
                        })()}
                        <div class="achievement-awarded-count">🏅 ${completed.length} operador${completed.length === 1 ? '' : 'es'} recebeu${completed.length === 1 ? '' : 'ram'} esta insígnia</div>
                        ${awardedUsers.length ? `<div class="achievement-awarded-names">${names}${extra ? ` e +${extra}` : ''}</div>` : '<div class="achievement-awarded-names muted">Ainda sem concluintes</div>'}
                        ${mine ? `<button type="button" class="btn-secondary achievement-feature-btn ${getFeaturedAchievementIds(currentUser).includes(String(a.id)) ? 'is-featured' : ''}" data-id="${a.id}">${getFeaturedAchievementIds(currentUser).includes(String(a.id)) ? '★ Em destaque' : '☆ Destacar no perfil'}</button>` : ''}
                    </div>
                    ${String(currentUser.role||'').toLowerCase() === 'admin' ? `<div class="achievement-admin-actions">
                        <button class="btn-secondary achievement-completers-btn" data-id="${a.id}">Concluintes</button>
                        <button class="btn-secondary achievement-edit-btn" data-id="${a.id}">Editar</button>
                        <button class="btn-danger achievement-delete-btn" data-id="${a.id}">Excluir</button>
                    </div>` : ''}
                </article>`;
        }).join('');

        achievementsGrid.querySelectorAll('.achievement-badge-wrap[data-badge="1"]').forEach(el => {
            el.addEventListener('click', () => {
                const a = achievements.find(x => x.id === el.dataset.id);
                if (a?.badge) openPhotoLightbox(a.badge, { title: a.title || 'Conquista', description: a.description || '', alt: `Insígnia ${a.title || 'conquistada'}` });
            });
        });
        achievementsGrid.querySelectorAll('.achievement-feature-btn').forEach(btn => btn.addEventListener('click', () => toggleFeaturedAchievement(btn.dataset.id)));
        achievementsGrid.querySelectorAll('.achievement-edit-btn').forEach(btn => btn.addEventListener('click', () => openAchievementModal(btn.dataset.id)));
        achievementsGrid.querySelectorAll('.achievement-delete-btn').forEach(btn => btn.addEventListener('click', () => deleteAchievement(btn.dataset.id)));
        achievementsGrid.querySelectorAll('.achievement-completers-btn').forEach(btn => btn.addEventListener('click', () => openAchievementMembers(btn.dataset.id)));
    }

    function resetAchievementModal() {
        editingAchievementId = null;
        pendingAchievementBadge = null;
        if (achievementModalTitle) achievementModalTitle.textContent = 'Nova Conquista';
        if (achievementTitle) achievementTitle.value = '';
        if (achievementDescription) achievementDescription.value = '';
        if (achievementBadgeInput) achievementBadgeInput.value = '';
        if (achievementBadgePreview) achievementBadgePreview.innerHTML = '<span>🏅</span>';
    }

    function openAchievementModal(id = null) {
        if (String(currentUser.role||'').toLowerCase() !== 'admin') { showToast('Apenas ADMIN pode gerenciar conquistas', 'error'); return; }
        resetAchievementModal();
        if (id) {
            const a = (getStore(DB_ACHIEVEMENTS) || []).find(x => x.id === id);
            if (!a) { showToast('Conquista não encontrada', 'error'); return; }
            editingAchievementId = id;
            pendingAchievementBadge = a.badge || '';
            achievementModalTitle.textContent = 'Editar Conquista';
            achievementTitle.value = a.title || '';
            achievementDescription.value = a.description || '';
            if (achievementRarity) achievementRarity.value = a.rarity || 'comum';
            achievementBadgePreview.innerHTML = a.badge ? `<img src="${a.badge}" alt="Prévia da insígnia">` : '<span>🏅</span>';
        }
        achievementModal.classList.remove('hidden');
    }

    if (btnCreateAchievement) btnCreateAchievement.addEventListener('click', () => openAchievementModal());
    if (btnCancelAchievement) btnCancelAchievement.addEventListener('click', () => { achievementModal.classList.add('hidden'); resetAchievementModal(); });
    if (achievementModal) achievementModal.addEventListener('click', e => { if (e.target === achievementModal) { achievementModal.classList.add('hidden'); resetAchievementModal(); } });

    if (achievementBadgeInput) achievementBadgeInput.addEventListener('change', () => {
        const file = achievementBadgeInput.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showToast('Selecione uma imagem válida', 'error'); achievementBadgeInput.value=''; return; }
        if (file.size > 8 * 1024 * 1024) { showToast('A imagem deve ter no máximo 8 MB', 'error'); achievementBadgeInput.value=''; return; }
        resizeImage(file, 320, 0.72, dataUrl => {
            pendingAchievementBadge = dataUrl;
            achievementBadgePreview.innerHTML = `<img src="${dataUrl}" alt="Prévia da insígnia">`;
        });
    });

    if (btnSaveAchievement) btnSaveAchievement.addEventListener('click', async () => {
        if (String(currentUser.role||'').toLowerCase() !== 'admin') { showToast('Apenas ADMIN pode gerenciar conquistas', 'error'); return; }
        const title = achievementTitle.value.trim();
        const description = achievementDescription.value.trim();
        const rarity = achievementRarity?.value || 'comum';
        const progressTarget = Math.max(1, Math.min(999, Number(achievementProgressTarget?.value || 1)));
        if (!title) { showToast('Informe o título da conquista', 'error'); return; }
        if (!description) { showToast('Informe a descrição da conquista', 'error'); return; }
        if (!pendingAchievementBadge) { showToast('Selecione a imagem da insígnia', 'error'); return; }
        btnSaveAchievement.disabled = true;
        try {
            if (editingAchievementId) {
                const existing = (getStore(DB_ACHIEVEMENTS) || []).find(x => x.id === editingAchievementId);
                if (!existing) throw new Error('Conquista não encontrada');
                if (window.AsgardCloud?.updateAchievement) {
                    await window.AsgardCloud.updateAchievement(editingAchievementId, {
                        title, description, rarity, progressTarget, progressMetric:'validated_games', badge: pendingAchievementBadge
                    });
                } else {
                    const achievements = getStore(DB_ACHIEVEMENTS) || [];
                    const a = achievements.find(x => x.id === editingAchievementId);
                    a.title = title; a.description = description; a.rarity = rarity; a.progressTarget = progressTarget; a.progressMetric = 'validated_games'; a.badge = pendingAchievementBadge; a.updatedAt = new Date().toISOString();
                    setStore(DB_ACHIEVEMENTS, achievements);
                }
                addActivity(`${currentUser.callsign} editou a conquista: ${title}`);
                showToast('Conquista atualizada!', 'success');
            } else {
                const achievement = {
                    id: generateId(), title, description, rarity, progressTarget, progressMetric:'validated_games', badge: pendingAchievementBadge,
                    completedBy: [], createdBy: currentUser.id, createdAt: new Date().toISOString()
                };
                if (window.AsgardCloud?.createAchievement) await window.AsgardCloud.createAchievement(achievement);
                else { const achievements = getStore(DB_ACHIEVEMENTS) || []; achievements.push(achievement); setStore(DB_ACHIEVEMENTS, achievements); }
                addActivity(`${currentUser.callsign} criou a conquista: ${title}`);
                showToast('Conquista criada e salva!', 'success');
            }
            achievementModal.classList.add('hidden');
            resetAchievementModal();
            refreshAchievements();
        } catch (err) {
            console.error(err);
            showToast(err?.message || 'Não foi possível salvar a conquista no servidor.', 'error');
        } finally {
            btnSaveAchievement.disabled = false;
        }
    });

    async function deleteAchievement(id) {
        if (String(currentUser.role||'').toLowerCase() !== 'admin') { showToast('Apenas ADMIN pode excluir conquistas', 'error'); return; }
        const achievements = getStore(DB_ACHIEVEMENTS) || [];
        const a = achievements.find(x => x.id === id);
        if (!a) return;
        if (!confirm(`Excluir definitivamente a conquista "${a.title}"? As insígnias concedidas também deixarão de aparecer nos perfis.`)) return;
        try {
            if (window.AsgardCloud?.removeAchievement) await window.AsgardCloud.removeAchievement(id);
            else setStore(DB_ACHIEVEMENTS, achievements.filter(x => x.id !== id));
            addActivity(`${currentUser.callsign} excluiu a conquista: ${a.title}`);
            showToast('Conquista excluída', 'info');
            refreshAchievements();
        } catch (err) { console.error(err); showToast(err?.message || 'Não foi possível excluir a conquista.', 'error'); }
    }

    function getManualAchievementStageV23(achievementId, userId) {
        // V31: o estágio manual fica no próprio documento da conquista.
        // Isso evita depender de uma coleção nova no Firestore e elimina
        // erros de permissão em projetos cujas regras antigas ainda estão publicadas.
        const achievement = (getStore(DB_ACHIEVEMENTS) || []).find(a => String(a.id) === String(achievementId));
        const embedded = achievement?.progressByUser?.[String(userId)];
        if (embedded != null) {
            const value = typeof embedded === 'object' ? embedded.value : embedded;
            if (Number.isFinite(Number(value))) return Math.max(0, Number(value));
        }

        // Compatibilidade com validações antigas e registros V23-V30.
        const records = getStore(DB_ACHIEVEMENT_PROGRESS) || [];
        const manual = records.find(r =>
            String(r.achievementId||'') === String(achievementId||'') &&
            String(r.userId||'') === String(userId||'') &&
            r.stageOverride === true
        );
        if (manual) return Math.max(0, Number(manual.stageValue)||0);

        const gameIds = new Set(records.filter(r =>
            String(r.achievementId||'') === String(achievementId||'') &&
            String(r.userId||'') === String(userId||'') &&
            r.stageOverride !== true &&
            r.gameId
        ).map(r=>String(r.gameId)));
        return gameIds.size;
    }

    function openAchievementMembers(id) {
        if (String(currentUser.role||'').toLowerCase() !== 'admin') { showToast('Apenas ADMIN pode gerenciar o progresso das conquistas', 'error'); return; }
        const a = (getStore(DB_ACHIEVEMENTS) || []).find(x => String(x.id) === String(id));
        if (!a) return;
        managingAchievementId = id;
        const target = Math.max(1, Number(a.progressTarget || a.target || 1));
        const isTenure = a.progressMetric === 'team_tenure_years';
        achievementMembersTitle.textContent = `Concluintes e progresso • ${a.title}`;
        const users = (getStore(DB_USERS) || []).slice().sort((x,y) => String(x.callsign || '').localeCompare(String(y.callsign || '')));
        const completed = new Set([...(a.completedBy || []).map(String), ...(getStore(DB_ACHIEVEMENT_AWARDS) || []).filter(x => String(x.achievementId || '') === String(id)).map(x => String(x.userId || ''))]);

        achievementMembersList.innerHTML = users.length ? users.map(u => {
            const automatic = isTenure ? getAchievementProgressV19(a,u) : null;
            const current = isTenure ? (automatic?.current ?? 0) : Math.min(target,getManualAchievementStageV23(id,u.id));
            const done = completed.has(String(u.id)) || current >= target;
            return `<div class="achievement-member-option achievement-member-stage-v23 ${done?'is-complete':''}" data-user-id="${escapeHtml(String(u.id))}">
                <input class="achievement-member-complete-v23" type="checkbox" value="${escapeHtml(String(u.id))}" ${done?'checked':''} ${isTenure?'disabled':''} aria-label="Conquista concluída por ${escapeHtml(u.callsign||u.name||'operador')}">
                <span class="achievement-member-avatar">${u.avatar ? `<img src="${u.avatar}" alt="" loading="lazy">` : escapeHtml((u.callsign || '?').charAt(0))}</span>
                <span class="achievement-member-label"><strong>${escapeHtml(u.callsign || 'SEM CALLSIGN')}</strong><small>${escapeHtml(u.name || '')}</small></span>
                <div class="achievement-stage-control-v23">
                    <span>PROGRESSO</span>
                    ${isTenure
                        ? `<strong>${current} / ${target} anos</strong><small>Automático por tempo de equipe</small>`
                        : `<div class="achievement-stage-input-v23"><button type="button" class="stage-step-v23" data-step="-1" aria-label="Diminuir progresso">−</button><input type="number" class="achievement-stage-value-v23" min="0" max="${target}" value="${current}" data-original="${current}" aria-label="Estágio atual"><span>/ ${target}</span><button type="button" class="stage-step-v23" data-step="1" aria-label="Aumentar progresso">+</button></div>`
                    }
                </div>
                <span class="achievement-member-check">✓</span>
            </div>`;
        }).join('') : '<p class="empty-state">Nenhum operador encontrado.</p>';

        achievementMembersList.querySelectorAll('.stage-step-v23').forEach(btn => btn.addEventListener('click',()=>{
            const row=btn.closest('.achievement-member-stage-v23'), input=row?.querySelector('.achievement-stage-value-v23');
            if(!input)return;
            const next=Math.max(0,Math.min(target,(Number(input.value)||0)+Number(btn.dataset.step||0)));
            input.value=next;
            const check=row.querySelector('.achievement-member-complete-v23');
            if(check) check.checked=next>=target;
            row.classList.toggle('is-complete',next>=target);
        }));
        achievementMembersList.querySelectorAll('.achievement-stage-value-v23').forEach(input => input.addEventListener('input',()=>{
            input.value=Math.max(0,Math.min(target,Number(input.value)||0));
            const row=input.closest('.achievement-member-stage-v23'), check=row?.querySelector('.achievement-member-complete-v23');
            if(check) check.checked=Number(input.value)>=target;
            row?.classList.toggle('is-complete',Number(input.value)>=target);
        }));
        achievementMembersList.querySelectorAll('.achievement-member-complete-v23:not(:disabled)').forEach(check => check.addEventListener('change',()=>{
            const row=check.closest('.achievement-member-stage-v23'), input=row?.querySelector('.achievement-stage-value-v23');
            if(input && check.checked) input.value=target;
            else if(input && !check.checked && Number(input.value)>=target) input.value=Math.max(0,target-1);
            row?.classList.toggle('is-complete',check.checked);
        }));
        achievementMembersModal.classList.remove('hidden');
    }

    if (btnCancelAchievementMembers) btnCancelAchievementMembers.addEventListener('click', () => { managingAchievementId = null; achievementMembersModal.classList.add('hidden'); });
    if (achievementMembersModal) achievementMembersModal.addEventListener('click', e => { if (e.target === achievementMembersModal) { managingAchievementId = null; achievementMembersModal.classList.add('hidden'); } });

    if (btnSaveAchievementMembers) btnSaveAchievementMembers.addEventListener('click', async () => {
        if (String(currentUser.role||'').toLowerCase() !== 'admin' || !managingAchievementId) return;
        const achievements = getStore(DB_ACHIEVEMENTS) || [];
        const a = achievements.find(x => String(x.id) === String(managingAchievementId));
        if (!a) return;
        const target=Math.max(1,Number(a.progressTarget||a.target||1));
        const isTenure=a.progressMetric==='team_tenure_years';
        const old = new Set((a.completedBy || []).map(String));
        const rows=[...achievementMembersList.querySelectorAll('.achievement-member-stage-v23')];
        let selected=rows.filter(row=>row.querySelector('.achievement-member-complete-v23')?.checked).map(row=>String(row.dataset.userId));
        btnSaveAchievementMembers.disabled = true;
        try {
            // Manual stage is a single override document per operator/conquest.
            // It coexists with historical per-match validations without manufacturing fake games.
            if (!isTenure) {
                for (const row of rows) {
                    const userId=String(row.dataset.userId||'');
                    const input=row.querySelector('.achievement-stage-value-v23');
                    if(!input||!userId)continue;
                    const value=Math.max(0,Math.min(target,Number(input.value)||0));
                    const original=Math.max(0,Number(input.dataset.original)||0);
                    if(value!==original) {
                        if(window.AsgardCloud?.setAchievementStage) {
                            await window.AsgardCloud.setAchievementStage(managingAchievementId,userId,value,target);
                        }
                        const now=new Date().toISOString();
                        a.progressByUser = { ...(a.progressByUser || {}) };
                        a.progressByUser[userId] = { value, target, updatedAt:now, updatedBy:String(currentUser.id) };

                        // Espelho local de compatibilidade. Não é mais necessário gravá-lo
                        // na coleção achievement_progress para o ajuste manual funcionar.
                        let records=(getStore(DB_ACHIEVEMENT_PROGRESS)||[]).filter(r=>!(String(r.achievementId||'')===String(managingAchievementId)&&String(r.userId||'')===userId&&r.stageOverride===true));
                        records.push({id:`stage_${managingAchievementId}_${userId}`,achievementId:String(managingAchievementId),userId,stageOverride:true,stageValue:value,target,updatedAt:now,updatedBy:String(currentUser.id)});
                        setStore(DB_ACHIEVEMENT_PROGRESS,records);
                    }
                }
            }

            // V32: não tenta regravar concluintes quando o ADMIN alterou apenas
            // o estágio (ex.: 0/5 -> 1/5). Isso evita disparar gravações extras em
            // achievement_awards/profiles sem necessidade.
            const previousRecipients=[...old].sort();
            const nextRecipients=[...new Set(selected.map(String))].sort();
            const recipientsChanged = previousRecipients.length !== nextRecipients.length ||
                previousRecipients.some((id,idx)=>id !== nextRecipients[idx]);

            if (recipientsChanged) {
                if (window.AsgardCloud?.setAchievementRecipients) {
                    await window.AsgardCloud.setAchievementRecipients(managingAchievementId, nextRecipients);
                }
                a.completedBy=nextRecipients;
            }
            a.updatedAt=new Date().toISOString();
            setStore(DB_ACHIEVEMENTS,achievements);

            const users=getStore(DB_USERS)||[];
            nextRecipients.filter(id=>!old.has(id)).forEach(id=>{const u=users.find(x=>String(x.id)===id);if(u)addActivity(`${u.callsign} conquistou a insígnia: ${a.title}`);});
            managingAchievementId=null;achievementMembersModal.classList.add('hidden');
            showToast('Progresso dos operadores salvo!', 'success');
            refreshAchievements();renderNotificationCenterV2();
            const active=document.querySelector('.page:not(.hidden)');if(active?.id==='page-profile')refreshProfile();
        } catch(err){
            console.error(err);
            const raw=String(err?.message||'');
            const permission=/permission|insufficient/i.test(raw);
            showToast(permission ? 'Permissão do Firestore recusada. Atualize esta versão e tente novamente como ADMIN.' : (raw||'Não foi possível salvar o progresso.'),'error');
        }
        finally{btnSaveAchievementMembers.disabled=false;}
    });

    // ===== CHAT =====
    let lastMessageCount = 0;
    let lastChatRenderSignature = '';
    let knownChatMessageIds = new Set();
    let chatNotificationBaselineReady = false;
    let chatNotificationSessionStartedAt = '';
    let mentionQueryState = null;

    // ===== CHAT EMBER PARTICLES =====
    let chatEmbersCreated = false;
    function createChatEmbers() {
        const container = $('chat-embers');
        if (!container) return;
        if (chatEmbersCreated) return;
        chatEmbersCreated = true;
        container.innerHTML = '';

        const glowTypes = ['cyan-glow', 'bright-cyan', 'warm-glow', 'warm-bright', 'dim-glow', 'dim-warm'];
        const total = 35;

        for (let i = 0; i < total; i++) {
            const ember = document.createElement('div');
            const glowType = glowTypes[Math.floor(Math.random() * glowTypes.length)];
            ember.className = 'ember ' + glowType;

            // Random position — more concentrated toward center
            const centerBias = Math.random() * 0.6 + 0.2; // 20%-80% range, biased center
            ember.style.left = (centerBias * 100) + '%';

            // Size: 2-6px, larger for bright variants
            let size;
            if (glowType === 'bright-cyan' || glowType === 'warm-bright') {
                size = 3 + Math.random() * 4; // 3-7px
            } else if (glowType === 'cyan-glow' || glowType === 'warm-glow') {
                size = 2 + Math.random() * 3; // 2-5px
            } else {
                size = 1.5 + Math.random() * 2; // 1.5-3.5px
            }
            ember.style.width = size + 'px';
            ember.style.height = size + 'px';

            // Timing — varied speeds for depth
            const dur = 3 + Math.random() * 7; // 3-10s
            const delay = Math.random() * 10;
            ember.style.setProperty('--ember-dur', dur + 's');
            ember.style.setProperty('--ember-delay', delay + 's');
            ember.style.animationDelay = delay + 's';

            // Twinkle speed — different from float for organic feel
            const twinkleDur = 1.5 + Math.random() * 2.5; // 1.5-4s
            const twinkleDelay = Math.random() * 3;
            ember.style.setProperty('--twinkle-dur', twinkleDur + 's');
            ember.style.setProperty('--twinkle-delay', twinkleDelay + 's');

            // Opacity based on glow type
            if (glowType === 'bright-cyan') {
                ember.style.setProperty('--ember-max-opacity', (0.5 + Math.random() * 0.3).toFixed(2));
                ember.style.setProperty('--ember-mid-opacity', (0.2 + Math.random() * 0.15).toFixed(2));
            } else if (glowType === 'cyan-glow') {
                ember.style.setProperty('--ember-max-opacity', (0.4 + Math.random() * 0.25).toFixed(2));
                ember.style.setProperty('--ember-mid-opacity', (0.12 + Math.random() * 0.12).toFixed(2));
            } else if (glowType === 'warm-bright') {
                ember.style.setProperty('--ember-max-opacity', (0.4 + Math.random() * 0.25).toFixed(2));
                ember.style.setProperty('--ember-mid-opacity', (0.15 + Math.random() * 0.12).toFixed(2));
            } else if (glowType === 'warm-glow') {
                ember.style.setProperty('--ember-max-opacity', (0.3 + Math.random() * 0.2).toFixed(2));
                ember.style.setProperty('--ember-mid-opacity', (0.08 + Math.random() * 0.1).toFixed(2));
            } else if (glowType === 'dim-glow') {
                ember.style.setProperty('--ember-max-opacity', (0.2 + Math.random() * 0.15).toFixed(2));
                ember.style.setProperty('--ember-mid-opacity', (0.05 + Math.random() * 0.08).toFixed(2));
            } else {
                ember.style.setProperty('--ember-max-opacity', (0.18 + Math.random() * 0.15).toFixed(2));
                ember.style.setProperty('--ember-mid-opacity', (0.04 + Math.random() * 0.06).toFixed(2));
            }

            // Drift — multi-directional organic movement
            const driftX = (Math.random() > 0.5 ? '' : '-') + (5 + Math.random() * 25);
            const driftX2 = (Math.random() > 0.5 ? '' : '-') + (3 + Math.random() * 18);
            ember.style.setProperty('--ember-drift-x', driftX + 'px');
            ember.style.setProperty('--ember-drift-x2', driftX2 + 'px');

            container.appendChild(ember);
        }
    }

    function getLatestChatDate(messages = getStore(DB_MESSAGES) || []) {
        return messages.reduce((latest, m) => {
            const d = String(m?.date || '');
            return d > latest ? d : latest;
        }, '');
    }

    function getUnreadChatMessages() {
        if (!currentUser) return [];
        const messages = getStore(DB_MESSAGES) || [];
        const lastRead = String(currentUser.chatLastReadAt || '');
        // O badge/notificação do Chat é exclusivo para menções diretas ao operador.
        // Mensagens comuns continuam aparecendo no histórico, mas não geram aviso.
        return messages.filter(m =>
            m.userId !== currentUser.id &&
            String(m.date || '') > lastRead &&
            Array.isArray(m.mentions) &&
            m.mentions.includes(currentUser.id)
        );
    }

    function updateChatBadge() {
        if (!chatBadge || !currentUser) return;
        if (!$('page-chat').classList.contains('hidden')) {
            chatBadge.classList.add('hidden');
            chatBadge.textContent = '0';
            return;
        }
        const unread = getUnreadChatMessages().length;
        if (unread > 0) {
            chatBadge.textContent = unread > 99 ? '99+' : String(unread);
            chatBadge.classList.remove('hidden');
        } else {
            chatBadge.textContent = '0';
            chatBadge.classList.add('hidden');
        }
    }

    async function markChatAsRead() {
        if (!currentUser) return;
        const latest = getLatestChatDate();
        chatBadge?.classList.add('hidden');
        if (chatBadge) chatBadge.textContent = '0';
        if (!latest || String(currentUser.chatLastReadAt || '') >= latest) return;
        currentUser.chatLastReadAt = latest;
        if (window.AsgardCloud?.updateChatLastRead) {
            await window.AsgardCloud.updateChatLastRead(latest);
        }
    }

    function refreshChat() {
        const messages = getStore(DB_MESSAGES) || [];
        const users = getStore(DB_USERS) || [];
        const signature = messages.map(m => `${m.id || ''}:${m.date || ''}`).join('|');
        const distanceFromBottom = Math.max(0, chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight);
        const shouldStickToBottom = distanceFromBottom < 90 || lastChatRenderSignature === '';

        // Do not rely only on array length: after the 200-message realtime limit is reached,
        // a new message replaces the oldest one and the length remains exactly 200.
        if (signature !== lastChatRenderSignature || messages.length === 0) {
            renderMessages(messages, shouldStickToBottom);
            lastMessageCount = messages.length;
            lastChatRenderSignature = signature;
        }

        const onlineUsers = users.filter(isUserOnline);
        chatOnlineUsers.innerHTML = onlineUsers.map(u =>
            `<span class="online-user-dot">${escapeHtml(u.callsign)}</span>`
        ).join('');

        updateChatBadge();
    }

    function formatChatText(text) {
        const safe = escapeHtml(text || '');
        const users = getStore(DB_USERS) || [];
        const callsigns = new Map(users.map(u => [String(u.callsign || '').toUpperCase(), u]));
        return safe.replace(/@([A-Za-z0-9_-]+)/g, (full, raw) => {
            if (String(raw).toLowerCase() === 'todos') {
                return `<span class="chat-mention chat-mention-all">@todos</span>`;
            }
            const u = callsigns.get(String(raw).toUpperCase());
            if (!u) return full;
            const mine = u.id === currentUser?.id ? ' mention-me' : '';
            return `<span class="chat-mention${mine}" data-user-id="${escapeHtml(u.id)}">@${escapeHtml(u.callsign)}</span>`;
        });
    }

    function renderMessages(messages, stickToBottom = true) {
        const previousScrollTop = chatMessages.scrollTop;
        const previousScrollHeight = chatMessages.scrollHeight;
        chatMessages.innerHTML = '<div class="chat-system-msg"><span>Bem-vindo ao chat da equipe!</span></div>';

        [...messages]
            .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
            .slice(-200)
            .forEach(msg => {
            const isOwn = msg.userId === currentUser.id;
            const user = msg.callsign || '?';
            const mentionsMe = Array.isArray(msg.mentions) && msg.mentions.includes(currentUser.id);

            const msgEl = document.createElement('div');
            msgEl.className = `chat-msg ${isOwn ? 'own' : ''} ${mentionsMe ? 'mentions-me' : ''}`;
            msgEl.innerHTML = `
                <div class="chat-msg-avatar">${escapeHtml(user.charAt(0))}</div>
                <div class="chat-msg-content">
                    ${!isOwn ? `<div class="chat-msg-sender">${escapeHtml(user)}</div>` : ''}
                    ${msg.text ? `<div class="chat-msg-text">${formatChatText(msg.text)}</div>` : ''}
                    ${renderChatMedia(msg)}
                    <div class="chat-msg-time">${formatTime(new Date(msg.date))}</div>
                </div>
            `;
            chatMessages.appendChild(msgEl);
        });

        if (stickToBottom) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            chatMessages.scrollTop = Math.max(0, previousScrollTop + (chatMessages.scrollHeight - previousScrollHeight));
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function renderChatMedia(msg) {
        if (!msg.mediaUrl) return '';
        const url = escapeHtml(msg.mediaUrl);
        if (msg.type === 'image') return `<a href="${url}" target="_blank" rel="noopener"><img class="chat-media-image" src="${url}" alt="Imagem enviada no chat" loading="lazy"></a>`;
        if (msg.type === 'video') return `<video class="chat-media-video" src="${url}" controls preload="metadata"></video>`;
        if (msg.type === 'audio') return `<audio class="chat-media-audio" src="${url}" controls preload="metadata"></audio>`;
        return `<a class="chat-media-file" href="${url}" target="_blank" rel="noopener">📎 ${escapeHtml(msg.mediaName || 'Arquivo')}</a>`;
    }

    function setChatUploadProgress(percent, label = 'Enviando mídia...') {
        const pct = Math.max(0, Math.min(100, Number(percent || 0)));
        chatUploadStatus?.classList.remove('hidden');
        if (chatUploadLabel) chatUploadLabel.textContent = label;
        if (chatUploadPercent) chatUploadPercent.textContent = `${pct}%`;
        if (chatUploadProgressBar) chatUploadProgressBar.style.width = `${pct}%`;
    }

    function hideChatUploadProgress() {
        chatUploadStatus?.classList.add('hidden');
        if (chatUploadProgressBar) chatUploadProgressBar.style.width = '0%';
        if (chatUploadPercent) chatUploadPercent.textContent = '0%';
    }

    async function sendChatMedia(file) {
        if (!file || !currentUser) return;
        const mime = String(file.type || '').toLowerCase();
        const isImage = mime.startsWith('image/');
        const isVideo = mime.startsWith('video/');
        if (!isImage && !isVideo) {
            showToast('Selecione somente uma foto ou vídeo.', 'error');
            return;
        }
        const maxBytes = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxBytes) {
            showToast(isImage ? 'A imagem deve ter no máximo 10 MB.' : 'O vídeo deve ter no máximo 50 MB.', 'error');
            return;
        }
        if (!window.AsgardCloud?.uploadChatMedia || !window.AsgardCloud?.addMessage) {
            showToast('O envio de mídia requer conexão com o Firebase Storage.', 'error');
            return;
        }

        const text = chatInput.value.trim();
        const mentionData = extractMentions(text);
        const messageId = generateId();
        btnChatAttach.disabled = true;
        btnSendMsg.disabled = true;
        setChatUploadProgress(0, isImage ? 'Enviando foto...' : 'Enviando vídeo...');

        try {
            const uploaded = await window.AsgardCloud.uploadChatMedia(file, messageId, pct => {
                setChatUploadProgress(pct, isImage ? 'Enviando foto...' : 'Enviando vídeo...');
            });
            await window.AsgardCloud.addMessage({
                id: messageId,
                userId: currentUser.id,
                callsign: currentUser.callsign,
                text,
                type: uploaded.type,
                mediaUrl: uploaded.mediaUrl,
                mediaName: uploaded.mediaName,
                mimeType: uploaded.mimeType,
                storagePath: uploaded.storagePath,
                mediaSize: uploaded.size,
                mentions: mentionData.ids,
                mentionCallsigns: mentionData.callsigns,
                date: new Date().toISOString()
            });
            chatInput.value = '';
            hideMentionSuggestions();
            setChatUploadProgress(100, 'Enviado!');
            setTimeout(hideChatUploadProgress, 650);
        } catch (err) {
            console.error('[Chat mídia]', err);
            hideChatUploadProgress();
            showToast(err?.message || 'Não foi possível enviar a mídia.', 'error');
        } finally {
            btnChatAttach.disabled = false;
            btnSendMsg.disabled = false;
            if (chatMediaInput) chatMediaInput.value = '';
            chatInput.focus();
        }
    }

    btnChatAttach?.addEventListener('click', () => {
        if (!currentUser) return;
        chatMediaInput?.click();
    });
    chatMediaInput?.addEventListener('change', () => {
        const file = chatMediaInput.files?.[0];
        if (file) sendChatMedia(file);
    });

    const CHAT_EMOJIS = ['😀','😂','🤣','😊','😍','😎','🤔','😅','😢','😡','👍','👎','👏','🙏','💪','🔥','⚡','🎯','🏆','💀','❤️','💙','✅','❌','📍','🎮','👊','🤝','💥','⭐'];
    if (chatEmojiPicker) {
        chatEmojiPicker.innerHTML = CHAT_EMOJIS.map(e => `<button type="button" class="emoji-choice">${e}</button>`).join('');
        chatEmojiPicker.addEventListener('click', e => {
            const b = e.target.closest('.emoji-choice'); if (!b) return;
            chatInput.value += b.textContent; chatInput.focus();
        });
    }
    btnChatEmoji?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (!chatEmojiPicker) return;
        const opening = chatEmojiPicker.classList.contains('hidden');
        chatEmojiPicker.classList.toggle('hidden');
        if (opening) {
            requestAnimationFrame(() => {
                const r = btnChatEmoji.getBoundingClientRect();
                const pr = chatEmojiPicker.getBoundingClientRect();
                const margin = 10;
                let left = r.left;
                if (left + pr.width > window.innerWidth - margin) left = window.innerWidth - pr.width - margin;
                left = Math.max(margin, left);
                let top = r.top - pr.height - 8;
                if (top < margin) top = Math.min(window.innerHeight - pr.height - margin, r.bottom + 8);
                chatEmojiPicker.style.left = `${left}px`;
                chatEmojiPicker.style.top = `${Math.max(margin, top)}px`;
            });
        }
    });
    chatEmojiPicker?.addEventListener('click', ev => ev.stopPropagation());
    document.addEventListener('click', () => chatEmojiPicker?.classList.add('hidden'));
    window.addEventListener('resize', () => chatEmojiPicker?.classList.add('hidden'));
    window.addEventListener('scroll', () => chatEmojiPicker?.classList.add('hidden'), true);

    function getMentionContext() {
        if (!chatInput) return null;
        const caret = chatInput.selectionStart ?? chatInput.value.length;
        const before = chatInput.value.slice(0, caret);
        const match = before.match(/(?:^|\s)@([A-Za-z0-9_-]*)$/);
        if (!match) return null;
        return { query: match[1], start: caret - match[1].length - 1, end: caret };
    }

    function hideMentionSuggestions() {
        mentionQueryState = null;
        chatMentionSuggestions?.classList.add('hidden');
        if (chatMentionSuggestions) chatMentionSuggestions.innerHTML = '';
    }

    function refreshMentionSuggestions() {
        if (!chatMentionSuggestions || !currentUser) return;
        const ctx = getMentionContext();
        if (!ctx) { hideMentionSuggestions(); return; }
        const q = ctx.query.toUpperCase();
        const users = (getStore(DB_USERS) || [])
            .filter(u => u.id !== currentUser.id && String(u.callsign || '').toUpperCase().includes(q))
            .slice(0, 8);
        const showEveryone = 'TODOS'.includes(q);
        if (!users.length && !showEveryone) { hideMentionSuggestions(); return; }
        mentionQueryState = ctx;
        const everyoneOption = showEveryone ? `
            <button type="button" class="chat-mention-option chat-mention-option-all" data-user-id="__all__" data-callsign="todos">
                <span class="mention-option-avatar">📣</span>
                <span><strong>@todos</strong><small>Marcar todos os membros</small></span>
            </button>` : '';
        chatMentionSuggestions.innerHTML = everyoneOption + users.map(u => `
            <button type="button" class="chat-mention-option" data-user-id="${escapeHtml(u.id)}" data-callsign="${escapeHtml(u.callsign)}">
                <span class="mention-option-avatar">${escapeHtml(String(u.callsign || '?').charAt(0))}</span>
                <span>@${escapeHtml(u.callsign)}</span>
            </button>`).join('');
        chatMentionSuggestions.classList.remove('hidden');
    }

    chatInput?.addEventListener('input', refreshMentionSuggestions);
    chatInput?.addEventListener('click', refreshMentionSuggestions);
    chatMentionSuggestions?.addEventListener('mousedown', e => e.preventDefault());
    chatMentionSuggestions?.addEventListener('click', e => {
        const option = e.target.closest('.chat-mention-option');
        if (!option || !mentionQueryState) return;
        const callsign = option.dataset.callsign || '';
        const value = chatInput.value;
        const replacement = `@${callsign} `;
        chatInput.value = value.slice(0, mentionQueryState.start) + replacement + value.slice(mentionQueryState.end);
        const caret = mentionQueryState.start + replacement.length;
        hideMentionSuggestions();
        chatInput.focus();
        chatInput.setSelectionRange(caret, caret);
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.chat-input-area')) hideMentionSuggestions();
    });

    function extractMentions(text) {
        const users = getStore(DB_USERS) || [];
        const byCallsign = new Map(users.map(u => [String(u.callsign || '').toUpperCase(), u]));
        const ids = [];
        const callsigns = [];
        const rawText = String(text || '');
        const mentionsEveryone = /(^|\s)@todos(?=\s|$|[.,!?;:])/i.test(rawText);

        if (mentionsEveryone) {
            users.forEach(u => {
                if (!u?.id || String(u.id) === String(currentUser?.id)) return;
                if (!ids.includes(u.id)) ids.push(u.id);
            });
            callsigns.push('@todos');
        }

        for (const match of rawText.matchAll(/@([A-Za-z0-9_-]+)/g)) {
            if (String(match[1]).toLowerCase() === 'todos') continue;
            const u = byCallsign.get(String(match[1]).toUpperCase());
            if (u && !ids.includes(u.id)) { ids.push(u.id); callsigns.push(u.callsign); }
        }
        return { ids, callsigns, everyone: mentionsEveryone };
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || !currentUser) return;
        const mentionData = extractMentions(text);

        const message = {
            id: generateId(),
            userId: currentUser.id,
            callsign: currentUser.callsign,
            text,
            mentions: mentionData.ids,
            mentionCallsigns: mentionData.callsigns,
            date: new Date().toISOString()
        };

        hideMentionSuggestions();
        chatInput.value = '';
        btnSendMsg.disabled = true;
        try {
            if (window.AsgardCloud?.addMessage) {
                await window.AsgardCloud.addMessage(message);
            } else {
                const messages = getStore(DB_MESSAGES) || [];
                messages.push(message);
                if (messages.length > 200) messages.splice(0, messages.length - 200);
                setStore(DB_MESSAGES, messages);
                refreshChat();
            }
        } catch (err) {
            console.error('[Chat]', err);
            chatInput.value = text;
            showToast('Não foi possível enviar a mensagem. Verifique sua conexão.', 'error');
        } finally {
            btnSendMsg.disabled = false;
            chatInput.focus();
        }
    }

    btnSendMsg.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (!chatMentionSuggestions?.classList.contains('hidden') && e.key === 'Escape') {
            hideMentionSuggestions();
            return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function messageActuallyMentionsCurrentUser(msg) {
        if (!currentUser || !msg || msg.userId === currentUser.id) return false;
        if (!Array.isArray(msg.mentions) || !msg.mentions.includes(currentUser.id)) return false;

        // Segurança extra: a notificação é válida quando o texto contém
        // @CALLSIGN do operador OU a menção coletiva @todos.
        const messageText = String(msg.text || '');
        if (/(^|\s)@todos(?=\s|$|[.,!?;:])/i.test(messageText)) return true;
        const callsign = String(currentUser.callsign || '').trim();
        if (!callsign) return false;
        const escaped = callsign.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const mentionRx = new RegExp(`(^|\\s)@${escaped}(?=\\s|$|[.,!?;:])`, 'i');
        return mentionRx.test(messageText);
    }

    function notifyMention(msg) {
        if (!chatNotificationBaselineReady) return;
        if (!messageActuallyMentionsCurrentUser(msg)) return;
        // Nunca notificar mensagens anteriores ao início desta sessão do app.
        if (chatNotificationSessionStartedAt && String(msg.date || '') <= chatNotificationSessionStartedAt) return;

        const isEveryoneMention = /(^|\s)@todos(?=\s|$|[.,!?;:])/i.test(String(msg.text || ''));
        showToast(isEveryoneMention ? `${msg.callsign || 'Um operador'} marcou @todos no Chat` : `${msg.callsign || 'Um operador'} marcou você no Chat`, 'info');
        if ('Notification' in window && Notification.permission === 'granted') {
            navigator.serviceWorker?.ready.then(reg => reg.showNotification('Filhos de Asgard • menção no Chat', {
                body: `${msg.callsign || 'Operador'}${isEveryoneMention ? ' marcou @todos' : ''}: ${String(msg.text || '').slice(0, 120)}`,
                icon: './icons/icon-192-v17.png',
                badge: './icons/icon-192-v17.png',
                tag: `chat-mention-${msg.id}`,
                data: { page: 'chat' }
            })).catch(() => {});
        }
    }

    function handleIncomingChatSync() {
        const messages = getStore(DB_MESSAGES) || [];

        // O primeiro snapshot depois do login é apenas uma linha de base. Ele pode
        // trazer todo o histórico do Firestore e nunca deve disparar notificações.
        if (!chatNotificationBaselineReady) {
            knownChatMessageIds = new Set(messages.map(m => m.id));
            chatNotificationBaselineReady = true;
            updateChatBadge();
            return;
        }

        for (const msg of messages) {
            if (!knownChatMessageIds.has(msg.id)) notifyMention(msg);
        }
        knownChatMessageIds = new Set(messages.map(m => m.id));
        updateChatBadge();
        if (!$('page-chat').classList.contains('hidden')) {
            refreshChat();
            markChatAsRead().catch(err => console.error('[Chat read]', err));
        }
    }

    function startChatPoll() {
        stopChatPoll();
        const initial = getStore(DB_MESSAGES) || [];
        knownChatMessageIds = new Set(initial.map(m => m.id));
        chatNotificationSessionStartedAt = new Date().toISOString();
        chatNotificationBaselineReady = true;
        lastMessageCount = initial.length;
        lastChatRenderSignature = '';
        updateChatBadge();

        // Remove notificações antigas de menção que tenham ficado no sistema.
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(async reg => {
                const existing = await reg.getNotifications?.({ tag: undefined }) || [];
                existing.forEach(n => {
                    if (String(n.tag || '').startsWith('chat-mention-')) n.close();
                });
            }).catch(() => {});
        }

        // Firestore's realtime message listener updates the badge through
        // handleIncomingChatSync(). A 1.5s polling loop duplicated work and caused
        // unnecessary DOM updates on every device, so no timer is needed here.
        chatPollInterval = null;
    }

    function stopChatPoll() {
        if (chatPollInterval) {
            clearInterval(chatPollInterval);
            chatPollInterval = null;
        }
    }

    // ===== GAMES =====
    function refreshGames() {
        const games = getStore(DB_GAMES) || [];
        const allUsers = getStore(DB_USERS) || [];
        const filtered = currentFilter === 'all'
            ? games
            : games.filter(g => g.type === currentFilter);

        const sorted = [...filtered].sort((a, b) =>
            new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'))
        );

        if (sorted.length === 0) {
            gamesList.innerHTML = '<p class="empty-state">Nenhum jogo encontrado</p>';
            return;
        }

        gamesList.innerHTML = sorted.map(g => {
            const isPast = new Date(g.date + 'T' + (g.time || '23:59')) < new Date();
            const confirmedIds = g.confirmed || [];
            const checkedInIds = g.checkedIn || [];
            const confirmedCount = confirmedIds.length;
            const checkedInCount = checkedInIds.length;
            const isConfirmed = confirmedIds.includes(currentUser.id);

            // Build confirmed members list
            const guestConfirmations = getStore('asgard_guest_confirmations') || [];
            const confirmedMembers = confirmedIds.map(uid => {
                const u = allUsers.find(u => u.id === uid);
                const guest = guestConfirmations.find(x => String(x.gameId) === String(g.id) && String(x.userId) === String(uid));
                const isCheckedIn = checkedInIds.includes(uid);
                const callsign = u ? u.callsign : (guest?.name || 'Convidado');
                const name = u ? u.name : '';
                const isGuestEntry = !u && !!guest;
                const isAdmin = String(currentUser.role||'').toLowerCase() === 'admin';
                return `
                    <div class="confirmed-member ${isCheckedIn ? 'checked-in' : ''}">
                        <div class="confirmed-member-info">
                            <span class="confirmed-member-callsign">${escapeHtml(callsign)}${isGuestEntry ? '<span class="guest-confirmed-badge">Convidado</span>' : ''}</span>
                            ${name ? `<span class="confirmed-member-name">${escapeHtml(name)}</span>` : ''}
                        </div>
                        <div class="confirmed-member-status">
                            ${isCheckedIn ? (isAdmin ? `<button class="btn-checkin checkin-btn" data-game="${g.id}" data-user="${uid}" title="Clique para desfazer o check-in">✓ Check-in</button>` : '<span class="checkin-badge checkin-done">✓ Check-in</span>') : (isAdmin ? `<button class="btn-checkin checkin-btn" data-game="${g.id}" data-user="${uid}">Check-in</button>` : '<span class="checkin-badge checkin-pending">Aguardando</span>')}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="game-card ${isPast ? 'opacity:0.6' : ''}" data-game-id="${g.id}">
                    <div class="game-card-header">
                        ${g.completed ? '<span class="game-completed-badge">✓ OPERAÇÃO CONCLUÍDA</span>' : ''}
                        <div>
                            <span class="game-type-badge ${g.type}">${g.type.toUpperCase()}</span>
                            <div class="game-title" style="margin-top:6px">${escapeHtml(g.title)}</div>
                        </div>
                    </div>
                    <div class="game-meta">
                        <span class="game-meta-item"><span class="meta-icon">📅</span> ${formatDate(g.date)}</span>
                        <span class="game-meta-item"><span class="meta-icon">⏰</span> ${g.time || '—'}</span>
                        <span class="game-meta-item"><span class="meta-icon">📍</span> ${escapeHtml(g.location || '—')}</span>
                    </div>
                    ${g.description ? `<div class="game-description">${escapeHtml(g.description)}</div>` : ''}
                    <div class="game-confirmed-count">✅ ${confirmedCount} confirmados · <span class="checkedin-count">🏁 ${checkedInCount} check-in</span> · <span class="game-unlimited-badge">∞ Sem limite de operadores</span></div>
                    ${confirmedCount > 0 ? `
                        <div class="game-confirmed-list">
                            <div class="confirmed-list-header">Operadores confirmados</div>
                            ${confirmedMembers}
                        </div>
                    ` : ''}
                    <div class="game-actions">
                        ${!g.completed ? `
                            ${(() => {
                                return `<button class="btn-secondary confirm-game-btn" data-id="${g.id}" ${isConfirmed ? 'style="border-color:var(--success);color:var(--success)"' : ''}>
                                    ${isConfirmed ? '✓ Confirmado' : 'Confirmar Presença'}
                                </button>`;
                            })()}
                        ` : ''}
                        ${String(currentUser.role||'').toLowerCase() === 'admin' ? `
                            <button class="btn-secondary complete-game-btn" data-id="${g.id}">${g.completed ? 'Reabrir' : 'Concluir Operação'}</button>
                            <button class="btn-secondary edit-game-btn" data-id="${g.id}">Editar</button>
                            <button class="btn-danger delete-game-btn" data-id="${g.id}">Excluir</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Event listeners
        gamesList.querySelectorAll('.confirm-game-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleConfirmGame(btn.dataset.id));
        });

        gamesList.querySelectorAll('.complete-game-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleGameCompletedV2(btn.dataset.id));
        });

        gamesList.querySelectorAll('.edit-game-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditGame(btn.dataset.id));
        });

        gamesList.querySelectorAll('.delete-game-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteGame(btn.dataset.id));
        });

        gamesList.querySelectorAll('.checkin-btn').forEach(btn => {
            btn.addEventListener('click', () => checkinMember(btn.dataset.game, btn.dataset.user));
        });
    }

    async function toggleConfirmGame(gameId) {
        const game = (getStore(DB_GAMES) || []).find(g => g.id === gameId);
        if (!game) return;
        if (game.completed) { showToast('Esta operação já foi concluída.', 'info'); return; }
        try {
            if (window.AsgardCloud?.toggleGameConfirmation) {
                const confirmedNow = await window.AsgardCloud.toggleGameConfirmation(gameId, currentUser.role === 'guest' ? currentUser.name : '');
                if (confirmedNow) {
                    if (currentUser.role !== 'guest') addActivity(`${currentUser.callsign} confirmou presença em ${game.title}`);
                    showToast('Presença confirmada!', 'success');
                } else {
                    showToast('Presença cancelada', 'info');
                }
            } else {
                if (!game.confirmed) game.confirmed = [];
                if (!game.checkedIn) game.checkedIn = [];
                const idx = game.confirmed.indexOf(currentUser.id);
                if (idx >= 0) {
                    if (game.checkedIn.includes(currentUser.id) && String(currentUser.role||'').toLowerCase() !== 'admin') {
                        showToast('Seu check-in já foi realizado. Solicite ao ADMIN para alterar a presença.', 'info');
                        return;
                    }
                    game.confirmed.splice(idx, 1);
                    showToast('Presença cancelada', 'info');
                } else {
                    game.confirmed.push(currentUser.id);
                    addActivity(`${currentUser.callsign} confirmou presença em ${game.title}`);
                    showToast('Presença confirmada!', 'success');
                }
                setStore(DB_GAMES, getStore(DB_GAMES) || []);
            }
        } catch (err) {
            const code = String(err?.code || '').toLowerCase();
            const message = String(err?.message || '');
            if (code.includes('resource-exhausted') || /quota\s*(exceeded|excedida|esgotada)/i.test(message)) {
                showToast('A cota de gravações do Firebase está temporariamente esgotada. A confirmação ficará disponível quando a cota do projeto for renovada.', 'error');
            } else {
                showToast(message || 'Não foi possível atualizar sua presença.', 'error');
            }
        }
    }

    async function checkinMember(gameId, userId) {
        if (String(currentUser.role||'').toLowerCase() !== 'admin') { showToast('Apenas ADMIN pode fazer check-in', 'error'); return; }
        const game = (getStore(DB_GAMES) || []).find(g => g.id === gameId);
        if (!game) return;
        const users = getStore(DB_USERS) || [];
        const member = users.find(u => u.id === userId);
        const memberName = member ? member.callsign : 'Operador';
        try {
            if (window.AsgardCloud?.setGameCheckin) {
                const checkedNow = await window.AsgardCloud.setGameCheckin(gameId, userId);
                addActivity(checkedNow ? `${memberName} recebeu check-in em ${game.title}` : `${currentUser.callsign} desfez o check-in de ${memberName} em ${game.title}`);
                showToast(checkedNow ? `Check-in de ${memberName} realizado!` : `Check-in de ${memberName} removido`, checkedNow ? 'success' : 'info');
            }
        } catch (err) {
            showToast(err?.message || 'Não foi possível atualizar o check-in.', 'error');
        }
    }

    function openEditGame(gameId) {
        if (String(currentUser.role||'').toLowerCase() !== 'admin') {
            showToast('Apenas ADMIN pode editar partidas', 'error');
            return;
        }
        const game = (getStore(DB_GAMES) || []).find(g => g.id === gameId);
        if (!game) { showToast('Jogo não encontrado', 'error'); return; }
        editingGameId = gameId;
        if (gameModalTitle) gameModalTitle.textContent = 'Editar Jogo';
        btnSaveGame.textContent = 'Salvar Alterações';
        gameType.value = game.type || 'partida';
        gameTitle.value = game.title || '';
        gameDate.value = game.date || '';
        gameTime.value = game.time || '';
        gameLocation.value = game.location || '';
        gameDescription.value = game.description || '';
        createGameModal.classList.remove('hidden');
    }

    async function deleteGame(gameId) {
        if (String(currentUser.role||'').toLowerCase() !== 'admin') { showToast('Apenas ADMIN pode excluir partidas', 'error'); return; }
        const game = (getStore(DB_GAMES) || []).find(g => g.id === gameId);
        if (!game) return;
        if (!confirm(`Excluir definitivamente "${game.title}"?`)) return;
        try {
            if (window.AsgardCloud?.removeGame) await window.AsgardCloud.removeGame(gameId);
            else {
                const games = (getStore(DB_GAMES) || []).filter(g => g.id !== gameId);
                setStore(DB_GAMES, games);
            }
            addActivity(`${currentUser.callsign} cancelou o jogo: ${game.title}`);
            showToast('Jogo excluído', 'info');
        } catch (err) { showToast(err?.message || 'Não foi possível excluir o jogo.', 'error'); }
    }

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            refreshGames();
        });
    });

    // Create game modal
    btnCreateGame.addEventListener('click', () => {
        editingGameId = null;
        if (gameModalTitle) gameModalTitle.textContent = 'Criar Novo Jogo';
        btnSaveGame.textContent = 'Criar';
        gameType.value = 'partida';
        gameTitle.value = '';
        gameLocation.value = '';
        gameDescription.value = '';
        createGameModal.classList.remove('hidden');
        // Default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        gameDate.value = tomorrow.toISOString().split('T')[0];
        gameTime.value = '08:00';
    });

    btnCancelGame.addEventListener('click', () => {
        editingGameId = null;
        createGameModal.classList.add('hidden');
    });

    createGameModal.addEventListener('click', (e) => {
        if (e.target === createGameModal) createGameModal.classList.add('hidden');
    });

    btnSaveGame.addEventListener('click', async () => {
        if (String(currentUser.role||'').toLowerCase() !== 'admin') {
            showToast('Apenas ADMIN pode criar ou editar partidas', 'error');
            return;
        }
        const type = gameType.value;
        const title = gameTitle.value.trim();
        const date = gameDate.value;
        const time = gameTime.value;
        const location = gameLocation.value.trim();
        const description = gameDescription.value.trim();

        if (!title) { showToast('Informe o título do jogo', 'error'); return; }
        if (!date) { showToast('Informe a data', 'error'); return; }

        try {
            if (editingGameId) {
                const game = (getStore(DB_GAMES) || []).find(g => g.id === editingGameId);
                if (!game) { showToast('Jogo não encontrado', 'error'); return; }
                const patch = { type, title, date, time, location, description };
                if (window.AsgardCloud?.updateGame) await window.AsgardCloud.updateGame(editingGameId, patch);
                else Object.assign(game, patch, { updatedAt:new Date().toISOString() });
                addActivity(`${currentUser.callsign} editou ${type}: ${title}`);
                showToast('Jogo atualizado com sucesso!', 'success');
            } else {
                const game = {
                    id: generateId(), type, title, date, time, location, description,
                    createdBy: currentUser.id, confirmed: [], checkedIn: [], completed:false,
                    createdAt: new Date().toISOString()
                };
                if (window.AsgardCloud?.createGame) await window.AsgardCloud.createGame(game);
                else { const games=getStore(DB_GAMES)||[]; games.push(game); setStore(DB_GAMES,games); }
                addActivity(`${currentUser.callsign} criou ${type}: ${title}`);
                showToast('Jogo criado com sucesso!', 'success');
            }
        } catch (err) {
            showToast(err?.message || 'Não foi possível salvar o jogo.', 'error');
            return;
        }

        editingGameId = null;
        gameTitle.value = '';
        gameLocation.value = '';
        gameDescription.value = '';
        if (gameModalTitle) gameModalTitle.textContent = 'Criar Novo Jogo';
        btnSaveGame.textContent = 'Criar';
        createGameModal.classList.add('hidden');
        refreshGames();
    });

    // ===== LOJA =====
    function refreshProducts() {
        const products = getStore(DB_PRODUCTS) || [];
        const searchTerm = productSearch ? productSearch.value.toLowerCase().trim() : '';
        const filtered = products.filter(p => {
            const matchesCategory = currentProductCategory === 'all' || p.categoria === currentProductCategory;
            const matchesSearch = !searchTerm || p.nome.toLowerCase().includes(searchTerm) || (p.descricao && p.descricao.toLowerCase().includes(searchTerm));
            return matchesCategory && matchesSearch;
        });

        const resultsCount = document.getElementById('store-results-count');
        if (resultsCount) resultsCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'produto' : 'produtos'}`;
        if (filtered.length === 0) {
            productsList.innerHTML = '';
            productsEmpty.classList.remove('hidden');
            return;
        }

        productsEmpty.classList.add('hidden');

        const normalizeProductName = (value='') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        const localProductPhoto = (product) => {
            const n = normalizeProductName(product?.nome);
            if (/duracell/.test(n) && /2032/.test(n)) return './assets/product-images/pilha-duracell-2032.webp';
            if (/(a k|ak)/.test(n) && /mid cap/.test(n) && /200/.test(n) && /tan/.test(n)) return './assets/product-images/ak-midcap-200-tan.webp';
            if (/(a k|ak)/.test(n) && /mid cap/.test(n) && /200/.test(n)) return './assets/product-images/ak-midcap-200-preto.webp';
            if (/berserker/.test(n) && /(0 28|028)/.test(n) && /(2 500|2500)/.test(n)) return './assets/product-images/bbs-berserker-028-2500.webp';
            if (/berserker/.test(n) && /(0 28|028)/.test(n) && /(5 000|5000)/.test(n)) return './assets/product-images/bbs-berserker-028-5000.webp';
            return product?.foto || './assets/product-images/produto-restante.webp';
        };

        productsList.innerHTML = filtered.map(p => {
            const productPhoto = localProductPhoto(p);
            const photoHtml = productPhoto
                ? `<img class="product-photo" src="${productPhoto}" alt="${escapeHtml(p.nome)}" loading="lazy" decoding="async">`
                : `<div class="product-photo-placeholder">🛡️</div>`;
            const adminBtns = String(currentUser.role||'').toLowerCase() === 'admin'
                ? `<div class="product-admin-menu-v33">
                       <button type="button" class="product-admin-trigger-v33" data-id="${p.id}" aria-label="Gerenciar produto">⋮</button>
                       <div class="product-admin-popover-v33 hidden" data-menu-id="${p.id}">
                           <button class="btn-edit-product" data-id="${p.id}">Editar</button>
                           <button class="btn-delete-product" data-id="${p.id}">Excluir</button>
                       </div>
                   </div>`
                : '';
            const createdAt = p.createdAt ? new Date(p.createdAt) : null;
            const isNew = createdAt && !Number.isNaN(createdAt.getTime()) && (Date.now() - createdAt.getTime()) < 1000*60*60*24*45;
            return `
                <article class="product-card product-card-v26 product-card-v33" data-product-id="${escapeHtml(String(p.id))}" tabindex="0" role="button" aria-label="Ver ${escapeHtml(p.nome)}">
                    <div class="product-media-v26">
                        ${photoHtml}
                        <div class="product-badges-v33">
                            <span class="product-category product-category-v26">${escapeHtml(p.categoria || 'Outro')}</span>
                            ${isNew ? '<span class="product-status-v33">NOVO</span>' : ''}
                        </div>
                        ${adminBtns}
                        <div class="product-quickview-v33">Ver detalhes</div>
                    </div>
                    <div class="product-info product-info-v26">
                        <div class="product-name">${escapeHtml(p.nome)}</div>
                        <div class="product-desc">${escapeHtml(p.descricao || '')}</div>
                        <div class="product-price-v26">
                            <small>POR</small>
                            <span class="product-price">R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                    <div class="product-card-footer product-card-footer-v26">
                        <button class="btn-add-cart" data-id="${p.id}" data-nome="${escapeHtml(p.nome)}" data-preco="${p.preco}"><span>🛒</span> Adicionar ao carrinho</button>
                    </div>
                </article>
            `;
        }).join('');

        // Attach event listeners for add-to-cart buttons
        productsList.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', () => addToCart(btn.dataset.id, btn.dataset.nome, parseFloat(btn.dataset.preco)));
        });

        // Attach event listeners for admin buttons
        productsList.querySelectorAll('.btn-edit-product').forEach(btn => {
            btn.addEventListener('click', () => editProduct(btn.dataset.id));
        });
        productsList.querySelectorAll('.btn-delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); deleteProduct(btn.dataset.id); });
        });
        productsList.querySelectorAll('.btn-edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => e.stopPropagation());
        });
        productsList.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => e.stopPropagation());
        });
        productsList.querySelectorAll('.product-admin-trigger-v33').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu=productsList.querySelector(`[data-menu-id="${CSS.escape(String(btn.dataset.id))}"]`);
                productsList.querySelectorAll('.product-admin-popover-v33').forEach(m=>{ if(m!==menu)m.classList.add('hidden'); });
                menu?.classList.toggle('hidden');
            });
        });
        const openDetail=(id)=>{
            const product=(getStore(DB_PRODUCTS)||[]).find(x=>String(x.id)===String(id));
            if(!product)return;
            const modal=document.getElementById('product-detail-modal-v33');
            const body=document.getElementById('product-detail-body-v33');
            if(!modal||!body)return;
            const photo=localProductPhoto(product);
            body.innerHTML=`<div class="product-detail-grid-v33">
                <div class="product-detail-media-v33"><img src="${photo}" alt="${escapeHtml(product.nome)}"></div>
                <div class="product-detail-info-v33">
                    <span class="product-detail-category-v33">${escapeHtml(product.categoria||'Outro')}</span>
                    <h2>${escapeHtml(product.nome)}</h2>
                    <p>${escapeHtml(product.descricao||'Produto disponível para membros da equipe.')}</p>
                    <div class="product-detail-price-v33"><small>POR</small><strong>R$ ${Number(product.preco).toFixed(2).replace('.',',')}</strong></div>
                    <button type="button" class="btn-add-cart product-detail-add-v33" data-id="${product.id}" data-nome="${escapeHtml(product.nome)}" data-preco="${product.preco}">🛒 Adicionar ao carrinho</button>
                </div></div>`;
            body.querySelector('.product-detail-add-v33')?.addEventListener('click',e=>{
                const b=e.currentTarget; addToCart(b.dataset.id,b.dataset.nome,parseFloat(b.dataset.preco));
            });
            modal.classList.remove('hidden');
        };
        productsList.querySelectorAll('.product-card-v33').forEach(card=>{
            card.addEventListener('click',e=>{
                if(e.target.closest('button,.product-admin-popover-v33'))return;
                openDetail(card.dataset.productId);
            });
            card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDetail(card.dataset.productId);}});
        });
    }


    document.getElementById('product-detail-close-v33')?.addEventListener('click',()=>document.getElementById('product-detail-modal-v33')?.classList.add('hidden'));
    document.getElementById('product-detail-modal-v33')?.addEventListener('click',(e)=>{if(e.target.id==='product-detail-modal-v33')e.currentTarget.classList.add('hidden');});
    document.getElementById('btn-store-highlight')?.addEventListener('click',()=>document.getElementById('products-list')?.scrollIntoView({behavior:'smooth',block:'start'}));
    document.addEventListener('click',(e)=>{if(!e.target.closest('.product-admin-menu-v33'))document.querySelectorAll('.product-admin-popover-v33').forEach(m=>m.classList.add('hidden'));});

    async function createProduct() {
        const nome = createProductNome.value.trim();
        const descricao = createProductDescricao.value.trim();
        const preco = createProductPreco.value;
        const categoria = createProductCategoria.value;

        if (!nome) { showToast('Informe o nome do produto', 'error'); return; }
        if (!preco || preco < 0) { showToast('Informe um preço válido', 'error'); return; }

        if (String(currentUser.role||'').toLowerCase() !== 'admin') { showToast('Somente o ADMIN pode criar produtos.', 'error'); return; }
        const product = {
            id: generateId(),
            nome: nome,
            descricao: descricao,
            preco: parseFloat(preco),
            categoria: categoria,
            foto: pendingProductPhoto || '',
            createdBy: currentUser.id,
            createdAt: new Date().toISOString()
        };
        try {
            if (window.AsgardCloud?.createProduct) await window.AsgardCloud.createProduct(product);
            else { const products = getStore(DB_PRODUCTS) || []; products.push(product); setStore(DB_PRODUCTS, products); }
        } catch (err) {
            console.error(err);
            showToast('Não foi possível salvar o produto no Firebase.', 'error');
            return;
        }

        addActivity(`${currentUser.callsign} adicionou produto: ${nome}`);
        showToast('Produto salvo e disponível na loja!', 'success');

        // Reset form
        createProductNome.value = '';
        createProductDescricao.value = '';
        createProductPreco.value = '';
        createProductCategoria.value = 'Equipamento';
        createProductFotoInput.value = '';
        createProductFotoPreview.classList.add('hidden');
        createProductFotoPreview.innerHTML = '';
        pendingProductPhoto = null;
        createProductModal.classList.add('hidden');

        refreshProducts();
    }

    function editProduct(productId) {
        if (String(currentUser.role||'').toLowerCase() !== 'admin') return;
        const products = getStore(DB_PRODUCTS) || [];
        const product = products.find(p => p.id === productId);
        if (!product) return;

        editingProductId = productId;
        editProductNome.value = product.nome;
        editProductDescricao.value = product.descricao || '';
        editProductPreco.value = product.preco;
        editProductCategoria.value = product.categoria;

        if (product.foto) {
            editProductFotoPreview.innerHTML = `<img src="${product.foto}" alt="Preview">`;
            editProductFotoPreview.classList.remove('hidden');
        } else {
            editProductFotoPreview.classList.add('hidden');
            editProductFotoPreview.innerHTML = '';
        }
        pendingProductPhoto = product.foto || null;
        editProductFotoInput.value = '';

        editProductModal.classList.remove('hidden');
    }

    async function saveEditProduct() {
        const nome = editProductNome.value.trim();
        const descricao = editProductDescricao.value.trim();
        const preco = editProductPreco.value;
        const categoria = editProductCategoria.value;

        if (!nome) { showToast('Informe o nome do produto', 'error'); return; }
        if (!preco || preco < 0) { showToast('Informe um preço válido', 'error'); return; }

        if (String(currentUser.role||'').toLowerCase() !== 'admin') { showToast('Somente o ADMIN pode editar produtos.', 'error'); return; }
        const products = getStore(DB_PRODUCTS) || [];
        const idx = products.findIndex(p => p.id === editingProductId);
        if (idx < 0) return;
        const patch = { nome, descricao, preco:parseFloat(preco), categoria };
        if (pendingProductPhoto !== null) patch.foto = pendingProductPhoto;
        try {
            if (window.AsgardCloud?.updateProduct) await window.AsgardCloud.updateProduct(editingProductId, patch);
            else { Object.assign(products[idx], patch); setStore(DB_PRODUCTS, products); }
        } catch (err) {
            console.error(err);
            showToast('Não foi possível atualizar o produto.', 'error');
            return;
        }

        addActivity(`${currentUser.callsign} editou produto: ${nome}`);
        showToast('Produto atualizado!', 'success');

        editProductModal.classList.add('hidden');
        editingProductId = null;
        pendingProductPhoto = null;
        refreshProducts();
    }

    async function deleteProduct(productId) {
        if (String(currentUser.role||'').toLowerCase() !== 'admin') return;
        if (!confirm('Excluir este produto?')) return;

        const products = getStore(DB_PRODUCTS) || [];
        const idx = products.findIndex(p => p.id === productId);
        if (idx >= 0) {
            const name = products[idx].nome;
            try {
                if (window.AsgardCloud?.removeProduct) await window.AsgardCloud.removeProduct(productId);
                else { products.splice(idx, 1); setStore(DB_PRODUCTS, products); }
            } catch (err) {
                console.error(err);
                showToast('Não foi possível excluir o produto.', 'error');
                return;
            }
            addActivity(`${currentUser.callsign} excluiu produto: ${name}`);
            showToast('Produto excluído', 'info');
            refreshProducts();
        }
    }

    // Product filter buttons
    productFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            productFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentProductCategory = btn.dataset.category;
            refreshProducts();
        });
    });

    // Product search
    if (productSearch) {
        productSearch.addEventListener('input', () => refreshProducts());
    }

    // Create product modal
    btnCreateProduct.addEventListener('click', () => {
        createProductNome.value = '';
        createProductDescricao.value = '';
        createProductPreco.value = '';
        createProductCategoria.value = 'Equipamento';
        createProductFotoInput.value = '';
        createProductFotoPreview.classList.add('hidden');
        createProductFotoPreview.innerHTML = '';
        pendingProductPhoto = null;
        createProductModal.classList.remove('hidden');
    });

    btnCancelProduct.addEventListener('click', () => {
        createProductModal.classList.add('hidden');
    });

    createProductModal.addEventListener('click', (e) => {
        if (e.target === createProductModal) createProductModal.classList.add('hidden');
    });

    btnSaveProduct.addEventListener('click', () => createProduct());

    // Create product photo upload
    createProductFotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        resizeImage(file, 400, 0.6, (dataUrl) => {
            pendingProductPhoto = dataUrl;
            createProductFotoPreview.innerHTML = `<img src="${dataUrl}" alt="Preview">`;
            createProductFotoPreview.classList.remove('hidden');
        });
    });

    // Edit product modal
    btnCancelEditProduct.addEventListener('click', () => {
        editProductModal.classList.add('hidden');
        editingProductId = null;
    });

    editProductModal.addEventListener('click', (e) => {
        if (e.target === editProductModal) editProductModal.classList.add('hidden');
    });

    btnSaveEditProduct.addEventListener('click', () => saveEditProduct());

    // Edit product photo upload
    editProductFotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        resizeImage(file, 400, 0.6, (dataUrl) => {
            pendingProductPhoto = dataUrl;
            editProductFotoPreview.innerHTML = `<img src="${dataUrl}" alt="Preview">`;
            editProductFotoPreview.classList.remove('hidden');
        });
    });

    // ===== CART =====
    function addToCart(productId, nome, preco) {
        const existing = cart.find(item => item.productId === productId);
        if (existing) {
            existing.qtd++;
        } else {
            cart.push({ productId, nome, preco, qtd: 1 });
        }
        refreshCartBadge();
        showToast(`${nome} adicionado ao carrinho!`, 'success');
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.productId !== productId);
        refreshCartBadge();
        refreshCartModal();
    }

    function updateCartQty(productId, delta) {
        const item = cart.find(i => i.productId === productId);
        if (!item) return;
        item.qtd += delta;
        if (item.qtd <= 0) {
            removeFromCart(productId);
            return;
        }
        refreshCartBadge();
        refreshCartModal();
    }

    function refreshCartBadge() {
        const totalItems = cart.reduce((sum, item) => sum + item.qtd, 0);
        if (totalItems > 0) {
            cartBadge.textContent = totalItems;
            cartBadge.classList.remove('hidden');
            if (cartBadgeLoja) { cartBadgeLoja.textContent = totalItems; cartBadgeLoja.classList.remove('hidden'); }
        } else {
            cartBadge.classList.add('hidden');
            if (cartBadgeLoja) cartBadgeLoja.classList.add('hidden');
        }
    }

    function refreshCartModal() {
        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p class="empty-state">Seu carrinho está vazio.</p>';
            cartTotalEl.textContent = 'R$ 0,00';
            return;
        }

        cartItemsList.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${escapeHtml(item.nome)}</div>
                    <div class="cart-item-price">R$ ${item.preco.toFixed(2)} x ${item.qtd}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="cart-qty-btn" data-id="${item.productId}" data-delta="-1">−</button>
                    <span class="cart-qty-value">${item.qtd}</span>
                    <button class="cart-qty-btn" data-id="${item.productId}" data-delta="1">+</button>
                </div>
                <button class="cart-item-remove" data-id="${item.productId}">Remover</button>
            </div>
        `).join('');

        // Attach qty buttons
        cartItemsList.querySelectorAll('.cart-qty-btn').forEach(btn => {
            btn.addEventListener('click', () => updateCartQty(btn.dataset.id, parseInt(btn.dataset.delta)));
        });
        cartItemsList.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
        });

        const total = cart.reduce((sum, item) => sum + (item.preco * item.qtd), 0);
        cartTotalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    function clearCart() {
        cart = [];
        refreshCartBadge();
        refreshCartModal();
    }

    function openCartModal() {
        refreshCartModal();
        // Pre-fill checkout fields with current user info
        if (currentUser) {
            checkoutNome.value = currentUser.name || '';
            checkoutTelefone.value = '';
            checkoutEndereco.value = '';
            checkoutObservacao.value = '';
        }
        cartModal.classList.remove('hidden');
    }

    // Cart modal events
    cartBadge.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openCartModal();
    });

    if (btnOpenCart) {
        btnOpenCart.addEventListener('click', () => openCartModal());
    }

    btnCancelCart.addEventListener('click', () => {
        cartModal.classList.add('hidden');
    });

    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.classList.add('hidden');
    });

    // Also open cart from Loja nav icon if items in cart
    // (badge click already handles it; nav click goes to page)
    // We add a floating cart button on the Loja page
    const lojaNav = document.querySelector('.nav-item[data-page="loja"]');
    if (lojaNav) {
        lojaNav.addEventListener('dblclick', (e) => {
            e.preventDefault();
            if (cart.length > 0) openCartModal();
        });
    }

    // ===== CHECKOUT / WHATSAPP =====
    function formatWhatsAppMessage(orderData) {
        let msg = `⚔️ *PEDIDO - FILHOS DE ASGARD* ⚔️\n\n`;
        msg += `👤 *Nome:* ${orderData.compradorNome}\n`;
        msg += `📍 *Endereço:* ${orderData.compradorEndereco}\n`;
        msg += `📞 *Telefone:* ${orderData.compradorTelefone}\n`;
        if (orderData.observacao) {
            msg += `📝 *Observação:* ${orderData.observacao}\n`;
        }
        msg += `\n🛒 *ITENS:*\n`;
        msg += `────────────────\n`;
        orderData.items.forEach(item => {
            msg += `• ${item.nome} x${item.qtd} — R$ ${(item.preco * item.qtd).toFixed(2).replace('.', ',')}\n`;
        });
        msg += `────────────────\n`;
        msg += `💰 *TOTAL: R$ ${orderData.total.toFixed(2).replace('.', ',')}*\n\n`;
        msg += `📡 Pedido #${orderData.id}\n`;
        msg += `🕐 ${formatDateTime(orderData.createdAt)}`;
        return msg;
    }

    function openWhatsApp(orderData) {
        const msg = formatWhatsAppMessage(orderData);
        const encoded = encodeURIComponent(msg);
        const url = `https://wa.me/${DEFAULT_WHATSAPP}?text=${encoded}`;
        window.open(url, '_blank');
    }

    function saveOrder(orderData) {
        const orders = getStore(DB_ORDERS) || [];
        orders.push(orderData);
        setStore(DB_ORDERS, orders);
        addActivity(`Novo pedido de ${orderData.compradorNome} — R$ ${orderData.total.toFixed(2).replace('.', ',')}`);
    }

    btnWhatsappCheckout.addEventListener('click', () => {
        if (cart.length === 0) {
            showToast('Seu carrinho está vazio!', 'error');
            return;
        }

        const nome = checkoutNome.value.trim();
        const endereco = checkoutEndereco.value.trim();
        const telefone = checkoutTelefone.value.trim();
        const observacao = checkoutObservacao.value.trim();

        if (!nome) { showToast('Informe seu nome completo', 'error'); return; }
        if (!endereco) { showToast('Informe seu endereço', 'error'); return; }
        if (!telefone) { showToast('Informe seu telefone', 'error'); return; }

        const total = cart.reduce((sum, item) => sum + (item.preco * item.qtd), 0);

        const orderData = {
            id: generateId(),
            items: cart.map(item => ({
                productId: item.productId,
                nome: item.nome,
                preco: item.preco,
                qtd: item.qtd
            })),
            total: total,
            compradorId: currentUser.id,
            compradorCallsign: currentUser.callsign,
            compradorNome: nome,
            compradorEndereco: endereco,
            compradorTelefone: telefone,
            observacao: observacao,
            status: 'Pendente',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        saveOrder(orderData);
        openWhatsApp(orderData);

        clearCart();
        cartModal.classList.add('hidden');
        showToast('Pedido enviado via WhatsApp!', 'success');
    });

    // ===== VENDAS (ADMIN) =====
    function refreshOrderStats() {
        const orders = getStore(DB_ORDERS) || [];
        const totalPedidos = orders.length;
        const receita = orders.filter(o => o.status !== 'Cancelado').reduce((sum, o) => sum + o.total, 0);
        const pendentes = orders.filter(o => o.status === 'Pendente').length;
        const entregues = orders.filter(o => o.status === 'Entregue').length;

        vendasTotalPedidos.textContent = totalPedidos;
        vendasReceita.textContent = `R$ ${receita.toFixed(2).replace('.', ',')}`;
        vendasPendentes.textContent = pendentes;
        vendasEntregues.textContent = entregues;
    }

    function refreshOrders() {
        const orders = getStore(DB_ORDERS) || [];
        const filterStatus = vendasFilterStatus ? vendasFilterStatus.value : 'todos';
        const filtered = filterStatus === 'todos'
            ? orders
            : orders.filter(o => o.status === filterStatus);

        const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (sorted.length === 0) {
            vendasOrdersList.innerHTML = '<p class="empty-state">Nenhum pedido encontrado.</p>';
            return;
        }

        vendasOrdersList.innerHTML = sorted.map(order => {
            const itemsList = order.items.map(item =>
                `• ${item.nome} x${item.qtd} — R$ ${(item.preco * item.qtd).toFixed(2).replace('.', ',')}`
            ).join('<br>');

            return `
                <div class="vendas-order-card">
                    <div class="vendas-order-header">
                        <div>
                            <span class="vendas-order-id">#${order.id.substring(0, 8).toUpperCase()}</span>
                            <span class="vendas-order-date">${formatDateTime(order.createdAt)}</span>
                        </div>
                        <span class="vendas-order-status-badge status-${order.status}">${order.status}</span>
                    </div>
                    <div class="vendas-order-body">
                        <div class="vendas-order-field">
                            <span class="vendas-order-field-label">Comprador</span>
                            <span class="vendas-order-field-value">${escapeHtml(order.compradorNome)} (${escapeHtml(order.compradorCallsign)})</span>
                        </div>
                        <div class="vendas-order-field">
                            <span class="vendas-order-field-label">Telefone</span>
                            <span class="vendas-order-field-value">${escapeHtml(order.compradorTelefone)}</span>
                        </div>
                        <div class="vendas-order-field">
                            <span class="vendas-order-field-label">Endereço</span>
                            <span class="vendas-order-field-value">${escapeHtml(order.compradorEndereco)}</span>
                        </div>
                        <div class="vendas-order-field">
                            <span class="vendas-order-field-label">Atualizado</span>
                            <span class="vendas-order-field-value">${formatDateTime(order.updatedAt)}</span>
                        </div>
                        <div class="vendas-order-items">
                            <span class="vendas-order-field-label">Itens</span>
                            <div class="vendas-order-items-list">${itemsList}</div>
                        </div>
                        ${order.observacao ? `
                        <div class="vendas-order-field">
                            <span class="vendas-order-field-label">Observação</span>
                            <span class="vendas-order-field-value">${escapeHtml(order.observacao)}</span>
                        </div>` : ''}
                    </div>
                    <div class="vendas-order-footer">
                        <span class="vendas-order-total">R$ ${order.total.toFixed(2).replace('.', ',')}</span>
                        <select class="vendas-order-status-select" data-order-id="${order.id}">
                            <option value="Pendente" ${order.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="Confirmado" ${order.status === 'Confirmado' ? 'selected' : ''}>Confirmado</option>
                            <option value="Enviado" ${order.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
                            <option value="Entregue" ${order.status === 'Entregue' ? 'selected' : ''}>Entregue</option>
                            <option value="Cancelado" ${order.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                </div>
            `;
        }).join('');

        // Attach status change listeners
        vendasOrdersList.querySelectorAll('.vendas-order-status-select').forEach(sel => {
            sel.addEventListener('change', () => updateOrderStatus(sel.dataset.orderId, sel.value));
        });
    }

    function updateOrderStatus(orderId, newStatus) {
        const orders = getStore(DB_ORDERS) || [];
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            order.updatedAt = new Date().toISOString();
            setStore(DB_ORDERS, orders);
            addActivity(`Pedido #${orderId.substring(0, 8).toUpperCase()} atualizado para ${newStatus}`);
            showToast(`Status atualizado para ${newStatus}`, 'success');
            refreshOrderStats();
            refreshOrders();
        }
    }

    // Vendas filter
    if (vendasFilterStatus) {
        vendasFilterStatus.addEventListener('change', () => refreshOrders());
    }

    // ===== PAINEL ADMIN =====
    function ensureAdminPanel() {
        if (currentUser?.role !== 'admin') {
            showToast('Acesso exclusivo do ADMIN.', 'error');
            navigateTo('dashboard');
            return false;
        }
        return true;
    }

    function setAdminTab(name) {
        if (!ensureAdminPanel()) return;
        adminTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.adminTab === name));
        adminPanels.forEach(panel => panel.classList.toggle('hidden', panel.dataset.adminPanel !== name));
        if (name === 'alerts') renderAdminAlerts();
        if (name === 'sales') { refreshOrderStats(); refreshOrders(); }
        if (name === 'history') renderAdminGameHistory();
        if (name === 'audit') renderAdminAudit();
        if (name === 'diagnostics') renderAdminDiagnostics();
    }

    // ===== V20 ADMIN: VALIDAÇÃO DE PROGRESSO POR PARTIDA =====
    const achievementProgressGame = $('achievement-progress-game');
    const achievementProgressUser = $('achievement-progress-user');
    const achievementProgressAdminList = $('achievement-progress-admin-list');

    function getGamePresentUserIdsV20(game) {
        if (!game) return [];
        const raw = Array.isArray(game.checkedIn) && game.checkedIn.length ? game.checkedIn : (Array.isArray(game.present) ? game.present : []);
        return [...new Set(raw.map(x => String(typeof x === 'object' ? (x.userId || x.id || '') : x)).filter(Boolean))];
    }
    function renderAchievementProgressAdminV20() {
        if (!ensureAdminPanel() || !achievementProgressGame || !achievementProgressUser || !achievementProgressAdminList) return;
        const games = (getStore(DB_GAMES)||[]).filter(g=>g.completed).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
        const keepGame = achievementProgressGame.value;
        achievementProgressGame.innerHTML = '<option value="">Selecione uma operação...</option>' + games.map(g=>`<option value="${escapeHtml(String(g.id))}">${escapeHtml(g.title||'Operação')} • ${formatDate(g.date)}</option>`).join('');
        if (games.some(g=>String(g.id)===keepGame)) achievementProgressGame.value=keepGame;
        const game = games.find(g=>String(g.id)===String(achievementProgressGame.value));
        const users = getStore(DB_USERS)||[];
        const presentIds = getGamePresentUserIdsV20(game);
        const keepUser = achievementProgressUser.value;
        const presentUsers = presentIds.map(id=>users.find(u=>String(u.id)===id)).filter(Boolean).sort((a,b)=>String(a.callsign||a.name||'').localeCompare(String(b.callsign||b.name||'')));
        achievementProgressUser.innerHTML = '<option value="">Selecione um operador...</option>' + presentUsers.map(u=>`<option value="${escapeHtml(String(u.id))}">${escapeHtml(u.callsign||u.name||'Operador')}</option>`).join('');
        if (presentUsers.some(u=>String(u.id)===keepUser)) achievementProgressUser.value=keepUser;
        const user = presentUsers.find(u=>String(u.id)===String(achievementProgressUser.value));
        if (!game) { achievementProgressAdminList.innerHTML='<p class="empty-state">Selecione uma operação concluída.</p>'; return; }
        if (!presentUsers.length) { achievementProgressAdminList.innerHTML='<p class="empty-state">Esta operação não possui operadores com check-in registrado.</p>'; return; }
        if (!user) { achievementProgressAdminList.innerHTML='<p class="empty-state">Selecione um operador presente para validar os requisitos.</p>'; return; }
        const achievements = getStore(DB_ACHIEVEMENTS)||[];
        const records = getStore(DB_ACHIEVEMENT_PROGRESS)||[];
        achievementProgressAdminList.innerHTML = achievements.length ? achievements.map(a=>{
            const target=Math.max(1,Number(a.progressTarget||a.target||1));
            const userRecords=records.filter(r=>String(r.userId)===String(user.id)&&String(r.achievementId)===String(a.id));
            const checked=userRecords.some(r=>String(r.gameId)===String(game.id));
            const count=new Set(userRecords.map(r=>String(r.gameId))).size;
            const earned=(a.completedBy||[]).map(String).includes(String(user.id)) || (getStore(DB_ACHIEVEMENT_AWARDS)||[]).some(x=>String(x.achievementId)===String(a.id)&&String(x.userId)===String(user.id));
            if (a.progressMetric === 'team_tenure_years') {
                const p = getAchievementProgressV19(a, user);
                return `<article class="achievement-validation-card tenure-auto ${earned?'earned':''}"><div class="achievement-validation-copy"><strong>${escapeHtml(a.title||'Conquista')}</strong><small>${escapeHtml(a.description||'')}</small><span>Tempo de equipe: <b>${p ? `${p.current} / ${p.target} anos` : `— / ${target} anos`}</b>${earned?' • CONQUISTADA':''}</span></div><span class="achievement-auto-badge">AUTOMÁTICA</span></article>`;
            }
            const scopeLabel = a.progressScope === 'training' ? 'TREINAMENTO' : a.progressScope === 'operation' ? 'OPERAÇÃO' : 'PARTIDA';
            return `<article class="achievement-validation-card ${checked?'validated':''} ${earned?'earned':''}"><div class="achievement-validation-copy"><strong>${escapeHtml(a.title||'Conquista')}</strong><small>${escapeHtml(a.description||'')}</small><span class="achievement-scope-v21">${scopeLabel}</span><span>Progresso: <b>${Math.min(count,target)} / ${target}</b>${earned?' • CONQUISTADA':''}</span></div><button type="button" class="${checked?'btn-secondary':'btn-primary'} achievement-validate-btn" data-achievement-id="${escapeHtml(String(a.id))}" ${earned&&!checked?'disabled':''}>${checked?'DESFAZER VALIDAÇÃO':'VALIDAR NESTA PARTIDA'}</button></article>`;
        }).join('') : '<p class="empty-state">Nenhuma conquista cadastrada.</p>';
    }
    async function toggleAchievementValidationV20(achievementId) {
        if (currentUser?.role!=='admin') return;
        const gameId=achievementProgressGame?.value, userId=achievementProgressUser?.value;
        if (!gameId||!userId) return showToast('Selecione operação e operador.', 'error');
        const game=(getStore(DB_GAMES)||[]).find(g=>String(g.id)===String(gameId));
        if (!game?.completed || !getGamePresentUserIdsV20(game).includes(String(userId))) return showToast('A validação exige uma operação concluída com check-in do operador.', 'error');
        const achievements=getStore(DB_ACHIEVEMENTS)||[]; const a=achievements.find(x=>String(x.id)===String(achievementId)); if(!a)return;
        let records=(getStore(DB_ACHIEVEMENT_PROGRESS)||[]).slice();
        const index=records.findIndex(r=>String(r.gameId)===String(gameId)&&String(r.userId)===String(userId)&&String(r.achievementId)===String(achievementId));
        if(index>=0){ records.splice(index,1); setStore(DB_ACHIEVEMENT_PROGRESS,records); showToast('Validação removida.', 'info'); }
        else { records.push({id:`${achievementId}_${userId}_${gameId}`,achievementId:String(achievementId),userId:String(userId),gameId:String(gameId),validatedBy:String(currentUser.id),createdAt:new Date().toISOString()}); setStore(DB_ACHIEVEMENT_PROGRESS,records); haptic(12); showToast('Requisito validado para esta partida.', 'success'); }
        const target=Math.max(1,Number(a.progressTarget||a.target||1));
        const count=new Set(records.filter(r=>String(r.userId)===String(userId)&&String(r.achievementId)===String(achievementId)).map(r=>String(r.gameId))).size;
        const already=(a.completedBy||[]).map(String).includes(String(userId));
        if(count>=target && !already){ a.completedBy=[...new Set([...(a.completedBy||[]).map(String),String(userId)])]; a.updatedAt=new Date().toISOString(); setStore(DB_ACHIEVEMENTS,achievements); const u=(getStore(DB_USERS)||[]).find(x=>String(x.id)===String(userId)); addActivity(`${u?.callsign||'Operador'} conquistou a insígnia: ${a.title}`); playSfx('achievement',.95); showToast(`Conquista desbloqueada: ${a.title}`, 'success'); }
        renderAchievementProgressAdminV20(); refreshAchievements();
    }
    achievementProgressGame?.addEventListener('change',()=>{ achievementProgressUser.value=''; renderAchievementProgressAdminV20(); });
    achievementProgressUser?.addEventListener('change',renderAchievementProgressAdminV20);
    achievementProgressAdminList?.addEventListener('click',e=>{const b=e.target.closest('.achievement-validate-btn');if(b&&!b.disabled)toggleAchievementValidationV20(b.dataset.achievementId);});

    function refreshAdminPanel() {
        if (!ensureAdminPanel()) return;
        const users = (getStore(DB_USERS) || []).filter(u => u.role !== 'guest');
        const games = getStore(DB_GAMES) || [];
        const orders = getStore(DB_ORDERS) || [];
        if ($('admin-total-members')) $('admin-total-members').textContent = users.length;
        if ($('admin-open-games')) $('admin-open-games').textContent = games.filter(g => !g.completed).length;
        if ($('admin-completed-games')) $('admin-completed-games').textContent = games.filter(g => g.completed).length;
        if ($('admin-pending-orders')) $('admin-pending-orders').textContent = orders.filter(o => o.status === 'Pendente').length;
        updateAdminAlertBadge();
        const active = [...adminTabs].find(b => b.classList.contains('active'))?.dataset.adminTab || 'overview';
        setAdminTab(active);
    }

    function getAdminAlertData() {
        const users = (getStore(DB_USERS) || []).filter(u => u.role !== 'guest');
        const games = getStore(DB_GAMES) || [];
        const orders = getStore(DB_ORDERS) || [];
        const guestConfirmations = getStore('asgard_guest_confirmations') || [];
        const contrib = getStore(DB_CONTRIBUTIONS) || {};
        const now = new Date();
        const monthKey = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
        const month = contrib.months?.[monthKey] || {};
        const overdue = users.filter(u => u.role !== 'admin' && month[u.id]?.status === 'Em Atraso');
        const pendingOrders = orders.filter(o => o.status === 'Pendente');
        const today = new Date(); today.setHours(23,59,59,999);
        const needCheckin = games.filter(g => {
            if (g.completed) return false;
            const d = g.date ? new Date(String(g.date).length <= 10 ? `${g.date}T23:59:59` : g.date) : null;
            if (!d || Number.isNaN(d.getTime()) || d > today) return false;
            const confirmed = Array.isArray(g.confirmed) ? g.confirmed.length : 0;
            const checked = Array.isArray(g.checkedIn) ? g.checkedIn.length : 0;
            const guestConfirmed = guestConfirmations.filter(x => String(x.gameId) === String(g.id)).length;
            const guestChecked = guestConfirmations.filter(x => String(x.gameId) === String(g.id) && x.checkedIn).length;
            return (confirmed + guestConfirmed) > (checked + guestChecked);
        });
        const activeGameIds = new Set(games.filter(g => !g.completed).map(g => String(g.id)));
        const guests = guestConfirmations.filter(x => activeGameIds.has(String(x.gameId)));
        return { overdue, pendingOrders, needCheckin, guests, updateAvailable:adminUpdateAvailable };
    }

    function updateAdminAlertBadge() {
        if (currentUser?.role !== 'admin') return;
        const d = getAdminAlertData();
        const total = d.overdue.length + d.pendingOrders.length + d.needCheckin.length + (d.updateAvailable ? 1 : 0);
        [adminAlertBadge, adminAlertTabCount].forEach(el => {
            if (!el) return;
            el.textContent = total > 99 ? '99+' : String(total);
            el.classList.toggle('hidden', total === 0);
        });
    }

    async function checkAdminAppUpdate() {
        if (!('serviceWorker' in navigator)) return false;
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (!reg) return false;
            adminUpdateAvailable = Boolean(reg.waiting);
            // update() is only run while the admin is looking at the panel; no polling.
            await reg.update().catch(()=>{});
            adminUpdateAvailable = Boolean(reg.waiting || (reg.installing && navigator.serviceWorker.controller));
        } catch (_) { adminUpdateAvailable = false; }
        updateAdminAlertBadge();
        return adminUpdateAvailable;
    }

    async function renderAdminAlerts() {
        if (!ensureAdminPanel() || !adminAlertList) return;
        await checkAdminAppUpdate();
        const d = getAdminAlertData();
        const items = [];
        if (d.overdue.length) items.push({ icon:'💳', type:'danger', count:d.overdue.length, title:`${d.overdue.length} contribuição(ões) em atraso`, body:'Revise os operadores em atraso na aba Contribuições.', action:'contribuicao' });
        if (d.pendingOrders.length) items.push({ icon:'📦', type:'warning', count:d.pendingOrders.length, title:`${d.pendingOrders.length} pedido(s) pendente(s)`, body:'Existem pedidos aguardando análise ou confirmação.', tab:'sales' });
        if (d.needCheckin.length) items.push({ icon:'🎯', type:'warning', count:d.needCheckin.length, title:`${d.needCheckin.length} operação(ões) precisam de check-in`, body:'A data já chegou e ainda existem confirmados sem presença registrada.', action:'games' });
        if (d.guests.length) items.push({ icon:'👤', type:'info', count:d.guests.length, title:`${d.guests.length} convidado(s) confirmado(s)`, body:'Convidados atualmente presentes nas listas de operações abertas.', action:'games' });
        if (d.updateAvailable) items.push({ icon:'⬆️', type:'info', count:1, title:'Nova versão do app disponível', body:'Há uma atualização do PWA pronta para ser aplicada.', tab:'diagnostics' });
        if (adminAlertSummary) adminAlertSummary.innerHTML = [
            ['Em atraso',d.overdue.length], ['Pedidos',d.pendingOrders.length], ['Check-in',d.needCheckin.length], ['Convidados',d.guests.length], ['Atualização',d.updateAvailable?'1':'0']
        ].map(([n,v])=>`<article class="admin-alert-mini"><strong>${v}</strong><span>${n}</span></article>`).join('');
        adminAlertList.innerHTML = items.length ? items.map((x,i)=>`<button type="button" class="admin-alert-card ${x.type}" data-alert-index="${i}"><span class="admin-alert-icon">${x.icon}</span><span class="admin-alert-copy"><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.body)}</small></span><span class="admin-alert-count">${x.count}</span></button>`).join('') : '<div class="admin-alert-ok"><strong>✓ Tudo em ordem</strong><span>Nenhuma pendência administrativa importante foi encontrada.</span></div>';
        adminAlertList.querySelectorAll('[data-alert-index]').forEach(btn => btn.addEventListener('click', () => {
            const x = items[Number(btn.dataset.alertIndex)]; if (!x) return;
            if (x.tab) setAdminTab(x.tab); else if (x.action) navigateTo(x.action);
        }));
        updateAdminAlertBadge();
    }

    function renderAdminGameHistory() {
        if (!adminGameHistory) return;
        const q = String(adminHistorySearch?.value || '').trim().toLowerCase();
        const users = getStore(DB_USERS) || [];
        const guestConfirmations = getStore('asgard_guest_confirmations') || [];
        const games = (getStore(DB_GAMES) || []).filter(g => g.completed)
            .filter(g => !q || String(g.title || '').toLowerCase().includes(q) || String(g.location || '').toLowerCase().includes(q))
            .sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
        if (!games.length) { adminGameHistory.innerHTML = '<p class="empty-state">Nenhuma operação concluída encontrada.</p>'; return; }
        adminGameHistory.innerHTML = games.map(g => {
            const confirmed = g.confirmed || [];
            const checked = g.checkedIn || [];
            const memberNames = checked.map(uid => users.find(u => String(u.id) === String(uid))?.callsign || users.find(u => String(u.id) === String(uid))?.name || 'Operador');
            const guests = guestConfirmations.filter(x => String(x.gameId) === String(g.id) && x.checkedIn).map(x => x.name || 'Convidado');
            const present = [...memberNames, ...guests];
            return `<article class="admin-history-card"><div class="admin-history-card-head"><div><strong>${escapeHtml(g.title || 'Operação')}</strong><span>${formatDate(g.date)} • ${escapeHtml(g.location || 'Local não informado')}</span></div><span class="game-completed-badge">CONCLUÍDA</span></div><div class="admin-history-stats"><span>✅ ${confirmed.length} confirmados</span><span>🏁 ${checked.length + guests.length} presentes</span></div><div class="admin-history-members">${present.length ? present.map(n => `<span>${escapeHtml(n)}</span>`).join('') : '<small>Nenhum check-in registrado.</small>'}</div></article>`;
        }).join('');
    }

    function renderAdminAudit() {
        if (!adminAuditList) return;
        const activities = (getStore(DB_ACTIVITY) || []).slice().sort((a,b) => new Date(b.date||0)-new Date(a.date||0));
        const adminWords = /admin|pedido|conquista|check-in|jogo|operação|contribui|membro|aviso|produto|exclu|criou|editou|atualizado/i;
        const filtered = activities.filter(a => adminWords.test(String(a.text || a.message || ''))).slice(0,80);
        if (!filtered.length) { adminAuditList.innerHTML = '<p class="empty-state">Nenhuma ação administrativa registrada ainda.</p>'; return; }
        adminAuditList.innerHTML = filtered.map(a => `<article class="admin-audit-item"><div class="admin-audit-icon">🛡️</div><div><strong>${escapeHtml(a.text || a.message || 'Ação administrativa')}</strong><small>${formatDateTime(a.date || a.createdAt)}</small></div></article>`).join('');
    }

    async function renderAdminDiagnostics() {
        if (!ensureAdminPanel()) return;
        const cfgOk = Boolean(window.ASGARD_FIREBASE_CONFIG?.projectId && window.ASGARD_FIREBASE_CONFIG?.apiKey);
        if ($('diag-firebase')) $('diag-firebase').textContent = cfgOk ? 'Configurado' : 'Não configurado';
        if ($('diag-network')) $('diag-network').textContent = navigator.onLine ? 'Online' : 'Offline';
        if ($('diag-pwa')) $('diag-pwa').textContent = window.matchMedia?.('(display-mode: standalone)')?.matches ? 'Instalado' : 'Navegador';
        if ($('diag-sw')) $('diag-sw').textContent = navigator.serviceWorker?.controller ? 'Ativo' : ('serviceWorker' in navigator ? 'Registrado / aguardando' : 'Indisponível');
        if ($('diag-cache')) {
            try { const keys = await caches.keys(); $('diag-cache').textContent = `${keys.length} cache(s)`; } catch (_) { $('diag-cache').textContent = 'Indisponível'; }
        }
        const counts = [
            ['Membros', (getStore(DB_USERS)||[]).length], ['Jogos', (getStore(DB_GAMES)||[]).length],
            ['Mensagens', (getStore(DB_MESSAGES)||[]).length], ['Conquistas', (getStore(DB_ACHIEVEMENTS)||[]).length],
            ['Produtos', (getStore(DB_PRODUCTS)||[]).length], ['Pedidos', (getStore(DB_ORDERS)||[]).length]
        ];
        if ($('diag-data-counts')) $('diag-data-counts').innerHTML = counts.map(([n,v]) => `<span><strong>${v}</strong>${n}</span>`).join('') + `<span><strong>200</strong>Chat máx.</span><span><strong>80</strong>Feed máx.</span><span><strong>4 min</strong>Heartbeat</span>`;
        await checkAdminAppUpdate();
    }

    adminTabs.forEach(btn => btn.addEventListener('click', () => setAdminTab(btn.dataset.adminTab)));
    adminHistorySearch?.addEventListener('input', renderAdminGameHistory);
    $('admin-refresh-alerts')?.addEventListener('click', renderAdminAlerts);
    $('admin-refresh-audit')?.addEventListener('click', renderAdminAudit);
    $('admin-refresh-diagnostics')?.addEventListener('click', renderAdminDiagnostics);
    $('admin-go-games')?.addEventListener('click', () => navigateTo('games'));
    $('admin-go-achievements')?.addEventListener('click', () => navigateTo('achievements'));
    $('admin-go-members')?.addEventListener('click', () => navigateTo('members'));
    $('admin-go-contrib')?.addEventListener('click', () => navigateTo('contribuicao'));
    $('admin-force-update')?.addEventListener('click', async () => {
        if (!ensureAdminPanel()) return;
        try {
            const reg = await navigator.serviceWorker?.getRegistration();
            await reg?.update();
            if (reg?.waiting) reg.waiting.postMessage({ type:'SKIP_WAITING' });
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
            showToast('Atualização preparada. Recarregando...', 'success');
            setTimeout(() => location.reload(true), 500);
        } catch (err) { showToast('Não foi possível forçar a atualização.', 'error'); }
    });
    $('admin-clear-local-cache')?.addEventListener('click', async () => {
        if (!ensureAdminPanel()) return;
        if (!confirm('Limpar cache local do app e recarregar? Seus dados no Firebase não serão apagados.')) return;
        try { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); } catch (_) {}
        ['asgard_messages','asgard_games','asgard_activity','asgard_products','asgard_orders'].forEach(k => localStorage.removeItem(k));
        location.reload();
    });

    // ===== CONTRIBUIÇÃO =====
    function getContribMonthKey() {
        const now = new Date();
        return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    }

    function getContribMonthLabel() {
        const now = new Date();
        return now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }

    function getContribData() {
        const raw = getStore(DB_CONTRIBUTIONS) || {};
        const valor = Number(raw.valor);
        return {
            ...raw,
            valor: Number.isFinite(valor) ? valor : 50.00,
            pixKey: typeof raw.pixKey === 'string' ? raw.pixKey : '5579996427351',
            months: raw.months && typeof raw.months === 'object' ? raw.months : {}
        };
    }

    function saveContribData(data) {
        setStore(DB_CONTRIBUTIONS, data);
    }

    function getMonthContribs(monthKey) {
        const data = getContribData();
        return data.months[monthKey] || {};
    }

    function ensureMonthContribs(monthKey, users) {
        const data = getContribData();
        let changed = false;
        if (!data.months[monthKey] || typeof data.months[monthKey] !== 'object') {
            data.months[monthKey] = {};
            changed = true;
        }
        // Ensure every operador has an entry. Do not persist on every render:
        // AsgardCloud.set() emits a sync event immediately, so an unconditional
        // save here caused refreshContribuicao -> sync -> refreshContribuicao recursion.
        users.forEach(u => {
            if (u.role !== 'admin' && !data.months[monthKey][u.id]) {
                data.months[monthKey][u.id] = { status: 'Pendente', confirmedAt: null, comprovante: null };
                changed = true;
            }
        });
        // Only ADMIN persists the full month template. Operators keep their
        // not-yet-persisted placeholders local until they submit their own payment.
        if (currentUser && String(currentUser.role||'').toLowerCase() === 'admin') {
            const userIds = new Set(users.map(u => u.id));
            Object.keys(data.months[monthKey]).forEach(uid => {
                if (!userIds.has(uid)) {
                    delete data.months[monthKey][uid];
                    changed = true;
                }
            });
            if (changed) saveContribData(data);
        }
        return data.months[monthKey];
    }

    function pixField(id, value) {
        const text = String(value ?? '');
        return id + String(text.length).padStart(2, '0') + text;
    }

    function crc16Pix(payload) {
        let crc = 0xFFFF;
        for (let i = 0; i < payload.length; i++) {
            crc ^= payload.charCodeAt(i) << 8;
            for (let bit = 0; bit < 8; bit++) {
                crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
                crc &= 0xFFFF;
            }
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
    }

    function normalizePixText(value, maxLen) {
        return String(value || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Za-z0-9 .-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim().toUpperCase().slice(0, maxLen);
    }

    function buildPixPayload(key, amount) {
        const pixKey = String(key || '').trim();
        if (!pixKey) return '';
        const merchantAccount = pixField('00', 'BR.GOV.BCB.PIX') + pixField('01', pixKey);
        let payload = '';
        payload += pixField('00', '01');
        payload += pixField('26', merchantAccount);
        payload += pixField('52', '0000');
        payload += pixField('53', '986');
        const numericAmount = Number(amount);
        if (Number.isFinite(numericAmount) && numericAmount > 0) payload += pixField('54', numericAmount.toFixed(2));
        payload += pixField('58', 'BR');
        payload += pixField('59', normalizePixText('FILHOS DE ASGARD', 25) || 'FILHOS DE ASGARD');
        payload += pixField('60', normalizePixText('ARACAJU', 15) || 'ARACAJU');
        payload += pixField('62', pixField('05', '***'));
        payload += '6304';
        return payload + crc16Pix(payload);
    }

    function renderContribuicaoQr(key, amount) {
        if (!contribuicaoQrCanvas && !contribuicaoQrFallback) return;
        const pixPayload = buildPixPayload(key, amount);
        if (!pixPayload) {
            if (contribuicaoQrCanvas) contribuicaoQrCanvas.classList.add('hidden');
            if (contribuicaoQrFallback) contribuicaoQrFallback.classList.add('hidden');
            return;
        }

        const showFallback = () => {
            if (!contribuicaoQrFallback) return;
            if (contribuicaoQrCanvas) contribuicaoQrCanvas.classList.add('hidden');
            contribuicaoQrFallback.src = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=' + encodeURIComponent(pixPayload);
            contribuicaoQrFallback.classList.remove('hidden');
        };

        if (window.QRCode && typeof window.QRCode.toCanvas === 'function' && contribuicaoQrCanvas) {
            try {
                contribuicaoQrCanvas.classList.remove('hidden');
                if (contribuicaoQrFallback) contribuicaoQrFallback.classList.add('hidden');
                window.QRCode.toCanvas(contribuicaoQrCanvas, pixPayload, {
                    width: 180,
                    margin: 2,
                    color: { dark: '#0a0a0a', light: '#ffffff' }
                }, function(error) {
                    if (error) { console.warn('QR Code generation error:', error); showFallback(); }
                });
                return;
            } catch (e) {
                console.warn('QR Code generation failed:', e);
            }
        }
        showFallback();
    }

    function refreshContribuicao() {
        const users = getStore(DB_USERS) || [];
        const operadores = users.filter(u => u.role !== 'admin');
        const data = getContribData();
        const monthKey = getContribMonthKey();
        const contribs = ensureMonthContribs(monthKey, users);

        // Month label
        if (contribuicaoMonth) contribuicaoMonth.textContent = getContribMonthLabel().charAt(0).toUpperCase() + getContribMonthLabel().slice(1);

        // Valor
        if (contribuicaoValor) contribuicaoValor.textContent = 'R$ ' + data.valor.toFixed(2).replace('.', ',');

        // PIX key
        if (contribuicaoPixKey) contribuicaoPixKey.textContent = data.pixKey || 'Não configurada';

        // QR Code PIX. Prefer the local/browser QR library when available and
        // fall back to a remote image generator if the CDN script was blocked.
        renderContribuicaoQr(data.pixKey || '', data.valor);

        // Copy PIX button
        if (btnCopyPix) {
            btnCopyPix.onclick = function() {
                const key = data.pixKey || '';
                if (!key) { showToast('Chave PIX não configurada', 'error'); return; }
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(key).then(() => {
                        showToast('Chave PIX copiada!', 'success');
                    }).catch(() => {
                        fallbackCopyText(key);
                    });
                } else {
                    fallbackCopyText(key);
                }
            };
        }

        const isAdmin = currentUser && String(currentUser.role||'').toLowerCase() === 'admin';
        const contribuicaoPage = $('page-contribuicao');
        if (contribuicaoPage) contribuicaoPage.classList.toggle('admin-contrib-view', !!isAdmin);
        const visibleOperators = isAdmin
            ? operadores
            : operadores.filter(op => currentUser && op.id === currentUser.id);

        // Payment totals are administrative information. Operators must not be able
        // to infer the payment status of other members from aggregate counters.
        const statsEl = $('contribuicao-stats');
        if (statsEl) statsEl.classList.toggle('hidden', !isAdmin);
        if (isAdmin) {
            let pagos = 0, pendentes = 0, atrasados = 0;
            operadores.forEach(op => {
                const c = contribs[op.id];
                if (!c) return;
                if (c.status === 'Pago') pagos++;
                else if (c.status === 'Em Atraso') atrasados++;
                else pendentes++;
            });
            if (contribTotal) contribTotal.textContent = operadores.length;
            if (contribPagos) contribPagos.textContent = pagos;
            if (contribPendentes) contribPendentes.textContent = pendentes;
            if (contribAtrasados) contribAtrasados.textContent = atrasados;
        }

        // Member cards: ADMIN sees everyone; each operator sees only their own
        // contribution status and receipt controls.
        if (contribuicaoMembers) {
            let html = '';
            visibleOperators.forEach(op => {
                const c = contribs[op.id] || { status: 'Pendente' };
                const initials = op.callsign ? op.callsign.substring(0, 2).toUpperCase() : '??';
                const safeStatus = typeof c.status === 'string' && c.status ? c.status : 'Pendente';
                c.status = safeStatus;
                const statusClass = 'contrib-status-' + safeStatus.replace(/\s+/g, '-');

                const isSelf = currentUser && currentUser.id === op.id;

                html += `<div class="contribuicao-member-card" data-user-id="${op.id}">
                    <div class="contribuicao-member-top">
                        <div class="contribuicao-member-avatar">${escapeHtml(initials)}</div>
                        <div class="contribuicao-member-info">
                            <div class="contribuicao-member-callsign">${escapeHtml(op.callsign)}</div>
                            <div class="contribuicao-member-name">${escapeHtml(op.name || '')}</div>
                        </div>
                        <span class="contrib-status ${statusClass}">${c.status}</span>
                    </div>
                    <div class="contribuicao-member-bottom">`;

                if (isAdmin) {
                    html += `<select class="contribuicao-status-select" data-user-id="${op.id}">
                        <option value="Pendente" ${c.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="Pago" ${c.status === 'Pago' ? 'selected' : ''}>Pago</option>
                        <option value="Em Atraso" ${c.status === 'Em Atraso' ? 'selected' : ''}>Em Atraso</option>
                    </select>`;
                }

                // Comprovante row
                const hasComprovante = c.comprovante ? true : false;
                html += `<div class="comprovante-row">`;

                if (isSelf && c.status !== 'Pago') {
                    if (hasComprovante) {
                        html += `<img class="comprovante-thumb" data-user-id="${op.id}" src="${c.comprovante}" alt="Comprovante" title="Ver comprovante">`;
                        html += `<button class="btn-upload-comprovante" data-user-id="${op.id}" title="Trocar comprovante">📎 Trocar</button>`;
                    } else {
                        html += `<button class="btn-upload-comprovante" data-user-id="${op.id}" title="Enviar comprovante">📎 Enviar Comprovante</button>`;
                    }
                }

                if (isSelf && hasComprovante && c.status === 'Pago') {
                    html += `<img class="comprovante-thumb" data-user-id="${op.id}" src="${c.comprovante}" alt="Comprovante" title="Ver comprovante">`;
                }

                if (isAdmin && hasComprovante) {
                    html += `<img class="comprovante-thumb" data-user-id="${op.id}" src="${c.comprovante}" alt="Comprovante" title="Ver comprovante">`;
                    html += `<button class="btn-view-comprovante" data-user-id="${op.id}">👁 Ver Comprovante</button>`;
                }

                if (isAdmin && !hasComprovante) {
                    html += `<span class="comprovante-indicator"><span class="comp-icon">📄</span> Sem comprovante</span>`;
                }

                html += `</div>`;

                if (isSelf && !hasComprovante) {
                    html += `<button class="btn-confirm-pix" data-user-id="${op.id}" ${c.status === 'Pago' ? 'disabled' : ''}>Confirmar Pagamento</button>`;
                }

                html += `</div></div>`;
            });

            if (visibleOperators.length === 0) {
                html = isAdmin
                    ? '<p class="empty-state">Nenhum operador registrado.</p>'
                    : '<p class="empty-state">Sua contribuição ainda não está disponível.</p>';
            }

            contribuicaoMembers.innerHTML = html;

            // Wire admin status selects
            contribuicaoMembers.querySelectorAll('.contribuicao-status-select').forEach(sel => {
                sel.addEventListener('change', function() {
                    updateContribStatus(this.dataset.userId, this.value);
                });
            });

            // Wire confirm payment buttons
            contribuicaoMembers.querySelectorAll('.btn-confirm-pix').forEach(btn => {
                btn.addEventListener('click', function() {
                    confirmarPagamento(this.dataset.userId);
                });
            });

            // Wire upload comprovante buttons
            contribuicaoMembers.querySelectorAll('.btn-upload-comprovante').forEach(btn => {
                btn.addEventListener('click', function() {
                    pendingComprovanteUserId = this.dataset.userId;
                    if (comprovanteFileInput) comprovanteFileInput.click();
                });
            });

            // Wire comprovante thumbnails (click to view)
            contribuicaoMembers.querySelectorAll('.comprovante-thumb').forEach(img => {
                img.addEventListener('click', function() {
                    openComprovanteView(this.dataset.userId);
                });
            });

            // Wire admin view comprovante buttons
            contribuicaoMembers.querySelectorAll('.btn-view-comprovante').forEach(btn => {
                btn.addEventListener('click', function() {
                    openComprovanteView(this.dataset.userId);
                });
            });
        }
    }

    async function updateContribStatus(userId, newStatus) {
        const allowed = ['Pendente', 'Pago', 'Em Atraso'];
        if (!currentUser || String(currentUser.role||'').toLowerCase() !== 'admin' || !allowed.includes(newStatus)) return;
        const monthKey = getContribMonthKey();
        const users = getStore(DB_USERS) || [];
        const user = users.find(u => u.id === userId);
        const callsign = user ? user.callsign : 'Desconhecido';

        // Update the visible cache immediately, then perform a dedicated Firestore
        // write and wait for confirmation. This avoids stale full-month snapshots
        // overwriting the status back to "Pendente" when navigating between pages.
        const data = getContribData();
        if (!data.months[monthKey]) data.months[monthKey] = {};
        if (!data.months[monthKey][userId]) data.months[monthKey][userId] = { status: 'Pendente', confirmedAt: null, comprovante: null };
        const previousStatus = data.months[monthKey][userId].status || 'Pendente';
        data.months[monthKey][userId].status = newStatus;
        if (window.AsgardCloud && typeof window.AsgardCloud.updateContribution === 'function') {
            try {
                await window.AsgardCloud.updateContribution(userId, monthKey, { status: newStatus });
            } catch (err) {
                data.months[monthKey][userId].status = previousStatus;
                saveContribData(data);
                console.error(err);
                showToast('Não foi possível salvar o status no Firebase.', 'error');
                refreshContribuicao();
                return;
            }
        } else {
            saveContribData(data);
        }

        addActivity(`Contribuição de ${callsign} atualizada para ${newStatus}`);
        showToast(`Status de ${callsign} salvo como ${newStatus}`, 'success');
        refreshContribuicao();
    }

    function confirmarPagamento(userId) {
        const data = getContribData();
        const monthKey = getContribMonthKey();
        if (!data.months[monthKey]) data.months[monthKey] = {};
        if (!data.months[monthKey][userId]) data.months[monthKey][userId] = { status: 'Pendente', confirmedAt: null, comprovante: null };

        // Mark as confirmed by operador (but keep status as Pendente until admin verifies)
        data.months[monthKey][userId].confirmedAt = new Date().toISOString();
        saveContribData(data);

        // Send WhatsApp message
        const users = getStore(DB_USERS) || [];
        const user = users.find(u => u.id === userId);
        const callsign = user ? user.callsign : 'Operador';
        const monthLabel = getContribMonthLabel();
        const valor = data.valor;
        const msg = `🛡️ *Filhos de Asgard - Contribuição Mensal*\n\n` +
            `Operador: *${callsign}*\n` +
            `Mês: *${monthLabel}*\n` +
            `Valor: *R$ ${valor.toFixed(2).replace('.', ',')}*\n\n` +
            `✅ Confirmo que realizei o pagamento da mensalidade via PIX.\n\n` +
            `_Mensagem automática do App Filhos de Asgard_`;
        const encoded = encodeURIComponent(msg);
        const url = `https://wa.me/${DEFAULT_WHATSAPP}?text=${encoded}`;
        window.open(url, '_blank');

        addActivity(`${callsign} confirmou pagamento de contribuição`);
        showToast('Confirmação enviada via WhatsApp!', 'success');
        refreshContribuicao();
    }

    // ===== COMPROVANTE =====
    function handleComprovanteUpload(event) {
        const file = event.target.files[0];
        if (!file || !pendingComprovanteUserId) {
            pendingComprovanteUserId = null;
            if (comprovanteFileInput) comprovanteFileInput.value = '';
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Envie apenas imagens (JPG, PNG, etc.)', 'error');
            pendingComprovanteUserId = null;
            if (comprovanteFileInput) comprovanteFileInput.value = '';
            return;
        }

        // Validate file size before client-side compression
        if (file.size > 2 * 1024 * 1024) {
            showToast('Imagem muito grande! Máximo 2MB.', 'error');
            pendingComprovanteUserId = null;
            if (comprovanteFileInput) comprovanteFileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            // Compress/resize before uploading/synchronizing the image
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_W = 800;
                const MAX_H = 800;
                let w = img.width;
                let h = img.height;
                if (w > MAX_W) { h = h * (MAX_W / w); w = MAX_W; }
                if (h > MAX_H) { w = w * (MAX_H / h); h = MAX_H; }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', 0.7);

                // Save to contribution data
                const data = getContribData();
                const monthKey = getContribMonthKey();
                if (!data.months[monthKey]) data.months[monthKey] = {};
                if (!data.months[monthKey][pendingComprovanteUserId]) data.months[monthKey][pendingComprovanteUserId] = { status: 'Pendente', confirmedAt: null, comprovante: null };
                data.months[monthKey][pendingComprovanteUserId].comprovante = compressed;
                data.months[monthKey][pendingComprovanteUserId].comprovanteAt = new Date().toISOString();
                saveContribData(data);

                const users = getStore(DB_USERS) || [];
                const user = users.find(u => u.id === pendingComprovanteUserId);
                const callsign = user ? user.callsign : 'Operador';
                addActivity(`${callsign} enviou comprovante de pagamento`);
                showToast('Comprovante enviado com sucesso!', 'success');

                pendingComprovanteUserId = null;
                if (comprovanteFileInput) comprovanteFileInput.value = '';
                refreshContribuicao();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function openComprovanteView(userId) {
        const data = getContribData();
        const monthKey = getContribMonthKey();
        const contrib = (data.months[monthKey] && data.months[monthKey][userId]) || {};
        if (!contrib.comprovante) {
            showToast('Nenhum comprovante enviado.', 'error');
            return;
        }
        if (comprovanteViewImg) comprovanteViewImg.src = contrib.comprovante;
        if (comprovanteViewModal) comprovanteViewModal.classList.remove('hidden');
    }

    function removeComprovante(userId) {
        const data = getContribData();
        const monthKey = getContribMonthKey();
        if (data.months[monthKey] && data.months[monthKey][userId]) {
            delete data.months[monthKey][userId].comprovante;
            delete data.months[monthKey][userId].comprovanteAt;
            saveContribData(data);
        }
        refreshContribuicao();
    }

    function editContribuicaoValor() {
        const data = getContribData();
        if (editValorInput) editValorInput.value = data.valor;
        if (editPixInput) editPixInput.value = data.pixKey || '';
        if (editValorModal) editValorModal.classList.remove('hidden');
    }

    function saveContribuicaoValor() {
        const newValor = parseFloat(editValorInput.value);
        const newPix = editPixInput.value.trim();
        if (isNaN(newValor) || newValor < 0) {
            showToast('Valor inválido!', 'error');
            return;
        }
        const data = getContribData();
        data.valor = newValor;
        if (newPix) data.pixKey = newPix;
        saveContribData(data);
        addActivity(`Valor da mensalidade atualizado para R$ ${newValor.toFixed(2).replace('.', ',')}`);
        showToast('Valor atualizado com sucesso!', 'success');
        if (editValorModal) editValorModal.classList.add('hidden');
        refreshContribuicao();
    }

    // Contribuição event listeners
    if (btnEditValor) btnEditValor.addEventListener('click', editContribuicaoValor);
    if (btnSaveValor) btnSaveValor.addEventListener('click', saveContribuicaoValor);
    if (btnCancelValor) btnCancelValor.addEventListener('click', () => { if (editValorModal) editValorModal.classList.add('hidden'); });
    if (editValorModal) editValorModal.addEventListener('click', function(e) { if (e.target === editValorModal) editValorModal.classList.add('hidden'); });

    // Comprovante event listeners
    if (comprovanteFileInput) comprovanteFileInput.addEventListener('change', handleComprovanteUpload);
    if (btnCloseComprovanteView) btnCloseComprovanteView.addEventListener('click', () => { if (comprovanteViewModal) comprovanteViewModal.classList.add('hidden'); });
    if (comprovanteViewModal) comprovanteViewModal.addEventListener('click', function(e) { if (e.target === comprovanteViewModal) comprovanteViewModal.classList.add('hidden'); });

    // ===== ACTIVITY LOG =====
    function inferActivityType(text) {
        const t = String(text || '').toLowerCase();
        if (/conquist|insígnia|conquista/.test(t)) return 'achievement';
        if (/jogo|operação|presença|check-in/.test(t)) return 'game';
        if (/produto|loja/.test(t)) return 'store';
        if (/pedido/.test(t)) return 'order';
        if (/contribui|mensalidade|pagamento|comprovante/.test(t)) return 'contribution';
        if (/admin|promoveu|rebaixou|removeu/.test(t)) return 'admin';
        if (/entrou online|saiu|registrou/.test(t)) return 'auth';
        return 'general';
    }

    function addActivity(text, type = null, meta = {}) {
        const entry = {
            id: generateId(), text: String(text || '').trim(),
            type: type || inferActivityType(text), date: new Date().toISOString(),
            actorUid: currentUser?.id || '', actorCallsign: currentUser?.callsign || ''
        };
        if (!entry.text) return;
        // Optimistic feed: show immediately without rewriting the entire collection.
        const activities = (getStore(DB_ACTIVITY) || []).filter(a => a && a.id !== entry.id);
        activities.push(entry);
        if (activities.length > 80) activities.splice(0, activities.length - 80);
        try { localStorage.setItem(DB_ACTIVITY, JSON.stringify(activities)); } catch (_) {}
        if (window.AsgardCloud?.appendActivity) {
            window.AsgardCloud.appendActivity(entry.text, entry.type, meta).catch(err => console.warn('Activity feed write skipped:', err));
        }
    }

    // ===== PWA INSTALL =====
    let deferredInstallPrompt = null;
    const btnInstallPwa = document.getElementById('btn-install-pwa');
    const installPwaStatus = document.getElementById('install-pwa-status');

    function isPwaInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    function updateInstallPwaUI() {
        if (!btnInstallPwa || !installPwaStatus) return;
        if (isPwaInstalled()) {
            btnInstallPwa.textContent = 'App instalado';
            btnInstallPwa.disabled = true;
            installPwaStatus.textContent = 'O Filhos de Asgard já está instalado neste dispositivo.';
            return;
        }
        btnInstallPwa.textContent = 'Instalar app';
        btnInstallPwa.disabled = false;
        if (deferredInstallPrompt) {
            installPwaStatus.textContent = 'Pronto para instalar neste dispositivo.';
        } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
            installPwaStatus.textContent = 'No iPhone/iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”.';
        } else {
            installPwaStatus.textContent = 'Se o botão não abrir a instalação, use a opção “Instalar app” do menu do navegador.';
        }
    }

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        updateInstallPwaUI();
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        updateInstallPwaUI();
        showToast('Aplicativo instalado com sucesso!', 'success');
    });

    if (btnInstallPwa) {
        btnInstallPwa.addEventListener('click', async () => {
            if (isPwaInstalled()) {
                updateInstallPwaUI();
                return;
            }
            if (deferredInstallPrompt) {
                try {
                    deferredInstallPrompt.prompt();
                    await deferredInstallPrompt.userChoice;
                } catch (err) {
                    console.error('Falha ao abrir instalação PWA:', err);
                    showToast('Não foi possível abrir a instalação automaticamente.', 'error');
                } finally {
                    deferredInstallPrompt = null;
                    updateInstallPwaUI();
                }
                return;
            }
            if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
                alert('Para instalar no iPhone/iPad: toque no botão Compartilhar do Safari e escolha “Adicionar à Tela de Início”.');
            } else {
                showToast('Abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.', 'info');
            }
        });
    }

    window.matchMedia('(display-mode: standalone)').addEventListener?.('change', updateInstallPwaUI);
    updateInstallPwaUI();


    // ===== EXPERIENCE V2: NOTIFICAÇÕES, CALENDÁRIO, PROGRESSÃO, ADMIN E CONEXÃO =====
    const notificationBellV2 = $('notification-bell');
    const notificationCountV2 = $('notification-count');
    const notificationDrawerV2 = $('notification-drawer');
    const notificationListV2 = $('notification-list');
    const btnMarkAllNotificationsV2 = $('btn-mark-all-notifications');
    const connectionStatusV2 = $('connection-status');
    let cloudHasRecentErrorV2 = false;

    function parseTimeV2(v) { const t = new Date(v || 0).getTime(); return Number.isFinite(t) ? t : 0; }
    function getNotificationReadAtV2() { return parseTimeV2(currentUser?.notificationReadAt); }
    function getNotificationsV2() {
        if (!currentUser) return [];
        const items = [];
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        (getStore(DB_MESSAGES) || []).forEach(m => {
            if (m.userId !== currentUser.id && (m.mentions || []).map(String).includes(String(currentUser.id))) {
                const ts = parseTimeV2(m.date);
                const everyone = /(^|\s)@todos(?=\s|$|[.,!?;:])/i.test(String(m.text || ''));
                if (ts >= cutoff) items.push({ id:`chat:${m.id}`, type:'mention', icon:'💬', title: everyone ? `${m.callsign || 'Operador'} marcou @todos` : `${m.callsign || 'Operador'} marcou você`, body:m.text || 'Nova menção no Chat', ts, page:'chat' });
            }
        });
        (currentUser.achievementNotifications || []).forEach(n => {
            const ts = parseTimeV2(n.awardedAt || n.createdAt); if (ts >= cutoff) items.push({ id:`achievement:${n.id}`, type:'achievement', icon:'🏆', title:n.title || 'Nova conquista', body:n.description || 'Você recebeu uma nova insígnia.', ts, page:'achievements' });
        });
        (getStore(DB_ANNOUNCEMENTS) || []).forEach(a => {
            const ts = parseTimeV2(a.createdAt || a.date); if (ts >= cutoff) items.push({ id:`announcement:${a.id}`, type:'announcement', icon:'📢', title:'Novo aviso da equipe', body:a.text || a.message || '', ts, page:'dashboard' });
        });
        (getStore(DB_GAMES) || []).forEach(g => {
            const ts = parseTimeV2(g.updatedAt || g.createdAt); if (ts >= cutoff) items.push({ id:`game:${g.id}:${g.updatedAt || g.createdAt || ''}`, type:'game', icon:'🎯', title:g.completed ? 'Operação concluída' : 'Partida atualizada', body:`${g.title || 'Jogo'} • ${formatDate(g.date)}`, ts, page:'games' });
        });
        (getStore(DB_ORDERS) || []).filter(o => o.compradorId === currentUser.id).forEach(o => {
            const ts = parseTimeV2(o.updatedAt || o.createdAt); if (ts >= cutoff) items.push({ id:`order:${o.id}:${o.status}:${o.updatedAt || ''}`, type:'order', icon:'📦', title:`Pedido ${o.status || 'atualizado'}`, body:`#${String(o.id||'').slice(0,8).toUpperCase()} • R$ ${Number(o.total||0).toFixed(2).replace('.',',')}`, ts, page:'loja' });
        });
        return items.sort((a,b)=>b.ts-a.ts).slice(0,40);
    }
    function renderNotificationCenterV2() {
        const list = getNotificationsV2(); const readAt = getNotificationReadAtV2();
        const unread = list.filter(n => n.ts > readAt).length;
        if (notificationCountV2) { notificationCountV2.textContent = unread > 99 ? '99+' : String(unread); notificationCountV2.classList.toggle('hidden', unread === 0); }
        if (!notificationListV2) return;
        notificationListV2.innerHTML = list.length ? list.map(n => `<button class="notification-item ${n.ts > readAt ? 'unread' : ''}" data-notification-page="${n.page}"><span class="notification-item-icon">${n.icon}</span><span class="notification-item-copy"><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.body)}</span><small>${new Date(n.ts).toLocaleString('pt-BR')}</small></span></button>`).join('') : '<p class="empty-state">Nenhuma notificação recente.</p>';
        notificationListV2.querySelectorAll('[data-notification-page]').forEach(btn => btn.addEventListener('click', () => { closeNotificationDrawerV2(); navigateTo(btn.dataset.notificationPage); }));
    }
    function openNotificationDrawerV2() { renderNotificationCenterV2(); notificationDrawerV2?.classList.remove('hidden'); notificationDrawerV2?.setAttribute('aria-hidden','false'); }
    function closeNotificationDrawerV2() { notificationDrawerV2?.classList.add('hidden'); notificationDrawerV2?.setAttribute('aria-hidden','true'); }
    async function markAllNotificationsReadV2() {
        if (!currentUser) return;
        const now = new Date().toISOString(); currentUser.notificationReadAt = now;
        const users = getStore(DB_USERS) || []; const me = users.find(u=>u.id===currentUser.id); if (me) me.notificationReadAt = now;
        setStore(DB_USERS, users); renderNotificationCenterV2(); showToast('Notificações marcadas como lidas.', 'success');
    }
    notificationBellV2?.addEventListener('click', openNotificationDrawerV2);
    notificationDrawerV2?.querySelectorAll('[data-close-notifications]').forEach(el => el.addEventListener('click', closeNotificationDrawerV2));
    btnMarkAllNotificationsV2?.addEventListener('click', markAllNotificationsReadV2);

    function getOperatorStatsV2(userId) {
        const games = getStore(DB_GAMES) || [];
        const completed = games.filter(g => g.completed);
        const attended = completed.filter(g => (g.checkedIn || []).includes(userId));
        const confirmed = games.filter(g => (g.confirmed || []).includes(userId));
        const awards = (getStore(DB_ACHIEVEMENT_AWARDS) || []).filter(a => String(a.userId) === String(userId));
        const achievementCatalog = getStore(DB_ACHIEVEMENTS) || [];
        const achievementXp = awards.reduce((sum, award) => {
            const achievement = achievementCatalog.find(a => String(a.id) === String(award.achievementId));
            const rarity = String(achievement?.rarity || 'comum').toLowerCase();
            const xpByRarity = { comum:100, incomum:125, rara:150, epica:200, lendaria:250 };
            return sum + (xpByRarity[rarity] || 100);
        }, 0);
        const xp = attended.length * 50 + achievementXp;
        const level = Math.floor(xp / 250) + 1;
        const inLevel = xp % 250;
        const attendanceBase = completed.filter(g => (g.confirmed || []).includes(userId)).length;
        const rate = attendanceBase ? Math.round((attended.filter(g => (g.confirmed || []).includes(userId)).length / attendanceBase) * 100) : 0;
        return { games, completed, attended, confirmed, awards, xp, level, inLevel, rate };
    }
    function renderProfileStatsV2(userId) {
        const s = getOperatorStatsV2(userId);
        if ($('profile-level')) $('profile-level').textContent = s.level;
        if ($('profile-xp')) $('profile-xp').textContent = `${s.xp} XP`;
        if ($('profile-xp-next')) $('profile-xp-next').textContent = `${250 - s.inLevel} XP para o próximo nível`;
        if ($('profile-xp-bar')) $('profile-xp-bar').style.width = `${(s.inLevel / 250) * 100}%`;
        if ($('profile-ops-count')) $('profile-ops-count').textContent = s.attended.length;
        if ($('profile-attendance-rate')) $('profile-attendance-rate').textContent = `${s.rate}%`;
        if ($('profile-badges-count')) $('profile-badges-count').textContent = s.awards.length;
        if ($('profile-confirmed-count')) $('profile-confirmed-count').textContent = s.confirmed.length;
        const hist = $('profile-operation-history');
        if (hist) hist.innerHTML = s.attended.length ? s.attended.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,8).map(g=>`<div class="operation-history-item"><div><strong>${escapeHtml(g.title || 'Operação')}</strong><span>${formatDate(g.date)} • ${escapeHtml(g.location || 'Local não informado')}</span></div><span class="operation-history-xp">+50 XP</span></div>`).join('') : '<p class="empty-state">Nenhuma operação concluída.</p>';
    }

    async function toggleGameCompletedV2(gameId) {
        if (String(currentUser.role||'').toLowerCase() !== 'admin') { showToast('Apenas ADMIN pode concluir operações.', 'error'); return; }
        const game = (getStore(DB_GAMES) || []).find(g => g.id === gameId);
        if (!game) return;
        const completed = !game.completed;
        try {
            if (window.AsgardCloud?.setGameCompleted) await window.AsgardCloud.setGameCompleted(gameId, completed);
            else { game.completed = completed; setStore(DB_GAMES, getStore(DB_GAMES) || []); }
            addActivity(`${currentUser.callsign} ${completed ? 'concluiu' : 'reabriu'} a operação ${game.title}`);
            showToast(completed ? 'Operação concluída. Ela não aceita mais confirmações.' : 'Operação reaberta para confirmações.', 'success');
        } catch (err) { showToast(err?.message || 'Não foi possível alterar o status da operação.', 'error'); }
    }

    function renderMyOrdersV2() {
        const el = $('my-orders-list'); if (!el || !currentUser) return;
        const orders = (getStore(DB_ORDERS) || []).filter(o => o.compradorId === currentUser.id).sort((a,b)=>parseTimeV2(b.createdAt)-parseTimeV2(a.createdAt));
        el.innerHTML = orders.length ? orders.map(o=>`<article class="my-order-card"><div class="my-order-head"><strong>#${String(o.id||'').slice(0,8).toUpperCase()}</strong><span class="vendas-order-status-badge status-${o.status}">${escapeHtml(o.status || 'Pendente')}</span></div><div class="my-order-items">${(o.items||o.itens||[]).map(i=>`${escapeHtml(i.nome || 'Item')} × ${Number(i.qtd||1)}`).join(' • ')}</div><div class="my-order-foot"><span>${new Date(o.createdAt||Date.now()).toLocaleString('pt-BR')}</span><strong>R$ ${Number(o.total||0).toFixed(2).replace('.',',')}</strong></div></article>`).join('') : '<p class="empty-state">Você ainda não realizou pedidos.</p>';
    }
    $('btn-refresh-my-orders')?.addEventListener('click', renderMyOrdersV2);

    function refreshDashboardV2() {
        const quick = $('dashboard-quick-overview'), ach = $('dashboard-recent-achievements');
        const greeting = $('dashboard-command-greeting');
        if (greeting && currentUser) {
            const hour = new Date().getHours();
            const salutation = hour < 12 ? 'BOM DIA' : hour < 18 ? 'BOA TARDE' : 'BOA NOITE';
            greeting.textContent = `${salutation}, ${(currentUser.callsign || currentUser.name || 'OPERADOR').toUpperCase()} // CENTRAL ONLINE`;
        }
        const games = getStore(DB_GAMES) || [], users = getStore(DB_USERS) || [], anns = getStore(DB_ANNOUNCEMENTS) || [];
        const next = games.filter(g=>!g.completed && new Date(`${g.date}T${g.time||'23:59'}`)>=new Date()).sort((a,b)=>String(a.date+a.time).localeCompare(String(b.date+b.time)))[0];
        const online = users.filter(isUserOnline).length;
        if (quick) quick.innerHTML = `<div class="quick-metric"><strong>${online}</strong><span>online agora</span></div><div class="quick-line"><span>Próxima operação</span><strong>${next ? escapeHtml(next.title) : 'Nenhuma'}</strong></div><div class="quick-line"><span>Confirmados</span><strong>${next ? (next.confirmed||[]).length : 0}</strong></div><div class="quick-line"><span>Último aviso</span><strong>${anns.length ? escapeHtml(String((anns.slice().sort((a,b)=>parseTimeV2(b.createdAt)-parseTimeV2(a.createdAt))[0].text)||'').slice(0,45)) : 'Sem avisos'}</strong></div>`;
        const awards = (getStore(DB_ACHIEVEMENT_AWARDS)||[]).slice().sort((a,b)=>parseTimeV2(b.awardedAt||b.createdAt)-parseTimeV2(a.awardedAt||a.createdAt)).slice(0,4);
        const achievements = getStore(DB_ACHIEVEMENTS)||[];
        if (ach) ach.innerHTML = awards.length ? awards.map(a=>{ const u=users.find(x=>x.id===a.userId), c=achievements.find(x=>x.id===a.achievementId); return `<div class="recent-achievement-row"><span>🏅</span><div><strong>${escapeHtml(u?.callsign||'Operador')}</strong><small>${escapeHtml(c?.title||'Conquista')}</small></div></div>`; }).join('') : '<p class="empty-state">Sem conquistas recentes.</p>';
        renderNotificationCenterV2();
    }
    document.querySelectorAll('[data-quick-page]').forEach(b=>b.addEventListener('click',()=>navigateTo(b.dataset.quickPage)));

    function updateConnectionUiV2() {
        if (!connectionStatusV2) return;
        const offline = !navigator.onLine;
        connectionStatusV2.className = `connection-status ${offline ? 'offline' : cloudHasRecentErrorV2 ? 'warning' : 'online'}`;
        const label=connectionStatusV2.querySelector('.connection-label'); if(label) label.textContent = offline ? 'Sem conexão' : cloudHasRecentErrorV2 ? 'Reconectando' : 'Online';
    }
    window.addEventListener('online',()=>{ cloudHasRecentErrorV2=false; updateConnectionUiV2(); showToast('Conexão restabelecida. Sincronizando...', 'success'); });
    window.addEventListener('offline',()=>{ updateConnectionUiV2(); showToast('Sem conexão — alterações podem aguardar sincronização.', 'info'); });
    updateConnectionUiV2();


    // ===== V1.0 EXPERIENCE ENHANCEMENTS =====
    const RARITY_LABELS = { comum:'COMUM', incomum:'INCOMUM', rara:'RARA', epica:'ÉPICA', lendaria:'LENDÁRIA' };
    const RARITY_XP = { comum:100, incomum:125, rara:150, epica:200, lendaria:250 };

    function getRarityMeta(a) {
        const rarity = String(a?.rarity || 'comum').toLowerCase();
        return { rarity, label: RARITY_LABELS[rarity] || 'COMUM', xp: RARITY_XP[rarity] || 100 };
    }

    function decorateAchievementRarity() {
        if (!achievementsGrid) return;
        const achievements = getStore(DB_ACHIEVEMENTS) || [];
        achievementsGrid.querySelectorAll('.achievement-card[data-achievement-id]').forEach(card => {
            const a = achievements.find(x => String(x.id) === String(card.dataset.achievementId));
            if (!a) return;
            const meta = getRarityMeta(a);
            card.classList.add(`rarity-${meta.rarity}`);
            const content = card.querySelector('.achievement-card-body') || card;
            if (!card.querySelector('.achievement-rarity-chip')) {
                const chip = document.createElement('span');
                chip.className = `achievement-rarity-chip rarity-${meta.rarity}`;
                chip.textContent = `${meta.label} • ${meta.xp} XP`;
                content.prepend(chip);
            }
        });
    }

    const refreshAchievementsBaseV10 = refreshAchievements;
    refreshAchievements = function() {
        refreshAchievementsBaseV10();
        decorateAchievementRarity();
    };

    const renderProfileAchievementsBaseV10 = renderProfileAchievements;
    renderProfileAchievements = function(userId) {
        renderProfileAchievementsBaseV10(userId);
        const achievements = getStore(DB_ACHIEVEMENTS) || [];
        profileAchievements?.querySelectorAll('[data-achievement-id], .profile-achievement-item, .profile-achievement-badge').forEach(el => {
            const id = el.dataset.achievementId || el.dataset.id;
            const a = achievements.find(x => String(x.id) === String(id));
            if (a) el.classList.add(`rarity-${getRarityMeta(a).rarity}`);
        });
    };

    function renderDashboardOperatorHeroV10() {
        if (!currentUser) return;
        const stats = getOperatorStatsV2(currentUser.id);
        const callsign = $('dashboard-hero-callsign'), fn = $('dashboard-hero-function'), level = $('dashboard-hero-level');
        const xp = $('dashboard-hero-xp'), bar = $('dashboard-hero-xp-bar'), avatar = $('dashboard-hero-avatar');
        if (callsign) callsign.textContent = currentUser.callsign || 'OPERADOR';
        if (fn) fn.textContent = currentUser.funcao || (String(currentUser.role||'').toLowerCase() === 'admin' ? 'Comando' : 'Operador');
        if (level) level.textContent = `Nível ${stats.level}`;
        if (xp) xp.textContent = `${stats.xp} / ${stats.level * 250} XP`;
        if (bar) bar.style.width = `${Math.min(100, (stats.inLevel / 250) * 100)}%`;
        if (avatar) avatar.innerHTML = currentUser.avatar ? `<img src="${escapeHtml(currentUser.avatar)}" alt="">` : escapeHtml((currentUser.callsign || '?').charAt(0));
        const hero = $('dashboard-operator-hero');
        if (hero) {
            const liveUser = (getStore(DB_USERS) || []).find(u => String(u.id) === String(currentUser.id)) || currentUser;
            applyProfileBackgroundVisual(hero, liveUser);
        }
    }

    const refreshDashboardV2BaseV10 = refreshDashboardV2;
    refreshDashboardV2 = function() {
        refreshDashboardV2BaseV10();
        renderDashboardOperatorHeroV10();
        const next = (getStore(DB_GAMES)||[]).filter(g=>!g.completed).sort((a,b)=>String(a.date+a.time).localeCompare(String(b.date+b.time)))[0];
        if (nextGameInfo && next) {
            nextGameInfo.innerHTML = `<div class="next-operation-card"><span class="next-operation-status">INSCRIÇÕES ABERTAS</span><strong>${escapeHtml(next.title||'Operação')}</strong><div>${formatDate(next.date)} • ${escapeHtml(next.time||'—')}</div><div>📍 ${escapeHtml(next.location||'Local a definir')}</div><div class="next-operation-people">👥 ${(next.confirmed||[]).length} confirmados</div><button type="button" class="btn-primary" data-dashboard-confirm-game="${escapeHtml(next.id)}">Ver operação</button></div>`;
            nextGameInfo.querySelector('[data-dashboard-confirm-game]')?.addEventListener('click',()=>navigateTo('games'));
        }
    };

    const refreshMembersBaseV10 = refreshMembers;
    refreshMembers = function() {
        refreshMembersBaseV10();
        const users = getStore(DB_USERS)||[];
        membersList?.querySelectorAll('.member-card').forEach(card => {
            const u = users.find(x=>String(x.id)===String(card.dataset.id)); if(!u) return;
            const info = card.querySelector('.member-info'); if(!info) return;
            const stats = getOperatorStatsV2(u.id);
            if (!info.querySelector('.member-v10-meta')) {
                const el=document.createElement('div'); el.className='member-v10-meta';
                el.innerHTML=`<span>${escapeHtml(u.funcao||'Operador')}</span><span>NV. ${stats.level}</span><span>${stats.awards} insígnias</span>`;
                info.appendChild(el);
            }
        });
    };

    const refreshGamesBaseV10 = refreshGames;
    refreshGames = function() {
        refreshGamesBaseV10();
        if (!gamesList) return;
        const cards=[...gamesList.querySelectorAll('.game-card')];
        if (!cards.length) return;
        const games=getStore(DB_GAMES)||[];
        const active=[], history=[];
        cards.forEach(card=>{
            const id=card.dataset.gameId;
            const g=games.find(x=>String(x.id)===String(id));
            (g?.completed ? history : active).push(card);
        });
        if (!active.length && !history.length) return;
        gamesList.innerHTML='';
        const appendGameSectionV12 = (items, historyMode=false) => {
            if (!items.length) return;
            const section=document.createElement('section');
            section.className='games-section-block' + (historyMode ? ' history history-collapsed-v25' : '');
            const h=document.createElement(historyMode ? 'button' : 'div');
            h.className='games-section-title' + (historyMode ? ' history history-toggle-v25' : '');
            if (historyMode) {
                h.type='button';
                h.setAttribute('aria-expanded','false');
                h.setAttribute('aria-label','Mostrar ou ocultar operações anteriores');
            }
            h.innerHTML=historyMode
                ? '<span>ᛏ</span><div><strong>Operações anteriores</strong><small class="history-toggle-hint-v25">Clique para expandir</small></div><span class="history-toggle-chevron-v25">⌄</span>'
                : '<span>⚔</span><div><strong>Operações abertas</strong><small>Confirme sua presença enquanto a operação estiver ativa.</small></div>';
            const grid=document.createElement('div');
            grid.className='games-section-grid' + (historyMode ? ' history-grid-v25' : '');
            items.forEach(c=>grid.appendChild(c));
            section.appendChild(h);
            section.appendChild(grid);
            gamesList.appendChild(section);

            if (historyMode) {
                h.addEventListener('click', () => {
                    const collapsed = section.classList.toggle('history-collapsed-v25');
                    h.setAttribute('aria-expanded', String(!collapsed));
                    const hint=h.querySelector('.history-toggle-hint-v25');
                    if(hint) hint.textContent=collapsed ? 'Clique para expandir' : 'Clique para minimizar';
                });
            }
        };
        appendGameSectionV12(active,false);
        appendGameSectionV12(history,true);
    };

    // Chat: reply-to, date separators and better message context.
    let activeChatReplyV10 = null;
    const chatReplyPreviewV10 = $('chat-reply-preview');
    const chatReplyAuthorV10 = $('chat-reply-author');
    const chatReplyTextV10 = $('chat-reply-text');
    function clearChatReplyV10(){ activeChatReplyV10=null; chatReplyPreviewV10?.classList.add('hidden'); }
    $('btn-cancel-chat-reply')?.addEventListener('click', clearChatReplyV10);
    function setChatReplyV10(msg){
        if(!msg) return; activeChatReplyV10={id:msg.id,callsign:msg.callsign||'Operador',text:String(msg.text||msg.mediaName|| (msg.type==='image'?'Foto':'Vídeo')).slice(0,140)};
        if(chatReplyAuthorV10) chatReplyAuthorV10.textContent=activeChatReplyV10.callsign;
        if(chatReplyTextV10) chatReplyTextV10.textContent=activeChatReplyV10.text;
        chatReplyPreviewV10?.classList.remove('hidden'); chatInput?.focus();
    }

    const renderMessagesBaseV10 = renderMessages;
    renderMessages = function(messages, stickToBottom=true) {
        renderMessagesBaseV10(messages, stickToBottom);
        const byId=new Map((messages||[]).map(m=>[String(m.id),m]));
        let lastDay='';
        [...chatMessages.querySelectorAll('.chat-msg')].forEach((el,idx)=>{
            const sorted=[...(messages||[])].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).slice(-200);
            const msg=sorted[idx]; if(!msg) return;
            el.dataset.messageId=msg.id;
            const day=new Date(msg.date||Date.now()).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
            if(day!==lastDay){ const sep=document.createElement('div');sep.className='chat-date-separator';sep.textContent=day;el.before(sep);lastDay=day; }
            const content=el.querySelector('.chat-msg-content');
            if(msg.replyTo && content){ const q=document.createElement('div');q.className='chat-reply-quoted';q.innerHTML=`<strong>${escapeHtml(msg.replyTo.callsign||'Operador')}</strong><span>${escapeHtml(msg.replyTo.text||'Mensagem')}</span>`;content.prepend(q); }
            if(content && !content.querySelector('.chat-reply-action')){ const b=document.createElement('button');b.type='button';b.className='chat-reply-action';b.textContent='↩ Responder';b.addEventListener('click',()=>setChatReplyV10(msg));content.appendChild(b); }
        });
    };

    const sendMessageBaseV10 = sendMessage;
    sendMessage = async function() {
        const text=chatInput.value.trim();
        if(!activeChatReplyV10) return sendMessageBaseV10();
        if(!text || !currentUser) return;
        const mentionData=extractMentions(text);
        const message={id:generateId(),userId:currentUser.id,callsign:currentUser.callsign,text,mentions:mentionData.ids,mentionCallsigns:mentionData.callsigns,date:new Date().toISOString(),replyTo:{...activeChatReplyV10}};
        hideMentionSuggestions(); chatInput.value=''; btnSendMsg.disabled=true;
        try { if(window.AsgardCloud?.addMessage) await window.AsgardCloud.addMessage(message); else { const messages=getStore(DB_MESSAGES)||[];messages.push(message);setStore(DB_MESSAGES,messages);refreshChat(); } clearChatReplyV10(); }
        catch(err){ console.error('[Chat reply]',err);chatInput.value=text;showToast('Não foi possível enviar a resposta.','error'); }
        finally{ btnSendMsg.disabled=false;chatInput.focus(); }
    };
    // Existing event listeners call the binding by reference captured earlier, so add a capture listener
    // that handles reply sends before the legacy click handler can execute.
    btnSendMsg?.addEventListener('click', e=>{ if(activeChatReplyV10){ e.stopImmediatePropagation(); sendMessage(); } }, true);
    chatInput?.addEventListener('keydown', e=>{ if(activeChatReplyV10 && e.key==='Enter' && !e.shiftKey){ e.preventDefault();e.stopImmediatePropagation();sendMessage(); } }, true);

    // Notification drawer: enrich with explicit unread counter label and retain fast deep-links.
    const notificationPanel = document.querySelector('.notification-panel-header');
    if(notificationPanel && !notificationPanel.querySelector('.notification-v10-note')){
        const n=document.createElement('small');n.className='notification-v10-note';n.textContent='Menções, conquistas, avisos e operações em um só lugar.';notificationPanel.querySelector('div')?.appendChild(n);
    }

    // Lightweight performance hygiene: avoid unnecessary work while the app is hidden.
    document.addEventListener('visibilitychange',()=>{
        if(document.hidden){ chatEmojiPicker?.classList.add('hidden'); hideMentionSuggestions(); }
        else if(currentUser){ scheduleSyncedViewRefresh('visibility'); }
    });


    // Pull-to-refresh: mobile-first, no polling; refreshes current synchronized view.
    const pullIndicatorV18 = $('pull-refresh-indicator');
    const pullLabelV18 = $('pull-refresh-label');
    let pullStartYV18 = 0, pullDistanceV18 = 0, pullingV18 = false;
    const scrollHostV18 = document.querySelector('.main-content');
    scrollHostV18?.addEventListener('touchstart', e => {
        if (window.scrollY <= 2 && e.touches.length === 1 && !document.querySelector('.modal:not(.hidden)')) {
            pullStartYV18 = e.touches[0].clientY; pullingV18 = true; pullDistanceV18 = 0;
        }
    }, {passive:true});
    scrollHostV18?.addEventListener('touchmove', e => {
        if (!pullingV18) return;
        pullDistanceV18 = Math.max(0, Math.min(90, e.touches[0].clientY - pullStartYV18));
        if (pullDistanceV18 > 8) {
            pullIndicatorV18?.classList.add('visible');
            if (pullLabelV18) pullLabelV18.textContent = pullDistanceV18 >= 62 ? 'Solte para sincronizar' : 'Puxe para sincronizar';
            pullIndicatorV18?.style.setProperty('--pull-distance', `${pullDistanceV18}px`);
        }
    }, {passive:true});
    scrollHostV18?.addEventListener('touchend', async () => {
        if (!pullingV18) return;
        pullingV18 = false;
        const trigger = pullDistanceV18 >= 62;
        pullDistanceV18 = 0;
        if (trigger && activePageName) {
            setAppSyncingV18(true, 'Sincronizando');
            haptic(10);
            if (pullLabelV18) pullLabelV18.textContent = 'Sincronizando...';
            navigateTo(activePageName, true);
            await new Promise(r => setTimeout(r, 420));
            showToast('Dados atualizados.', 'success');
            setAppSyncingV18(false);
        }
        setTimeout(() => {
            pullIndicatorV18?.classList.remove('visible');
            pullIndicatorV18?.style.removeProperty('--pull-distance');
        }, trigger ? 220 : 0);
    }, {passive:true});

    // Settings: haptics.
    document.addEventListener('DOMContentLoaded', () => {
        const h = $('haptic-enabled'), test = $('btn-test-haptic');
        if (h) h.checked = hapticState.enabled;
        h?.addEventListener('change', () => setHapticsEnabled(h.checked));
        test?.addEventListener('click', () => haptic([18,35,18]));
        enhanceImagesV18();
    });

    // Micro-feedback on primary actions.
    document.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn || btn.disabled) return;
        if (btn.matches('.btn-primary, .btn-confirm, [id*="save"], [id*="confirm"], [id*="copy"]')) {
            animateActionV18(btn, 'success');
        }
    }, {passive:true});

    // Offline snapshot UX: local store remains browsable and clearly labeled.
    window.addEventListener('offline', () => {
        document.body.classList.add('offline-snapshot-v18');
        setAppSyncingV18(false);
    });
    window.addEventListener('online', () => {
        document.body.classList.remove('offline-snapshot-v18');
        setAppSyncingV18(true, 'Sincronizando');
        setTimeout(() => setAppSyncingV18(false), 900);
    });

    // ===== INIT =====
    async function init() {
        createParticles();
        splashStartedAt = performance.now();
        setSplashStage(8, 'INICIANDO SISTEMA', 'Preparando Central de Comando');
        try {
            setSplashStage(24, 'CONECTANDO À ASGARD', 'Estabelecendo conexão segura');
            const status = await window.AsgardCloud.init();
            if (!status.online) {
                splashFailure('Modo online não configurado');
                await finishSplash('auth-screen', () => showAuthMessage('Modo online não configurado. Preencha firebase-config.js com os dados do seu projeto Firebase.'));
                return;
            }
            setSplashStage(40, 'CONECTANDO À ASGARD', 'Conexão estabelecida');
            // No artificial 1.2 s delay: real authentication/data stages drive progress.
            await checkSession();
        } catch (err) {
            console.error(err);
            splashFailure('Falha ao conectar à Asgard');
            await finishSplash('auth-screen', () => showAuthMessage('Falha ao conectar ao Firebase. Verifique firebase-config.js e sua conexão.'));
        }
    }


    // Re-render active views when another device changes cloud data.
    // Firestore can deliver several initial snapshots almost simultaneously. Grouping
    // those UI renders prevents repeated heavy innerHTML rebuilds during login/navigation.
    let syncRenderTimer = null;
    const pendingSyncKeys = new Set();
    function scheduleSyncedViewRefresh(key) {
        if (key) pendingSyncKeys.add(key);
        if (syncRenderTimer) return;
        syncRenderTimer = setTimeout(() => {
            syncRenderTimer = null;
            const keys = new Set(pendingSyncKeys); pendingSyncKeys.clear();
            if (!currentUser) return;
            renderNotificationCenterV2();
            const active = document.querySelector('.page:not(.hidden)');
            if (!active) return;
            const id = active.id || '';
            if (id === 'page-dashboard') { refreshDashboard(); refreshDashboardV2(); }
            if (id === 'page-profile') { refreshProfile(); renderProfileStatsV2((getViewedProfileUser() || currentUser).id); }
            if (id === 'page-members') refreshMembers();
            if (id === 'page-arsenal') refreshArsenal();
            if (id === 'page-achievements') refreshAchievements();
            if (id === 'page-chat' && !keys.has(DB_MESSAGES)) refreshChat();
            if (id === 'page-games') refreshGames();
            if (id === 'page-loja') { refreshProducts(); renderMyOrdersV2(); }
            if (id === 'page-admin' && String(currentUser.role||'').toLowerCase() === 'admin') refreshAdminPanel();
            if (id === 'page-contribuicao') refreshContribuicao();
        }, 70);
    }
    window.addEventListener('asgard:sync', (event) => {
        if (!currentUser) return;
        setAppSyncingV18(true, 'Sincronizando');
        clearTimeout(window.__asgardSyncEndV18);
        window.__asgardSyncEndV18 = setTimeout(() => setAppSyncingV18(false), 260);
        updateNavBadgesV18();
        const key = event.detail?.key;
        if (key === DB_MESSAGES) handleIncomingChatSync();
        if (key === DB_USERS) {
            currentUser = (getStore(DB_USERS) || []).find(u => u.id === currentUser.id) || currentUser;
            updateUIForRole(); updateTopbar();
            updateAchievementNotificationBadge();
            setTimeout(maybeShowAchievementNotification, 120);
        }
        if (key === DB_ACHIEVEMENTS || key === DB_ACHIEVEMENT_AWARDS) {
            updateAchievementNotificationBadge();
            // A galeria é recalculada em tempo real: fundos acompanham somente as conquistas atuais.
            if (!profileBackgroundModal?.classList.contains('hidden')) renderProfileBackgroundGallery();
            refreshProfile();
        }
        if (currentUser?.role === 'admin' && [DB_GAMES,DB_ORDERS,DB_CONTRIBUTIONS,'asgard_guest_confirmations'].includes(key)) updateAdminAlertBadge();
        scheduleSyncedViewRefresh(key);
    });
    window.addEventListener('asgard:cloud-error', (e) => {
        console.error(e.detail);
        cloudHasRecentErrorV2 = true; updateConnectionUiV2();
        setTimeout(()=>{ cloudHasRecentErrorV2=false; updateConnectionUiV2(); }, 8000);
        const code = String(e.detail?.code || e.detail?.message || '').toLowerCase();
        let msg = 'Não foi possível sincronizar uma alteração com o servidor.';
        if (code.includes('resource-exhausted') || code.includes('quota')) msg = 'Cota do Firebase atingida. Aguarde a renovação da cota ou verifique o uso no console.';
        else if (code.includes('permission-denied')) {
            msg = currentUser?.role === 'admin'
                ? 'Firebase recusou a gravação do ADMIN. Publique o arquivo firestore.rules desta versão no projeto Firebase.'
                : 'Operação não permitida para este usuário pelas regras do Firebase.';
        }
        else if (code.includes('unavailable') || !navigator.onLine) msg = 'Sem conexão com o servidor. A tela será atualizada quando a conexão voltar.';
        showToast(msg, 'error');
    });

    $('btn-dismiss-app-update')?.addEventListener('click', () => $('app-update-banner')?.classList.add('hidden'));
    $('btn-apply-app-update')?.addEventListener('click', async () => {
        const btn = $('btn-apply-app-update');
        if (btn) { btn.disabled = true; btn.textContent = 'ATUALIZANDO...'; }
        sessionStorage.setItem('asgard_restore_page', activePageName || 'dashboard');
        try {
            const reg = await navigator.serviceWorker?.getRegistration();
            if (reg?.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
            else location.reload();
        } catch (_) { location.reload(); }
    });
    navigator.serviceWorker?.addEventListener?.('controllerchange', () => {
        const page = sessionStorage.getItem('asgard_restore_page') || activePageName || 'dashboard';
        sessionStorage.setItem('asgard_last_page', page);
        location.reload();
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(reg => {
            if (reg.waiting && navigator.serviceWorker.controller) {
                adminUpdateAvailable = true; updateAdminAlertBadge();
                $('app-update-banner')?.classList.remove('hidden');
            }
            reg.addEventListener('updatefound', () => {
                const installing = reg.installing;
                installing?.addEventListener('statechange', () => {
                    if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                        adminUpdateAvailable = true; updateAdminAlertBadge();
                        const banner = $('app-update-banner');
                        banner?.classList.remove('hidden');
                    }
                });
            });
        }).catch(() => {});
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'OPEN_PAGE' && event.data?.page && currentUser) navigateTo(event.data.page);
        });
    }

    // Start app

    document.addEventListener('DOMContentLoaded',()=>{const e=$('sfx-enabled'),v=$('sfx-volume'),l=$('sfx-volume-label'),t=$('btn-test-sfx');if(e)e.checked=soundState.enabled;if(v)v.value=Math.round(soundState.volume*100);if(l)l.textContent=Math.round(soundState.volume*100)+'%';e?.addEventListener('change',()=>setSfxEnabled(e.checked));v?.addEventListener('input',()=>{setSfxVolume(Number(v.value)/100);if(l)l.textContent=v.value+'%'});t?.addEventListener('click',()=>playSfx('confirm',1));});
    init();

})();