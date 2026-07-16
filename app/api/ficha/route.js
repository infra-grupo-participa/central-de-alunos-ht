import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';
import { resolveCohort, aulaLiberada } from '@/lib/cohort.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PONTOS_FICHA = 50;

// Ficha de interesse do Holding Masters — formulário INTERNO da Central.
// Estrutura básica (a copy final das perguntas vem depois); as respostas ficam
// em jsonb, então trocar as perguntas não exige migração.
// Liberação: a partir da Aula 4 (quando ela abre às 08h).
const FICHA_LIBERA_NA_AULA = 4;

async function fichaLiberada(profile) {
  const cohort = await resolveCohort(profile);
  if (!cohort) return false;
  const rows = unwrap(
    await ht
      .from('lessons')
      .select('unlock_at')
      .eq('cohort_id', cohort.id)
      .eq('ativo', true)
      .eq('day_index', FICHA_LIBERA_NA_AULA)
      .limit(1)
  );
  const aula = rows?.[0];
  return aula ? aulaLiberada(aula) : false;
}

export async function GET(request) {
  const { user, profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });
  try {
    const ficha = unwrap(
      await ht.from('ficha_interesse').select('*').eq('user_id', user.id).maybeSingle()
    );
    return Response.json({
      status: ficha?.status || 'pendente',
      respostas: ficha?.respostas || {},
      respondida_at: ficha?.respondida_at || null,
      liberada: await fichaLiberada(profile),
    });
  } catch (e) {
    console.error('[api/ficha GET]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  try {
    if (!(await fichaLiberada(profile))) {
      return Response.json({ error: 'ficha_ainda_nao_liberada' }, { status: 403 });
    }

    const respostas = body?.respostas && typeof body.respostas === 'object' ? body.respostas : {};
    const existente = unwrap(
      await ht.from('ficha_interesse').select('*').eq('user_id', user.id).maybeSingle()
    );
    const jaRespondida = existente?.status === 'respondida';

    unwrap(
      await ht
        .from('ficha_interesse')
        .upsert(
          {
            user_id: user.id,
            status: 'respondida',
            respostas,
            respondida_at: existente?.respondida_at || new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single()
    );

    // Enriquecimento: nome/telefone informados na ficha alimentam o profile
    // (sem sobrescrever com vazio).
    const patchPerfil = {};
    if (String(respostas?.nome || '').trim()) patchPerfil.nome = String(respostas.nome).trim().slice(0, 80);
    if (String(respostas?.telefone || '').trim()) patchPerfil.telefone = String(respostas.telefone).trim().slice(0, 20);
    if (Object.keys(patchPerfil).length) {
      unwrap(await ht.from('profiles').update(patchPerfil).eq('id', user.id).select('id').maybeSingle());
    }

    // Credita os pontos da ficha uma única vez.
    let pontos = 0;
    if (!jaRespondida) {
      const credito = unwrap(
        await ht
          .from('points_ledger')
          .select('id')
          .eq('user_id', user.id)
          .eq('source', 'ficha')
          .limit(1)
          .maybeSingle()
      );
      if (!credito) {
        unwrap(
          await ht
            .from('points_ledger')
            .insert({ user_id: user.id, source: 'ficha', points: PONTOS_FICHA })
        );
        pontos = PONTOS_FICHA;
      }
    }

    return Response.json({
      ok: true,
      pontos_creditados: pontos,
      mensagem: 'Ficha registrada. Seu carrinho abre 15 minutos antes de todo mundo.',
    });
  } catch (e) {
    console.error('[api/ficha POST]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
