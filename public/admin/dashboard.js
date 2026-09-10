document.getElementById('load-btn').addEventListener('click', load);
document.getElementById('key').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') load();
});

const KEY_STORAGE = 'langapp_admin_key';
const PAIR_LABELS = {
  'tr-ru': 'TR',
  'en-ru': 'EN',
  'es-ru': 'ES',
};

let adminKey = '';
let usersCache = [];

const savedKey = sessionStorage.getItem(KEY_STORAGE);
if (savedKey) document.getElementById('key').value = savedKey;

async function adminFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'X-Admin-Key': adminKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

async function load() {
  adminKey = document.getElementById('key').value;
  const err = document.getElementById('err');
  const btn = document.getElementById('load-btn');
  err.textContent = '';
  btn.disabled = true;
  try {
    const [data, push, usersRes, vapid] = await Promise.all([
      adminFetch('/api/analytics/dashboard'),
      adminFetch('/api/admin/push/subscribers'),
      adminFetch('/api/admin/users'),
      adminFetch('/api/admin/diag/vapid'),
    ]);
    sessionStorage.setItem(KEY_STORAGE, adminKey);
    usersCache = usersRes.users ?? [];
    render(data, push.subscribers, vapid);
    document.getElementById('dash').style.display = 'block';
  } catch (e) {
    err.textContent = e.message;
  } finally {
    btn.disabled = false;
  }
}

function render(d, subscribers, vapid) {
  const el = document.getElementById('dash');
  const rows = d.last7Days.map((r) => `<tr><td>${r.date}</td><td>${r.signups}</td><td>${r.activeUsers}</td><td>${r.sessions}</td></tr>`).join('');
  const eventItems = Object.entries(d.eventCounts).map(([k, v]) => `<li>${k}: ${v}</li>`).join('');
  const options = subscribers
    .map((u) => {
      const label = [u.name, u.email, u.time ? `⏰ ${u.time}` : null, u.host].filter(Boolean).join(' · ');
      return `<option value="${u.id}">#${u.id} ${esc(label)}</option>`;
    })
    .join('');
  const vapidLine = vapidStatus(vapid);
  el.innerHTML = `
    <div class="card"><div class="grid">
      <div class="metric"><div class="num" id="metric-users">${d.totals.users}</div><div class="lbl">Users</div></div>
      <div class="metric"><div class="num">${d.totals.sessions}</div><div class="lbl">Sessions</div></div>
      <div class="metric"><div class="num">${d.retention.d1.rate == null ? '—' : `${d.retention.d1.rate}%`}</div><div class="lbl">D1 retention</div></div>
      <div class="metric"><div class="num">${d.retention.d7.rate == null ? '—' : `${d.retention.d7.rate}%`}</div><div class="lbl">D7 retention</div></div>
    </div></div>
    <div class="card" id="users-card">
      <h2>Пользователи</h2>
      <div class="row" style="margin-top:0">
        <input type="search" id="user-search" placeholder="Поиск по email, имени или id" aria-label="Поиск пользователей" />
        <p class="muted" id="user-count"></p>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Язык</th>
              <th>Уровень</th>
              <th>Серии</th>
              <th>Сессии</th>
              <th>Слова</th>
              <th>Регистрация</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="users-body"></tbody>
        </table>
      </div>
      <p id="users-empty" class="empty" hidden></p>
      <p id="users-msg" class="ok"></p>
    </div>
    <div class="card">
      <h2>Тест пуш-уведомления</h2>
      <p class="muted">${vapidLine}</p>
      <p class="muted" style="margin-top:0.35rem">Подписок: ${subscribers.length}</p>
      ${subscribers.length
        ? `<div class="row">
            <select id="push-user">${options}</select>
            <button type="button" id="push-test-btn">Отправить тест</button>
          </div>
          <p id="push-msg" class="ok"></p>`
        : '<p class="empty">Нет активных подписок — сначала включите напоминания в приложении.</p>'}
    </div>
    <div class="card"><h2>Funnel</h2>
      <p>Регистрации: ${d.funnel.registrations} → Онбординг: ${d.funnel.onboarded} → Сессия: ${d.funnel.completedSession} → Рефералы: ${d.funnel.referrals}</p>
    </div>
    <div class="card"><h2>Last 7 days</h2>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Signups</th><th>Active</th><th>Sessions</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>
    <div class="card"><h2>Events</h2><ul>${eventItems || '<li>—</li>'}</ul></div>
    <p class="muted" style="font-size:0.8rem">Updated: ${d.generatedAt}</p>`;

  document.getElementById('push-test-btn')?.addEventListener('click', sendTestPush);
  document.getElementById('user-search')?.addEventListener('input', () => renderUsersTable());
  document.getElementById('users-body')?.addEventListener('click', onUsersClick);
  renderUsersTable();
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
    const hay = [u.id, u.email, u.name, u.langPair, u.cefrLevel].join(' ').toLowerCase();
    return hay.includes(q);
  });
  const body = document.getElementById('users-body');
  const empty = document.getElementById('users-empty');
  const count = document.getElementById('user-count');
  if (count) {
    count.textContent = q
      ? `${filtered.length} из ${usersCache.length}`
      : `${usersCache.length}`;
  }
  if (!filtered.length) {
    if (body) body.innerHTML = '';
    if (empty) {
      empty.hidden = false;
      empty.textContent = usersCache.length
        ? 'Никого не найдено по этому запросу.'
        : 'Пока нет зарегистрированных пользователей.';
    }
    return;
  }
  if (empty) empty.hidden = true;
  if (!body) return;
  body.innerHTML = filtered.map((u) => {
    const created = u.createdAt ? esc(u.createdAt.slice(0, 10)) : '—';
    const name = u.name ? esc(u.name) : '—';
    const lang = PAIR_LABELS[u.langPair] ?? esc(u.langPair ?? '—');
    return `<tr data-user-id="${u.id}">
      <td class="num">${u.id}</td>
      <td>${esc(u.email)}</td>
      <td>${name}</td>
      <td>${lang}</td>
      <td>${esc(u.cefrLevel ?? '—')}</td>
      <td class="num">${u.streak}</td>
      <td class="num">${u.sessionsCompleted}</td>
      <td class="num">${u.wordsKnown}</td>
      <td>${created}</td>
      <td><button type="button" class="danger" data-delete-user="${u.id}" aria-label="Удалить ${esc(u.email)}">Удалить</button></td>
    </tr>`;
  }).join('');
}

async function onUsersClick(e) {
  const btn = e.target.closest('[data-delete-user]');
  if (!btn) return;
  const userId = Number(btn.getAttribute('data-delete-user'));
  const user = usersCache.find((u) => u.id === userId);
  if (!user) return;
  const ok = window.confirm(
    `Удалить ${user.email} (#${user.id})?\nАккаунт, прогресс и сессии будут удалены без возможности восстановления.`,
  );
  if (!ok) return;
  const msg = document.getElementById('users-msg');
  btn.disabled = true;
  if (msg) {
    msg.className = 'ok';
    msg.textContent = 'Удаление…';
  }
  try {
    await adminFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    usersCache = usersCache.filter((u) => u.id !== userId);
    const metric = document.getElementById('metric-users');
    if (metric) metric.textContent = String(usersCache.length);
    if (msg) msg.textContent = `Удалён ${user.email}`;
    renderUsersTable();
  } catch (err) {
    btn.disabled = false;
    if (msg) {
      msg.className = 'error';
      msg.textContent = err.message;
    }
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

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
