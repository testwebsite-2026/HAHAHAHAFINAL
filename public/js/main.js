/**
 * main.js
 * App bootstrap: login gate, session check, tab navigation, clock,
 * and module initialization.
 */

let modulesInitialized = false;

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
  if (tabName === 'reports') Reports.render();
  if (tabName === 'inventory') Inventory.render();
}

function startClock() {
  const clockEl = document.getElementById('clockTime');
  const tick = () => {
    clockEl.textContent = new Date().toLocaleTimeString('en-PH', { hour12: true });
  };
  tick();
  setInterval(tick, 1000);
}

function initCashierPersistence() {
  const input = document.getElementById('cashierName');
  const settings = DB.getSettings();
  input.value = settings.cashier || '';
  input.addEventListener('change', () => {
    DB.saveSettings({ cashier: input.value.trim() }).catch(() => {
      UI.toast('Could not save cashier name.');
    });
  });
}

/* ============================================================
   Login / session handling
   ============================================================ */

function showLogin(message) {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  const errorEl = document.getElementById('loginError');
  if (message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  } else {
    errorEl.classList.add('hidden');
  }
}

async function showApp(username) {
  console.log('[CLIENT] Transitioning to app for user:', username);
  
  try {
    console.log('[CLIENT] Loading data from server...');
    await DB.loadAll();
    console.log('[CLIENT] Data loaded successfully');
  } catch (err) {
    console.error('[CLIENT] Data loading failed:', err);
    const errorMsg = err.message || 'Could not load data from server.';
    
    // Show error and go back to login
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    showLogin('Error: ' + errorMsg + ' (Try logging in again)');
    return;
  }

  // Hide login screen and show app
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('userBadge').textContent = username || '';

  startClock();
  initCashierPersistence();

  if (!modulesInitialized) {
    console.log('[CLIENT] Initializing modules...');
    POS.init();
    Inventory.init();
    Receipt.init();
    Reports.init();
    modulesInitialized = true;
    console.log('[CLIENT] Modules initialized');
  } else {
    POS.renderItemGrid();
    POS.renderCart();
    Inventory.render();
    Reports.render();
  }
  
  console.log('[CLIENT] App fully loaded');
}

async function checkSession() {
  try {
    const res = await fetch('/api/session', { credentials: 'include' });
    const data = await res.json();
    return data;
  } catch (e) {
    return { loggedIn: false };
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('loginError');
  
  if (!username || !password) {
    errorEl.textContent = 'Please enter both username and password';
    errorEl.classList.remove('hidden');
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';
  errorEl.classList.add('hidden');

  try {
    console.log('[CLIENT] Sending login request for:', username);
    
    const res = await fetch('/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    console.log('[CLIENT] Login response status:', res.status);
    
    const data = await res.json();
    console.log('[CLIENT] Login response data:', data);
    
    if (!res.ok) {
      console.log('[CLIENT] Login failed:', data.error);
      errorEl.textContent = data.error || 'Invalid username or password.';
      errorEl.classList.remove('hidden');
      return;
    }
    
    console.log('[CLIENT] Login successful, showing app...');
    document.getElementById('loginForm').reset();
    await showApp(data.username);
    
  } catch (err) {
    console.error('[CLIENT] Login error:', err);
    errorEl.textContent = 'Could not reach the server. Please try again.';
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log In';
  }
}

async function handleLogout() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  } catch (e) { /* ignore */ }
  window.location.reload();
}

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  const session = await checkSession();
  if (session.loggedIn) {
    await showApp(session.username);
  } else {
    showLogin();
  }
});
