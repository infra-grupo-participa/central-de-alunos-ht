import { one } from '../db.js';
import { hasServiceRole, hasDatabase } from '../env.js';

export default async function healthRoutes(app) {
  app.get('/api/health', async () => {
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
    return {
      status: 'ok',
      db,
      config: { service_role: hasServiceRole, database: hasDatabase },
      modo: hasServiceRole && hasDatabase ? 'completo' : 'degradado',
      ts: new Date().toISOString(),
    };
  });
}
