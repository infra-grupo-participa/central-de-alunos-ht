'use client';

import { Fragment, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import {
  IcoConcluida,
  IcoExercicio,
  IcoBloqueada,
  IcoFicha,
  IcoAvancar,
} from '@/components/icons.jsx';

function rotuloLiberacao(unlockAt) {
  if (!unlockAt) return 'em breve';
  const d = new Date(unlockAt);
  const dia = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'numeric' }).format(d);
  return `${dia}, às 08h`;
}

// Módulo da ficha de interesse HM — aparece como uma opção a partir da Aula 4.
const FICHA_LIBERA_NA_AULA = 4;
function FichaCard({ ficha }) {
  const respondida = ficha?.status === 'respondida';
  return (
    <div className={`ht-ex-card ${respondida ? '' : 'ht-ex-ficha'}`}>
      <span className="ht-ex-num" style={{ color: 'var(--ht-orange)' }}>
        <IcoFicha size={18} />
      </span>
      <div className="ht-ex-body">
        <strong>Ficha de interesse — Holding Masters</strong>
        {respondida ? (
          <p>
            Ficha registrada. Você garantiu <strong style={{ color: 'var(--ht-orange)' }}>acesso
            antecipado</strong> na abertura das vagas — seu carrinho abre 15 minutos antes.
          </p>
        ) : (
          <p>
            Opcional, mas estratégico: quem preenche a ficha entra{' '}
            <strong style={{ color: 'var(--ht-orange)' }}>15 minutos antes</strong> quando as vagas do
            Holding Masters abrirem. Leva 2 minutos.
          </p>
        )}
      </div>
      {respondida ? (
        <span className="ht-lesson-tag ht-lesson-tag-ok" title="Ficha respondida">
          <IcoConcluida size={17} />
        </span>
      ) : (
        <Link href="/ficha" className="ht-btn ht-btn-primary" style={{ textDecoration: 'none', flexShrink: 0 }}>
          Preencher ficha
          <IcoAvancar size={16} />
        </Link>
      )}
    </div>
  );
}

// Exercícios das aulas, alinhados verticalmente abaixo do cronograma.
// Bloqueado = conteúdo real, mas atrás de um blur: dá pra intuir o que vem,
// sem conseguir ler — a linha tênue entre imaginar e saber.
export default function Exercicios({ exercicios, ficha }) {
  const router = useRouter();
  const listaRef = useRef(null);

  // Reveal suave dos módulos conforme entram na tela (respeita reduce-motion).
  useEffect(() => {
    const el = listaRef.current;
    if (!el || !exercicios?.length) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.ht-ex-card').forEach((card) => {
        gsap.fromTo(
          card,
          { y: 22, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: card, start: 'top 92%', once: true },
          }
        );
      });
    }, el);
    return () => ctx.revert();
  }, [exercicios]);

  if (!exercicios || exercicios.length === 0) return null;

  // A pergunta "você assistiu?" vive DENTRO da página do exercício e é feita
  // em toda entrada (até por link direto) — aqui só navegamos.
  function abrir(e) {
    router.push(`/exercicio/${e.id}`);
  }

  const fichaLiberada = exercicios.some((e) => e.day_index === FICHA_LIBERA_NA_AULA && e.liberado);

  return (
    <section>
      <div style={{ marginBottom: 14 }}>
        <span className="ht-tag">Plano do primeiro contrato</span>
        <h2 style={{ fontSize: 'clamp(20px, 4.5vw, 28px)', textTransform: 'uppercase', marginTop: 12 }}>
          Exercícios<span className="ht-accent">.</span>
        </h2>
        <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, marginTop: 8, maxWidth: 640 }}>
          Um passo por vez. Cada aula libera o exercício do dia — execute e registre aqui. No fim da
          semana, esse plano vira o seu workbook completo.
        </p>
      </div>

      <div ref={listaRef} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {exercicios.map((e) => (
          <Fragment key={e.id}>
            {e.liberado ? (
              <div className="ht-ex-card">
                <span className="ht-ex-num">{e.day_index}</span>
                <div className="ht-ex-body">
                  <strong>{e.titulo}</strong>
                  <p>{e.objetivo}</p>
                </div>
                {e.concluido ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span className="ht-lesson-tag ht-lesson-tag-ok" title="Concluído">
                      <IcoConcluida size={17} />
                    </span>
                    <button className="ht-btn ht-btn-ghost" onClick={() => abrir(e)}>
                      Rever
                    </button>
                  </div>
                ) : (
                  <button
                    className="ht-btn ht-btn-primary"
                    style={{ flexShrink: 0 }}
                    onClick={() => abrir(e)}
                  >
                    <IcoExercicio size={16} />
                    {e.submission_status === 'rascunho' ? 'Continuar' : 'Fazer exercício'}
                  </button>
                )}
              </div>
            ) : (
              <div className="ht-ex-card ht-ex-lock" aria-disabled="true">
                <span className="ht-ex-num">
                  <IcoBloqueada size={16} />
                </span>
                <div className="ht-ex-body ht-ex-blur" aria-hidden="true">
                  <strong>{e.titulo}</strong>
                  <p>{e.objetivo}</p>
                </div>
                <span className="ht-ex-lock-label">
                  Libera {rotuloLiberacao(e.aula?.unlock_at)}
                </span>
              </div>
            )}
            {/* A ficha HM entra como opção logo depois do exercício da Aula 4. */}
            {e.day_index === FICHA_LIBERA_NA_AULA && fichaLiberada && <FichaCard ficha={ficha} />}
          </Fragment>
        ))}
      </div>

    </section>
  );
}
