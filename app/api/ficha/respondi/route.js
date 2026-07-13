import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Aluno declara que respondeu a ficha de interesse. Credita +50 pts uma unica vez.
export async function POST(request) {
  const { user, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });

  try {
    const existente = unwrap(
      await ht.from('ficha_interesse').select('*').eq('user_id', user.id).maybeSingle()
    );
    const jaRespondida = existente?.status === 'respondida';
    const respondidaAt = existente?.respondida_at || new Date().toISOString();

    const ficha = unwrap(
      await ht
        .from('ficha_interesse')
        .upsert(
          { user_id: user.id, status: 'respondida', respondida_at: respondidaAt },
          { onConflict: 'user_id' }
        )
        .select()
        .single()
    );

    let pontos = 0;
    if (!jaRespondida) {
      // Guarda contra credito duplicado: so credita se ainda nao houver linha 'ficha'.
      const existentePts = unwrap(
        await ht
          .from('points_ledger')
          .select('id')
          .eq('user_id', user.id)
          .eq('source', 'ficha')
          .limit(1)
          .maybeSingle()
      );
      if (!existentePts) {
        unwrap(
          await ht.from('points_ledger').insert({ user_id: user.id, source: 'ficha', points: 50 })
        );
        pontos = 50;
      }
    }

    return Response.json({
      ok: true,
      ficha,
      pontos_creditados: pontos,
      mensagem: pontos
        ? 'Ficha registrada! Você garantiu +50 pontos.'
        : 'Ficha já estava registrada.',
    });
  } catch (e) {
    console.error('[api/ficha/respondi]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
