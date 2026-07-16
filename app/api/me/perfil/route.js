import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Dados pessoais editáveis pelo próprio aluno (/perfil). Sanitização no
// servidor: mesmo que o cliente burle a máscara, o dado entra limpo.

const PROFISSOES = ['Advogado(a)', 'Contador(a)', 'Advogado(a) e contador(a)', 'Outra'];
const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR',
  'PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

function limparNome(v) {
  return String(v || '')
    .replace(/[^\p{L}\s'’-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 80);
}

function limparTelefone(v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 11);
  if (d.length < 10) return null;
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

function limparInstagram(v) {
  const s = String(v || '')
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9._]/g, '')
    .slice(0, 30);
  return s ? `@${s}` : null;
}

export async function POST(request) {
  const { user, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  try {
    const nome = limparNome(body?.nome);
    if (!nome) return Response.json({ error: 'nome_obrigatorio' }, { status: 400 });

    const telefone = body?.telefone ? limparTelefone(body.telefone) : null;
    if (body?.telefone && !telefone) {
      return Response.json({ error: 'telefone_invalido' }, { status: 400 });
    }

    const patch = {
      nome,
      telefone,
      profissao: PROFISSOES.includes(body?.profissao) ? body.profissao : null,
      cidade: String(body?.cidade || '').replace(/[^\p{L}\s'’-]/gu, '').trim().slice(0, 60) || null,
      uf: UFS.includes(String(body?.uf || '').toUpperCase()) ? String(body.uf).toUpperCase() : null,
      instagram: limparInstagram(body?.instagram),
      perfil_atualizado_at: new Date().toISOString(),
    };

    const profile = unwrap(
      await ht.from('profiles').update(patch).eq('id', user.id).select().single()
    );
    return Response.json({ ok: true, profile, mensagem: 'Dados atualizados!' });
  } catch (e) {
    console.error('[api/me/perfil]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
