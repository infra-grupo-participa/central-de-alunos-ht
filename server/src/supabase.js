import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Client com service_role: usado para criar/gerenciar usuarios (auth.admin)
// e validar tokens. NUNCA exposto ao browser.
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Valida um JWT de aluno e retorna o usuario, ou null.
export async function getUserFromToken(token) {
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
