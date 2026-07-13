import { env } from './env.js';
import { getUserFromToken } from './supabase-admin.js';
import { ht, unwrap } from './htdb.js';

function bearer(request) {
  const h = request.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// Exige aluno autenticado. Retorna { user, profile } ou { unauthorized: true }.
export async function requireAuth(request) {
  const user = await getUserFromToken(bearer(request));
  if (!user) return { user: null, profile: null, unauthorized: true };
  const profile = unwrap(
    await ht.from('profiles').select('*').eq('id', user.id).maybeSingle()
  );
  return { user, profile, unauthorized: false };
}

// Exige admin (email na allowlist OU registrado em ht.admins).
export async function requireAdmin(request) {
  const user = await getUserFromToken(bearer(request));
  if (!user) return { user: null, unauthorized: true };
  const email = (user.email || '').toLowerCase();
  const inList = env.adminEmails.includes(email);
  let inTable = false;
  if (!inList) {
    const row = unwrap(
      await ht.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
    );
    inTable = !!row;
  }
  if (!inList && !inTable) return { user: null, forbidden: true };
  return { user, unauthorized: false };
}
