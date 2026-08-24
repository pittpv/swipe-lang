document.getElementById('load-btn').addEventListener('click', load);

async function load() {
  const key = document.getElementById('key').value;
  const err = document.getElementById('err');
  err.textContent = '';
  try {
    const res = await fetch('/api/analytics/dashboard', { headers: { 'X-Admin-Key': key } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    render(data);
    document.getElementById('dash').style.display = 'block';
  } catch (e) {
    err.textContent = e.message;
  }
}

function render(d) {
  const el = document.getElementById('dash');
  const rows = d.last7Days.map(r => `<tr><td>${r.date}</td><td>${r.signups}</td><td>${r.activeUsers}</td><td>${r.sessions}</td></tr>`).join('');
  const events = Object.entries(d.eventCounts).map(([k, v]) => `<li>${k}: ${v}</li>`).join('');
  el.innerHTML = `
    <div class="card"><div class="grid">
      <div class="metric"><div class="num">${d.totals.users}</div><div class="lbl">Users</div></div>
      <div class="metric"><div class="num">${d.totals.sessions}</div><div class="lbl">Sessions</div></div>
      <div class="metric"><div class="num">${d.retention.d1.rate ?? '—'}%</div><div class="lbl">D1 retention</div></div>
      <div class="metric"><div class="num">${d.retention.d7.rate ?? '—'}%</div><div class="lbl">D7 retention</div></div>
    </div></div>
    <div class="card"><h2>Funnel</h2>
      <p>Регистрации: ${d.funnel.registrations} → Онбординг: ${d.funnel.onboarded} → Сессия: ${d.funnel.completedSession} → Рефералы: ${d.funnel.referrals}</p>
    </div>
    <div class="card"><h2>Last 7 days</h2>
      <table><thead><tr><th>Date</th><th>Signups</th><th>Active</th><th>Sessions</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="card"><h2>Events</h2><ul>${events || '<li>—</li>'}</ul></div>
    <p style="font-size:0.8rem;color:var(--muted)">Updated: ${d.generatedAt}</p>`;
}