import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';
import { fichaFormUrl } from '@/lib/env.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Registra que o aluno FOI preencher a ficha (carimba iniciada_at na 1a vez e
// conta cada abertura). Garante que sabemos quando ele passou pra preencher.
export async function POST(request) {
  const { user, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });
  try {
    const existente = unwrap(
      await ht.from('ficha_interesse').select('*').eq('user_id', user.id).maybeSingle()
    );
    const ficha = unwrap(
      await ht
        .from('ficha_interesse')
        .upsert(
          {
            user_id: user.id,
            status: existente?.status || 'pendente',
            iniciada_at: existente?.iniciada_at || new Date().toISOString(),
            aberturas: (existente?.aberturas || 0) + 1,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single()
    );
    return Response.json({ ok: true, url: fichaFormUrl(user), ficha });
  } catch (e) {
    console.error('[api/ficha/iniciar]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
