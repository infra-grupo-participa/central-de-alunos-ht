import pg from 'pg';
import { env } from './env.js';

// Backend acessa o schema `ht` direto no Postgres (nao exposto no PostgREST).
// search_path fixado em ht p/ todas as queries deste pool.
const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 10,
  ssl: env.databaseUrl?.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
});

pool.on('connect', (client) => {
  client.query('set search_path to ht, public');
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

export async function one(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

export { pool };
