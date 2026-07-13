import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function cohortIdDoAluno(profile) {
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

async function carregarAula(id, cohortId) {
  const aula = unwrap(
    await ht.from('lessons').select('*').eq('id', id).eq('ativo', true).maybeSingle()
  );
  if (!aula || !cohortId || aula.cohort_id !== cohortId) return null;
  return aula;
}

function montar(aula, prog) {
  const agora = Date.now();
  const min = aula.min_watch_seconds || 600;
  const liberada = !aula.unlock_at || new Date(aula.unlock_at).getTime() <= agora;
  let restante = min;
  if (prog?.opened_at) {
    const passou = Math.floor((agora - new Date(prog.opened_at).getTime()) / 1000);
    restante = Math.max(0, min - passou);
  }
  return {
    id: aula.id,
    day_index: aula.day_index,
    ordem: aula.ordem,
    titulo: aula.titulo,
    descricao: aula.descricao,
    resumo: aula.resumo,
    video_provider: aula.video_provider,
    video_id: aula.video_id,
    min_watch_seconds: min,
    pontos: aula.pontos || 100,
    liberada,
    opened_at: prog?.opened_at || null,
    concluida: !!prog?.completed_at,
    rating: prog?.rating || null,
    rating_comment: prog?.rating_comment || null,
    restante_seconds: restante,
  };
}

async function progresso(userId, lessonId) {
  return unwrap(
    await ht
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle()
  );
}

export async function GET(request, { params }) {
  const { user, profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });
  try {
    const cohortId = await cohortIdDoAluno(profile);
    const aula = await carregarAula(params.id, cohortId);
    if (!aula) return Response.json({ error: 'aula_nao_encontrada' }, { status: 404 });
    const prog = await progresso(user.id, aula.id);
    return Response.json(montar(aula, prog));
  } catch (e) {
    console.error('[api/lessons/[id] GET]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { user, profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const action = body?.action;

  try {
    const cohortId = await cohortIdDoAluno(profile);
    const aula = await carregarAula(params.id, cohortId);
    if (!aula) return Response.json({ error: 'aula_nao_encontrada' }, { status: 404 });

    const liberada = !aula.unlock_at || new Date(aula.unlock_at).getTime() <= Date.now();
    if (!liberada) return Response.json({ error: 'aula_bloqueada' }, { status: 403 });

    let prog = await progresso(user.id, aula.id);

    // Registra a abertura (inicia o cronometro server-side).
    if (action === 'abrir') {
      if (!prog) {
        prog = unwrap(
          await ht
            .from('lesson_progress')
            .upsert(
              { user_id: user.id, lesson_id: aula.id, opened_at: new Date().toISOString() },
              { onConflict: 'user_id,lesson_id' }
            )
            .select()
            .single()
        );
      } else if (!prog.opened_at) {
        prog = unwrap(
          await ht
            .from('lesson_progress')
            .update({ opened_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('lesson_id', aula.id)
            .select()
            .single()
        );
      }
      return Response.json(montar(aula, prog));
    }

    // Conclui: valida que passou o tempo minimo desde a abertura e credita pontos 1x.
    if (action === 'concluir') {
      const min = aula.min_watch_seconds || 600;
      const openedAt = prog?.opened_at ? new Date(prog.opened_at).getTime() : null;
      if (!openedAt) return Response.json({ error: 'aula_nao_iniciada' }, { status: 400 });
      const passou = (Date.now() - openedAt) / 1000;
      if (passou < min) {
        return Response.json(
          { error: 'tempo_insuficiente', faltam: Math.ceil(min - passou) },
          { status: 400 }
        );
      }
      const jaConcluida = !!prog?.completed_at;
      if (!jaConcluida) {
        prog = unwrap(
          await ht
            .from('lesson_progress')
            .update({ completed_at: new Date().toISOString(), watched_seconds: min })
            .eq('user_id', user.id)
            .eq('lesson_id', aula.id)
            .select()
            .single()
        );
      }
      let pontos = 0;
      if (!jaConcluida) {
        const existente = unwrap(
          await ht
            .from('points_ledger')
            .select('id')
            .eq('user_id', user.id)
            .eq('source', 'aula')
            .eq('ref_id', aula.id)
            .limit(1)
            .maybeSingle()
        );
        if (!existente) {
          unwrap(
            await ht
              .from('points_ledger')
              .insert({ user_id: user.id, source: 'aula', ref_id: aula.id, points: aula.pontos || 100 })
          );
          pontos = aula.pontos || 100;
        }
      }
      return Response.json({
        ok: true,
        ...montar(aula, prog),
        pontos_creditados: pontos,
        mensagem: pontos ? `Aula concluída! +${pontos} pontos no ranking.` : 'Aula concluída.',
      });
    }

    // Avalia a aula (1..5) — so depois de concluir.
    if (action === 'avaliar') {
      const rating = Math.max(1, Math.min(5, parseInt(body?.rating, 10) || 0));
      if (!rating) return Response.json({ error: 'rating_invalido' }, { status: 400 });
      if (!prog?.completed_at) return Response.json({ error: 'conclua_primeiro' }, { status: 400 });
      const comentario = body?.comentario ? String(body.comentario).slice(0, 500) : null;
      prog = unwrap(
        await ht
          .from('lesson_progress')
          .update({ rating, rating_comment: comentario, rating_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('lesson_id', aula.id)
          .select()
          .single()
      );
      return Response.json({ ok: true, ...montar(aula, prog) });
    }

    return Response.json({ error: 'acao_invalida' }, { status: 400 });
  } catch (e) {
    console.error('[api/lessons/[id] POST]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
