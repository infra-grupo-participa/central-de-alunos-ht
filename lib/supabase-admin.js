import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Client com service_role: usado para gerenciar usuarios (auth.admin) e validar
// tokens. NUNCA exposto ao browser (este modulo so e importado por route handlers
// e por lib/auth.js). Usa a anon key como fallback para validar JWT enquanto o
// service_role ainda nao foi configurado (modo degradado).
export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceKey || env.supabaseAnonKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    // O Next.js faz cache do fetch() por padrao — sem isto, o supabase-js
    // devolveria dados velhos apos qualquer mudanca no banco (aulas, ranking,
    // perfil). `no-store` forca cada query a ler fresco.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  }
);

// Valida um JWT de aluno e retorna o usuario, ou null.
export async function getUserFromToken(token) {
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
