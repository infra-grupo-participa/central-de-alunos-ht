'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Guard from '@/components/Guard.jsx';
import Navbar from '@/components/Navbar.jsx';
import Cronograma from '@/components/Cronograma.jsx';
import Exercicios from '@/components/Exercicios.jsx';
import CtaCarrinho from '@/components/CtaCarrinho.jsx';
import WhatsAppFloat from '@/components/WhatsAppFloat.jsx';
import { useMe } from '@/components/MeProvider.jsx';
import { api } from '@/lib/supabase-browser.js';
import { IcoLive, IcoUrgente, IcoFicha, IcoAviso, IcoBaixar } from '@/components/icons.jsx';

function HomeView() {
  const { me } = useMe();
  const [aulas, setAulas] = useState(null);
  const [exercicios, setExercicios] = useState(null);
  const [avisos, setAvisos] = useState([]);

  const carregar = useCallback(() => {
    api('/api/lessons').then(setAulas).catch(() => setAulas([]));
    api('/api/exercicios').then(setExercicios).catch(() => setExercicios([]));
    api('/api/announcements').then(setAvisos).catch(() => setAvisos([]));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const profile = me?.profile;
  const primeiroNome = (profile?.nome || profile?.email || 'Aluno').split(' ')[0].split('@')[0];

  // "Concluída" no cronograma = exercício do dia concluído.
  const aulasComStatus = useMemo(() => {
    if (!aulas) return null;
    const feitoPorDia = new Map((exercicios || []).map((e) => [e.day_index, e.concluido]));
    return aulas.map((a) => ({ ...a, concluida: !!feitoPorDia.get(a.day_index) }));
  }, [aulas, exercicios]);

  const total = exercicios?.length || 0;
  const feitos = (exercicios || []).filter((e) => e.concluido).length;
  const tudoConcluido = total > 0 && feitos === total;
  const fichaRespondida = me?.ficha?.status === 'respondida';

  return (
    <div className="ht-hero-glow" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 980,
          margin: '0 auto',
          padding: '28px 24px 90px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* Boas-vindas curtas — o palco é do cronograma */}
        <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, margin: 0 }}>
          Bem-vindo de volta, <strong style={{ color: 'var(--ht-text)' }}>{primeiroNome}</strong>.
          {tudoConcluido
            ? ' Plano executado por completo — agora é decisão.'
            : ` Você executou ${feitos} de ${total || 6} exercícios do plano.`}
        </p>

        {/* Avisos ativos */}
        {avisos.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {avisos.map((a) => (
              <AvisoBanner key={a.id} aviso={a} />
            ))}
          </section>
        )}

        {/* Cronograma: thumbs horizontais → YouTube, liberação 08h, timer */}
        <Cronograma aulas={aulasComStatus} />

        {/* CTA de carrinho (aparece ao concluir tudo ou a partir das 21h da véspera) */}
        <CtaCarrinho
          carrinho={me?.carrinho}
          fichaRespondida={fichaRespondida}
          tudoConcluido={tudoConcluido}
        />

        {/* Exercícios verticais com blur + ficha HM a partir da Aula 2 */}
        <Exercicios exercicios={exercicios} ficha={me?.ficha} />

        {/* Workbook: o material completo, liberado ao concluir os exercícios */}
        <section className="ht-card" style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <strong
                style={{
                  fontFamily: 'var(--ht-font-display)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontSize: 17,
                }}
              >
                Workbook completo do Holding Total
              </strong>
              <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, margin: '6px 0 0', lineHeight: 1.5 }}>
                {tudoConcluido ? (
                  <>
                    Todas as aulas e os seus exercícios, reunidos num único PDF organizado — o registro
                    do seu plano do primeiro contrato.
                  </>
                ) : (
                  <>
                    Conclua os {total || 6} exercícios para liberar o download do workbook — todas as
                    aulas e as suas respostas num único PDF organizado.{' '}
                    <strong style={{ color: 'var(--ht-orange)' }}>
                      {feitos}/{total || 6} concluídos.
                    </strong>
                  </>
                )}
              </p>
            </div>
            {tudoConcluido ? (
              <Link href="/workbook" className="ht-btn ht-btn-primary" style={{ textDecoration: 'none' }}>
                <IcoBaixar size={17} />
                Baixar o workbook (PDF)
              </Link>
            ) : (
              <span
                className="ht-btn ht-btn-ghost"
                style={{ opacity: 0.55, cursor: 'not-allowed' }}
                aria-disabled="true"
              >
                <IcoBaixar size={17} />
                {feitos}/{total || 6} para liberar
              </span>
            )}
          </div>

          {/* Prévia no tease: o aluno vê que o workbook dele já está tomando
              forma — mas só lê quando concluir. Curiosidade a favor da meta. */}
          {!tudoConcluido && (
            <div className="ht-workbook-tease" aria-hidden="true">
              <span className="ht-tease">Radar: sua lista de 10 — nomes e problemas classificados</span>
              <span className="ht-tease">Diagnóstico completo: perda pela inércia mapeada em R$</span>
              <span className="ht-tease">Croqui estrutural + honorários com ancoragem de preço</span>
            </div>
          )}
        </section>
      </main>

      <WhatsAppFloat url={me?.carrinho?.whatsapp_url} />
    </div>
  );
}

// ---------------------------------------------------------------- Avisos

const AVISO_ICO = {
  live: IcoLive,
  urgente: IcoUrgente,
  ficha: IcoFicha,
};

function AvisoBanner({ aviso }) {
  const classe =
    aviso.tipo === 'live'
      ? 'ht-banner-live'
      : aviso.tipo === 'urgente'
        ? 'ht-banner-urgente'
        : aviso.tipo === 'ficha'
          ? 'ht-banner-ficha'
          : 'ht-banner-normal';

  const aoVivo = aviso.tipo === 'live';
  const Ico = AVISO_ICO[aviso.tipo] || IcoAviso;

  return (
    <div className={`ht-banner ${classe}`}>
      <span className="ht-banner-ico">
        <Ico size={20} />
      </span>
      <div style={{ flex: 1, minWidth: 240 }}>
        <strong
          style={{
            fontFamily: 'var(--ht-font-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: aoVivo ? 17 : 15,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {aoVivo && (
            <span
              style={{ width: 10, height: 10, borderRadius: 999, background: '#fff', display: 'inline-block' }}
            />
          )}
          {aviso.titulo}
        </strong>
        {aviso.mensagem && (
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 14,
              color: aoVivo ? 'rgba(255,255,255,0.92)' : 'var(--ht-text-dim)',
            }}
          >
            {aviso.mensagem}
          </p>
        )}
      </div>
      {aviso.cta_url && (
        <a
          className={`ht-btn ${aoVivo ? 'ht-btn-ghost' : 'ht-btn-primary'}`}
          style={{ textDecoration: 'none', ...(aoVivo ? { background: '#0a0a0b', border: 'none' } : {}) }}
          href={aviso.cta_url}
          target="_blank"
          rel="noreferrer"
        >
          {aviso.cta_label || 'Acessar'}
        </a>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Guard>
      <HomeView />
    </Guard>
  );
}
