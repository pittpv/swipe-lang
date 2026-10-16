const KEY_STORAGE = 'langapp_admin_key';
const THEME_KEY = 'langapp.theme';
const PAIR_LABELS = { 'tr-ru': 'TR', 'en-ru': 'EN', 'es-ru': 'ES' };
const D7_BAR = 25;

const gate = document.getElementById('gate');
const loading = document.getElementById('loading');
const app = document.getElementById('app');
const title = document.getElementById('title');
const err = document.getElementById('err');
const keyInput = document.getElementById('key');
const loginBtn = document.getElementById('load-btn');
const refreshBtn = document.getElementById('refresh');
const logoutBtn = document.getElementById('logout');
const deleteDialog = document.getElementById('delete-dialog');

let adminKey = '';
let usersCache = [];
let pendingDelete = null;
let loadingNow = false;

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  load();
});
refreshBtn.addEventListener('click', () => load(adminKey));
logoutBtn.addEventListener('click', logout);
document.getElementById('user-search').addEventListener('input', renderUsersTable);
document.getElementById('users-body').addEventListener('click', onUsersClick);
document.getElementById('push-test-btn').addEventListener('click', sendTestPush);
deleteDialog.addEventListener('close', onDeleteClose);
initTheme();

const savedKey = readKey();
if (savedKey) {
  keyInput.value = savedKey;
  title.textContent = 'Админка';
  load(savedKey);
} else {
  keyInput.focus();
}

function readKey() {
  try {
    return sessionStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

function writeKey(value) {
  try {
    if (value) sessionStorage.setItem(KEY_STORAGE, value);
    else sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    /* private mode */
  }
}

async function adminFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(path, {
      ...options,
      headers: {
        'X-Admin-Key': adminKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    const error = new Error('Нет связи с сервером');
    error.status = 0;
    throw error;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(messageForStatus(res.status, data.error));
    error.status = res.status;
    throw error;
  }
  return data;
}

function messageForStatus(status, serverMessage) {
  if (status === 401) return 'Ключ не подошёл';
  if (status === 503) return 'Админка выключена: на сервере не задан ADMIN_API_KEY';
  return serverMessage || 'Не удалось загрузить данные';
}

async function load(preset) {
  if (loadingNow) return;
  const next = String(preset ?? keyInput.value).trim();
  err.textContent = '';
  if (!next) {
    showGate('Введите ключ');
    return;
  }
  adminKey = next;
  const firstPaint = app.hidden;
  setBusy(true, firstPaint);
  try {
    const [data, push, usersRes, vapid, associations] = await Promise.all([
      adminFetch('/api/analytics/dashboard'),
      adminFetch('/api/admin/push/subscribers'),
      adminFetch('/api/admin/users'),
      adminFetch('/api/admin/diag/vapid'),
      adminFetch('/api/admin/associations'),
    ]);
    writeKey(adminKey);
    usersCache = usersRes.users ?? [];
    render(data, push.subscribers ?? [], vapid, associations);
    showApp();
  } catch (e) {
    if (e.status === 401 || e.status === 503) {
      writeKey('');
      adminKey = '';
      keyInput.value = '';
      showGate(e.message);
    } else if (firstPaint) {
      showGate(e.message);
    } else {
      const msg = document.getElementById('users-msg');
      if (msg) {
        msg.className = 'error';
        msg.textContent = e.message;
      }
      showApp();
    }
  } finally {
    setBusy(false, false);
    if (!gate.hidden) keyInput.focus();
  }
}

function setBusy(busy, replaceWithSkeleton) {
  loadingNow = busy;
  loginBtn.disabled = busy;
  refreshBtn.disabled = busy;
  loginBtn.textContent = busy ? 'Вход…' : 'Войти';
  refreshBtn.textContent = busy ? 'Обновление…' : 'Обновить';
  if (replaceWithSkeleton) {
    document.documentElement.classList.add('admin-restoring');
    gate.hidden = true;
    app.hidden = true;
    loading.hidden = false;
  }
}

function showGate(message) {
  document.documentElement.classList.remove('admin-restoring');
  gate.hidden = false;
  loading.hidden = true;
  app.hidden = true;
  refreshBtn.hidden = true;
  logoutBtn.hidden = true;
  title.textContent = 'Вход в админку';
  err.textContent = message || '';
}

function showApp() {
  document.documentElement.classList.remove('admin-restoring');
  gate.hidden = true;
  loading.hidden = true;
  app.hidden = false;
  refreshBtn.hidden = false;
  logoutBtn.hidden = false;
  title.textContent = 'Админка';
}

function logout() {
  adminKey = '';
  usersCache = [];
  writeKey('');
  keyInput.value = '';
  document.getElementById('users-msg').textContent = '';
  document.getElementById('push-msg').textContent = '';
  showGate('');
}

function render(d, subscribers, vapid, associations) {
  document.getElementById('retention-note').textContent =
    'D1 и D7 — классическое удержание по календарю Europe/Moscow: доля людей, которые закончили сессию ровно через 1 и 7 дней после регистрации. Сессия в день регистрации не считается возвратом.';
  document.getElementById('updated').textContent = `Обновлено ${formatStamp(d.generatedAt)}`;
  document.getElementById('metrics').innerHTML = [
    metric('Пользователи', String(d.totals.users), 'аккаунты в базе', 'metric-users'),
    metric('Сессии', String(d.totals.sessions), 'завершённые'),
    metric('D1', rateText(d.retention.d1), d1Hint(d.retention.d1)),
    metric('D7', rateText(d.retention.d7), d7Hint(d.retention.d7)),
  ].join('');

  const f = d.funnel;
  document.getElementById('funnel').innerHTML = [
    step('Регистрации', f.registrations, 'все аккаунты'),
    step('Онбординг', f.onboarded, share(f.onboarded, f.registrations, 'от регистраций')),
    step('Сессия', f.completedSession, share(f.completedSession, f.onboarded, 'от онбординга')),
    step('Рефералы', f.referrals, share(f.referrals, f.registrations, 'от регистраций')),
  ].join('');

  const today = d.retention.d1.returnDay;
  document.getElementById('week-body').innerHTML = d.last7Days.map((r) => `
    <tr ${r.date === today ? 'data-today' : ''}>
      <td>${esc(r.date)}</td>
      <td class="num">${r.signups}</td>
      <td class="num">${r.activeUsers}</td>
      <td class="num">${r.sessions}</td>
    </tr>`).join('');

  renderAssociations(associations);
  renderPush(subscribers, vapid);
  renderEvents(d.eventCounts);
  renderUsersTable();
}

function metric(label, num, hint, id) {
  const idAttr = id ? ` id="${id}"` : '';
  return `<div class="metric"><div class="num"${idAttr}>${esc(num)}</div><div class="lbl">${esc(label)}</div><div class="hint">${esc(hint)}</div></div>`;
}

function step(label, num, hint) {
  return `<div class="step"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div><div class="hint">${esc(hint)}</div></div>`;
}

function rateText(block) {
  return block.rate == null ? 'нет' : `${block.rate}%`;
}

function d1Hint(block) {
  if (block.rate == null) return `нет регистраций ${formatDay(block.cohortDay)}`;
  return `${block.retained} из ${block.cohortSize} · когорта ${formatDay(block.cohortDay)}`;
}

function d7Hint(block) {
  if (block.rate == null) return `нет регистраций ${formatDay(block.cohortDay)}`;
  const bar = block.rate >= D7_BAR ? `порог ${D7_BAR}% пройден` : `ниже порога ${D7_BAR}%`;
  return `${block.retained} из ${block.cohortSize} · ${bar}`;
}

function share(part, whole, label) {
  if (!whole) return 'не с чем сравнить';
  return `${Math.round((part / whole) * 100)}% ${label}`;
}

function renderAssociations(summary) {
  const rows = summary?.rows ?? [];
  const totals = summary?.totals ?? { up: 0, down: 0, words: 0 };
  document.getElementById('assoc-metrics').innerHTML = [
    metric('Подходит', String(totals.up), 'оценок'),
    metric('Не подходит', String(totals.down), 'оценок'),
    metric('Слова', String(totals.words), 'с оценкой'),
  ].join('');
  const wrap = document.getElementById('assoc-table-wrap');
  const empty = document.getElementById('assoc-empty');
  if (!rows.length) {
    wrap.hidden = true;
    empty.hidden = false;
    empty.textContent = 'Пока никто не оценил ассоциацию.';
    document.getElementById('assoc-body').innerHTML = '';
    return;
  }
  empty.hidden = true;
  wrap.hidden = false;
  document.getElementById('assoc-body').innerHTML = rows.map((row) => `
    <tr>
      <td>${esc(row.lemma)}</td>
      <td>${esc(row.langPair)}</td>
      <td>${esc(row.hook || '—')}</td>
      <td>${esc(row.image || '—')}</td>
      <td class="num">${row.up}</td>
      <td class="num">${row.down}</td>
      <td class="num">${row.likeRate == null ? '—' : `${row.likeRate}%`}</td>
    </tr>`).join('');
}

function renderPush(subscribers, vapid) {
  document.getElementById('vapid-line').textContent = vapidStatus(vapid);
  document.getElementById('push-count').textContent = `Подписок: ${subscribers.length}`;
  const row = document.getElementById('push-row');
  const empty = document.getElementById('push-empty');
  const select = document.getElementById('push-user');
  if (!subscribers.length) {
    row.hidden = true;
    empty.hidden = false;
    select.innerHTML = '';
    return;
  }
  empty.hidden = true;
  row.hidden = false;
  select.innerHTML = subscribers.map((u) => {
    const label = [u.name, u.email, u.time, u.host].filter(Boolean).join(' · ');
    return `<option value="${u.id}">#${u.id} ${esc(label)}</option>`;
  }).join('');
}

function renderEvents(eventCounts) {
  const entries = Object.entries(eventCounts ?? {}).sort((a, b) => b[1] - a[1]);
  const wrap = document.getElementById('events-table-wrap');
  const empty = document.getElementById('events-empty');
  if (!entries.length) {
    wrap.hidden = true;
    empty.hidden = false;
    document.getElementById('events-body').innerHTML = '';
    return;
  }
  empty.hidden = true;
  wrap.hidden = false;
  document.getElementById('events-body').innerHTML = entries.map(([name, count]) => `
    <tr><td>${esc(name)}</td><td class="num">${count}</td></tr>`).join('');
}

function vapidStatus(vapid) {
  if (!vapid) return 'VAPID: нет данных';
  if (!vapid.publicKeySet || !vapid.privateKeySet) return 'VAPID: ключи не заданы — пуш не отправится';
  if (vapid.pairMatches) return 'VAPID: пара ключей совпадает';
  return `VAPID: ключи не совпадают (${vapid.detail})`;
}

function renderUsersTable() {
  const q = (document.getElementById('user-search')?.value ?? '').trim().toLowerCase();
  const filtered = usersCache.filter((u) => {
    if (!q) return true;
    return [u.id, u.email, u.name, u.langPair, u.cefrLevel].join(' ').toLowerCase().includes(q);
  });
  const body = document.getElementById('users-body');
  const empty = document.getElementById('users-empty');
  const count = document.getElementById('user-count');
  count.textContent = q ? `${filtered.length} из ${usersCache.length}` : `${usersCache.length}`;
  if (!filtered.length) {
    body.innerHTML = '';
    empty.hidden = false;
    empty.textContent = usersCache.length
      ? 'Никого не найдено по этому запросу.'
      : 'Пока нет зарегистрированных пользователей.';
    return;
  }
  empty.hidden = true;
  body.innerHTML = filtered.map((u) => {
    const created = u.createdAt ? esc(formatIsoDay(u.createdAt)) : '—';
    return `<tr data-user-id="${u.id}">
      <td class="num">${u.id}</td>
      <td>${esc(u.email)}</td>
      <td>${u.name ? esc(u.name) : '—'}</td>
      <td>${PAIR_LABELS[u.langPair] ?? esc(u.langPair ?? '—')}</td>
      <td>${esc(u.cefrLevel ?? '—')}</td>
      <td class="num">${u.streak}</td>
      <td class="num">${u.sessionsCompleted}</td>
      <td class="num">${u.wordsKnown}</td>
      <td>${created}</td>
      <td><button type="button" class="btn danger small" data-delete-user="${u.id}" aria-label="Удалить ${esc(u.email)}">Удалить</button></td>
    </tr>`;
  }).join('');
}

function onUsersClick(e) {
  const btn = e.target.closest('[data-delete-user]');
  if (!btn || loadingNow) return;
  const userId = Number(btn.getAttribute('data-delete-user'));
  const user = usersCache.find((u) => u.id === userId);
  if (!user) return;
  pendingDelete = user;
  document.getElementById('delete-copy').textContent =
    `${user.email} (#${user.id}). Аккаунт, прогресс и сессии будут удалены без восстановления.`;
  if (typeof deleteDialog.showModal === 'function') deleteDialog.showModal();
  else if (window.confirm(document.getElementById('delete-copy').textContent)) deleteUser(user);
}

async function onDeleteClose() {
  const user = pendingDelete;
  pendingDelete = null;
  if (deleteDialog.returnValue !== 'confirm' || !user) return;
  await deleteUser(user);
}

async function deleteUser(user) {
  const msg = document.getElementById('users-msg');
  msg.className = 'ok';
  msg.textContent = 'Удаление…';
  try {
    await adminFetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    usersCache = usersCache.filter((u) => u.id !== user.id);
    const metricEl = document.getElementById('metric-users');
    if (metricEl) metricEl.textContent = String(usersCache.length);
    msg.textContent = `Удалён ${user.email}`;
    renderUsersTable();
  } catch (error) {
    msg.className = 'error';
    msg.textContent = error.message;
  }
}

async function sendTestPush() {
  const btn = document.getElementById('push-test-btn');
  const msg = document.getElementById('push-msg');
  const userId = Number(document.getElementById('push-user')?.value);
  if (!userId) return;
  btn.disabled = true;
  msg.className = 'ok';
  msg.textContent = 'Отправка…';
  try {
    const data = await adminFetch('/api/admin/push/test', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    const via = [data.host, data.statusCode].filter(Boolean).join(', ');
    msg.textContent = via
      ? `Тест принят сервисом пуша (${via}). Если баннер не появился — откройте PWA с домашнего экрана.`
      : `Тест отправлен пользователю #${userId}`;
  } catch (e) {
    msg.className = 'error';
    msg.textContent = e.message;
  } finally {
    btn.disabled = false;
  }
}

function formatStamp(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatIsoDay(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatDay(day) {
  if (!day) return '';
  const [y, m, d] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function initTheme() {
  const group = document.querySelector('.theme');
  const current = () => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch { /* private mode */ }
    return 'system';
  };
  const paint = (pref) => {
    group.querySelectorAll('button').forEach((btn) => {
      btn.setAttribute('aria-checked', String(btn.dataset.theme === pref));
    });
  };
  paint(current());
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-theme]');
    if (!btn) return;
    const pref = btn.dataset.theme;
    try { localStorage.setItem(THEME_KEY, pref); } catch { /* private mode */ }
    const root = document.documentElement;
    if (pref === 'light' || pref === 'dark') root.setAttribute('data-theme', pref);
    else root.removeAttribute('data-theme');
    paint(pref);
  });
}
