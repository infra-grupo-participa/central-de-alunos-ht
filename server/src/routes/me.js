import { requireAuth } from '../auth.js';
import { query, one } from '../db.js';
import { supabaseAdmin } from '../supabase.js';

// Cohort do aluno (via profile) ou fallback: cohort ativo mais recente.
async function resolveCohort(profile) {
  if (profile?.cohort_id) {
    const c = await one('select * from ht.cohorts where id = $1', [profile.cohort_id]);
    if (c) return c;
  }
  return one(
    `select * from ht.cohorts
      where status = 'ativo' and coalesce(is_template, false) = false
      order by data_inicio desc nulls last
      limit 1`
  );
}

export default async function meRoutes(app) {
  // Retorna o "estado do aluno": profile + cohort + settings + ficha.
  app.get('/api/me', { preHandler: requireAuth }, async (req, reply) => {
    try {
      let profile = req.profile;
      if (!profile) {
        // Primeiro acesso: cria a linha minima do profile.
        profile = await one(
          `insert into ht.profiles (id, email)
           values ($1, $2)
           on conflict (id) do update set email = excluded.email
           returning *`,
          [req.user.id, req.user.email || null]
        );
      }

      profile = await one(
        'update ht.profiles set last_seen_at = now() where id = $1 returning *',
        [req.user.id]
      );

      const cohort = await resolveCohort(profile);

      const settings = cohort
        ? await one('select * from ht.settings where cohort_id = $1', [cohort.id])
        : null;

      let ficha = await one('select * from ht.ficha_interesse where user_id = $1', [
        req.user.id,
      ]);
      if (!ficha) {
        ficha = await one(
          `insert into ht.ficha_interesse (user_id, status)
           values ($1, 'pendente')
           on conflict (user_id) do nothing
           returning *`,
          [req.user.id]
        );
        // Corrida rara: outra requisicao criou antes; releia.
        if (!ficha) {
          ficha = await one('select * from ht.ficha_interesse where user_id = $1', [
            req.user.id,
          ]);
        }
      }

      return { profile, cohort, settings, ficha };
    } catch (e) {
      req.log.error(e);
      return reply.code(500).send({ error: 'erro_interno' });
    }
  });

  // Troca a senha do aluno e libera o acesso (must_change_password = false).
  app.post('/api/me/senha', { preHandler: requireAuth }, async (req, reply) => {
    const novaSenha = String(req.body?.nova_senha || '');
    if (novaSenha.length < 8) {
      return reply.code(400).send({
        error: 'senha_invalida',
        mensagem: 'A nova senha precisa ter pelo menos 8 caracteres.',
      });
    }
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        password: novaSenha,
      });
      if (error) {
        req.log.error(error);
        return reply.code(400).send({
          error: 'erro_ao_trocar_senha',
          mensagem: 'Não foi possível trocar a senha. Tente novamente.',
        });
      }
      await query('update ht.profiles set must_change_password = false where id = $1', [
        req.user.id,
      ]);
      return { ok: true, mensagem: 'Senha atualizada. Bem-vindo à Central.' };
    } catch (e) {
      req.log.error(e);
      return reply.code(500).send({ error: 'erro_interno' });
    }
  });
}
