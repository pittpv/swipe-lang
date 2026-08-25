import { randomBytes } from 'crypto';

export function generateReferralCode() {
  return randomBytes(4).toString('hex');
}

export function findUserByReferralCode(db, code) {
  if (!code || typeof code !== 'string') return null;
  return db.data.users.find((u) => u.referral_code === code.toLowerCase().trim()) ?? null;
}

export async function ensureReferralCode(user, db) {
  if (user.referral_code) return user.referral_code;
  const code = generateReferralCode();
  await db.transact(() => {
    const u = db.data.users.find((row) => row.id === user.id);
    if (u && !u.referral_code) u.referral_code = code;
  });
  return db.data.users.find((row) => row.id === user.id)?.referral_code ?? code;
}
