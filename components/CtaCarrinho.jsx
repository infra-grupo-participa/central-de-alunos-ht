'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { pad2, splitCountdown, formatDateLong } from '@/lib/format.js';
import { IcoContagem, IcoAvancar, IcoFicha } from '@/components/icons.jsx';

// CTA de abertura de carrinho do Holding Masters.
// Aparece quando o aluno terminou todas as aulas/exercícios OU quando a janela
// de CTA do cohort começou (cta_inicio_at — 21h da véspera). Timer evidente até
// a abertura: 06:45 pra quem preencheu a ficha, 07:00 pra quem não preencheu.
export default function CtaCarrinho({ carrinho, fichaRespondida, tudoConcluido }) {
  const [agora, setAgora] = useState(null);

  const visivel = useMemo(() => {
    if (!carrinho?.abre_at) return false;
    if (tudoConcluido) return true;
    if (carrinho.cta_inicio_at && new Date(carrinho.cta_inicio_at).getTime() <= Date.now()) return true;
    return false;
  }, [carrinho, tudoConcluido]);

  useEffect(() => {
    if (!visivel) return undefined;
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [visivel]);

  // Antes da janela do CTA: seeding no tease. O aluno vê que existe um convite
  // se formando — mas o conteúdo só se revela no momento certo. Curiosidade
  // trabalhando a semana inteira a favor da conversão.
  if (!visivel && carrinho?.abre_at) {
    return (
      <section className="ht-card" style={{ padding: '22px 24px' }}>
        <span className="ht-tag">Em breve</span>
        <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)', textTransform: 'uppercase', margin: '14px 0 8px' }}>
          O próximo passo da sua jornada<span className="ht-accent">.</span>
        </h2>
        <p className="ht-tease" aria-hidden="true" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>
          O método completo do diagnóstico ao membership, com acompanhamento até o seu primeiro
          contrato de R$ 35 mil — e uma condição exclusiva para quem executou o plano.
        </p>
        <p style={{ color: 'var(--ht-text-muted)', fontSize: 13, margin: '12px 0 0' }}>
          Revelado ao final das aulas. Continue executando o plano.
        </p>
      </section>
    );
  }

  if (!visivel || agora === null) return null;

  const abreMs = new Date(carrinho.abre_at).getTime();
  const aberto = abreMs <= agora;
  const { dias, horas, minutos, segundos } = splitCountdown(abreMs - agora);

  if (aberto) {
    return (
      <section className="ht-card ht-cta-carrinho" style={{ padding: '30px 28px', textAlign: 'center' }}>
        <span className="ht-tag" style={{ borderColor: '#fff', color: '#fff' }}>
          Vagas abertas
        </span>
        <h2 style={{ fontSize: 'clamp(24px, 5vw, 36px)', textTransform: 'uppercase', margin: '16px 0 10px', color: '#fff' }}>
          Sua vaga no Holding Masters está aberta.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, margin: '0 auto 22px', maxWidth: 520, lineHeight: 1.55 }}>
          Você executou o plano a semana inteira. Agora é a decisão: o método completo, do diagnóstico
          ao membership — com acompanhamento para o seu primeiro contrato de R$ 35 mil ou mais.
        </p>
        <a
          className="ht-btn"
          style={{
            background: '#0a0a0b',
            color: '#fff',
            fontSize: 17,
            padding: '16px 34px',
            textDecoration: 'none',
          }}
          href={carrinho.checkout_url || carrinho.whatsapp_url || '#'}
          target="_blank"
          rel="noreferrer"
        >
          {carrinho.checkout_url ? 'Garantir minha vaga agora' : 'Falar com a Secretaria e garantir a vaga'}
          <IcoAvancar size={18} />
        </a>
      </section>
    );
  }

  return (
    <section className="ht-card" style={{ padding: '28px 26px' }}>
      <span className="ht-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <IcoContagem size={14} />
        Abertura das vagas — Holding Masters
      </span>
      <h2 style={{ fontSize: 'clamp(22px, 4.5vw, 32px)', textTransform: 'uppercase', margin: '16px 0 8px' }}>
        Seu carrinho abre em<span className="ht-accent">.</span>
      </h2>
      <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, margin: '0 0 20px', maxWidth: 560, lineHeight: 1.5 }}>
        {fichaRespondida ? (
          <>
            Você preencheu a ficha de interesse — seu acesso é{' '}
            <strong style={{ color: 'var(--ht-orange)' }}>antecipado: {formatDateLong(carrinho.abre_at)}</strong>.
          </>
        ) : (
          <>
            Abertura geral: <strong>{formatDateLong(carrinho.abre_at)}</strong>. Quem preencheu a
            ficha de interesse entra 15 minutos antes.
          </>
        )}
      </p>
      <div className="ht-count-grid">
        <div className="ht-count-box">
          <span className="ht-count-num">{pad2(dias)}</span>
          <span className="ht-count-label">dias</span>
        </div>
        <div className="ht-count-box">
          <span className="ht-count-num">{pad2(horas)}</span>
          <span className="ht-count-label">horas</span>
        </div>
        <div className="ht-count-box">
          <span className="ht-count-num">{pad2(minutos)}</span>
          <span className="ht-count-label">min</span>
        </div>
        <div className="ht-count-box">
          <span className="ht-count-num">{pad2(segundos)}</span>
          <span className="ht-count-label">seg</span>
        </div>
      </div>
      {!fichaRespondida && (
        <p style={{ marginTop: 18, marginBottom: 0, fontSize: 14 }}>
          <Link href="/ficha" style={{ color: 'var(--ht-orange)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IcoFicha size={15} />
            Preencher a ficha e abrir 15 minutos antes
          </Link>
        </p>
      )}
    </section>
  );
}
