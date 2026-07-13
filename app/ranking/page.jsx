'use client';

import Link from 'next/link';
import Guard from '@/components/Guard.jsx';
import Logo from '@/components/Logo.jsx';
import Ranking from '@/components/Ranking.jsx';

function RankingView() {
  return (
    <div className="ht-hero-glow" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '18px 24px',
          borderBottom: '1px solid var(--ht-border)',
        }}
      >
        <Logo />
        <strong style={{ letterSpacing: '0.12em', fontSize: 14 }}>HOLDING TOTAL</strong>
        <Link
          href="/"
          className="ht-btn ht-btn-ghost"
          style={{ marginLeft: 'auto', padding: '9px 16px', fontSize: 13, textDecoration: 'none' }}
        >
          ← Voltar
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding: '26px 24px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <span className="ht-tag">Classificação da turma</span>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 38px)', textTransform: 'uppercase', marginTop: 12 }}>
            Ranking <span className="ht-accent">ao vivo</span>.
          </h1>
          <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, marginTop: 10 }}>
            Cada aula concluída e cada ação valem pontos. O topo é de quem se move primeiro —
            atualiza sozinho a cada 20 segundos.
          </p>
        </div>

        <Ranking />
      </main>
    </div>
  );
}

export default function RankingPage() {
  return (
    <Guard>
      <RankingView />
    </Guard>
  );
}
