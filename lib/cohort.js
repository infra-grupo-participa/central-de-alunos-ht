import { ht, unwrap } from './htdb.js';

// Cohort do aluno (via profile) ou fallback: cohort ativo mais recente
// (nao-template). Compartilhado pelas rotas de API.
export async function resolveCohort(profile) {
  if (profile?.cohort_id) {
    const c = unwrap(
      await ht.from('cohorts').select('*').eq('id', profile.cohort_id).maybeSingle()
    );
    if (c) return c;
  }
  const rows = unwrap(
    await ht
      .from('cohorts')
      .select('*')
      .eq('status', 'ativo')
      .or('is_template.is.null,is_template.eq.false')
      .order('data_inicio', { ascending: false, nullsFirst: false })
      .limit(1)
  );
  return rows?.[0] || null;
}

export function aulaLiberada(lesson, agora = Date.now()) {
  return !lesson?.unlock_at || new Date(lesson.unlock_at).getTime() <= agora;
}

// Janela de carrinho do aluno: quem respondeu a ficha entra mais cedo.
export function carrinhoDoAluno(cohort, fichaRespondida) {
  if (!cohort) return null;
  const abreAt =
    (fichaRespondida && cohort.carrinho_abre_ficha_at) ||
    cohort.carrinho_abre_at ||
    null;
  return {
    cta_inicio_at: cohort.cta_inicio_at || null,
    abre_at: abreAt,
    aberto: !!abreAt && new Date(abreAt).getTime() <= Date.now(),
    antecipado: !!(fichaRespondida && cohort.carrinho_abre_ficha_at),
    checkout_url: cohort.checkout_url || null,
    whatsapp_url: cohort.whatsapp_url || null,
  };
}
