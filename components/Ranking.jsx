'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/supabase-browser.js';
import { IcoTrofeu, IcoMedalha, IcoReticencias, IcoAvancar } from '@/components/icons.jsx';

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
          <div className="ht-rank-sep">
            <IcoReticencias size={20} />
          </div>
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
          Ver ranking completo
          <IcoAvancar size={16} />
        </Link>
      )}
    </section>
  );
}

// Pódio: troféu no 1º, medalha no 2º e 3º, cada um no seu metal. Do 4º em diante,
// só o número — o destaque tem que ficar em quem está na frente.
function Podio({ posicao }) {
  if (posicao === 1) return <IcoTrofeu size={19} className="ht-rank-1" aria-label="1º lugar" />;
  if (posicao === 2) return <IcoMedalha size={19} className="ht-rank-2" aria-label="2º lugar" />;
  if (posicao === 3) return <IcoMedalha size={19} className="ht-rank-3" aria-label="3º lugar" />;
  return <>{posicao}º</>;
}

function RankRow({ x }) {
  return (
    <li className={`ht-rank-row ${x.eu ? 'ht-rank-me' : ''}`}>
      <span className="ht-rank-pos">
        <Podio posicao={x.posicao} />
      </span>
      <span className="ht-rank-nome">
        {x.nome}
        {x.eu && <span className="ht-rank-voce">você</span>}
      </span>
      <span className="ht-rank-pts">{x.pontos.toLocaleString('pt-BR')}</span>
    </li>
  );
}
