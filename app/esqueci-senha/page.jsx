'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider.jsx';
import Logo from '@/components/Logo.jsx';
import { IcoEmail, IcoErro, IcoCheck, IcoVoltar } from '@/components/icons.jsx';

// Pedido de recuperacao: manda o e-mail com o link que abre /redefinir-senha.
export default function EsqueciSenhaPage() {
  const { resetSenha } = useAuth();
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErro(null);
    if (!email.trim()) {
      setErro('Digite o e-mail que você usa para entrar na Central.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await resetSenha(email.trim());
      // De proposito NAO dizemos se o e-mail existe ou nao: isso entregaria a
      // base de alunos pra quem ficasse testando endereços na tela de login.
      if (error && error.status !== 400) {
        setErro('Não conseguimos enviar agora. Tente novamente em alguns minutos.');
        return;
      }
      setEnviado(true);
    } catch {
      setErro('Não conseguimos falar com o servidor. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="ht-hero-glow"
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Logo size={42} />
        <strong style={{ letterSpacing: '0.12em', fontSize: 15 }}>HOLDING TOTAL</strong>
      </div>

      <div className="ht-card" style={{ width: '100%', maxWidth: 420, padding: '34px 30px' }}>
        <span className="ht-tag">Recuperar acesso</span>

        {enviado ? (
          <>
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 34px)', textTransform: 'uppercase', marginTop: 18 }}>
              Verifique seu <span className="ht-accent">e-mail</span>.
            </h1>
            <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, lineHeight: 1.5, marginTop: 12 }}>
              Se <strong>{email.trim()}</strong> estiver cadastrado, o link para criar uma nova senha
              já está a caminho. Ele vale por 1 hora — confira também a caixa de spam.
            </p>
            <Link
              href="/login"
              className="ht-btn ht-btn-ghost"
              style={{ width: '100%', marginTop: 22, textDecoration: 'none' }}
            >
              <IcoVoltar size={16} />
              Voltar para o login
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 34px)', textTransform: 'uppercase', marginTop: 18 }}>
              Esqueceu a <span className="ht-accent">senha</span>?
            </h1>
            <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, lineHeight: 1.5, marginTop: 12 }}>
              Sem problema. Informe seu e-mail e enviamos um link para você criar uma nova.
            </p>

            <form onSubmit={onSubmit} style={{ marginTop: 10 }}>
              <label className="ht-label" htmlFor="email">
                E-mail
              </label>
              <div className="ht-field">
                <input
                  id="email"
                  className="ht-input"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <IcoEmail size={17} />
              </div>

              {erro && (
                <p className="ht-error">
                  <IcoErro size={16} />
                  {erro}
                </p>
              )}

              <button
                type="submit"
                className="ht-btn ht-btn-primary"
                disabled={busy}
                style={{ width: '100%', marginTop: 22, opacity: busy ? 0.7 : 1 }}
              >
                {busy ? (
                  'Enviando...'
                ) : (
                  <>
                    <IcoCheck size={17} strokeWidth={2.5} />
                    Enviar link de recuperação
                  </>
                )}
              </button>
            </form>

            <Link
              href="/login"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: 18,
                color: 'var(--ht-text-muted)',
                fontSize: 13,
              }}
            >
              Lembrei minha senha — voltar ao login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
