import { one } from '../db.js';

export default async function healthRoutes(app) {
  app.get('/api/health', async () => {
    let db = 'ok';
    try {
      await one('select 1 as ok');
    } catch (e) {
      db = 'erro: ' + e.message;
    }
    return { status: 'ok', db, ts: new Date().toISOString() };
  });
}
