import pg from 'pg';
import { env, hasDatabase } from './env.js';

// Backend acessa o schema `ht` direto no Postgres (nao exposto no PostgREST).
// search_path fixado em ht p/ todas as queries deste pool.
//
// Pool guardado em globalThis: no dev do Next os modulos recarregam a cada
// mudanca; sem isso, cada reload criaria um novo pool e vazaria conexoes.
// Sem DATABASE_URL o pool nao e criado: queries respondem erro claro (modo degradado).
function getPool() {
  if (!hasDatabase) return null;
  if (!globalThis.__htPool) {
    const pool = new pg.Pool({
      connectionString: env.databaseUrl,
      max: 10,
      ssl: env.databaseUrl?.includes('supabase.') ? { rejectUnauthorized: false } : undefined,
      // Falha rapido em vez de pendurar a requisicao (que viraria 504 / tela
      // carregando pra sempre) se o banco estiver inacessivel — ex.: DATABASE_URL
      // apontando pra conexao IPv6 direta num host sem IPv6. Use o Transaction
      // pooler (IPv4) do Supabase. Ver DEPLOY.md.
      connectionTimeoutMillis: 8000,
      statement_timeout: 15000,
      query_timeout: 15000,
      idleTimeoutMillis: 30000,
    });
    pool.on('connect', (client) => {
      client.query('set search_path to ht, public');
    });
    // Sem este handler, um erro de conexao ocioso derruba o processo Node.
    pool.on('error', (err) => {
      console.error('[db] erro no pool de conexoes:', err.message);
    });
    globalThis.__htPool = pool;
  }
  return globalThis.__htPool;
}

export async function query(text, params) {
  const pool = getPool();
  if (!pool) throw new Error('banco_nao_configurado');
  const res = await pool.query(text, params);
  return res.rows;
}

export async function one(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}
