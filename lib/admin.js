import { env } from './env.js';
import { ht, unwrap, selectAll } from './htdb.js';

// Camada de leitura do painel de metricas. As duas rotas de admin (/metrics e
// /alunos) partem da MESMA base, entao os numeros do topo e a lista batem.

// Cohort ativo (mesma regra usada nas rotas do aluno: o mais recente que nao e
// template). O painel sempre olha a turma que esta rodando agora.
export async function cohortAtivo() {
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

// Quem NAO conta como aluno: os admins. Sem isso, o acesso do time interno
// entraria no funil como "aluno que nunca assistiu" e sujaria toda metrica.
async function idsDeAdmins() {
  const linhas = await selectAll('admins', 'user_id');
  return new Set((linhas || []).map((a) => a.user_id));
}

function ehAdmin(profile, adminIds) {
  return (
    adminIds.has(profile.id) ||
    env.adminEmails.includes((profile.email || '').toLowerCase())
  );
}

// Base completa do painel, em 5 leituras. Os alunos sao TODOS os profiles nao
// admin: matricular no cohort e responsabilidade do provisionamento, e um aluno
// com cohort_id nulo (importado por CSV, por ex.) ainda precisa aparecer no
// funil em vez de sumir da conta.
export async function carregarBase() {
  const cohort = await cohortAtivo();

  const [profiles, adminIds] = await Promise.all([
    selectAll('profiles', 'id, email, nome, telefone, cohort_id, must_change_password, last_seen_at, created_at'),
    idsDeAdmins(),
  ]);

  const alunos = (profiles || []).filter((p) => !ehAdmin(p, adminIds));

  const aulas = cohort
    ? await selectAll('lessons', 'id, day_index, ordem, titulo, unlock_at, pontos, min_watch_seconds', (q) =>
        q.eq('cohort_id', cohort.id).eq('ativo', true).order('day_index', { ascending: true })
      )
    : [];

  const idsAulas = new Set(aulas.map((a) => a.id));

  const [progressoTodo, fichas, pontos] = await Promise.all([
    selectAll('lesson_progress', 'user_id, lesson_id, opened_at, watched_seconds, completed_at, rating'),
    selectAll('ficha_interesse', 'user_id, status, iniciada_at, respondida_at, aberturas'),
    selectAll('points_ledger', 'user_id, points'),
  ]);

  // So interessa o progresso das aulas da turma ativa (turmas antigas ficam de fora).
  const progresso = progressoTodo.filter((p) => idsAulas.has(p.lesson_id));

  return { cohort, alunos, aulas, progresso, fichas, pontos };
}

// Um aluno so conta como "assistindo" se de fato rodou o video; e so conta como
// concluido pelo completed_at (que a rota da aula so grava com o tempo minimo).
export function resumoPorAluno(base) {
  const { alunos, progresso, fichas, pontos } = base;

  const progPorAluno = new Map();
  for (const p of progresso) {
    const lista = progPorAluno.get(p.user_id) || [];
    lista.push(p);
    progPorAluno.set(p.user_id, lista);
  }

  const fichaPorAluno = new Map((fichas || []).map((f) => [f.user_id, f]));

  const pontosPorAluno = new Map();
  for (const l of pontos || []) {
    pontosPorAluno.set(l.user_id, (pontosPorAluno.get(l.user_id) || 0) + (l.points || 0));
  }

  return alunos.map((a) => {
    const prog = progPorAluno.get(a.id) || [];
    const ficha = fichaPorAluno.get(a.id) || null;
    return {
      id: a.id,
      nome: a.nome || null,
      email: a.email,
      telefone: a.telefone || null,
      primeiro_acesso_feito: a.must_change_password === false,
      last_seen_at: a.last_seen_at || null,
      created_at: a.created_at || null,
      aulas_abertas: prog.length,
      aulas_concluidas: prog.filter((p) => p.completed_at).length,
      minutos_assistidos: Math.round(
        prog.reduce((acc, p) => acc + (p.watched_seconds || 0), 0) / 60
      ),
      pontos: pontosPorAluno.get(a.id) || 0,
      ficha_status: ficha?.status || 'pendente',
      ficha_abriu: !!ficha?.iniciada_at,
    };
  });
}
