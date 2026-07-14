import { isAdmin, requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';
import { fichaFormUrl } from '@/lib/env.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cohort do aluno (via profile) ou fallback: cohort ativo mais recente (nao-template).
async function resolveCohort(profile) {
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

// Retorna o "estado do aluno": profile + cohort + settings + ficha.
export async function GET(request) {
  const { user, profile: existing, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });

  try {
    let profile = existing;
    if (!profile) {
      // Primeiro acesso: cria a linha minima do profile.
      profile = unwrap(
        await ht
          .from('profiles')
          .upsert({ id: user.id, email: user.email || null }, { onConflict: 'id' })
          .select()
          .single()
      );
    }

    profile =
      unwrap(
        await ht
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', user.id)
          .select()
          .maybeSingle()
      ) || profile;

    const cohort = await resolveCohort(profile);

    const settings = cohort
      ? unwrap(await ht.from('settings').select('*').eq('cohort_id', cohort.id).maybeSingle())
      : null;

    let ficha = unwrap(
      await ht.from('ficha_interesse').select('*').eq('user_id', user.id).maybeSingle()
    );
    if (!ficha) {
      ficha = unwrap(
        await ht
          .from('ficha_interesse')
          .upsert({ user_id: user.id, status: 'pendente' }, { onConflict: 'user_id' })
          .select()
          .single()
      );
    }

    return Response.json({
      profile,
      cohort,
      settings,
      ficha,
      ficha_url: fichaFormUrl(user),
      // O front usa isso so pra decidir o que MOSTRAR (aba Metricas). Quem
      // protege os dados de verdade e o requireAdmin nas rotas /api/admin/*.
      is_admin: await isAdmin(user),
    });
  } catch (e) {
    console.error('[api/me]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
