import { one } from '@/lib/db.js';
import { hasServiceRole, hasDatabase } from '@/lib/env.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let db = 'ok';
  if (!hasDatabase) {
    db = 'nao_configurado';
  } else {
    try {
      await one('select 1 as ok');
    } catch (e) {
      db = 'erro: ' + e.message;
    }
  }
  return Response.json({
    status: 'ok',
    db,
    config: { service_role: hasServiceRole, database: hasDatabase },
    modo: hasServiceRole && hasDatabase ? 'completo' : 'degradado',
    ts: new Date().toISOString(),
  });
}
