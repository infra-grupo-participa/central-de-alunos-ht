import pg from 'pg';
import { env, hasDatabase } from './env.js';

// Backend acessa o schema `ht` direto no Postgres (nao exposto no PostgREST).
// search_path fixado em ht p/ todas as queries deste pool.
// Sem DATABASE_URL o pool nao e criado: queries respondem erro claro (modo degradado).
const pool = hasDatabase
  ? new pg.Pool({
      connectionString: env.databaseUrl,
      max: 10,
      ssl: env.databaseUrl?.includes('supabase.') ? { rejectUnauthorized: false } : undefined,
    })
  : null;

if (pool) {
  pool.on('connect', (client) => {
    client.query('set search_path to ht, public');
  });
}

export async function query(text, params) {
  if (!pool) throw new Error('banco_nao_configurado');
  const res = await pool.query(text, params);
  return res.rows;
}

export async function one(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

export { pool };
