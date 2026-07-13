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

  const full = new URL(request.url).searchParams.get('full') === '1';

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
    const dias = Math.max(0, (nowMs - startMs) / 86400000);
    const mult = Number(settings?.momentum_multiplier || 1);

    // Pontuacao realista: espelha como o aluno pontua de verdade (ficha +50,
    // cada aula concluida +100). Cada persona tem um "ritmo" (seed) que define
    // quantas aulas ela ja assistiu ate hoje — cresce dia a dia (cap 6 aulas).
    // Um terminho continuo pequeno da leve movimento no "ao vivo".
    const scoreOf = (p) => {
      const s = Number(p.seed || 0);
      const ritmo = 0.5 + ((s * 13) % 100) / 110; // ~0.5..1.4 aulas por dia
      const aulasFeitas = Math.min(6, Math.floor(dias * ritmo));
      const fezFicha = s % 5 !== 0 ? 50 : 0; // ~80% preencheu a ficha
      const bonus = (s % 7) * 10; // engajamento extra (0..60)
      const base = Number(p.base_offset || 0) % 40; // leve variacao inicial
      const vivo = Math.round(8 * (0.5 + 0.5 * Math.sin(s * 1.7 + nowMs / 120000)));
      return Math.max(0, Math.round((fezFicha + aulasFeitas * 100 + bonus + base) * mult) + vivo);
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
    const top = lista.slice(0, full ? 200 : 20);

    return Response.json({ top, eu, total_participantes: lista.length });
  } catch (e) {
    console.error('[api/ranking]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
