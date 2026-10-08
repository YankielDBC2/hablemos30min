import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'h30_admin';
const MAX_AGE = 8 * 60 * 60;
function secret() { const value = process.env.ADMIN_SESSION_SECRET; if (!value || value.length < 32) throw new Error('Admin session configuration missing'); return value; }
export function passwordMatches(password: string, encoded = process.env.ADMIN_PASSWORD_HASH ?? '') {
  const [salt, expected] = encoded.split(':');
  if (!salt || !expected || !/^[a-f0-9]{128}$/.test(expected) || password.length > 256) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
export function createSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now()/1000) + MAX_AGE, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret()).update(payload).digest('base64url')}`;
}
export function validSession(value: string | undefined) {
  if (!value || value.length > 1024) return false;
  const [payload, signature, extra] = value.split('.'); if (!payload || !signature || extra) return false;
  const expected = createHmac('sha256', secret()).update(payload).digest();
  const supplied = Buffer.from(signature, 'base64url');
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
  try { const data = JSON.parse(Buffer.from(payload,'base64url').toString()); return typeof data.exp === 'number' && data.exp > Date.now()/1000 && data.exp <= Date.now()/1000 + MAX_AGE + 10; } catch { return false; }
}
export async function isAdmin() { return validSession((await cookies()).get(ADMIN_COOKIE)?.value); }
export async function requireAdmin() { if (!await isAdmin()) throw new HttpError('Inicia sesión para continuar.',401); }
export class HttpError extends Error { constructor(message:string,public status=400) { super(message); } }
export async function setAdminCookie(value:string) { (await cookies()).set(ADMIN_COOKIE,value,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:MAX_AGE}); }
export async function clearAdminCookie() { (await cookies()).delete(ADMIN_COOKIE); }
