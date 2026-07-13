'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider.jsx';
import Logo from '@/components/Logo.jsx';

// Tela de login — email + senha, na cara da marca HT.
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
        setErro('E-mail ou senha incorretos. Confira e tente de novo — sua vaga te espera.');
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

      <div className="ht-card" style={{ width: '100%', maxWidth: 420, padding: '34px 30px' }}>
        <span className="ht-tag">Central do Aluno</span>
        <h1
          style={{
            fontSize: 'clamp(30px, 6vw, 40px)',
            textTransform: 'uppercase',
            marginTop: 18,
          }}
        >
          Sua central
          <br />
          te <span className="ht-accent">espera</span>.
        </h1>
        <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, lineHeight: 1.5, marginTop: 12 }}>
          Entre agora. Cada dia conta — quem fica de fora, fica para trás.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 10 }}>
          <label className="ht-label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            className="ht-input"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="ht-label" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            className="ht-input"
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha de acesso"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {erro && <p className="ht-error">{erro}</p>}

          <button
            type="submit"
            className="ht-btn ht-btn-primary"
            disabled={busy}
            style={{ width: '100%', marginTop: 22, opacity: busy ? 0.7 : 1 }}
          >
            {busy ? 'Entrando...' : 'Entrar na Central'}
          </button>
        </form>
      </div>

      <p style={{ color: 'var(--ht-text-muted)', fontSize: 13, marginTop: 22, textAlign: 'center' }}>
        Recebeu a senha por e-mail após a compra? É ela que abre essa porta.
      </p>
    </div>
  );
}
