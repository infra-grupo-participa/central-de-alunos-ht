import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';
import { resolveCohort, aulaLiberada } from '@/lib/cohort.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function carregar(id, cohortId) {
  const e = unwrap(
    await ht.from('exercises').select('*').eq('id', id).eq('ativo', true).maybeSingle()
  );
  if (!e || !cohortId || e.cohort_id !== cohortId) return null;
  return e;
}

async function aulaDo(exercicio) {
  if (!exercicio.lesson_id) return null;
  return unwrap(
    await ht.from('lessons').select('*').eq('id', exercicio.lesson_id).maybeSingle()
  );
}

async function minhaSubmissao(userId, exerciseId) {
  return unwrap(
    await ht
      .from('exercise_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .maybeSingle()
  );
}

function montar(exercicio, aula, prog, sub) {
  return {
    id: exercicio.id,
    day_index: exercicio.day_index,
    titulo: exercicio.titulo,
    objetivo: exercicio.objetivo,
    descricao: exercicio.descricao,
    campos: exercicio.campos || [],
    pontos: exercicio.pontos,
    aula: aula
      ? { id: aula.id, titulo: aula.titulo, video_id: aula.video_id, unlock_at: aula.unlock_at }
      : null,
    watch_mode: prog?.watch_mode || null,
    watch_confirmado: !!prog?.watch_confirmed_at,
    respostas: sub?.respostas || {},
    status: sub?.status || 'nenhum',
    concluido: sub?.status === 'concluido',
    completed_at: sub?.completed_at || null,
  };
}

// Validação leve na conclusão: repeaters com min_rows exigem o mínimo de linhas
// com o primeiro campo preenchido. O resto é responsabilidade do aluno.
function validar(campos, respostas) {
  for (const campo of campos || []) {
    if (campo.type === 'repeater' && campo.min_rows) {
      const linhas = Array.isArray(respostas?.[campo.key]) ? respostas[campo.key] : [];
      const chave = campo.fields?.[0]?.key;
      const preenchidas = linhas.filter((r) => String(r?.[chave] || '').trim()).length;
      if (preenchidas < campo.min_rows) {
        return { ok: false, erro: 'linhas_insuficientes', campo: campo.label, minimo: campo.min_rows, atual: preenchidas };
      }
    }
  }
  return { ok: true };
}

export async function GET(request, { params }) {
  const { user, profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });
  try {
    const cohort = await resolveCohort(profile);
    const exercicio = await carregar(params.id, cohort?.id);
    if (!exercicio) return Response.json({ error: 'exercicio_nao_encontrado' }, { status: 404 });

    const aula = await aulaDo(exercicio);
    if (aula && !aulaLiberada(aula)) {
      return Response.json({ error: 'exercicio_bloqueado' }, { status: 403 });
    }

    const prog = aula
      ? unwrap(
          await ht
            .from('lesson_progress')
            .select('watch_mode, watch_confirmed_at')
            .eq('user_id', user.id)
            .eq('lesson_id', aula.id)
            .maybeSingle()
        )
      : null;
    const sub = await minhaSubmissao(user.id, exercicio.id);
    return Response.json(montar(exercicio, aula, prog, sub));
  } catch (e) {
    console.error('[api/exercicios/[id] GET]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { user, profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const action = body?.action;

  try {
    const cohort = await resolveCohort(profile);
    const exercicio = await carregar(params.id, cohort?.id);
    if (!exercicio) return Response.json({ error: 'exercicio_nao_encontrado' }, { status: 404 });

    const aula = await aulaDo(exercicio);
    if (aula && !aulaLiberada(aula)) {
      return Response.json({ error: 'exercicio_bloqueado' }, { status: 403 });
    }

    const respostas = body?.respostas && typeof body.respostas === 'object' ? body.respostas : {};
    let sub = await minhaSubmissao(user.id, exercicio.id);

    if (sub?.status === 'concluido' && action === 'salvar') {
      // Concluído continua editável, mas não regride de status.
      sub = unwrap(
        await ht
          .from('exercise_submissions')
          .update({ respostas, updated_at: new Date().toISOString() })
          .eq('id', sub.id)
          .select()
          .single()
      );
      return Response.json({ ok: true, status: sub.status });
    }

    if (action === 'salvar') {
      sub = unwrap(
        await ht
          .from('exercise_submissions')
          .upsert(
            { user_id: user.id, exercise_id: exercicio.id, respostas, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,exercise_id' }
          )
          .select()
          .single()
      );
      return Response.json({ ok: true, status: sub.status });
    }

    if (action === 'concluir') {
      const v = validar(exercicio.campos, respostas);
      if (!v.ok) return Response.json({ error: v.erro, ...v }, { status: 400 });

      const jaConcluido = sub?.status === 'concluido';
      sub = unwrap(
        await ht
          .from('exercise_submissions')
          .upsert(
            {
              user_id: user.id,
              exercise_id: exercicio.id,
              respostas,
              status: 'concluido',
              completed_at: sub?.completed_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,exercise_id' }
          )
          .select()
          .single()
      );

      let pontos = 0;
      if (!jaConcluido) {
        const existente = unwrap(
          await ht
            .from('points_ledger')
            .select('id')
            .eq('user_id', user.id)
            .eq('source', 'exercicio')
            .eq('ref_id', exercicio.id)
            .limit(1)
            .maybeSingle()
        );
        if (!existente) {
          unwrap(
            await ht
              .from('points_ledger')
              .insert({ user_id: user.id, source: 'exercicio', ref_id: exercicio.id, points: exercicio.pontos || 100 })
          );
          pontos = exercicio.pontos || 100;
        }
      }

      return Response.json({
        ok: true,
        status: 'concluido',
        pontos_creditados: pontos,
        mensagem: 'Exercício concluído. Um passo por vez — e esse você já deu.',
      });
    }

    return Response.json({ error: 'acao_invalida' }, { status: 400 });
  } catch (e) {
    console.error('[api/exercicios/[id] POST]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
