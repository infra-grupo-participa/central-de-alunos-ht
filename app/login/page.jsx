'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider.jsx';
import Logo from '@/components/Logo.jsx';
import { IcoEmail, IcoSenha, IcoAvancar, IcoErro, IcoWhats } from '@/components/icons.jsx';

// WhatsApp da Secretaria (o mesmo default do servidor; trocavel por env).
const WHATSAPP_SECRETARIA =
  process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/5511999999999';

// Tela de login — simples e direta: o email da compra do ingresso é a chave.
export default function LoginPage() {
  const { session, loading, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [busy, setBusy] = useState(false);

  // Já logado → manda para a Central.
  useEffect(() => {
    if (!loading && session) router.replace('/');
  }, [loading, session, router]);

  async function onSubmit(e) {
    e.preventDefault();
    setErro(null);
    if (!email || !senha) {
      setErro('Preencha e-mail e senha para entrar.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await signIn(email.trim(), senha);
      if (error) {
        setErro('E-mail ou senha incorretos. Use o mesmo e-mail da compra do ingresso.');
        return;
      }
      router.replace('/');
    } catch {
      setErro('Não conseguimos falar com o servidor. Tente novamente em instantes.');
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

      <div className="ht-card" style={{ width: '100%', maxWidth: 440, padding: '34px 30px' }}>
        <h1
          style={{
            fontSize: 'clamp(24px, 5vw, 32px)',
            textTransform: 'uppercase',
            lineHeight: 1.05,
          }}
        >
          Acesse a central de alunos do{' '}
          <span className="ht-accent">Holding Total</span>
        </h1>
        <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, lineHeight: 1.5, marginTop: 12 }}>
          Use o mesmo email da compra do ingresso para acessar
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 10 }}>
          <label className="ht-label" htmlFor="email">
            E-mail
          </label>
          {/* O ícone vem depois do input no DOM de propósito: é o que permite o
              seletor `.ht-input:focus + .ht-ico` acender ele no laranja ao focar. */}
          <div className="ht-field">
            <input
              id="email"
              className="ht-input"
              type="email"
              autoComplete="email"
              placeholder="O e-mail usado na compra"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <IcoEmail size={17} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <label className="ht-label" htmlFor="senha" style={{ flex: 1 }}>
              Senha
            </label>
            <Link
              href="/esqueci-senha"
              style={{ color: 'var(--ht-text-muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="ht-field">
            <input
              id="senha"
              className="ht-input"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha de acesso"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <IcoSenha size={17} />
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
              'Entrando...'
            ) : (
              <>
                Entrar na Central
                <IcoAvancar size={17} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Dobra abaixo: canal direto com a Secretaria */}
      <p style={{ color: 'var(--ht-text-muted)', fontSize: 14, marginTop: 24, textAlign: 'center' }}>
        Dúvidas?{' '}
        <a
          href={WHATSAPP_SECRETARIA}
          target="_blank"
          rel="noreferrer"
          style={{
            color: 'var(--ht-orange)',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <IcoWhats size={15} />
          Fale com a Secretaria
        </a>
      </p>
    </div>
  );
}
