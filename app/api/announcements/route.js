import { requireAuth } from '@/lib/auth.js';
import { query, one } from '@/lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Avisos ativos do cohort do aluno, dentro da janela de exibicao.
export async function GET(request) {
  const { profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });

  try {
    let cohortId = profile?.cohort_id || null;
    if (!cohortId) {
      const c = await one(
        `select id from ht.cohorts
          where status = 'ativo' and coalesce(is_template, false) = false
          order by data_inicio desc nulls last
          limit 1`
      );
      cohortId = c?.id || null;
    }
    if (!cohortId) return Response.json([]);

    const rows = await query(
      `select * from ht.announcements
        where cohort_id = $1
          and ativo = true
          and (starts_at is null or starts_at <= now())
          and (ends_at is null or ends_at >= now())
        order by prioridade desc, created_at desc`,
      [cohortId]
    );
    return Response.json(rows);
  } catch (e) {
    console.error('[api/announcements]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
