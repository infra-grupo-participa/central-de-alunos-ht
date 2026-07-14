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

// E admin quem esta na allowlist de emails (env ADMIN_EMAILS) OU registrado em
// ht.admins. A tabela existe para dar/tirar acesso sem redeploy — mexer na env
// da Hostinger obriga a reimplantar o app.
export async function isAdmin(user) {
  if (!user) return false;
  const email = (user.email || '').toLowerCase();
  if (env.adminEmails.includes(email)) return true;
  try {
    const row = unwrap(
      await ht.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
    );
    return !!row;
  } catch (e) {
    // Sem a tabela (ou sem service_role) o admin continua valendo pela allowlist.
    console.error('[auth/isAdmin]', e.message);
    return false;
  }
}

// Exige admin. Retorna { user } ou { unauthorized } / { forbidden }.
export async function requireAdmin(request) {
  const user = await getUserFromToken(bearer(request));
  if (!user) return { user: null, unauthorized: true };
  if (!(await isAdmin(user))) return { user: null, forbidden: true };
  return { user, unauthorized: false };
}
