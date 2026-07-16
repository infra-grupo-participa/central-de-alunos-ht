'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
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

function rotuloDia(unlockAt) {
  if (!unlockAt) return 'Em breve';
  const d = new Date(unlockAt);
  const dia = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(d);
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(d);
  return `${dia} · ${hora}`;
}

// Contagem regressiva do card: visível e clara, sem gritar.
function CountCard({ unlockAt, agora }) {
  if (!unlockAt || agora === null) return null;
  const ms = new Date(unlockAt).getTime() - agora;
  if (ms <= 0) return null;
  const { dias, horas, minutos, segundos } = splitCountdown(ms);
  return (
    <span className="ht-crono-count" aria-label="Tempo até a liberação da aula">
      <IcoRelogio size={13} />
      <b>
        {dias > 0 ? `${dias}d ` : ''}
        {pad2(horas)}:{pad2(minutos)}:{pad2(segundos)}
      </b>
    </span>
  );
}

// Cronograma de aulas: só as thumbnails, alinhadas horizontalmente.
// Liberada → abre no YouTube. Bloqueada → thumb borrada + cadeado + timer do
// dia (as aulas abrem às 08h). O trilho desliza sozinho, de leve, para mostrar
// que existe conteúdo além da dobra — e pausa assim que o aluno interage.
export default function Cronograma({ aulas }) {
  const trilhoRef = useRef(null);
  const [agora, setAgora] = useState(null);

  const temBloqueada = useMemo(() => (aulas || []).some((a) => !a.liberada && a.unlock_at), [aulas]);

  // Um relógio só para todos os cards.
  useEffect(() => {
    if (!temBloqueada) return undefined;
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [temBloqueada]);

  // Entrada dos cards (stagger) — respeita reduce-motion.
  useEffect(() => {
    const el = trilhoRef.current;
    if (!el || !aulas?.length) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.ht-crono-card',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' }
      );
    }, el);
    return () => ctx.revert();
  }, [aulas]);

  // Deslize horizontal autônomo, leve e sutil (vai e volta), com pausa na
  // interação e retomada depois de um respiro.
  useEffect(() => {
    const el = trilhoRef.current;
    if (!el || !aulas?.length) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const VEL = 18; // px/s — passeio, não corrida
    const PAUSA_BORDA = 1600; // respiro ao chegar na ponta
    const RETOMA_MS = 4500; // volta a deslizar depois da interação
    let dir = 1;
    let pausadoAte = performance.now() + 1400; // espera a entrada dos cards
    let interagindo = false;
    let idleTimer = null;

    const tick = (_t, deltaMS) => {
      if (interagindo || performance.now() < pausadoAte) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 8) return;
      el.scrollLeft += dir * VEL * (deltaMS / 1000);
      if (el.scrollLeft >= max - 1) {
        dir = -1;
        pausadoAte = performance.now() + PAUSA_BORDA;
      } else if (el.scrollLeft <= 1) {
        dir = 1;
        pausadoAte = performance.now() + PAUSA_BORDA;
      }
    };

    const pausar = () => {
      interagindo = true;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        interagindo = false;
        pausadoAte = 0;
      }, RETOMA_MS);
    };
    const entrar = () => {
      interagindo = true;
      clearTimeout(idleTimer);
    };
    const sair = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        interagindo = false;
      }, 900);
    };

    el.addEventListener('pointerenter', entrar);
    el.addEventListener('pointerleave', sair);
    el.addEventListener('pointerdown', pausar);
    el.addEventListener('wheel', pausar, { passive: true });
    el.addEventListener('touchstart', pausar, { passive: true });
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      clearTimeout(idleTimer);
      el.removeEventListener('pointerenter', entrar);
      el.removeEventListener('pointerleave', sair);
      el.removeEventListener('pointerdown', pausar);
      el.removeEventListener('wheel', pausar);
      el.removeEventListener('touchstart', pausar);
    };
  }, [aulas]);

  if (!aulas || aulas.length === 0) return null;

  return (
    <section>
      <h1 style={{ fontSize: 'clamp(24px, 5vw, 34px)', textTransform: 'uppercase', marginBottom: 10 }}>
        Cronograma de aulas<span className="ht-accent">.</span>
      </h1>
      <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, margin: '0 0 16px', maxWidth: 640 }}>
        Uma aula por dia, liberada às <strong style={{ color: 'var(--ht-orange)' }}>08h</strong>. Clique na
        aula para assistir no YouTube — e volte aqui para executar o exercício do dia.
      </p>

      <div className="ht-crono" ref={trilhoRef}>
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
                <CountCard unlockAt={a.unlock_at} agora={agora} />
                <small>Libera {rotuloDia(a.unlock_at)}</small>
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}
