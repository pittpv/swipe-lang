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
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set');
  }
  if (!devVapidKeys) devVapidKeys = webpush.generateVAPIDKeys();
  return devVapidKeys;
}

/** Stable QStash id so time changes update the same schedule instead of delete+create. */
export function reminderScheduleId(userId) {
  return `langapp-reminder-${userId}`;
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
      'Upstash-Schedule-Id': reminderScheduleId(userId),
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
  await pruneOtherReminderSchedules(userId).catch((err) => {
    console.error(`[reminders] prune schedules failed: ${err.message}`);
  });
  return json.scheduleId;
}

export async function deleteReminderSchedule(scheduleId) {
  const res = await qstash(`/schedules/${encodeURIComponent(scheduleId)}`, { method: 'DELETE' });
  return res.ok;
}

/** Drops leftover auto-id schedules from before stable `langapp-reminder-<id>`. */
export async function pruneOtherReminderSchedules(userId) {
  const keep = reminderScheduleId(userId);
  const res = await qstash('/schedules');
  if (!res.ok) return;
  const schedules = await res.json().catch(() => []);
  if (!Array.isArray(schedules)) return;
  await Promise.all(
    schedules.map(async (s) => {
      const id = s.scheduleId;
      if (!id || id === keep) return;
      let payload = s.body;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }
      if (Number(payload?.userId) !== Number(userId)) return;
      await deleteReminderSchedule(id);
    }),
  );
}

export function dueWordsCount(db, userId) {
  const now = new Date().toISOString();
  const rows = db.data.user_word_progress.filter((p) => p.user_id === userId);
  return {
    due: rows.filter((p) => p.next_review_at && p.next_review_at <= now).length,
    started: rows.length > 0,
  };
}

function vapidSubject() {
  return (process.env.APP_URL || 'https://langapp-neon.vercel.app').replace(/\/$/, '');
}

export function pushEndpointHost(subscription) {
  try {
    return new URL(subscription?.endpoint).host;
  } catch {
    return null;
  }
}

/** Exact payload shape that previously delivered on Apple Web Push. */
function buildPushPayload({ title, body, url = '/' }) {
  const path = url.startsWith('/') ? url : `/${url}`;
  return JSON.stringify({ title, body, url: path });
}

async function deliverPush(user, payload, { logPrefix }) {
  if (!user?.push_subscription) return { skipped: 'no-subscription', host: null };
  const host = pushEndpointHost(user.push_subscription);
  const keys = getVapidKeys();
  // VAPID "sub" must be a reachable mailto: or https: URL — Apple rejects
  // pushes with 403 when the domain doesn't exist (e.g. ".example").
  webpush.setVapidDetails(vapidSubject(), keys.publicKey, keys.privateKey);
  try {
    // No Topic header — Apple collapsing was unnecessary and risked drops.
    const res = await webpush.sendNotification(user.push_subscription, payload);
    console.log(`[reminders] ${logPrefix} sent host=${host} status=${res?.statusCode ?? 201}`);
    return { sent: true, statusCode: res?.statusCode ?? 201, host };
  } catch (err) {
    console.error(`[reminders] ${logPrefix} ${err.statusCode ?? '???'}: ${err.body ?? err.message}`);
    // 404/410 — subscription expired; 401/403 — VAPID key mismatch (keys were
    // rotated). Drop the endpoint so the next app-open heal can resubscribe,
    // but keep the QStash schedule and reminder_time — otherwise the UI shows
    // reminders as off and heal never runs.
    if ([401, 403, 404, 410].includes(err.statusCode)) {
      return { skipped: 'expired-subscription', expired: true, host, statusCode: err.statusCode };
    }
    return { skipped: `delivery-error-${err.statusCode ?? 'unknown'}`, host, statusCode: err.statusCode };
  }
}

/** Sends one push; cleans up expired subscriptions. Never throws for delivery issues. */
export async function sendReminderPush(db, user) {
  if (!user?.push_subscription) return { skipped: 'no-subscription' };
  const { due, started } = dueWordsCount(db, user.id);
  // iOS shows "<title> from LangApp" — the "from LangApp" suffix comes from
  // the manifest name, so the title itself must carry the actual message.
  const { title, body } =
    due > 0
      ? {
          title: `${due} ${pluralRu(due)} ждут повторения`,
          body: 'Пять минут — и готово 🔥',
        }
      : started
        ? { title: 'Всё повторено! 🎉', body: 'План на сегодня выполнен — возвращайся завтра' }
        : { title: 'Начни учить турецкий 🇹🇷', body: 'Первая сессия из 18 слов уже ждёт' };
  const result = await deliverPush(user, buildPushPayload({ title, body }), {
    logPrefix: 'web-push',
  });
  return { ...result, due };
}

/** Immediate test notification — same VAPID path as the daily reminder. */
export async function sendTestPush(user) {
  return deliverPush(
    user,
    buildPushPayload({
      title: 'Тест LangApp',
      body: 'Пуш работает — это проверка 🔔',
    }),
    { logPrefix: 'test web-push' },
  );
}

function pluralRu(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'слово';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'слова';
  return 'слов';
}