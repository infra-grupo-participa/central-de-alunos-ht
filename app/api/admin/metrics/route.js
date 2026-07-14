import { requireAdmin } from '@/lib/auth.js';
import { carregarBase, resumoPorAluno } from '@/lib/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HORA = 3600 * 1000;

function media(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Metricas internas da turma ativa: funil de alunos, engajamento aula a aula e
// ficha de interesse. Numeros reais (nada do ranking manipulado entra aqui).
export async function GET(request) {
  const { unauthorized, forbidden } = await requireAdmin(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });
  if (forbidden) return Response.json({ error: 'sem_permissao' }, { status: 403 });

  try {
    const base = await carregarBase();
    const { cohort, alunos, aulas, progresso } = base;
    const resumo = resumoPorAluno(base);
    const total = alunos.length;
    const agora = Date.now();
    const desde = (h) => agora - h * HORA;

    const visto = (a) => (a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0);

    const funil = {
      total_alunos: total,
      primeiro_acesso_feito: resumo.filter((a) => a.primeiro_acesso_feito).length,
      nunca_acessaram: resumo.filter((a) => !a.last_seen_at).length,
      ativos_24h: resumo.filter((a) => visto(a) >= desde(24)).length,
      ativos_7d: resumo.filter((a) => visto(a) >= desde(24 * 7)).length,
      // Ja entrou alguma vez, mas sumiu ha mais de 48h — o alvo da recuperacao.
      sumidos_48h: resumo.filter((a) => a.last_seen_at && visto(a) < desde(48)).length,
      concluiram_tudo_liberado: 0, // preenchido abaixo (depende do drip)
    };

    // Engajamento por aula. `abriram` = tem linha de progresso; `assistindo` =
    // rodou o video mas ainda nao bateu o minimo; `concluiram` = completed_at.
    const porAula = aulas.map((aula) => {
      const min = aula.min_watch_seconds || 2700;
      const liberada = !aula.unlock_at || new Date(aula.unlock_at).getTime() <= agora;
      const linhas = progresso.filter((p) => p.lesson_id === aula.id);
      const concluidas = linhas.filter((p) => p.completed_at);
      const notas = linhas.map((p) => p.rating).filter((r) => r > 0);
      const minutos = linhas.map((p) => (p.watched_seconds || 0) / 60);

      return {
        id: aula.id,
        day_index: aula.day_index,
        titulo: aula.titulo,
        unlock_at: aula.unlock_at,
        liberada,
        min_watch_minutes: Math.round(min / 60),
        abriram: linhas.length,
        assistindo: linhas.filter((p) => !p.completed_at && (p.watched_seconds || 0) > 0).length,
        concluiram: concluidas.length,
        // Sobre o total de alunos: e a taxa que o time interno cobra.
        taxa_conclusao: total ? Math.round((concluidas.length / total) * 100) : 0,
        minutos_medios: Math.round(media(minutos)),
        nota_media: notas.length ? Number(media(notas).toFixed(1)) : null,
        avaliacoes: notas.length,
      };
    });

    const liberadas = porAula.filter((a) => a.liberada);
    funil.concluiram_tudo_liberado = liberadas.length
      ? resumo.filter((a) => a.aulas_concluidas >= liberadas.length).length
      : 0;

    const ficha = {
      respondida: resumo.filter((a) => a.ficha_status === 'respondida').length,
      abriu_sem_responder: resumo.filter((a) => a.ficha_abriu && a.ficha_status !== 'respondida')
        .length,
      nao_abriu: resumo.filter((a) => !a.ficha_abriu && a.ficha_status !== 'respondida').length,
      taxa_resposta: total
        ? Math.round((resumo.filter((a) => a.ficha_status === 'respondida').length / total) * 100)
        : 0,
    };

    return Response.json({
      cohort: cohort ? { id: cohort.id, nome: cohort.nome, data_inicio: cohort.data_inicio } : null,
      atualizado_em: new Date().toISOString(),
      funil,
      aulas: porAula,
      aulas_liberadas: liberadas.length,
      ficha,
    });
  } catch (e) {
    console.error('[api/admin/metrics]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
