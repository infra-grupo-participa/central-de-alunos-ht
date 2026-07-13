import { requireAuth } from '@/lib/auth.js';
import { one } from '@/lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

// Retorna o "estado do aluno": profile + cohort + settings + ficha.
export async function GET(request) {
  const { user, profile: existing, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });

  try {
    let profile = existing;
    if (!profile) {
      // Primeiro acesso: cria a linha minima do profile.
      profile = await one(
        `insert into ht.profiles (id, email)
         values ($1, $2)
         on conflict (id) do update set email = excluded.email
         returning *`,
        [user.id, user.email || null]
      );
    }

    profile = await one(
      'update ht.profiles set last_seen_at = now() where id = $1 returning *',
      [user.id]
    );

    const cohort = await resolveCohort(profile);

    const settings = cohort
      ? await one('select * from ht.settings where cohort_id = $1', [cohort.id])
      : null;

    let ficha = await one('select * from ht.ficha_interesse where user_id = $1', [user.id]);
    if (!ficha) {
      ficha = await one(
        `insert into ht.ficha_interesse (user_id, status)
         values ($1, 'pendente')
         on conflict (user_id) do nothing
         returning *`,
        [user.id]
      );
      // Corrida rara: outra requisicao criou antes; releia.
      if (!ficha) {
        ficha = await one('select * from ht.ficha_interesse where user_id = $1', [user.id]);
      }
    }

    return Response.json({ profile, cohort, settings, ficha });
  } catch (e) {
    console.error('[api/me]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
