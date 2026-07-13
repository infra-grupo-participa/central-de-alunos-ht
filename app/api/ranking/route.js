import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveCohort(profile) {
  if (profile?.cohort_id) {
    const c = unwrap(
      await ht.from('cohorts').select('id, data_inicio').eq('id', profile.cohort_id).maybeSingle()
    );
    if (c) return c;
  }
  const rows = unwrap(
    await ht
      .from('cohorts')
      .select('id, data_inicio')
      .eq('status', 'ativo')
      .or('is_template.is.null,is_template.eq.false')
      .order('data_inicio', { ascending: false, nullsFirst: false })
      .limit(1)
  );
  return rows?.[0] || null;
}

// Ranking "ao vivo": personas fake com pontuacao deterministica que cresce com o
// tempo (curva) + oscilacao lenta (da vida ao ranking a cada atualizacao), mais o
// aluno real com seus pontos de verdade (points_ledger). Ver Epico 5.
export async function GET(request) {
  const { user, profile, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });

  try {
    const cohort = await resolveCohort(profile);
    if (!cohort) return Response.json({ top: [], eu: null, total_participantes: 0 });

    const personas = unwrap(
      await ht
        .from('fake_personas')
        .select('nome, seed, base_offset, curve_bias')
        .eq('cohort_id', cohort.id)
    );
    const settings = unwrap(
      await ht.from('settings').select('momentum_multiplier').eq('cohort_id', cohort.id).maybeSingle()
    );
    const pts = unwrap(await ht.from('points_ledger').select('points').eq('user_id', user.id));

    const nowMs = Date.now();
    const startMs = cohort.data_inicio ? new Date(cohort.data_inicio).getTime() : nowMs;
    const elapsedH = Math.max(0, (nowMs - startMs) / 3600000);
    const mult = Number(settings?.momentum_multiplier || 1);

    const scoreOf = (p) => {
      const s = Number(p.seed || 0);
      const growth = Number(p.base_offset || 0) + Number(p.curve_bias || 0) * elapsedH * mult;
      const wobble = 16 * Math.sin(s * 0.7 + elapsedH * 0.5) + 10 * Math.sin(s * 2.3 + nowMs / 90000);
      return Math.max(0, Math.round(growth + wobble));
    };

    const lista = (personas || []).map((p) => ({ nome: p.nome, pontos: scoreOf(p), eu: false }));

    const meusPontos = (pts || []).reduce((acc, r) => acc + (r.points || 0), 0);
    const meuNome =
      profile?.nome || (profile?.email || 'Você').split('@')[0].replace(/\./g, ' ');
    lista.push({ nome: meuNome, pontos: meusPontos, eu: true });

    lista.sort((a, b) => b.pontos - a.pontos);
    lista.forEach((x, i) => {
      x.posicao = i + 1;
    });

    const eu = lista.find((x) => x.eu) || null;
    const top = lista.slice(0, 20);

    return Response.json({ top, eu, total_participantes: lista.length });
  } catch (e) {
    console.error('[api/ranking]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
