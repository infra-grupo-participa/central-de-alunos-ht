'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/supabase-browser.js';

// Ranking ao vivo: atualiza sozinho a cada 20s (a pontuacao das personas varia
// com o tempo no backend), destacando a posicao do aluno.
export default function Ranking() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let vivo = true;
    const load = () =>
      api('/api/ranking')
        .then((d) => {
          if (vivo) setData(d);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 20000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);

  if (!data || !data.top || data.top.length === 0) return null;

  const { top, eu, total_participantes } = data;
  const euNoTop = top.some((x) => x.eu);

  return (
    <section className="ht-card" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span className="ht-live-dot" />
        <h2 style={{ fontSize: 19, textTransform: 'uppercase' }}>Ranking ao vivo</h2>
        <span style={{ marginLeft: 'auto', color: 'var(--ht-text-muted)', fontSize: 12 }}>
          {total_participantes} participantes
        </span>
      </div>

      <ol className="ht-rank">
        {top.map((x) => (
          <RankRow key={`${x.posicao}-${x.nome}`} x={x} />
        ))}
      </ol>

      {!euNoTop && eu && (
        <>
          <div className="ht-rank-sep">• • •</div>
          <ol className="ht-rank">
            <RankRow x={eu} />
          </ol>
        </>
      )}
    </section>
  );
}

function RankRow({ x }) {
  const medalha = x.posicao === 1 ? '🥇' : x.posicao === 2 ? '🥈' : x.posicao === 3 ? '🥉' : null;
  return (
    <li className={`ht-rank-row ${x.eu ? 'ht-rank-me' : ''}`}>
      <span className="ht-rank-pos">{medalha || `${x.posicao}º`}</span>
      <span className="ht-rank-nome">
        {x.nome}
        {x.eu && <span className="ht-rank-voce">você</span>}
      </span>
      <span className="ht-rank-pts">{x.pontos.toLocaleString('pt-BR')}</span>
    </li>
  );
}
