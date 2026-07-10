import { requireAuth } from '../auth.js';
import { query, one } from '../db.js';

export default async function fichaRoutes(app) {
  // Aluno declara que respondeu a ficha de interesse. Credita +50 pts uma unica vez.
  app.post('/api/ficha/respondi', { preHandler: requireAuth }, async (req, reply) => {
    try {
      const existente = await one(
        'select * from ht.ficha_interesse where user_id = $1',
        [req.user.id]
      );
      const jaRespondida = existente?.status === 'respondida';

      const ficha = await one(
        `insert into ht.ficha_interesse (user_id, status, respondida_at)
         values ($1, 'respondida', now())
         on conflict (user_id) do update
           set status = 'respondida',
               respondida_at = coalesce(ficha_interesse.respondida_at, now())
         returning *`,
        [req.user.id]
      );

      let pontos = 0;
      if (!jaRespondida) {
        // Dupla guarda contra credito duplicado (corrida entre requisicoes).
        const credito = await query(
          `insert into ht.points_ledger (user_id, source, points)
           select $1, 'ficha', 50
            where not exists (
              select 1 from ht.points_ledger where user_id = $1 and source = 'ficha'
            )
           returning points`,
          [req.user.id]
        );
        pontos = credito.length ? 50 : 0;
      }

      return {
        ok: true,
        ficha,
        pontos_creditados: pontos,
        mensagem: pontos
          ? 'Ficha registrada! Você garantiu +50 pontos.'
          : 'Ficha já estava registrada.',
      };
    } catch (e) {
      req.log.error(e);
      return reply.code(500).send({ error: 'erro_interno' });
    }
  });
}
