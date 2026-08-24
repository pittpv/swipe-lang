import { randomBytes } from 'crypto';

export function generateReferralCode() {
  return randomBytes(4).toString('hex');
}

export function findUserByReferralCode(db, code) {
  if (!code || typeof code !== 'string') return null;
  return db.data.users.find((u) => u.referral_code === code.toLowerCase().trim()) ?? null;
}

export function ensureReferralCode(user, db) {
  if (!user.referral_code) {
    user.referral_code = generateReferralCode();
    db.persist();
  }
  return user.referral_code;
}
