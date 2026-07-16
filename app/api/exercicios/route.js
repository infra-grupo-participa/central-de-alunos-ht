import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';
import { resolveCohort, aulaLiberada } from '@/lib/cohort.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lista os exercícios do cohort do aluno, com o estado de cada um:
// - liberado (a aula do dia já abriu às 08h?)
// - confirmação de como assistiu (ao vivo / replay / não assistiu)
// - status da minha submissão (nenhum / rascunho / concluído)
// Com ?full=1 inclui também `campos` e `respostas` (usado pelo workbook).
export async function GET(request) {
  const { user, profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });

  const full = new URL(request.url).searchParams.get('full') === '1';

  try {
    const cohort = await resolveCohort(profile);
    if (!cohort) return Response.json([]);

    const [exercicios, lessons, progresso, submissoes] = await Promise.all([
      ht
        .from('exercises')
        .select('*')
        .eq('cohort_id', cohort.id)
        .eq('ativo', true)
        .order('day_index', { ascending: true })
        .order('ordem', { ascending: true }),
      ht.from('lessons').select('*').eq('cohort_id', cohort.id).eq('ativo', true),
      ht.from('lesson_progress').select('lesson_id, watch_mode, watch_confirmed_at').eq('user_id', user.id),
      ht.from('exercise_submissions').select('*').eq('user_id', user.id),
    ]).then((rs) => rs.map(unwrap));

    const aulaPorId = new Map((lessons || []).map((l) => [l.id, l]));
    const progPorAula = new Map((progresso || []).map((p) => [p.lesson_id, p]));
    const subPorExercicio = new Map((submissoes || []).map((s) => [s.exercise_id, s]));

    const agora = Date.now();
    const lista = (exercicios || []).map((e) => {
      const aula = e.lesson_id ? aulaPorId.get(e.lesson_id) : null;
      const liberado = aula ? aulaLiberada(aula, agora) : true;
      const prog = aula ? progPorAula.get(aula.id) : null;
      const sub = subPorExercicio.get(e.id);
      return {
        id: e.id,
        day_index: e.day_index,
        titulo: e.titulo,
        objetivo: e.objetivo,
        descricao: e.descricao,
        pontos: e.pontos,
        liberado,
        aula: aula
          ? {
              id: aula.id,
              titulo: aula.titulo,
              video_id: aula.video_id,
              unlock_at: aula.unlock_at,
              liberada: liberado,
            }
          : null,
        watch_mode: prog?.watch_mode || null,
        watch_confirmado: !!prog?.watch_confirmed_at,
        submission_status: sub?.status || 'nenhum',
        concluido: sub?.status === 'concluido',
        ...(full && liberado
          ? { campos: e.campos, respostas: sub?.respostas || {}, completed_at: sub?.completed_at || null }
          : {}),
      };
    });

    return Response.json(lista);
  } catch (e) {
    console.error('[api/exercicios]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
