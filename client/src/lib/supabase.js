import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Client do browser: usado SOMENTE para Auth (login/sessao).
// Dados do HT vem pela API Fastify (schema ht nao e exposto no PostgREST).
export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const API = import.meta.env.VITE_API_URL || '';

// Helper: chamada autenticada a API, injeta o token da sessao.
export async function api(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}
