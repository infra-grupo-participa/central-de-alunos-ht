'use client';

import { useEffect, useMemo, useState } from 'react';
import { pad2, splitCountdown } from '@/lib/format.js';
import { IcoBloqueada, IcoConcluida, IcoRelogio, IcoYoutube } from '@/components/icons.jsx';

// Thumbnail oficial do YouTube — o vídeo não é mais embedado: o card leva
// direto pro YouTube, e a thumb mantém a página visualmente rica.
export function youtubeThumb(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeUrl(videoId) {
  return `https://youtu.be/${videoId}`;
}

function rotuloLiberacao(unlockAt) {
  if (!unlockAt) return 'Em breve';
  const d = new Date(unlockAt);
  const dia = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(d);
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(d);
  return `${dia} · ${hora}`;
}

// Timer entre aulas: contagem até a próxima aula ainda bloqueada.
function TimerProximaAula({ aulas }) {
  const proxima = useMemo(
    () =>
      (aulas || [])
        .filter((a) => !a.liberada && a.unlock_at)
        .sort((a, b) => new Date(a.unlock_at) - new Date(b.unlock_at))[0] || null,
    [aulas]
  );
  const [agora, setAgora] = useState(null);

  useEffect(() => {
    if (!proxima) return undefined;
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [proxima]);

  if (!proxima || agora === null) return null;
  const ms = new Date(proxima.unlock_at).getTime() - agora;
  if (ms <= 0) return null;
  const { dias, horas, minutos, segundos } = splitCountdown(ms);

  return (
    <span className="ht-crono-timer">
      <IcoRelogio size={14} />
      Aula {proxima.day_index} libera em{' '}
      <strong>
        {dias > 0 ? `${dias}d ` : ''}
        {pad2(horas)}:{pad2(minutos)}:{pad2(segundos)}
      </strong>
    </span>
  );
}

// Cronograma de aulas: só as thumbnails, alinhadas horizontalmente.
// Liberada → abre no YouTube. Bloqueada → thumb borrada + cadeado, e a aula só
// abre às 08h do dia dela.
export default function Cronograma({ aulas }) {
  if (!aulas || aulas.length === 0) return null;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 34px)', textTransform: 'uppercase' }}>
          Cronograma de aulas<span className="ht-accent">.</span>
        </h1>
        <span style={{ marginLeft: 'auto' }}>
          <TimerProximaAula aulas={aulas} />
        </span>
      </div>
      <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, margin: '0 0 16px', maxWidth: 640 }}>
        Uma aula por dia, liberada às <strong style={{ color: 'var(--ht-orange)' }}>08h</strong>. Clique na
        aula para assistir no YouTube — e volte aqui para executar o exercício do dia.
      </p>

      <div className="ht-crono">
        {aulas.map((a) =>
          a.liberada ? (
            <a
              key={a.id}
              className="ht-crono-card"
              href={youtubeUrl(a.video_id)}
              target="_blank"
              rel="noreferrer"
              title={`Assistir no YouTube: ${a.titulo}`}
            >
              <span className="ht-crono-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={youtubeThumb(a.video_id)} alt={a.titulo} loading="lazy" />
                <span className="ht-crono-play">
                  <IcoYoutube size={26} />
                </span>
                {a.concluida && (
                  <span className="ht-crono-ok" title="Exercício concluído">
                    <IcoConcluida size={15} />
                  </span>
                )}
              </span>
              <span className="ht-crono-info">
                <strong>Aula {a.day_index}</strong>
                <small>{a.titulo.replace(/^Aula \d+\s*[-—]\s*/, '')}</small>
              </span>
            </a>
          ) : (
            <div key={a.id} className="ht-crono-card ht-crono-lock" aria-disabled="true">
              <span className="ht-crono-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={youtubeThumb(a.video_id)} alt="" loading="lazy" />
                <span className="ht-crono-play ht-crono-cadeado">
                  <IcoBloqueada size={22} />
                </span>
              </span>
              <span className="ht-crono-info">
                <strong>Aula {a.day_index}</strong>
                <small>Libera {rotuloLiberacao(a.unlock_at)}</small>
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}
