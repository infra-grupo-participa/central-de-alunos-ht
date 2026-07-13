import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveCohortId(profile) {
  if (profile?.cohort_id) return profile.cohort_id;
  const rows = unwrap(
    await ht
      .from('cohorts')
      .select('id')
      .eq('status', 'ativo')
      .or('is_template.is.null,is_template.eq.false')
      .order('data_inicio', { ascending: false, nullsFirst: false })
      .limit(1)
  );
  return rows?.[0]?.id || null;
}

// Aulas do cohort do aluno, com status de liberacao (drip por unlock_at) e conclusao.
export async function GET(request) {
  const { user, profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });

  try {
    const cohortId = await resolveCohortId(profile);
    if (!cohortId) return Response.json([]);

    const rows = unwrap(
      await ht
        .from('lessons')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('ativo', true)
        .order('day_index', { ascending: true })
        .order('ordem', { ascending: true })
    );

    const progresso = unwrap(
      await ht
        .from('lesson_progress')
        .select('lesson_id, completed_at')
        .eq('user_id', user.id)
    );
    const porAula = new Map((progresso || []).map((p) => [p.lesson_id, p]));

    const agora = Date.now();
    const aulas = (rows || []).map((l) => {
      const liberada = !l.unlock_at || new Date(l.unlock_at).getTime() <= agora;
      return {
        id: l.id,
        day_index: l.day_index,
        ordem: l.ordem,
        titulo: l.titulo,
        descricao: l.descricao,
        resumo: l.resumo,
        video_provider: l.video_provider,
        video_id: l.video_id,
        pontos: l.pontos,
        unlock_at: l.unlock_at,
        liberada,
        concluida: !!porAula.get(l.id)?.completed_at,
      };
    });

    return Response.json(aulas);
  } catch (e) {
    console.error('[api/lessons]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
