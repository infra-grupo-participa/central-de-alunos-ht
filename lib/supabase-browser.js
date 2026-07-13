import { createClient } from '@supabase/supabase-js';

// Next so expoe ao browser as variaveis com prefixo NEXT_PUBLIC_.
// Default embutido (URL + publishable key) para o front subir mesmo sem env.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mbvybujpkwuorhtdzcde.supabase.co';
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_ZCwMkDCoJ5_H7DHZ476TsQ_CesBbG9J';

// Client do browser: usado SOMENTE para Auth (login/sessao).
// Dados do HT vem pela API (schema ht nao e exposto no PostgREST).
export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Helper: chamada autenticada a API (mesma origem), injeta o token da sessao.
export async function api(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}
