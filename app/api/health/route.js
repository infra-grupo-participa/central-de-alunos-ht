import { ht } from '@/lib/htdb.js';
import { hasServiceRole } from '@/lib/env.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let db = 'ok';
  try {
    const { error } = await ht.from('cohorts').select('id').limit(1);
    if (error) db = 'erro: ' + error.message;
  } catch (e) {
    db = 'erro: ' + e.message;
  }
  return Response.json({
    status: 'ok',
    db,
    config: { service_role: hasServiceRole },
    modo: hasServiceRole && db === 'ok' ? 'completo' : 'degradado',
    ts: new Date().toISOString(),
  });
}
