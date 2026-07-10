import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useMe } from '../App.jsx';
import Logo from '../components/Logo.jsx';
import { splitCountdown, pad2, formatDateLong } from '../lib/format.js';

// A Central do Aluno — home protegida do Épico 1.
export default function Home() {
  const { signOut } = useAuth();
  const { me, refresh } = useMe();
  const navigate = useNavigate();
  const [avisos, setAvisos] = useState([]);
  const [fichaMsg, setFichaMsg] = useState(null);
  const [fichaBusy, setFichaBusy] = useState(false);

  useEffect(() => {
    api('/api/announcements')
      .then(setAvisos)
      .catch(() => setAvisos([]));
  }, []);

  async function sair() {
    await signOut();
    navigate('/login', { replace: true });
  }

  async function marcarFichaRespondida() {
    setFichaBusy(true);
    try {
      const res = await api('/api/ficha/respondi', {
        method: 'POST',
        body: JSON.stringify({}),
      });
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

  const profile = me?.profile;
  const cohort = me?.cohort;
  const fichaPendente = me?.ficha?.status === 'pendente';
  const avisoFicha = avisos.find((a) => a.tipo === 'ficha');
  const fichaUrl = avisoFicha?.cta_url || null;
  const primeiroNome = (profile?.nome || profile?.email || 'Aluno').split(' ')[0].split('@')[0];

  return (
    <div className="ht-hero-glow" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '18px 24px',
          borderBottom: '1px solid var(--ht-border)',
        }}
      >
        <Logo />
        <strong style={{ letterSpacing: '0.12em', fontSize: 14 }}>HOLDING TOTAL</strong>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ color: 'var(--ht-text-dim)', fontSize: 14 }}>
            Fala, <strong style={{ color: 'var(--ht-text)' }}>{primeiroNome}</strong>
          </span>
          <button
            className="ht-btn ht-btn-ghost"
            style={{ padding: '9px 16px', fontSize: 13 }}
            onClick={sair}
          >
            Sair
          </button>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 980,
          margin: '0 auto',
          padding: '26px 24px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Avisos ativos — sempre no topo */}
        {avisos.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {avisos.map((a) => (
              <AvisoBanner key={a.id} aviso={a} />
            ))}
          </section>
        )}

        {/* CTA Ficha de Interesse */}
        {fichaPendente && (
          <div className="ht-banner ht-banner-ficha">
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
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {fichaUrl && (
                <a
                  className="ht-btn ht-btn-primary"
                  style={{ textDecoration: 'none' }}
                  href={fichaUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Preencher agora
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

        {/* Contagem regressiva */}
        <Countdown cohort={cohort} />

        {/* Teaser do que vem por aí */}
        <section>
          <h2
            style={{
              fontSize: 20,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: 14,
            }}
          >
            O que vem por aí<span className="ht-accent">.</span>
          </h2>
          <div className="ht-teaser-grid">
            <TeaserCard
              titulo="Aulas liberadas dia a dia"
              texto="Uma aula por dia, no ritmo certo. Assista, conclua e avance na frente de todo mundo."
            />
            <TeaserCard
              titulo="Deveres de casa"
              texto="Ação gera resultado. Entregue os deveres e acumule pontos que separam quem faz de quem assiste."
            />
            <TeaserCard
              titulo="Ranking ao vivo"
              texto="Seu nome contra o dos outros alunos, em tempo real. O topo é de quem se move primeiro."
            />
          </div>
        </section>
      </main>

      <footer style={{ padding: '16px 24px', color: 'var(--ht-text-muted)', fontSize: 13 }}>
        Central do Aluno · Holding Total
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------- Avisos

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

  return (
    <div className={`ht-banner ${classe}`}>
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
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: '#fff',
                display: 'inline-block',
              }}
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
          style={{
            textDecoration: 'none',
            ...(aoVivo ? { background: '#0a0a0b', border: 'none' } : {}),
          }}
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

// Escolhe o alvo mais próximo no futuro: início das aulas ou live do pitch.
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
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!alvo) return undefined;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [alvo]);

  if (!alvo) return null;

  const { dias, horas, minutos, segundos } = splitCountdown(
    new Date(alvo.data).getTime() - agora
  );

  return (
    <section className="ht-card" style={{ padding: '28px 26px' }}>
      <span className="ht-tag">{alvo.titulo}</span>
      <h2
        style={{
          fontSize: 'clamp(24px, 4.5vw, 34px)',
          textTransform: 'uppercase',
          margin: '16px 0 20px',
        }}
      >
        Faltam <span className="ht-accent">{dias > 0 ? `${dias} ${dias === 1 ? 'dia' : 'dias'}` : 'horas'}</span>{' '}
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

// ------------------------------------------------------------- Teaser cards

function TeaserCard({ titulo, texto }) {
  return (
    <div className="ht-card ht-teaser-card">
      <span className="ht-soon">Em breve</span>
      <h3 style={{ fontSize: 17, textTransform: 'uppercase', paddingRight: 70 }}>{titulo}</h3>
      <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, lineHeight: 1.5, margin: '10px 0 0' }}>
        {texto}
      </p>
    </div>
  );
}
