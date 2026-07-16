import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';
import { resolveCohort, aulaLiberada } from '@/lib/cohort.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// O vídeo agora vive no YouTube (a Central só aponta pra lá). O que esta rota
// guarda é a CONFIRMAÇÃO de como o aluno assistiu — ao vivo, replay ou ainda
// não — que é o gate do exercício do dia.

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

function montar(aula, prog) {
  return {
    id: aula.id,
    day_index: aula.day_index,
    titulo: aula.titulo,
    descricao: aula.descricao,
    resumo: aula.resumo,
    video_provider: aula.video_provider,
    video_id: aula.video_id,
    unlock_at: aula.unlock_at,
    liberada: aulaLiberada(aula),
    watch_mode: prog?.watch_mode || null,
    watch_confirmado: !!prog?.watch_confirmed_at,
  };
}

export async function GET(request, { params }) {
  const { user, profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });
  try {
    const cohort = await resolveCohort(profile);
    const aula = await carregarAula(params.id, cohort?.id);
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

  try {
    const cohort = await resolveCohort(profile);
    const aula = await carregarAula(params.id, cohort?.id);
    if (!aula) return Response.json({ error: 'aula_nao_encontrada' }, { status: 404 });
    if (!aulaLiberada(aula)) return Response.json({ error: 'aula_bloqueada' }, { status: 403 });

    // Confirma como o aluno assistiu (gate do exercício). Pode ser atualizado
    // depois (ex.: marcou "não assisti" e voltou após ver o replay).
    if (body?.action === 'confirmar_visto') {
      const modo = body?.watch_mode;
      if (!['ao_vivo', 'replay', 'nao_assistiu'].includes(modo)) {
        return Response.json({ error: 'watch_mode_invalido' }, { status: 400 });
      }
      const prog = unwrap(
        await ht
          .from('lesson_progress')
          .upsert(
            {
              user_id: user.id,
              lesson_id: aula.id,
              watch_mode: modo,
              watch_confirmed_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,lesson_id' }
          )
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
