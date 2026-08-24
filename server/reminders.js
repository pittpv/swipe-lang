/**
 * Daily study reminders: Web Push delivery + QStash recurring schedules.
 *
 * Flow:
 *  - Client subscribes to push (see public/sw.js) and picks a local time.
 *  - POST /api/push/subscribe stores the subscription on the user row and
 *    creates one QStash schedule (cron in UTC) that calls back
 *    POST /api/cron/reminders with { userId } and x-internal-secret header.
 *  - The callback sends the push if there is something worth reminding about.
 */
import webpush from 'web-push';

let devVapidKeys = null;

/** Real keys in prod (env), ephemeral per-process keys in dev. */
export function getVapidKeys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) return { publicKey, privateKey };
  if (!devVapidKeys) devVapidKeys = webpush.generateVAPIDKeys();
  return devVapidKeys;
}

/** "19:00" + optional IANA timezone -> "{mm} {hh} * * *" cron (UTC fallback). */
export function localTimeToCron(reminderTime, tzOffsetMinutes, timeZone) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(reminderTime ?? '');
  if (!match) throw new Error('Invalid reminderTime');
  const localMinutes = Number(match[1]) * 60 + Number(match[2]);
  if (timeZone && /^[A-Za-z_][A-Za-z_+\-0-9]*(\/[A-Za-z_+\-0-9]+)*$/.test(timeZone)) {
    // QStash evaluates the cron in that timezone — keep local wall time.
    return `CRON_TZ=${timeZone} ${match[2]} ${match[1]} * * *`;
  }
  const utcTotal = (((localMinutes + Number(tzOffsetMinutes || 0)) % 1440) + 1440) % 1440;
  return `${String(utcTotal % 60).padStart(2, '0')} ${String(Math.floor(utcTotal / 60)).padStart(2, '0')} * * *`;
}

async function qstash(path, options = {}) {
  const res = await fetch(`https://qstash.upstash.io/v2${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${process.env.QSTASH_TOKEN}`, ...options.headers },
  });
  return res;
}

/**
 * Creates one QStash schedule. REST format: the destination is part of the
 * path, the cron rides in the Upstash-Cron header, the body is the published
 * message payload. Custom headers below are forwarded to the callback.
 */
export async function createReminderSchedule({ callbackUrl, userId, reminderTime, tzOffsetMinutes, timeZone }) {
  const cron = localTimeToCron(reminderTime, tzOffsetMinutes, timeZone);
  const res = await qstash(`/schedules/${callbackUrl}`, {
    method: 'POST',
    headers: {
      'Upstash-Cron': cron,
      'Content-Type': 'application/json',
      // "Upstash-Forward-*" headers are forwarded to the destination;
      // plain custom headers are consumed by QStash itself.
      'Upstash-Forward-x-internal-secret': process.env.REMINDER_SECRET ?? '',
    },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`QStash schedule failed: ${res.status} ${detail}`.trim());
  }
  const json = await res.json();
  return json.scheduleId;
}

export async function deleteReminderSchedule(scheduleId) {
  const res = await qstash(`/schedules/${encodeURIComponent(scheduleId)}`, { method: 'DELETE' });
  return res.ok;
}

export function dueWordsCount(db, userId) {
  const now = new Date().toISOString();
  const rows = db.data.user_word_progress.filter((p) => p.user_id === userId);
  return {
    due: rows.filter((p) => p.next_review_at && p.next_review_at <= now).length,
    started: rows.length > 0,
  };
}

/** Sends one push; cleans up expired subscriptions. Never throws for delivery issues. */
export async function sendReminderPush(db, user) {
  if (!user?.push_subscription) return { skipped: 'no-subscription' };
  const { due, started } = dueWordsCount(db, user.id);

  const keys = getVapidKeys();
  webpush.setVapidDetails('mailto:support@langapp.example', keys.publicKey, keys.privateKey);
  const payload = JSON.stringify({
    title: 'LangApp',
    body:
      due > 0
        ? `${due} ${pluralRu(due)} ждут повторения 🔥 Пять минут — и готово.`
        : started
          ? 'На сегодня всё повторено! 🎉 Загляни завтра — слова уже ждут.'
          : 'Учи турецкий свайпом — первая сессия из 18 слов ждёт!',
    url: '/',
  });
  try {
    await webpush.sendNotification(user.push_subscription, payload);
    return { sent: true, due };
  } catch (err) {
    // 404/410 — subscription expired; 401/403 — VAPID key mismatch (keys were
    // rotated). Both are permanent: drop the subscription so the client can
    // re-subscribe with the current key on the next visit.
    if ([401, 403, 404, 410].includes(err.statusCode)) {
      if (user.push_schedule_id) {
        // Best-effort: don't leave an orphaned schedule behind.
        await deleteReminderSchedule(user.push_schedule_id).catch(() => {});
      }
      user.push_subscription = null;
      user.push_schedule_id = null;
      db.persist();
      return { skipped: 'expired-subscription' };
    }
    return { skipped: `delivery-error-${err.statusCode ?? 'unknown'}` };
  }
}

function pluralRu(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'слово';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'слова';
  return 'слов';
}