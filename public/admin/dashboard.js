document.getElementById('load-btn').addEventListener('click', load);

let adminKey = '';

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
  err.textContent = '';
  try {
    const [data, push] = await Promise.all([
      adminFetch('/api/analytics/dashboard'),
      adminFetch('/api/admin/push/subscribers'),
    ]);
    render(data, push.subscribers);
    document.getElementById('dash').style.display = 'block';
  } catch (e) {
    err.textContent = e.message;
  }
}

function render(d, subscribers) {
  const el = document.getElementById('dash');
  const rows = d.last7Days.map((r) => `<tr><td>${r.date}</td><td>${r.signups}</td><td>${r.activeUsers}</td><td>${r.sessions}</td></tr>`).join('');
  const events = Object.entries(d.eventCounts).map(([k, v]) => `<li>${k}: ${v}</li>`).join('');
  const options = subscribers
    .map((u) => {
      const label = [u.name, u.email, u.time ? `⏰ ${u.time}` : null].filter(Boolean).join(' · ');
      return `<option value="${u.id}">#${u.id} ${esc(label)}</option>`;
    })
    .join('');
  el.innerHTML = `
    <div class="card"><div class="grid">
      <div class="metric"><div class="num">${d.totals.users}</div><div class="lbl">Users</div></div>
      <div class="metric"><div class="num">${d.totals.sessions}</div><div class="lbl">Sessions</div></div>
      <div class="metric"><div class="num">${d.retention.d1.rate ?? '—'}%</div><div class="lbl">D1 retention</div></div>
      <div class="metric"><div class="num">${d.retention.d7.rate ?? '—'}%</div><div class="lbl">D7 retention</div></div>
    </div></div>
    <div class="card">
      <h2>Тест пуш-уведомления</h2>
      <p style="color:var(--muted);margin:0">Подписок: ${subscribers.length}</p>
      ${subscribers.length
        ? `<div class="row">
            <select id="push-user">${options}</select>
            <button type="button" id="push-test-btn">Отправить тест</button>
          </div>
          <p id="push-msg" class="ok"></p>`
        : '<p style="color:var(--muted)">Нет активных подписок — сначала включите напоминания в приложении.</p>'}
    </div>
    <div class="card"><h2>Funnel</h2>
      <p>Регистрации: ${d.funnel.registrations} → Онбординг: ${d.funnel.onboarded} → Сессия: ${d.funnel.completedSession} → Рефералы: ${d.funnel.referrals}</p>
    </div>
    <div class="card"><h2>Last 7 days</h2>
      <table><thead><tr><th>Date</th><th>Signups</th><th>Active</th><th>Sessions</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="card"><h2>Events</h2><ul>${events || '<li>—</li>'}</ul></div>
    <p style="font-size:0.8rem;color:var(--muted)">Updated: ${d.generatedAt}</p>`;

  document.getElementById('push-test-btn')?.addEventListener('click', sendTestPush);
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
    await adminFetch('/api/admin/push/test', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    msg.textContent = `Тест отправлен пользователю #${userId}`;
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
