// ===== UTILITÁRIOS GLOBAIS =====

// --- API helper ---
const API = {
  async get(url) {
    const r = await fetch(url);
    if (r.status === 401) { window.location.href = '/login.html'; return; }
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Erro'); }
    return r.json();
  },
  async post(url, data) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (r.status === 401) { window.location.href = '/login.html'; return; }
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Erro'); }
    return r.json();
  },
  async put(url, data) {
    const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (r.status === 401) { window.location.href = '/login.html'; return; }
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Erro'); }
    return r.json();
  },
  async delete(url) {
    const r = await fetch(url, { method: 'DELETE' });
    if (r.status === 401) { window.location.href = '/login.html'; return; }
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Erro'); }
    return r.json();
  }
};

// --- Toast notifications ---
function showToast(type, title, msg = '') {
  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>`
  };
  const container = document.getElementById('toast-container') || (() => {
    const d = document.createElement('div'); d.id = 'toast-container'; document.body.appendChild(d); return d;
  })();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<div class="toast-icon">${icons[type]}</div><div class="toast-content"><div class="toast-title">${title}</div>${msg ? `<div class="toast-msg">${msg}</div>` : ''}</div>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3500);
}

// --- Formatar datas ---
function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str + (str.length === 10 ? 'T12:00:00' : ''));
  if (isNaN(d)) return str;
  return d.toLocaleDateString('pt-BR');
}

// --- Iniciais para avatar ---
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// --- Badge de status ---
function statusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'contratado') return `<span class="badge badge-success">Contratado</span>`;
  if (s === 'demitido')   return `<span class="badge badge-danger">Demitido</span>`;
  return `<span class="badge badge-gray">${status || '—'}</span>`;
}

// --- Sidebar: marcar link ativo ---
function initSidebar() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item[data-href]').forEach(el => {
    if (el.dataset.href === path) el.classList.add('active');
    el.addEventListener('click', () => window.location.href = el.dataset.href);
  });
  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
  // Dados do usuário
  fetch('/api/auth/me').then(r => r.json()).then(user => {
    if (!user || user.error) { window.location.href = '/login.html'; return; }
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrador' : user.role === 'editor' ? 'Editor' : 'Visualizador';
    if (avatarEl) avatarEl.textContent = getInitials(user.name);
    // Mostrar/esconder itens admin
    if (user.role !== 'admin') {
      document.querySelectorAll('[data-admin]').forEach(el => el.style.display = 'none');
    }
    window._currentUser = user;
  }).catch(() => { window.location.href = '/login.html'; });
}

// --- Sidebar HTML reutilizável ---
function renderSidebar() {
  return `
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">QLP</div>
      <div>
        <div class="logo-text">Sistema de RH</div>
        <div class="logo-sub">IPAUSSU · 2026</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-title">Menu</div>
      <div class="nav-item" data-href="/dashboard.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Dashboard
      </div>
      <div class="nav-item" data-href="/colaboradores.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Colaboradores
      </div>
      <div class="nav-item" data-href="/cadastro.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Novo Colaborador
      </div>
      <div class="nav-section-title" data-admin>Administração</div>
      <div class="nav-item" data-href="/usuarios.html" data-admin>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Usuários do Sistema
      </div>
    </nav>
    <div class="sidebar-footer">
      <div class="user-card">
        <div class="user-avatar" id="user-avatar">?</div>
        <div class="user-info">
          <div class="user-name" id="user-name">Carregando…</div>
          <div class="user-role" id="user-role"></div>
        </div>
        <button class="btn-logout" id="btn-logout" title="Sair">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </div>
  </aside>`;
}
