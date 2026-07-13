'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Guard from '@/components/Guard.jsx';
import Navbar from '@/components/Navbar.jsx';
import { api } from '@/lib/supabase-browser.js';

function fmtTempo(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function AulaView() {
  const { id } = useParams();
  const [aula, setAula] = useState(null);
  const [erro, setErro] = useState(null);
  const [restante, setRestante] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [avaliado, setAvaliado] = useState(false);

  // Abre a aula (registra o inicio do cronometro no servidor) e traz o estado.
  useEffect(() => {
    let vivo = true;
    api(`/api/lessons/${id}`, { method: 'POST', body: JSON.stringify({ action: 'abrir' }) })
      .then((a) => {
        if (!vivo) return;
        setAula(a);
        setRestante(a.restante_seconds);
        setRating(a.rating || 0);
        setAvaliado(!!a.rating);
      })
      .catch((e) =>
        setErro(
          e.message === 'aula_bloqueada'
            ? 'Esta aula ainda não foi liberada.'
            : 'Não foi possível abrir a aula.'
        )
      );
    return () => {
      vivo = false;
    };
  }, [id]);

  // Cronometro de contagem regressiva.
  useEffect(() => {
    if (restante === null || restante <= 0) return undefined;
    const t = setTimeout(() => setRestante((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearTimeout(t);
  }, [restante]);

  async function concluir() {
    setBusy(true);
    setErro(null);
    try {
      const r = await api(`/api/lessons/${id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'concluir' }),
      });
      setAula((a) => ({ ...a, concluida: true }));
      setMsg(r.mensagem || 'Aula concluída!');
    } catch (e) {
      const min = Math.round((aula?.min_watch_seconds || 1800) / 60);
      setErro(
        e.message === 'tempo_insuficiente'
          ? `Assista pelo menos ${min} minutos antes de concluir.`
          : 'Não foi possível concluir agora. Tente de novo.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function avaliar() {
    if (!rating) return;
    setBusy(true);
    setErro(null);
    try {
      await api(`/api/lessons/${id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'avaliar', rating, comentario }),
      });
      setAvaliado(true);
    } catch {
      setErro('Não foi possível salvar a avaliação.');
    } finally {
      setBusy(false);
    }
  }

  const podeConcluir = restante !== null && restante <= 0;
  const min = aula?.min_watch_seconds || 600;
  const progresso = restante === null ? 0 : Math.min(100, Math.round(((min - restante) / min) * 100));

  return (
    <div className="ht-hero-glow" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 900,
          margin: '0 auto',
          padding: '26px 24px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {erro && !aula && (
          <div className="ht-card" style={{ padding: 28, textAlign: 'center' }}>
            <p className="ht-error" style={{ marginBottom: 16 }}>{erro}</p>
            <Link href="/" className="ht-btn ht-btn-primary" style={{ textDecoration: 'none' }}>
              Voltar para a Central
            </Link>
          </div>
        )}

        {aula && (
          <>
            <div>
              <span className="ht-tag">Dia {aula.day_index}</span>
              <h1 style={{ fontSize: 'clamp(24px, 5vw, 34px)', textTransform: 'uppercase', marginTop: 12 }}>
                {aula.titulo}
              </h1>
            </div>

            <div className="ht-card" style={{ overflow: 'hidden' }}>
              <div className="ht-video-wrap">
                <iframe
                  src={`https://www.youtube.com/embed/${aula.video_id}?rel=0`}
                  title={aula.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {aula.resumo && (
              <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, lineHeight: 1.5, margin: 0 }}>
                {aula.resumo}
              </p>
            )}

            {/* Bloco de conclusão / timer */}
            {!aula.concluida ? (
              <div className="ht-card" style={{ padding: '22px 24px' }}>
                {!podeConcluir ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                      <strong style={{ fontSize: 15 }}>Assistindo…</strong>
                      <span style={{ marginLeft: 'auto', fontFamily: 'var(--ht-font-display)', fontWeight: 800, color: 'var(--ht-orange)', fontSize: 22 }}>
                        {fmtTempo(restante ?? min)}
                      </span>
                    </div>
                    <div className="ht-progress">
                      <div className="ht-progress-fill" style={{ width: `${progresso}%` }} />
                    </div>
                    <p style={{ color: 'var(--ht-text-muted)', fontSize: 13, margin: '12px 0 0' }}>
                      O botão de conclusão libera após {Math.round((aula.min_watch_seconds || 1800) / 60)}{' '}
                      minutos assistindo. Fica de olho — quem conclui pontua.
                    </p>
                  </>
                ) : (
                  <>
                    <strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
                      Pronto para concluir!
                    </strong>
                    <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, margin: '0 0 16px' }}>
                      Confirme que assistiu para garantir seus{' '}
                      <strong style={{ color: 'var(--ht-orange)' }}>+{aula.pontos} pontos</strong>.
                    </p>
                    <button
                      className="ht-btn ht-btn-primary"
                      onClick={concluir}
                      disabled={busy}
                      style={{ opacity: busy ? 0.7 : 1 }}
                    >
                      {busy ? 'Confirmando…' : 'Marcar como assistida'}
                    </button>
                  </>
                )}
                {erro && <p className="ht-error">{erro}</p>}
              </div>
            ) : (
              <div className="ht-card" style={{ padding: '22px 24px' }}>
                <strong style={{ fontSize: 16, color: 'var(--ht-success)' }}>✓ Aula concluída</strong>
                {msg && <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, margin: '6px 0 0' }}>{msg}</p>}

                {/* Avaliação */}
                <div style={{ marginTop: 20, borderTop: '1px solid var(--ht-border)', paddingTop: 18 }}>
                  <strong style={{ fontSize: 14, display: 'block', marginBottom: 10 }}>
                    {avaliado ? 'Sua avaliação' : 'O que achou desta aula?'}
                  </strong>
                  <div className="ht-stars" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="ht-star"
                        disabled={avaliado}
                        onMouseEnter={() => !avaliado && setHover(n)}
                        onClick={() => !avaliado && setRating(n)}
                        aria-label={`${n} estrelas`}
                      >
                        <span style={{ opacity: (hover || rating) >= n ? 1 : 0.28 }}>★</span>
                      </button>
                    ))}
                  </div>
                  {!avaliado && (
                    <>
                      <textarea
                        className="ht-input"
                        style={{ marginTop: 12, minHeight: 70, resize: 'vertical' }}
                        placeholder="Deixe um comentário (opcional)"
                        value={comentario}
                        maxLength={500}
                        onChange={(e) => setComentario(e.target.value)}
                      />
                      <button
                        className="ht-btn ht-btn-primary"
                        onClick={avaliar}
                        disabled={busy || !rating}
                        style={{ marginTop: 14, opacity: busy || !rating ? 0.6 : 1 }}
                      >
                        {busy ? 'Enviando…' : 'Enviar avaliação'}
                      </button>
                    </>
                  )}
                  {avaliado && (
                    <p style={{ color: 'var(--ht-success)', fontSize: 13, margin: '10px 0 0', fontWeight: 600 }}>
                      Obrigado pela avaliação!
                    </p>
                  )}
                  {erro && <p className="ht-error">{erro}</p>}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function AulaPage() {
  return (
    <Guard>
      <AulaView />
    </Guard>
  );
}
