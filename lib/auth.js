import { env } from './env.js';
import { getUserFromToken } from './supabase-admin.js';
import { one } from './db.js';

function bearer(request) {
  const h = request.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// Exige aluno autenticado. Retorna { user, profile } ou { unauthorized: true }.
// O route handler decide a resposta 401.
export async function requireAuth(request) {
  const user = await getUserFromToken(bearer(request));
  if (!user) return { user: null, profile: null, unauthorized: true };
  const profile = await one('select * from ht.profiles where id = $1', [user.id]);
  return { user, profile, unauthorized: false };
}

// Exige admin (email na allowlist OU registrado em ht.admins).
// Retorna { user } ou { unauthorized: true } / { forbidden: true }.
export async function requireAdmin(request) {
  const user = await getUserFromToken(bearer(request));
  if (!user) return { user: null, unauthorized: true };
  const email = (user.email || '').toLowerCase();
  const inList = env.adminEmails.includes(email);
  const inTable = inList
    ? true
    : !!(await one('select 1 from ht.admins where user_id = $1', [user.id]));
  if (!inList && !inTable) return { user: null, forbidden: true };
  return { user, unauthorized: false };
}
