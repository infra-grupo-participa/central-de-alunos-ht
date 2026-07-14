'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider.jsx';
import { useMe } from '@/components/MeProvider.jsx';
import { api } from '@/lib/supabase-browser.js';
import Logo from '@/components/Logo.jsx';
import Splash from '@/components/Splash.jsx';
import { IcoSenha, IcoCheck, IcoErro, IcoVoltar } from '@/components/icons.jsx';

// Destino do link do e-mail. O supabase-js le o token que veio na URL e cria a
// sessao sozinho (detectSessionInUrl) — aqui so esperamos essa sessao aparecer.
// Esta pagina fica FORA do Guard de proposito: quem chega aqui pode estar com
// must_change_password=true e seria jogado pra /trocar-senha antes de conseguir
// definir a senha nova.
export default function RedefinirSenhaPage() {
  const { session, loading } = useAuth();
  const { refresh } = useMe();
  const router = useRouter();

  const [linkInvalido, setLinkInvalido] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [erro, setErro] = useState(null);
  const [busy, setBusy] = useState(false);

  // O Supabase devolve falha de link (expirado/ja usado) no hash da URL.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hash.get('error')) setLinkInvalido(true);
  }, []);

  // Sem sessao depois que o Auth terminou de carregar = link invalido. A janela
  // extra existe porque a leitura do token da URL termina logo DEPOIS do
  // getSession inicial — declarar invalido na hora daria falso negativo.
  useEffect(() => {
    if (loading || session) return undefined;
    const t = setTimeout(() => setLinkInvalido(true), 3000);
    return () => clearTimeout(t);
  }, [loading, session]);

  async function onSubmit(e) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 8) {
      setErro('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (senha !== confirma) {
      setErro('As senhas não conferem. Digite a mesma senha nos dois campos.');
      return;
    }
    setBusy(true);
    try {
      // Mesma rota do primeiro acesso: troca a senha e libera o must_change_password.
      await api('/api/me/senha', { method: 'POST', body: JSON.stringify({ nova_senha: senha }) });
      await refresh();
      router.replace('/');
    } catch {
      setErro('Não foi possível salvar a nova senha. Peça um novo link e tente de novo.');
    } finally {
      setBusy(false);
    }
  }

  if (!linkInvalido && (loading || !session)) return <Splash />;

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
        {linkInvalido ? (
          <>
            <span className="ht-tag">Link expirado</span>
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 34px)', textTransform: 'uppercase', marginTop: 18 }}>
              Esse link não <span className="ht-accent">vale mais</span>.
            </h1>
            <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, lineHeight: 1.5, marginTop: 12 }}>
              Links de recuperação expiram em 1 hora e só funcionam uma vez. Peça um novo — leva 10
              segundos.
            </p>
            <Link
              href="/esqueci-senha"
              className="ht-btn ht-btn-primary"
              style={{ width: '100%', marginTop: 22, textDecoration: 'none' }}
            >
              Pedir um novo link
            </Link>
            <Link
              href="/login"
              className="ht-btn ht-btn-ghost"
              style={{ width: '100%', marginTop: 10, textDecoration: 'none' }}
            >
              <IcoVoltar size={16} />
              Voltar para o login
            </Link>
          </>
        ) : (
          <>
            <span className="ht-tag">Nova senha</span>
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 34px)', textTransform: 'uppercase', marginTop: 18 }}>
              Defina sua <span className="ht-accent">nova senha</span>.
            </h1>
            <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, lineHeight: 1.5, marginTop: 12 }}>
              Escolha uma senha nova e já entramos na Central com ela.
            </p>

            <form onSubmit={onSubmit} style={{ marginTop: 10 }}>
              <label className="ht-label" htmlFor="nova-senha">
                Nova senha
              </label>
              <div className="ht-field">
                <input
                  id="nova-senha"
                  className="ht-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <IcoSenha size={17} />
              </div>

              <label className="ht-label" htmlFor="confirma-senha">
                Confirme a nova senha
              </label>
              <div className="ht-field">
                <input
                  id="confirma-senha"
                  className="ht-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
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
                  'Salvando...'
                ) : (
                  <>
                    <IcoCheck size={17} strokeWidth={2.5} />
                    Salvar e entrar
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
