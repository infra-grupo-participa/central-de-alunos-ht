import { requireAdmin } from '@/lib/auth.js';
import { carregarBase, resumoPorAluno } from '@/lib/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ORDENS = {
  // Padrao: quem esta mais atras primeiro — a lista existe pra cobrar.
  engajamento: (a, b) =>
    a.aulas_concluidas - b.aulas_concluidas || a.minutos_assistidos - b.minutos_assistidos,
  pontos: (a, b) => b.pontos - a.pontos,
  recente: (a, b) => (b.last_seen_at || '').localeCompare(a.last_seen_at || ''),
  nome: (a, b) => (a.nome || a.email || '').localeCompare(b.nome || b.email || ''),
};

// Lista aluno a aluno (drill-down do painel). Suporta busca por nome/email,
// filtro por situacao e ordenacao.
export async function GET(request) {
  const { unauthorized, forbidden } = await requireAdmin(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });
  if (forbidden) return Response.json({ error: 'sem_permissao' }, { status: 403 });

  const url = new URL(request.url);
  const busca = (url.searchParams.get('q') || '').trim().toLowerCase();
  const filtro = url.searchParams.get('filtro') || 'todos';
  const ordem = ORDENS[url.searchParams.get('ordem')] || ORDENS.engajamento;

  try {
    const base = await carregarBase();
    let alunos = resumoPorAluno(base);

    if (busca) {
      alunos = alunos.filter(
        (a) =>
          (a.email || '').toLowerCase().includes(busca) ||
          (a.nome || '').toLowerCase().includes(busca)
      );
    }

    if (filtro === 'nunca_acessaram') alunos = alunos.filter((a) => !a.last_seen_at);
    else if (filtro === 'sem_ficha') alunos = alunos.filter((a) => a.ficha_status !== 'respondida');
    else if (filtro === 'sem_aula') alunos = alunos.filter((a) => a.aulas_concluidas === 0);

    alunos.sort(ordem);

    return Response.json({ total: alunos.length, alunos });
  } catch (e) {
    console.error('[api/admin/alunos]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
