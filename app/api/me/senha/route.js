import { requireAuth } from '@/lib/auth.js';
import { ht, unwrap } from '@/lib/htdb.js';
import { supabaseAdmin } from '@/lib/supabase-admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Troca a senha do aluno e libera o acesso (must_change_password = false).
export async function POST(request) {
  const { user, unauthorized } = await requireAuth(request);
  if (unauthorized) return Response.json({ error: 'nao_autenticado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const novaSenha = String(body?.nova_senha || '');
  if (novaSenha.length < 8) {
    return Response.json(
      {
        error: 'senha_invalida',
        mensagem: 'A nova senha precisa ter pelo menos 8 caracteres.',
      },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: novaSenha,
    });
    if (error) {
      console.error('[api/me/senha]', error);
      return Response.json(
        {
          error: 'erro_ao_trocar_senha',
          mensagem: 'Não foi possível trocar a senha. Tente novamente.',
        },
        { status: 400 }
      );
    }
    unwrap(
      await ht.from('profiles').update({ must_change_password: false }).eq('id', user.id)
    );
    return Response.json({ ok: true, mensagem: 'Senha atualizada. Bem-vindo à Central.' });
  } catch (e) {
    console.error('[api/me/senha]', e);
    return Response.json({ error: 'erro_interno' }, { status: 500 });
  }
}
