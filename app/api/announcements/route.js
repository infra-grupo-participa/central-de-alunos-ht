import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Avisos ativos do cohort do aluno, dentro da janela de exibicao.
export async function GET(request) {
  const { profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });

  try {
    let cohortId = profile?.cohort_id || null;
    if (!cohortId) {
      const rows = unwrap(
        await ht
          .from('cohorts')
          .select('id')
          .eq('status', 'ativo')
          .or('is_template.is.null,is_template.eq.false')
          .order('data_inicio', { ascending: false, nullsFirst: false })
          .limit(1)
      );
      cohortId = rows?.[0]?.id || null;
    }
    if (!cohortId) return Response.json([]);

    // Sem milissegundos: evita o '.' quebrar o parser do filtro or() do PostgREST.
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const rows = unwrap(
      await ht
        .from('announcements')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('ativo', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: false })
    );
    return Response.json(rows || []);
  } catch (e) {
    console.error('[api/announcements]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
