import { requireAuth } from '../auth.js';
import { query, one } from '../db.js';

export default async function announcementsRoutes(app) {
  // Avisos ativos do cohort do aluno, dentro da janela de exibicao.
  app.get('/api/announcements', { preHandler: requireAuth }, async (req, reply) => {
    try {
      let cohortId = req.profile?.cohort_id || null;
      if (!cohortId) {
        const c = await one(
          `select id from ht.cohorts
            where status = 'ativo' and coalesce(is_template, false) = false
            order by data_inicio desc nulls last
            limit 1`
        );
        cohortId = c?.id || null;
      }
      if (!cohortId) return [];

      const rows = await query(
        `select * from ht.announcements
          where cohort_id = $1
            and ativo = true
            and (starts_at is null or starts_at <= now())
            and (ends_at is null or ends_at >= now())
          order by prioridade desc, created_at desc`,
        [cohortId]
      );
      return rows;
    } catch (e) {
      req.log.error(e);
      return reply.code(500).send({ error: 'erro_interno' });
    }
  });
}
