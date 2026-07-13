'use client';

import Guard from '@/components/Guard.jsx';
import Navbar from '@/components/Navbar.jsx';
import Aulas from '@/components/Aulas.jsx';

function AulasView() {
  return (
    <div className="ht-hero-glow" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 820,
          margin: '0 auto',
          padding: '26px 24px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <span className="ht-tag">Sua jornada</span>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 38px)', textTransform: 'uppercase', marginTop: 12 }}>
            Aulas<span className="ht-accent">.</span>
          </h1>
          <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, marginTop: 10 }}>
            Uma aula por dia, no ritmo certo. Assista até o fim, marque como concluída e garanta
            seus pontos — quem avança primeiro lidera o ranking.
          </p>
        </div>

        <Aulas />
      </main>
    </div>
  );
}

export default function AulasPage() {
  return (
    <Guard>
      <AulasView />
    </Guard>
  );
}
