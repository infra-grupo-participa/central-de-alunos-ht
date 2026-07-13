import { supabaseAdmin } from './supabase-admin.js';

// Acesso ao schema `ht` pela Data API do Supabase (PostgREST), usando o
// service_role: ele tem GRANT no schema ht e bypassa a RLS. O anon NAO tem
// grant no ht (fica bloqueado), entao o schema segue "privado" ao backend
// mesmo estando exposto na API. Ver DEPLOY.md.
export const ht = supabaseAdmin.schema('ht');

// supabase-js retorna { data, error } em vez de lancar. Este helper propaga o
// erro para o try/catch do route handler (que responde 500 com log).
export function unwrap({ data, error }) {
  if (error) throw new Error(error.message || 'erro_supabase');
  return data;
}
