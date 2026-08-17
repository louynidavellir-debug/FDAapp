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

    // ===== DOM ELEMENTS =====
    const $ = id => document.getElementById(id);

    // Screens
    const splashScreen = $('splash-screen');
    const authScreen = $('auth-screen');
    const appScreen = $('app-screen');

    // Auth
    const loginForm = $('login-form');
    const registerForm = $('register-form');
    const loginCallsign = $('login-callsign');
    const loginPin = $('login-pin');
    const regCallsign = $('reg-callsign');
    const regName = $('reg-name');
    const regPin = $('reg-pin');
    const regPinConfirm = $('reg-pin-confirm');
    const btnLogin = $('btn-login');
    const btnRegister = $('btn-register');
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
    const statGames = $('stat-games');
    const nextGameInfo = $('next-game-info');
    const announcements = $('announcements');
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

    // Temp storage for photos being edited (base64)
    let pendingAvatar = null;
    let pendingFotoPrimaria = null;
    let pendingFotoSecundaria = null;
    let pendingFotoLoadout = null;

    // Members
    const membersList = $('members-list');
    const memberSearch = $('member-search');
    const adminMembersActions = $('admin-members-actions');
    const btnPromoteMember = $('btn-promote-member');
    const btnRemoveMember = $('btn-remove-member');

    // Arsenal
    const arsenalGallery = $('arsenal-gallery');
    const arsenalSearch = $('arsenal-search');
    const arsenalFilter = $('arsenal-filter');
    const arsenalSummary = $('arsenal-summary');

    // Achievements
    const achievementsGrid = $('achievements-grid');
    const achievementsSummary = $('achievements-summary');
    const btnCreateAchievement = $('btn-create-achievement');
    const achievementModal = $('achievement-modal');
    const achievementModalTitle = $('achievement-modal-title');
    const achievementTitle = $('achievement-title');
    const achievementDescription = $('achievement-description');
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

    // Chat
    const chatMessages = $('chat-messages');
    const chatInput = $('chat-input');
    const btnSendMsg = $('btn-send-msg');
    const chatBadge = $('chat-badge');
    const chatOnlineUsers = $('chat-online-users');
    const btnChatEmoji = $('btn-chat-emoji');
    const chatEmojiPicker = $('chat-emoji-picker');

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

    btnLogin.addEventListener('click', async () => {
        const callsign = loginCallsign.value.trim().toUpperCase();
        const pin = loginPin.value.trim();
        if (!callsign) { showAuthMessage('Insira seu callsign'); return; }
        if (pin.length < 6) { showAuthMessage('A senha deve ter pelo menos 6 caracteres'); return; }
        if (!window.AsgardCloud?.hasConfig()) { showAuthMessage('Firebase não configurado. Preencha firebase-config.js.'); return; }
        btnLogin.disabled = true;
        try {
            const authUser = await window.AsgardCloud.signIn(callsign, pin);
            await window.AsgardCloud.connectSession();
            const users = getStore(DB_USERS) || [];
            const user = users.find(u => u.id === authUser.uid);
            if (!user) throw new Error('Perfil não encontrado no Firestore.');
            user.online = true;
            user.lastSeen = new Date().toISOString();
            setStore(DB_USERS, users);
            currentUser = user;
            addActivity(`${user.callsign} entrou online`);
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
            setStore(DB_USERS, users);
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
            splashScreen.classList.add('fade-out');
            setTimeout(() => { showScreen('auth-screen'); showAuthMessage('Backend não configurado. Abra firebase-config.js e cole a configuração do Firebase.'); }, 600);
            return;
        }
        try {
            const authUser = await window.AsgardCloud.waitForAuth();
            if (authUser) {
                await window.AsgardCloud.connectSession();
                const users = getStore(DB_USERS) || [];
                const user = users.find(u => u.id === authUser.uid);
                if (user) {
                    user.online = true;
                    user.lastSeen = new Date().toISOString();
                    setStore(DB_USERS, users);
                    currentUser = user;
                    enterApp();
                    return;
                }
                await window.AsgardCloud.removeSession();
            }
        } catch (err) { console.error(err); }
        splashScreen.classList.add('fade-out');
        setTimeout(() => { showScreen('auth-screen'); }, 600);
    }

    // ===== ENTER APP =====
    function enterApp() {
        splashScreen.classList.add('fade-out');
        setTimeout(() => {
            showScreen('app-screen');
            updateUIForRole();
            updateTopbar();
            navigateTo('dashboard');
            startChatPoll();
        }, 600);
    }

    // ===== UPDATE UI FOR ROLE =====
    function updateUIForRole() {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            if (currentUser.role === 'admin') {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
    }

    // ===== TOPBAR =====
    function updateTopbar() {
        topbarCallsign.textContent = currentUser.callsign;
        topbarRole.textContent = currentUser.role === 'admin' ? 'ADMIN' : 'OPERADOR';
        topbarRole.className = `role-badge ${currentUser.role}`;
    }

    // ===== NAVIGATION =====
    function navigateTo(page) {
        pages.forEach(p => p.classList.add('hidden'));
        const target = $('page-' + page);
        if (target) {
            target.classList.remove('hidden');
            target.style.animation = 'none';
            target.offsetHeight; // Trigger reflow
            target.style.animation = '';
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
            vendas: 'Vendas'
        };
        pageTitle.textContent = titles[page] || 'Dashboard';

        // Refresh page data
        if (page === 'dashboard') refreshDashboard();
        if (page === 'profile') {
            const viewedUser = getViewedProfileUser();
            pageTitle.textContent = viewedProfileUserId && viewedUser && viewedUser.id !== currentUser.id
                ? `Perfil • ${viewedUser.callsign}`
                : 'Meu Perfil';
            refreshProfile();
        }
        if (page === 'members') refreshMembers();
        if (page === 'arsenal') refreshArsenal();
        if (page === 'achievements') refreshAchievements();
        if (page === 'chat') { createChatEmbers(); refreshChat(); }
        if (page === 'games') refreshGames();
        if (page === 'loja') refreshProducts();
        if (page === 'vendas') { refreshOrderStats(); refreshOrders(); }
        if (page === 'contribuicao') refreshContribuicao();

        // Close mobile sidebar
        closeSidebar();
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            if (item.dataset.page === 'profile') viewedProfileUserId = null;
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
        const users = getStore(DB_USERS) || [];
        const user = users.find(u => u.id === currentUser.id);
        if (user) {
            user.online = false;
            user.lastSeen = new Date().toISOString();
            setStore(DB_USERS, users);
        }

        addActivity(`${currentUser.callsign} saiu`);
        await window.AsgardCloud?.removeSession();
        currentUser = null;
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
        statOnline.textContent = users.filter(u => u.online).length;
        statGames.textContent = games.length;

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

        // Announcements
        if (anns.length > 0) {
            announcements.innerHTML = anns.slice(-3).reverse().map(a =>
                `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.85rem;">${a.text}<br><span style="font-size:0.7rem;color:var(--text-dim)">${formatDateTime(a.date)}</span></div>`
            ).join('');
        } else {
            announcements.innerHTML = '<p class="empty-state">Sem avisos</p>';
        }

        // Recent activity
        if (activities.length > 0) {
            recentActivity.innerHTML = activities.slice(-5).reverse().map(a =>
                `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.85rem;color:var(--text-secondary)">⚡ ${a.text}<br><span style="font-size:0.7rem;color:var(--text-dim)">${formatDateTime(a.date)}</span></div>`
            ).join('');
        } else {
            recentActivity.innerHTML = '<p class="empty-state">Sem atividade</p>';
        }
    }

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
    function openPhotoLightbox(src) {
        const lb = document.createElement('div');
        lb.className = 'photo-lightbox';
        lb.innerHTML = `<img src="${src}" alt="Foto"/>`;
        lb.addEventListener('click', () => lb.remove());
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
        profileName.textContent = profileUser.name || '—';
        profileCallsignText.textContent = profileUser.callsign || '—';
        profileFuncao.textContent = profileUser.funcao || 'Operador';
        profilePrimaria.textContent = profileUser.primaria || '—';
        profileSecundaria.textContent = profileUser.secundaria || '—';
        profileLoadout.textContent = profileUser.loadout || '—';
        profileSince.textContent = formatDate(profileUser.createdAt);
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

    btnCancelProfile.addEventListener('click', () => {
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
            setStore(DB_USERS, users);
            currentUser = user;
            pendingFotoPrimaria = null;
            pendingFotoSecundaria = null;
            pendingFotoLoadout = null;
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
                <div class="member-card ${selectedMemberId === u.id ? 'selected' : ''}" data-id="${u.id}" role="button" tabindex="0" aria-label="Abrir perfil de ${escapeHtml(u.callsign)}">
                    <div class="member-avatar">${escapeHtml((u.callsign || '?').charAt(0))}</div>
                    <div class="member-info">
                        <div class="member-callsign">${escapeHtml(u.callsign || 'SEM CALLSIGN')}</div>
                        <div class="member-name-preview">${escapeHtml(u.name || '')}</div>
                        <div class="member-role role-badge ${u.role}">${u.role === 'admin' ? 'ADMIN' : 'OPERADOR'}</div>
                    </div>
                    ${currentUser.role === 'admin' && u.id !== currentUser.id ? `<button type="button" class="member-manage-btn" data-manage-id="${u.id}" title="Gerenciar membro">Gerenciar</button>` : ''}
                    <div class="member-status ${u.online ? 'online' : 'offline'}" title="${u.online ? 'Online' : 'Offline'}"></div>
                </div>
            `).join('');

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
                selectedMemberId = button.dataset.manageId;
                refreshMembers();
                adminMembersActions.classList.remove('hidden');
            });
        });

        // Hide admin actions if not admin
        if (currentUser.role !== 'admin') {
            adminMembersActions.classList.add('hidden');
        }
    }

    memberSearch.addEventListener('input', refreshMembers);

    btnPromoteMember.addEventListener('click', () => {
        if (!selectedMemberId) { showToast('Selecione um membro', 'error'); return; }
        const users = getStore(DB_USERS) || [];
        const user = users.find(u => u.id === selectedMemberId);
        if (user) {
            if (user.role === 'admin') {
                user.role = 'operador';
                addActivity(`${currentUser.callsign} rebaixou ${user.callsign} para Operador`);
                showToast(`${user.callsign} agora é Operador`, 'info');
            } else {
                user.role = 'admin';
                addActivity(`${currentUser.callsign} promoveu ${user.callsign} a Admin`);
                showToast(`${user.callsign} promovido a Admin!`, 'success');
            }
            setStore(DB_USERS, users);
            selectedMemberId = null;
            adminMembersActions.classList.add('hidden');
            refreshMembers();
        }
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
                if (filter !== 'all' && filter !== weapon.type) return;
                const weaponName = (weapon.name || '').trim();
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

    function getAchievementBadgeMarkup(achievement, className = '') {
        if (achievement?.badge) {
            return `<img class="${className}" src="${achievement.badge}" alt="Insígnia ${escapeHtml(achievement.title || '')}" loading="lazy">`;
        }
        return `<div class="achievement-badge-placeholder ${className}">🏅</div>`;
    }

    function renderProfileAchievements(userId) {
        if (!profileAchievements) return;
        const achievements = (getStore(DB_ACHIEVEMENTS) || []).filter(a => (a.completedBy || []).includes(userId));
        if (!achievements.length) {
            profileAchievements.innerHTML = '<span class="profile-achievements-empty">Nenhuma insígnia conquistada.</span>';
            return;
        }
        profileAchievements.innerHTML = achievements.map(a => `
            <button type="button" class="profile-badge" data-achievement-id="${a.id}" title="${escapeHtml(a.title || 'Conquista')}">
                ${a.badge ? `<img src="${a.badge}" alt="${escapeHtml(a.title || 'Insígnia')}">` : '<span>🏅</span>'}
                <small>${escapeHtml(a.title || 'Conquista')}</small>
            </button>
        `).join('');
        profileAchievements.querySelectorAll('.profile-badge').forEach(btn => {
            btn.addEventListener('click', () => {
                const achievement = (getStore(DB_ACHIEVEMENTS) || []).find(a => a.id === btn.dataset.achievementId);
                if (achievement?.badge) openPhotoLightbox(achievement.badge);
            });
        });
    }

    function refreshAchievements() {
        if (!achievementsGrid) return;
        const achievements = (getStore(DB_ACHIEVEMENTS) || []).slice()
            .sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        const users = getStore(DB_USERS) || [];
        const myCount = achievements.filter(a => (a.completedBy || []).includes(currentUser?.id)).length;
        if (achievementsSummary) {
            achievementsSummary.innerHTML = `
                <span><strong>${achievements.length}</strong> conquista${achievements.length === 1 ? '' : 's'} disponível${achievements.length === 1 ? '' : 'is'}</span>
                <span class="achievements-summary-sep">•</span>
                <span>Você conquistou <strong>${myCount}</strong></span>`;
        }
        if (!achievements.length) {
            achievementsGrid.innerHTML = `<div class="achievements-empty">
                <div class="achievements-empty-icon">🏅</div>
                <h3>Nenhuma conquista disponível</h3>
                <p>Quando o ADMIN criar uma conquista, ela aparecerá aqui para toda a equipe.</p>
            </div>`;
            return;
        }
        achievementsGrid.innerHTML = achievements.map(a => {
            const completed = Array.isArray(a.completedBy) ? a.completedBy : [];
            const mine = completed.includes(currentUser.id);
            const awardedUsers = completed.map(id => users.find(u => u.id === id)).filter(Boolean);
            const names = awardedUsers.slice(0, 5).map(u => escapeHtml(u.callsign || u.name || 'Operador')).join(', ');
            const extra = Math.max(0, awardedUsers.length - 5);
            return `
                <article class="achievement-card ${mine ? 'achievement-earned' : ''}">
                    <div class="achievement-badge-wrap" data-badge="${a.badge ? '1' : '0'}" data-id="${a.id}">
                        ${getAchievementBadgeMarkup(a, 'achievement-badge-image')}
                        ${mine ? '<span class="achievement-earned-ribbon">CONQUISTADA</span>' : ''}
                    </div>
                    <div class="achievement-card-body">
                        <h3>${escapeHtml(a.title || 'Conquista')}</h3>
                        <p>${escapeHtml(a.description || 'Sem descrição.')}</p>
                        <div class="achievement-awarded-count">🏅 ${completed.length} operador${completed.length === 1 ? '' : 'es'} recebeu${completed.length === 1 ? '' : 'ram'} esta insígnia</div>
                        ${awardedUsers.length ? `<div class="achievement-awarded-names">${names}${extra ? ` e +${extra}` : ''}</div>` : '<div class="achievement-awarded-names muted">Ainda sem concluintes</div>'}
                    </div>
                    ${currentUser.role === 'admin' ? `<div class="achievement-admin-actions">
                        <button class="btn-secondary achievement-completers-btn" data-id="${a.id}">Concluintes</button>
                        <button class="btn-secondary achievement-edit-btn" data-id="${a.id}">Editar</button>
                        <button class="btn-danger achievement-delete-btn" data-id="${a.id}">Excluir</button>
                    </div>` : ''}
                </article>`;
        }).join('');

        achievementsGrid.querySelectorAll('.achievement-badge-wrap[data-badge="1"]').forEach(el => {
            el.addEventListener('click', () => {
                const a = achievements.find(x => x.id === el.dataset.id);
                if (a?.badge) openPhotoLightbox(a.badge);
            });
        });
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
        if (currentUser.role !== 'admin') { showToast('Apenas ADMIN pode gerenciar conquistas', 'error'); return; }
        resetAchievementModal();
        if (id) {
            const a = (getStore(DB_ACHIEVEMENTS) || []).find(x => x.id === id);
            if (!a) { showToast('Conquista não encontrada', 'error'); return; }
            editingAchievementId = id;
            pendingAchievementBadge = a.badge || '';
            achievementModalTitle.textContent = 'Editar Conquista';
            achievementTitle.value = a.title || '';
            achievementDescription.value = a.description || '';
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

    if (btnSaveAchievement) btnSaveAchievement.addEventListener('click', () => {
        if (currentUser.role !== 'admin') { showToast('Apenas ADMIN pode gerenciar conquistas', 'error'); return; }
        const title = achievementTitle.value.trim();
        const description = achievementDescription.value.trim();
        if (!title) { showToast('Informe o título da conquista', 'error'); return; }
        if (!description) { showToast('Informe a descrição da conquista', 'error'); return; }
        if (!pendingAchievementBadge) { showToast('Selecione a imagem da insígnia', 'error'); return; }
        const achievements = getStore(DB_ACHIEVEMENTS) || [];
        if (editingAchievementId) {
            const a = achievements.find(x => x.id === editingAchievementId);
            if (!a) { showToast('Conquista não encontrada', 'error'); return; }
            a.title = title;
            a.description = description;
            a.badge = pendingAchievementBadge;
            a.updatedAt = new Date().toISOString();
            addActivity(`${currentUser.callsign} editou a conquista: ${title}`);
            showToast('Conquista atualizada!', 'success');
        } else {
            achievements.push({
                id: generateId(), title, description, badge: pendingAchievementBadge,
                completedBy: [], createdBy: currentUser.id, createdAt: new Date().toISOString()
            });
            addActivity(`${currentUser.callsign} criou a conquista: ${title}`);
            showToast('Conquista criada!', 'success');
        }
        setStore(DB_ACHIEVEMENTS, achievements);
        achievementModal.classList.add('hidden');
        resetAchievementModal();
        refreshAchievements();
    });

    function deleteAchievement(id) {
        if (currentUser.role !== 'admin') { showToast('Apenas ADMIN pode excluir conquistas', 'error'); return; }
        const achievements = getStore(DB_ACHIEVEMENTS) || [];
        const idx = achievements.findIndex(a => a.id === id);
        if (idx < 0) return;
        const a = achievements[idx];
        if (!confirm(`Excluir definitivamente a conquista "${a.title}"? As insígnias concedidas também deixarão de aparecer nos perfis.`)) return;
        achievements.splice(idx, 1);
        setStore(DB_ACHIEVEMENTS, achievements);
        addActivity(`${currentUser.callsign} excluiu a conquista: ${a.title}`);
        showToast('Conquista excluída', 'info');
        refreshAchievements();
    }

    function openAchievementMembers(id) {
        if (currentUser.role !== 'admin') { showToast('Apenas ADMIN pode definir concluintes', 'error'); return; }
        const a = (getStore(DB_ACHIEVEMENTS) || []).find(x => x.id === id);
        if (!a) return;
        managingAchievementId = id;
        achievementMembersTitle.textContent = `Concluintes • ${a.title}`;
        const users = (getStore(DB_USERS) || []).slice().sort((x,y) => String(x.callsign || '').localeCompare(String(y.callsign || '')));
        const completed = new Set(a.completedBy || []);
        achievementMembersList.innerHTML = users.length ? users.map(u => `
            <label class="achievement-member-option">
                <input type="checkbox" value="${u.id}" ${completed.has(u.id) ? 'checked' : ''}>
                <span class="achievement-member-avatar">${u.avatar ? `<img src="${u.avatar}" alt="">` : escapeHtml((u.callsign || '?').charAt(0))}</span>
                <span class="achievement-member-label"><strong>${escapeHtml(u.callsign || 'SEM CALLSIGN')}</strong><small>${escapeHtml(u.name || '')}</small></span>
                <span class="achievement-member-check">✓</span>
            </label>`).join('') : '<p class="empty-state">Nenhum operador encontrado.</p>';
        achievementMembersModal.classList.remove('hidden');
    }

    if (btnCancelAchievementMembers) btnCancelAchievementMembers.addEventListener('click', () => { managingAchievementId = null; achievementMembersModal.classList.add('hidden'); });
    if (achievementMembersModal) achievementMembersModal.addEventListener('click', e => { if (e.target === achievementMembersModal) { managingAchievementId = null; achievementMembersModal.classList.add('hidden'); } });
    if (btnSaveAchievementMembers) btnSaveAchievementMembers.addEventListener('click', () => {
        if (currentUser.role !== 'admin' || !managingAchievementId) return;
        const achievements = getStore(DB_ACHIEVEMENTS) || [];
        const a = achievements.find(x => x.id === managingAchievementId);
        if (!a) return;
        const old = new Set(a.completedBy || []);
        const selected = [...achievementMembersList.querySelectorAll('input[type="checkbox"]:checked')].map(x => x.value);
        a.completedBy = selected;
        a.updatedAt = new Date().toISOString();
        const users = getStore(DB_USERS) || [];
        selected.filter(id => !old.has(id)).forEach(id => {
            const u = users.find(x => x.id === id);
            if (u) addActivity(`${u.callsign} conquistou a insígnia: ${a.title}`);
        });
        setStore(DB_ACHIEVEMENTS, achievements);
        managingAchievementId = null;
        achievementMembersModal.classList.add('hidden');
        showToast('Concluintes atualizados!', 'success');
        refreshAchievements();
    });

    // ===== CHAT =====
    let lastMessageCount = 0;

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

    function refreshChat() {
        const messages = getStore(DB_MESSAGES) || [];
        const users = getStore(DB_USERS) || [];

        // Only render new messages
        if (messages.length !== lastMessageCount || messages.length === 0) {
            renderMessages(messages);
            lastMessageCount = messages.length;
        }

        // Online users
        const onlineUsers = users.filter(u => u.online);
        chatOnlineUsers.innerHTML = onlineUsers.map(u =>
            `<span class="online-user-dot">${u.callsign}</span>`
        ).join('');

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function renderMessages(messages) {
        chatMessages.innerHTML = '<div class="chat-system-msg"><span>Bem-vindo ao chat da equipe!</span></div>';

        [...messages]
            .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
            .slice(-200)
            .forEach(msg => {
            const isOwn = msg.userId === currentUser.id;
            const user = msg.callsign || '?';

            const msgEl = document.createElement('div');
            msgEl.className = `chat-msg ${isOwn ? 'own' : ''}`;
            msgEl.innerHTML = `
                <div class="chat-msg-avatar">${user.charAt(0)}</div>
                <div class="chat-msg-content">
                    ${!isOwn ? `<div class="chat-msg-sender">${user}</div>` : ''}
                    ${msg.text ? `<div class="chat-msg-text">${escapeHtml(msg.text)}</div>` : ''}
                    ${renderChatMedia(msg)}
                    <div class="chat-msg-time">${formatTime(new Date(msg.date))}</div>
                </div>
            `;
            chatMessages.appendChild(msgEl);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
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

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || !currentUser) return;

        const message = {
            id: generateId(),
            userId: currentUser.id,
            callsign: currentUser.callsign,
            text,
            date: new Date().toISOString()
        };

        chatInput.value = '';
        btnSendMsg.disabled = true;
        try {
            if (window.AsgardCloud?.addMessage) {
                // Dedicated Firestore write: each message is its own document.
                // This is safe when several users send at the same time.
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
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function startChatPoll() {
        // Realtime is provided by Cloud Firestore; polling remains as a lightweight fallback.
        stopChatPoll();
        chatPollInterval = setInterval(() => {
            const messages = getStore(DB_MESSAGES) || [];
            if (messages.length !== lastMessageCount) {
                if (!$('page-chat').classList.contains('hidden')) {
                    refreshChat();
                }
                // Update badge if not on chat page
                if ($('page-chat').classList.contains('hidden')) {
                    const newMsgs = messages.length - lastMessageCount;
                    if (newMsgs > 0) {
                        chatBadge.textContent = newMsgs;
                        chatBadge.classList.remove('hidden');
                    }
                }
            }
        }, 1500);
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
            const confirmedMembers = confirmedIds.map(uid => {
                const u = allUsers.find(u => u.id === uid);
                const isCheckedIn = checkedInIds.includes(uid);
                const callsign = u ? u.callsign : '?';
                const name = u ? u.name : '';
                const isAdmin = currentUser.role === 'admin';
                return `
                    <div class="confirmed-member ${isCheckedIn ? 'checked-in' : ''}">
                        <div class="confirmed-member-info">
                            <span class="confirmed-member-callsign">${escapeHtml(callsign)}</span>
                            ${name ? `<span class="confirmed-member-name">${escapeHtml(name)}</span>` : ''}
                        </div>
                        <div class="confirmed-member-status">
                            ${isCheckedIn ? (isAdmin ? `<button class="btn-checkin checkin-btn" data-game="${g.id}" data-user="${uid}" title="Clique para desfazer o check-in">✓ Check-in</button>` : '<span class="checkin-badge checkin-done">✓ Check-in</span>') : (isAdmin ? `<button class="btn-checkin checkin-btn" data-game="${g.id}" data-user="${uid}">Check-in</button>` : '<span class="checkin-badge checkin-pending">Aguardando</span>')}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="game-card ${isPast ? 'opacity:0.6' : ''}">
                    <div class="game-card-header">
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
                    <div class="game-confirmed-count">✅ ${confirmedCount} confirmados · <span class="checkedin-count">🏁 ${checkedInCount} check-in</span></div>
                    ${confirmedCount > 0 ? `
                        <div class="game-confirmed-list">
                            <div class="confirmed-list-header">Operadores confirmados</div>
                            ${confirmedMembers}
                        </div>
                    ` : ''}
                    <div class="game-actions">
                        ${!isPast ? `
                            <button class="btn-secondary confirm-game-btn" data-id="${g.id}" ${isConfirmed ? 'style="border-color:var(--success);color:var(--success)"' : ''}>
                                ${isConfirmed ? '✓ Confirmado' : 'Confirmar Presença'}
                            </button>
                        ` : ''}
                        ${currentUser.role === 'admin' ? `
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

    function toggleConfirmGame(gameId) {
        const games = getStore(DB_GAMES) || [];
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        if (!game.confirmed) game.confirmed = [];
        if (!game.checkedIn) game.checkedIn = [];
        const idx = game.confirmed.indexOf(currentUser.id);

        if (idx >= 0) {
            // Depois que o ADMIN registra o check-in, o operador não pode apagar
            // a própria presença e invalidar a lista de chamada.
            if (game.checkedIn.includes(currentUser.id) && currentUser.role !== 'admin') {
                showToast('Seu check-in já foi realizado. Solicite ao ADMIN para alterar a presença.', 'info');
                return;
            }
            game.confirmed.splice(idx, 1);
            if (currentUser.role === 'admin') {
                const ciIdx = game.checkedIn.indexOf(currentUser.id);
                if (ciIdx >= 0) game.checkedIn.splice(ciIdx, 1);
            }
            showToast('Presença cancelada', 'info');
        } else {
            game.confirmed.push(currentUser.id);
            addActivity(`${currentUser.callsign} confirmou presença em ${game.title}`);
            showToast('Presença confirmada!', 'success');
        }
        setStore(DB_GAMES, games);
        refreshGames();
    }

    function checkinMember(gameId, userId) {
        if (currentUser.role !== 'admin') {
            showToast('Apenas ADMIN pode fazer check-in', 'error');
            return;
        }
        const games = getStore(DB_GAMES) || [];
        const game = games.find(g => g.id === gameId);
        if (!game) return;
        if (!(game.confirmed || []).includes(userId)) {
            showToast('O operador precisa confirmar presença antes do check-in.', 'error');
            return;
        }
        if (!game.checkedIn) game.checkedIn = [];
        const users = getStore(DB_USERS) || [];
        const member = users.find(u => u.id === userId);
        const memberName = member ? member.callsign : 'Operador';
        const idx = game.checkedIn.indexOf(userId);
        if (idx >= 0) {
            game.checkedIn.splice(idx, 1);
            addActivity(`${currentUser.callsign} desfez o check-in de ${memberName} em ${game.title}`);
            showToast(`Check-in de ${memberName} removido`, 'info');
        } else {
            game.checkedIn.push(userId);
            addActivity(`${memberName} recebeu check-in em ${game.title}`);
            showToast(`Check-in de ${memberName} realizado!`, 'success');
        }
        setStore(DB_GAMES, games);
        refreshGames();
    }

    function openEditGame(gameId) {
        if (currentUser.role !== 'admin') {
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

    function deleteGame(gameId) {
        if (currentUser.role !== 'admin') {
            showToast('Apenas ADMIN pode excluir partidas', 'error');
            return;
        }
        const games = getStore(DB_GAMES) || [];
        const idx = games.findIndex(g => g.id === gameId);
        if (idx >= 0) {
            const game = games[idx];
            if (!confirm(`Excluir definitivamente "${game.title}"?`)) return;
            games.splice(idx, 1);
            setStore(DB_GAMES, games);
            addActivity(`${currentUser.callsign} cancelou o jogo: ${game.title}`);
            showToast('Jogo excluído', 'info');
            refreshGames();
        }
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

    btnSaveGame.addEventListener('click', () => {
        if (currentUser.role !== 'admin') {
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

        const games = getStore(DB_GAMES) || [];
        if (editingGameId) {
            const game = games.find(g => g.id === editingGameId);
            if (!game) { showToast('Jogo não encontrado', 'error'); return; }
            game.type = type;
            game.title = title;
            game.date = date;
            game.time = time;
            game.location = location;
            game.description = description;
            game.updatedAt = new Date().toISOString();
            addActivity(`${currentUser.callsign} editou ${type}: ${title}`);
            showToast('Jogo atualizado com sucesso!', 'success');
        } else {
            games.push({
                id: generateId(),
                type,
                title,
                date,
                time,
                location,
                description,
                createdBy: currentUser.id,
                confirmed: [],
                checkedIn: [],
                createdAt: new Date().toISOString()
            });
            addActivity(`${currentUser.callsign} criou ${type}: ${title}`);
            showToast('Jogo criado com sucesso!', 'success');
        }
        setStore(DB_GAMES, games);

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

        if (filtered.length === 0) {
            productsList.innerHTML = '';
            productsEmpty.classList.remove('hidden');
            return;
        }

        productsEmpty.classList.add('hidden');

        productsList.innerHTML = filtered.map(p => {
            const photoHtml = p.foto
                ? `<img class="product-photo" src="${p.foto}" alt="${escapeHtml(p.nome)}">`
                : `<div class="product-photo-placeholder">🛡️</div>`;
            const adminBtns = currentUser.role === 'admin'
                ? `<button class="btn-edit-product" data-id="${p.id}">Editar</button><button class="btn-delete-product" data-id="${p.id}">Excluir</button>`
                : '';
            return `
                <div class="product-card">
                    ${photoHtml}
                    <div class="product-info">
                        <div class="product-name">${escapeHtml(p.nome)}</div>
                        <div class="product-desc">${escapeHtml(p.descricao || '')}</div>
                        <div>
                            <span class="product-price">R$ ${Number(p.preco).toFixed(2)}</span>
                            <span class="product-category">${escapeHtml(p.categoria)}</span>
                        </div>
                    </div>
                    <div class="product-card-footer">
                        <button class="btn-add-cart" data-id="${p.id}" data-nome="${escapeHtml(p.nome)}" data-preco="${p.preco}">🛒 Adicionar</button>
                        ${adminBtns}
                    </div>
                </div>
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
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
    }

    async function createProduct() {
        const nome = createProductNome.value.trim();
        const descricao = createProductDescricao.value.trim();
        const preco = createProductPreco.value;
        const categoria = createProductCategoria.value;

        if (!nome) { showToast('Informe o nome do produto', 'error'); return; }
        if (!preco || preco < 0) { showToast('Informe um preço válido', 'error'); return; }

        if (currentUser.role !== 'admin') { showToast('Somente o ADMIN pode criar produtos.', 'error'); return; }
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
        if (currentUser.role !== 'admin') return;
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

        if (currentUser.role !== 'admin') { showToast('Somente o ADMIN pode editar produtos.', 'error'); return; }
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
        if (currentUser.role !== 'admin') return;
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
        if (currentUser && currentUser.role === 'admin') {
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

        const isAdmin = currentUser && currentUser.role === 'admin';
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
        if (!currentUser || currentUser.role !== 'admin' || !allowed.includes(newStatus)) return;
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
    function addActivity(text) {
        const activities = getStore(DB_ACTIVITY) || [];
        activities.push({ text: text, date: new Date().toISOString() });
        // Keep last 50
        if (activities.length > 50) activities.splice(0, activities.length - 50);
        setStore(DB_ACTIVITY, activities);
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

    // ===== INIT =====
    async function init() {
        createParticles();
        try {
            const status = await window.AsgardCloud.init();
            if (!status.online) {
                splashScreen.classList.add('fade-out');
                setTimeout(() => {
                    showScreen('auth-screen');
                    showAuthMessage('Modo online não configurado. Preencha firebase-config.js com os dados do seu projeto Firebase.');
                }, 600);
                return;
            }
            // Data is loaded after authentication because RLS protects the database.
            setTimeout(() => { checkSession(); }, 1200);
        } catch (err) {
            console.error(err);
            splashScreen.classList.add('fade-out');
            setTimeout(() => { showScreen('auth-screen'); showAuthMessage('Falha ao conectar ao Firebase. Verifique firebase-config.js e sua conexão.'); }, 600);
        }
    }


    // Re-render active views when another device changes cloud data.
    window.addEventListener('asgard:sync', (event) => {
        if (!currentUser) return;
        const key = event.detail?.key;
        if (key === DB_USERS) {
            currentUser = (getStore(DB_USERS) || []).find(u => u.id === currentUser.id) || currentUser;
            updateUIForRole(); updateTopbar();
        }
        const active = document.querySelector('.page:not(.hidden)');
        if (!active) return;
        const id = active.id || '';
        if (id === 'page-dashboard') refreshDashboard();
        if (id === 'page-profile') refreshProfile();
        if (id === 'page-members') refreshMembers();
        if (id === 'page-arsenal') refreshArsenal();
        if (id === 'page-achievements') refreshAchievements();
        if (id === 'page-chat') refreshChat();
        if (id === 'page-games') refreshGames();
        if (id === 'page-loja') refreshProducts();
        if (id === 'page-vendas' && currentUser.role === 'admin') { refreshOrderStats(); refreshOrders(); }
        if (id === 'page-contribuicao') refreshContribuicao();
    });
    window.addEventListener('asgard:cloud-error', (e) => {
        console.error(e.detail);
        showToast('Não foi possível sincronizar uma alteração com o servidor.', 'error');
    });
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    // Start app
    init();

})();