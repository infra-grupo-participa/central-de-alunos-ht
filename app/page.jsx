'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Guard from '@/components/Guard.jsx';
import Navbar from '@/components/Navbar.jsx';
import { useMe } from '@/components/MeProvider.jsx';
import { api } from '@/lib/supabase-browser.js';
import Ranking from '@/components/Ranking.jsx';
import { splitCountdown, pad2, formatDateLong } from '@/lib/format.js';
import {
  IcoConcluida,
  IcoPontos,
  IcoTrofeu,
  IcoAvancar,
  IcoContagem,
  IcoLive,
  IcoUrgente,
  IcoFicha,
  IcoAviso,
} from '@/components/icons.jsx';

function HomeView() {
  const { me, refresh } = useMe();
  const [aulas, setAulas] = useState(null);
  const [rank, setRank] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [fichaMsg, setFichaMsg] = useState(null);
  const [fichaBusy, setFichaBusy] = useState(false);

  useEffect(() => {
    api('/api/lessons').then(setAulas).catch(() => setAulas([]));
    api('/api/ranking').then(setRank).catch(() => setRank(null));
    api('/api/announcements').then(setAvisos).catch(() => setAvisos([]));
  }, []);

  const profile = me?.profile;
  const cohort = me?.cohort;
  const fichaPendente = me?.ficha?.status === 'pendente';
  const fichaUrl = me?.ficha_url || null;
  const fichaIniciada = !!me?.ficha?.iniciada_at;
  const primeiroNome = (profile?.nome || profile?.email || 'Aluno').split(' ')[0].split('@')[0];

  const total = aulas?.length || 0;
  const concluidas = (aulas || []).filter((a) => a.concluida).length;
  const proxima = (aulas || []).find((a) => a.liberada && !a.concluida) || null;
  const pct = total ? Math.round((concluidas / total) * 100) : 0;

  async function marcarFichaRespondida() {
    setFichaBusy(true);
    try {
      const res = await api('/api/ficha/respondi', { method: 'POST', body: JSON.stringify({}) });
      setFichaMsg(
        res.pontos_creditados
          ? `Boa! +${res.pontos_creditados} pontos creditados na sua conta.`
          : 'Ficha registrada!'
      );
      await refresh();
    } catch {
      setFichaMsg(null);
    } finally {
      setFichaBusy(false);
    }
  }

  // Registra que o aluno foi preencher a ficha (a navegacao fica no href, entao
  // nao ha bloqueio de pop-up). Atualiza o estado depois pra refletir iniciada_at.
  function registrarAberturaFicha() {
    api('/api/ficha/iniciar', { method: 'POST', body: JSON.stringify({}) })
      .then(() => refresh())
      .catch(() => {});
  }

  const saudacao =
    concluidas === 0
      ? 'Sua jornada começou. Assista à primeira aula e comece a pontuar — cada passo te aproxima do topo.'
      : concluidas < total
        ? `Você já concluiu ${concluidas} de ${total} aulas. Mantenha o ritmo: a consistência é o que separa quem chega lá.`
        : 'Você está em dia com todas as aulas liberadas. Excelente! Fique de olho nas próximas e na live decisiva.';

  return (
    <div className="ht-hero-glow" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 980,
          margin: '0 auto',
          padding: '28px 24px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Boas-vindas */}
        <section>
          <h1 style={{ fontSize: 'clamp(26px, 5.5vw, 42px)', textTransform: 'uppercase' }}>
            Bem-vindo de volta,
            <br />
            <span className="ht-accent">{primeiroNome}</span>.
          </h1>
          <p style={{ color: 'var(--ht-text-dim)', fontSize: 16, lineHeight: 1.5, marginTop: 14, maxWidth: 580 }}>
            {saudacao}
          </p>
        </section>

        {/* Painel de progresso */}
        <section className="ht-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <strong style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Seu progresso nas aulas
            </strong>
            <span style={{ marginLeft: 'auto', color: 'var(--ht-text-dim)', fontSize: 14 }}>
              {concluidas}/{total || '—'} aulas
            </span>
          </div>
          <div className="ht-progress">
            <div className="ht-progress-fill" style={{ width: `${pct}%` }} />
          </div>

          <div className="ht-stats">
            <Stat Ico={IcoConcluida} n={concluidas} l="Aulas concluídas" />
            <Stat Ico={IcoPontos} n={rank?.eu?.pontos ?? '—'} l="Pontos" />
            <Stat Ico={IcoTrofeu} n={rank?.eu?.posicao ? `${rank.eu.posicao}º` : '—'} l="No ranking" />
          </div>

          {proxima ? (
            <Link
              href={`/aula/${proxima.id}`}
              className="ht-btn ht-btn-primary"
              style={{ marginTop: 18, textDecoration: 'none' }}
            >
              {concluidas === 0 ? 'Começar a Aula 1' : `Continuar — Aula ${proxima.day_index}`}
              <IcoAvancar size={17} />
            </Link>
          ) : total > 0 ? (
            <p className="ht-success-msg" style={{ marginTop: 14 }}>
              <IcoConcluida size={16} />
              Você está em dia com as aulas liberadas.
            </p>
          ) : null}
        </section>

        {/* Avisos ativos */}
        {avisos.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {avisos.map((a) => (
              <AvisoBanner key={a.id} aviso={a} />
            ))}
          </section>
        )}

        {/* Ficha de interesse */}
        {fichaPendente && (
          <div className="ht-banner ht-banner-ficha">
            <span className="ht-banner-ico">
              <IcoFicha size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 240 }}>
              <strong
                style={{
                  fontFamily: 'var(--ht-font-display)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontSize: 16,
                }}
              >
                Preencha sua ficha de interesse
              </strong>
              <p style={{ margin: '6px 0 0', color: 'var(--ht-text-dim)', fontSize: 14 }}>
                Leva 2 minutos e vale <strong style={{ color: 'var(--ht-orange)' }}>+50 pontos</strong> no
                ranking. Não deixe para depois.
              </p>
              {fichaIniciada && (
                <p style={{ margin: '8px 0 0', color: 'var(--ht-orange)', fontSize: 13, fontWeight: 600 }}>
                  Você já abriu o formulário — depois de enviar, confirme aqui para creditar seus pontos.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {fichaUrl && (
                <a
                  className="ht-btn ht-btn-primary"
                  style={{ textDecoration: 'none' }}
                  href={fichaUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={registrarAberturaFicha}
                >
                  {fichaIniciada ? 'Abrir formulário' : 'Preencher agora'}
                </a>
              )}
              <button
                className="ht-btn ht-btn-ghost"
                onClick={marcarFichaRespondida}
                disabled={fichaBusy}
                style={{ opacity: fichaBusy ? 0.7 : 1 }}
              >
                {fichaBusy ? 'Registrando...' : 'Já respondi'}
              </button>
            </div>
          </div>
        )}
        {!fichaPendente && fichaMsg && <p className="ht-success-msg">{fichaMsg}</p>}

        {/* Ranking compacto */}
        <Ranking compact />

        {/* Contagem regressiva */}
        <Countdown cohort={cohort} />
      </main>
    </div>
  );
}

function Stat({ Ico, n, l }) {
  return (
    <div className="ht-stat">
      <Ico size={16} className="ht-stat-ico" />
      <span className="ht-stat-n">{n}</span>
      <span className="ht-stat-l">{l}</span>
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

// ------------------------------------------------------- Contagem regressiva

function escolherAlvo(cohort) {
  if (!cohort) return null;
  const agora = Date.now();
  const candidatos = [
    { data: cohort.data_inicio, rotulo: 'para a virada de chave', titulo: 'As aulas começam em' },
    { data: cohort.data_live_pitch, rotulo: 'para a live decisiva', titulo: 'A live decisiva é em' },
  ]
    .filter((c) => c.data && new Date(c.data).getTime() > agora)
    .sort((a, b) => new Date(a.data) - new Date(b.data));
  return candidatos[0] || null;
}

function Countdown({ cohort }) {
  const alvo = useMemo(() => escolherAlvo(cohort), [cohort]);
  const [agora, setAgora] = useState(null);

  useEffect(() => {
    if (!alvo) return undefined;
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [alvo]);

  if (!alvo || agora === null) return null;

  const { dias, horas, minutos, segundos } = splitCountdown(new Date(alvo.data).getTime() - agora);

  return (
    <section className="ht-card" style={{ padding: '28px 26px' }}>
      <span className="ht-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <IcoContagem size={14} />
        {alvo.titulo}
      </span>
      <h2 style={{ fontSize: 'clamp(22px, 4.5vw, 32px)', textTransform: 'uppercase', margin: '16px 0 20px' }}>
        Faltam{' '}
        <span className="ht-accent">{dias > 0 ? `${dias} ${dias === 1 ? 'dia' : 'dias'}` : 'horas'}</span>{' '}
        {alvo.rotulo}.
      </h2>
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
      <p style={{ color: 'var(--ht-text-muted)', fontSize: 13, marginTop: 16, marginBottom: 0 }}>
        {formatDateLong(alvo.data)} — marque na agenda. Quem chega atrasado assiste de fora.
      </p>
    </section>
  );
}

export default function HomePage() {
  return (
    <Guard>
      <HomeView />
    </Guard>
  );
}
