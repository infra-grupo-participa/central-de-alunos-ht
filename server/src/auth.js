import { env } from './env.js';
import { getUserFromToken } from './supabase.js';
import { one } from './db.js';

function bearer(req) {
  const h = req.headers['authorization'] || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// Exige aluno autenticado. Anexa req.user e req.profile.
export async function requireAuth(req, reply) {
  const user = await getUserFromToken(bearer(req));
  if (!user) return reply.code(401).send({ error: 'nao_autenticado' });
  req.user = user;
  req.profile = await one('select * from ht.profiles where id = $1', [user.id]);
}

// Exige admin (email na allowlist OU registrado em ht.admins).
export async function requireAdmin(req, reply) {
  const user = await getUserFromToken(bearer(req));
  if (!user) return reply.code(401).send({ error: 'nao_autenticado' });
  const email = (user.email || '').toLowerCase();
  const inList = env.adminEmails.includes(email);
  const inTable = inList
    ? true
    : !!(await one('select 1 from ht.admins where user_id = $1', [user.id]));
  if (!inList && !inTable) return reply.code(403).send({ error: 'nao_autorizado' });
  req.user = user;
}
