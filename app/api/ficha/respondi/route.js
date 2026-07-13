import { requireAuth } from '@/lib/auth.js';
import { query, one } from '@/lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Aluno declara que respondeu a ficha de interesse. Credita +50 pts uma unica vez.
export async function POST(request) {
  const { user, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });

  try {
    const existente = await one('select * from ht.ficha_interesse where user_id = $1', [user.id]);
    const jaRespondida = existente?.status === 'respondida';

    const ficha = await one(
      `insert into ht.ficha_interesse (user_id, status, respondida_at)
       values ($1, 'respondida', now())
       on conflict (user_id) do update
         set status = 'respondida',
             respondida_at = coalesce(ficha_interesse.respondida_at, now())
       returning *`,
      [user.id]
    );

    let pontos = 0;
    if (!jaRespondida) {
      // Dupla guarda contra credito duplicado (corrida entre requisicoes).
      const credito = await query(
        `insert into ht.points_ledger (user_id, source, points)
         select $1, 'ficha', 50
          where not exists (
            select 1 from ht.points_ledger where user_id = $1 and source = 'ficha'
          )
         returning points`,
        [user.id]
      );
      pontos = credito.length ? 50 : 0;
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
