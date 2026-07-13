'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo.jsx';
import { IcoAvancar } from '@/components/icons.jsx';

// Landing pública (teaser do Épico 0), preservada em /bem-vindo.
export default function BemVindoPage() {
  const [health, setHealth] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline' }));
  }, []);

  return (
    <div
      className="ht-hero-glow"
      style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '22px 28px',
        }}
      >
        <Logo />
        <strong style={{ letterSpacing: '0.12em', fontSize: 14 }}>HOLDING TOTAL</strong>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 28px',
          maxWidth: 760,
        }}
      >
        <span className="ht-tag" style={{ alignSelf: 'flex-start', marginBottom: 22 }}>
          Central do Aluno
        </span>
        <h1 style={{ fontSize: 'clamp(40px, 8vw, 78px)', textTransform: 'uppercase' }}>
          Sua jornada
          <br />
          começa <span className="ht-accent">aqui</span>.
        </h1>
        <p
          style={{
            color: 'var(--ht-text-dim)',
            fontSize: 18,
            lineHeight: 1.5,
            marginTop: 20,
            maxWidth: 540,
          }}
        >
          Aulas liberadas dia a dia, deveres, ranking ao vivo e tudo que você
          precisa para não ficar para trás nesta semana. Prepare-se.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 34 }}>
          <button className="ht-btn ht-btn-primary" onClick={() => router.push('/login')}>
            Entrar na Central
            <IcoAvancar size={17} />
          </button>
          <button className="ht-btn ht-btn-ghost">Como funciona</button>
        </div>
      </main>

      <footer
        style={{
          padding: '18px 28px',
          color: 'var(--ht-text-muted)',
          fontSize: 13,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: health?.status === 'ok' ? 'var(--ht-success)' : 'var(--ht-text-muted)',
          }}
        />
        API: {health ? health.status : '...'}
        {health?.db ? ` · DB: ${health.db}` : ''}
      </footer>
    </div>
  );
}
