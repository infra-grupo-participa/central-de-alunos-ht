'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDateLong } from '@/lib/format.js';
import { IcoAvancar, IcoFicha, IcoConcluida } from '@/components/icons.jsx';

// Anúncio do Holding Masters — regra do Marcio: NADA de anunciar cedo.
// Só aparece depois que o aluno finaliza as aulas/exercícios (pós-aulas),
// e a tela pós-aulas NÃO tem tempo de espera: anúncio direto, sem countdown.
// Quando o carrinho abre (06:45 com ficha / 07:00 sem), vira o CTA de vaga.
export default function CtaCarrinho({ carrinho, fichaRespondida, tudoConcluido }) {
  // Tick leve só para virar "aberto" na hora certa sem recarregar a página.
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  if (!carrinho?.abre_at) return null;
  const aberto = new Date(carrinho.abre_at).getTime() <= agora;

  // Antes de concluir as aulas: silêncio. O anúncio é a recompensa do fim.
  if (!aberto && !tudoConcluido) return null;

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

  // Pós-aulas: anúncio direto, sem countdown. A data de abertura é informada
  // por extenso — informação, não ansiedade.
  return (
    <section className="ht-card" style={{ padding: '28px 26px' }}>
      <span className="ht-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <IcoConcluida size={14} />
        Plano concluído
      </span>
      <h2 style={{ fontSize: 'clamp(22px, 4.5vw, 32px)', textTransform: 'uppercase', margin: '16px 0 10px' }}>
        Seu próximo passo: <span className="ht-accent">Holding Masters</span>.
      </h2>
      <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, margin: '0 0 14px', maxWidth: 580, lineHeight: 1.6 }}>
        Você executou o plano do primeiro contrato a semana inteira. O Holding Masters é o método
        completo — do diagnóstico ao membership, com acompanhamento até o seu primeiro contrato de
        R$ 35 mil ou mais.
      </p>
      <p style={{ fontSize: 15, margin: 0 }}>
        As vagas abrem <strong style={{ color: 'var(--ht-orange)' }}>{formatDateLong(carrinho.abre_at)}</strong>
        {fichaRespondida ? ' — e o seu acesso é antecipado, 15 minutos antes de todo mundo.' : '.'}
      </p>
      {!fichaRespondida && (
        <p style={{ marginTop: 14, marginBottom: 0, fontSize: 14 }}>
          <Link
            href="/ficha"
            style={{
              color: 'var(--ht-orange)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <IcoFicha size={15} />
            Preencher a ficha de interesse e entrar 15 minutos antes
          </Link>
        </p>
      )}
    </section>
  );
}
