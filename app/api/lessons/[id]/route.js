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

// Grava o tempo assistido ACUMULADO (nunca regride; teto = min_watch_seconds).
async function gravarAssistido(userId, lessonId, prog, enviado, min) {
  const capped = Math.min(min, Math.max(prog?.watched_seconds || 0, Math.floor(enviado) || 0));
  if (!prog) {
    return unwrap(
      await ht
        .from('lesson_progress')
        .upsert(
          { user_id: userId, lesson_id: lessonId, watched_seconds: capped, opened_at: new Date().toISOString() },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single()
    );
  }
  if (capped > (prog.watched_seconds || 0)) {
    return unwrap(
      await ht
        .from('lesson_progress')
        .update({ watched_seconds: capped })
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .select()
        .single()
    );
  }
  return prog;
}

function montar(aula, prog) {
  const agora = Date.now();
  const min = aula.min_watch_seconds || 2700;
  const liberada = !aula.unlock_at || new Date(aula.unlock_at).getTime() <= agora;
  const assistido = Math.min(min, prog?.watched_seconds || 0);
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
    assistido_seconds: assistido,
    restante_seconds: Math.max(0, min - assistido),
    concluida: !!prog?.completed_at,
    rating: prog?.rating || null,
    rating_comment: prog?.rating_comment || null,
  };
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

    const min = aula.min_watch_seconds || 2700;
    let prog = await progresso(user.id, aula.id);

    // Abre a aula: garante a linha de progresso (marca opened_at 1a vez) e
    // devolve o tempo ja assistido pra o cliente retomar de onde parou.
    if (action === 'abrir') {
      if (!prog) {
        prog = unwrap(
          await ht
            .from('lesson_progress')
            .upsert(
              { user_id: user.id, lesson_id: aula.id, opened_at: new Date().toISOString(), watched_seconds: 0 },
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

    // Salva o progresso do cronometro (tempo assistido acumulado).
    if (action === 'tick') {
      prog = await gravarAssistido(user.id, aula.id, prog, body?.watched_seconds, min);
      return Response.json(montar(aula, prog));
    }

    // Conclui: exige tempo assistido ACUMULADO >= minimo. Credita pontos 1x.
    if (action === 'concluir') {
      prog = await gravarAssistido(user.id, aula.id, prog, body?.watched_seconds, min);
      const assistido = prog?.watched_seconds || 0;
      if (assistido < min) {
        return Response.json(
          { error: 'tempo_insuficiente', faltam: Math.ceil(min - assistido) },
          { status: 400 }
        );
      }
      const jaConcluida = !!prog?.completed_at;
      if (!jaConcluida) {
        prog = unwrap(
          await ht
            .from('lesson_progress')
            .update({ completed_at: new Date().toISOString() })
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
