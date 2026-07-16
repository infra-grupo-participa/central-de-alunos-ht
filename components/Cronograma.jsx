'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { pad2, splitCountdown } from '@/lib/format.js';
import {
  IcoBloqueada,
  IcoConcluida,
  IcoRelogio,
  IcoYoutube,
  IcoEsq,
  IcoDir,
} from '@/components/icons.jsx';

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
// O relógio vive AQUI dentro (e não no pai): só este span re-renderiza a cada
// segundo, em vez do trilho inteiro — o resto da página fica parado.
function CountCard({ unlockAt }) {
  const [agora, setAgora] = useState(null);

  useEffect(() => {
    if (!unlockAt) return undefined;
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [unlockAt]);

  if (!unlockAt || agora === null) return null;
  const ms = new Date(unlockAt).getTime() - agora;
  if (ms <= 0) return null;
  const { dias, horas, minutos, segundos } = splitCountdown(ms);
  return (
    <span className="ht-crono-count" aria-label="Tempo até a liberação da aula">
      <IcoRelogio size={14} />
      <b>
        {dias > 0 ? `${dias}d ` : ''}
        {pad2(horas)}:{pad2(minutos)}:{pad2(segundos)}
      </b>
    </span>
  );
}

// A lógica do produto vira estado visual óbvio (o aluno leigo entende sem
// aprender nada): Concluída (verde) · AULA DE HOJE (laranja, destaque) ·
// Assistida/liberada (neutra com play) · Bloqueada (blur + cadeado + timer).
function estadoDaAula(a, idHoje) {
  if (!a.liberada) return 'bloqueada';
  if (a.concluida) return 'concluida';
  if (a.id === idHoje) return 'hoje';
  return 'liberada';
}

export default function Cronograma({ aulas }) {
  const trilhoRef = useRef(null);
  const [podeEsq, setPodeEsq] = useState(false);
  const [podeDir, setPodeDir] = useState(false);

  // "Aula de hoje" = a última liberada ainda sem exercício concluído.
  const idHoje = useMemo(() => {
    const liberadas = (aulas || []).filter((a) => a.liberada && !a.concluida);
    return liberadas.length ? liberadas[liberadas.length - 1].id : null;
  }, [aulas]);

  // Habilita/desabilita as setas conforme a posição do trilho.
  const atualizarSetas = useCallback(() => {
    const el = trilhoRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPodeEsq(el.scrollLeft > 4);
    setPodeDir(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = trilhoRef.current;
    if (!el) return undefined;
    atualizarSetas();
    el.addEventListener('scroll', atualizarSetas, { passive: true });
    window.addEventListener('resize', atualizarSetas);
    return () => {
      el.removeEventListener('scroll', atualizarSetas);
      window.removeEventListener('resize', atualizarSetas);
    };
  }, [aulas, atualizarSetas]);

  // Setas: deslizam um card por clique, com easing do GSAP.
  const irPara = useCallback((direcao) => {
    const el = trilhoRef.current;
    if (!el) return;
    const card = el.querySelector('.ht-crono-card');
    const passo = card ? card.getBoundingClientRect().width + 16 : 340;
    const max = el.scrollWidth - el.clientWidth;
    const destino = Math.max(0, Math.min(max, el.scrollLeft + direcao * passo));
    gsap.to(el, { scrollLeft: destino, duration: 0.55, ease: 'power2.out', overwrite: 'auto' });
  }, []);

  // Entrada dos cards (stagger) — respeita reduce-motion.
  useEffect(() => {
    const el = trilhoRef.current;
    if (!el || !aulas?.length) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.ht-crono-card',
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity' }
      );
    }, el);
    return () => ctx.revert();
  }, [aulas]);

  // Deslize autônomo: as aulas passam de forma sutil para a DIREITA e, ao
  // chegar no fim, o trilho volta suave para o começo e recomeça. Pausa em
  // qualquer interação e retoma depois de um respiro.
  useEffect(() => {
    const el = trilhoRef.current;
    if (!el || !aulas?.length) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const VEL = 16; // px/s — passeio, não corrida
    const RETOMA_MS = 4500;
    let pausadoAte = performance.now() + 1600; // espera a entrada dos cards
    let interagindo = false;
    let voltando = false;
    let idleTimer = null;

    const tick = (_t, deltaMS) => {
      if (interagindo || voltando || performance.now() < pausadoAte) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 8) return;
      el.scrollLeft += VEL * (deltaMS / 1000);
      if (el.scrollLeft >= max - 1) {
        // Chegou no fim: respira e volta suave pro começo.
        voltando = true;
        gsap.to(el, {
          scrollLeft: 0,
          duration: 1.4,
          ease: 'power2.inOut',
          delay: 1.6,
          overwrite: 'auto',
          onComplete: () => {
            voltando = false;
            pausadoAte = performance.now() + 1400;
          },
        });
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
      gsap.killTweensOf(el);
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
      <div className="ht-crono-head">
        <div>
          <h1 style={{ fontSize: 'clamp(26px, 5.5vw, 38px)', textTransform: 'uppercase' }}>
            Cronograma de aulas<span className="ht-accent">.</span>
          </h1>
          <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, margin: '10px 0 0', maxWidth: 620 }}>
            Uma aula por dia, liberada às <strong style={{ color: 'var(--ht-orange)' }}>08h</strong>.
            Clique na aula para assistir no YouTube — e volte aqui para fazer o exercício do dia.
          </p>
        </div>
        <div className="ht-crono-setas">
          <button
            type="button"
            className="ht-seta"
            onClick={() => irPara(-1)}
            disabled={!podeEsq}
            aria-label="Aulas anteriores"
          >
            <IcoEsq size={20} />
          </button>
          <button
            type="button"
            className="ht-seta"
            onClick={() => irPara(1)}
            disabled={!podeDir}
            aria-label="Próximas aulas"
          >
            <IcoDir size={20} />
          </button>
        </div>
      </div>

      <div className="ht-crono" ref={trilhoRef}>
        {aulas.map((a) => {
          const estado = estadoDaAula(a, idHoje);
          const titulo = a.titulo.replace(/^Aula \d+\s*[-—]\s*/, '');

          if (estado === 'bloqueada') {
            return (
              <div key={a.id} className="ht-crono-card ht-crono-lock" aria-disabled="true">
                <span className="ht-crono-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={youtubeThumb(a.video_id)} alt="" loading="lazy" decoding="async" width={480} height={270} />
                  <span className="ht-crono-chip ht-chip-dia">Aula {a.day_index}</span>
                  <span className="ht-crono-play ht-crono-cadeado">
                    <IcoBloqueada size={26} />
                  </span>
                </span>
                <span className="ht-crono-info">
                  {/* Título no tease: dá pra ver que existem letras, não dá pra
                      ler — o aluno fica curioso pelo que vem amanhã. */}
                  <strong className="ht-tease" aria-hidden="true">
                    {titulo}
                  </strong>
                  <CountCard unlockAt={a.unlock_at} />
                  <small>Libera {rotuloDia(a.unlock_at)}</small>
                </span>
              </div>
            );
          }

          const ehHoje = estado === 'hoje';
          const concluida = estado === 'concluida';
          return (
            <a
              key={a.id}
              className={`ht-crono-card ${ehHoje ? 'ht-crono-hoje' : ''} ${concluida ? 'ht-crono-feita' : ''}`}
              href={youtubeUrl(a.video_id)}
              target="_blank"
              rel="noreferrer"
              title={`Assistir no YouTube: ${a.titulo}`}
            >
              <span className="ht-crono-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={youtubeThumb(a.video_id)} alt={a.titulo} loading="lazy" decoding="async" width={480} height={270} />
                <span className={`ht-crono-chip ${ehHoje ? 'ht-chip-hoje' : 'ht-chip-dia'}`}>
                  {ehHoje ? 'Aula de hoje' : `Aula ${a.day_index}`}
                </span>
                <span className="ht-crono-play">
                  <IcoYoutube size={34} />
                </span>
                {concluida && (
                  <span className="ht-crono-ok" title="Exercício concluído">
                    <IcoConcluida size={16} />
                  </span>
                )}
              </span>
              <span className="ht-crono-info">
                <strong>{titulo}</strong>
                {concluida ? (
                  <small className="ht-crono-status ht-status-ok">
                    <IcoConcluida size={13} />
                    Aula e exercício concluídos
                  </small>
                ) : (
                  <small className={`ht-crono-status ${ehHoje ? 'ht-status-hoje' : ''}`}>
                    <IcoYoutube size={13} />
                    {ehHoje ? 'Assista agora no YouTube' : 'Assistir no YouTube'}
                  </small>
                )}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
