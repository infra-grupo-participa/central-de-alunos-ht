'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/supabase-browser.js';

// Ranking ao vivo: atualiza sozinho a cada 20s. `compact` = versao pequena da
// home (top 5 + link pro ranking completo); sem ela = pagina /ranking completa.
export default function Ranking({ compact = false }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let vivo = true;
    const url = compact ? '/api/ranking' : '/api/ranking?full=1';
    const load = () =>
      api(url)
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
  }, [compact]);

  if (!data || !data.top || data.top.length === 0) return null;

  const { top, eu, total_participantes } = data;
  const linhas = compact ? top.slice(0, 5) : top;
  const euNasLinhas = linhas.some((x) => x.eu);

  return (
    <section className="ht-card" style={{ padding: compact ? '18px 20px' : '24px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span className="ht-live-dot" />
        <h2 style={{ fontSize: compact ? 16 : 20, textTransform: 'uppercase' }}>Ranking ao vivo</h2>
        <span style={{ marginLeft: 'auto', color: 'var(--ht-text-muted)', fontSize: 12 }}>
          {total_participantes} alunos
        </span>
      </div>

      <ol className="ht-rank">
        {linhas.map((x) => (
          <RankRow key={`${x.posicao}-${x.nome}`} x={x} />
        ))}
      </ol>

      {!euNasLinhas && eu && (
        <>
          <div className="ht-rank-sep">• • •</div>
          <ol className="ht-rank">
            <RankRow x={eu} />
          </ol>
        </>
      )}

      {compact && (
        <Link
          href="/ranking"
          className="ht-btn ht-btn-ghost"
          style={{ width: '100%', marginTop: 14, textDecoration: 'none', fontSize: 14 }}
        >
          Ver ranking completo →
        </Link>
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
