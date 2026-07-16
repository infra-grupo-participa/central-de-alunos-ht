'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Guard from '@/components/Guard.jsx';
import Navbar from '@/components/Navbar.jsx';
import ExercicioForm from '@/components/ExercicioForm.jsx';
import WatchGate from '@/components/WatchGate.jsx';
import WhatsAppFloat from '@/components/WhatsAppFloat.jsx';
import { useMe } from '@/components/MeProvider.jsx';
import { api } from '@/lib/supabase-browser.js';
import useTitle from '@/lib/useTitle.js';
import { youtubeUrl } from '@/components/Cronograma.jsx';
import { IcoVoltar, IcoCheck, IcoConcluida, IcoErro, IcoYoutube } from '@/components/icons.jsx';

function ExercicioView() {
  const { id } = useParams();
  const router = useRouter();
  const { me } = useMe();
  const [ex, setEx] = useState(null);
  useTitle(ex ? `Exercício ${ex.day_index}` : 'Exercício');
  const [respostas, setRespostas] = useState({});
  const [erro, setErro] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [salvo, setSalvo] = useState(null); // 'salvando' | 'salvo'
  // Gate do "você assistiu?": pergunta em TODA entrada num exercício não
  // concluído — de propósito. Sem responder, o formulário não aparece.
  const [gate, setGate] = useState(false);

  const respostasRef = useRef(respostas);
  useEffect(() => {
    respostasRef.current = respostas;
  }, [respostas]);

  useEffect(() => {
    let vivo = true;
    api(`/api/exercicios/${id}`)
      .then((data) => {
        if (!vivo) return;
        setEx(data);
        setRespostas(data.respostas || {});
        // Sempre pergunta antes de trabalhar num exercício aberto; só a
        // revisão de um exercício já concluído entra direto.
        if (!data.concluido) setGate(true);
      })
      .catch((e) =>
        setErro(
          e.message === 'exercicio_bloqueado'
            ? 'Este exercício ainda não foi liberado. As aulas abrem às 08h do dia.'
            : 'Não foi possível abrir o exercício.'
        )
      );
    return () => {
      vivo = false;
    };
  }, [id]);

  // Auto-save do rascunho a cada 20s (só quando há algo digitado e não concluiu).
  const salvarRascunho = useCallback(async () => {
    if (!ex || ex.concluido) return;
    setSalvo('salvando');
    try {
      await api(`/api/exercicios/${id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'salvar', respostas: respostasRef.current }),
      });
      setSalvo('salvo');
    } catch {
      setSalvo(null);
    }
  }, [ex, id]);

  useEffect(() => {
    if (!ex || ex.concluido) return undefined;
    const t = setInterval(salvarRascunho, 20000);
    return () => clearInterval(t);
  }, [ex, salvarRascunho]);

  async function concluir() {
    setBusy(true);
    setErro(null);
    try {
      const r = await api(`/api/exercicios/${id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'concluir', respostas: respostasRef.current }),
      });
      setEx((e) => ({ ...e, concluido: true, status: 'concluido' }));
      setMsg(r.mensagem || 'Exercício concluído!');
    } catch (e) {
      setErro(
        e.message === 'linhas_insuficientes'
          ? 'Sua lista ainda não chegou no mínimo pedido pelo exercício. Complete as linhas e tente de novo.'
          : 'Não foi possível concluir agora. Tente de novo.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function salvarEditado() {
    setBusy(true);
    setErro(null);
    try {
      await api(`/api/exercicios/${id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'salvar', respostas: respostasRef.current }),
      });
      setMsg('Respostas atualizadas.');
    } catch {
      setErro('Não foi possível salvar agora.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ht-hero-glow" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 820,
          margin: '0 auto',
          padding: '26px 24px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {erro && !ex && (
          <div className="ht-card" style={{ padding: 28, textAlign: 'center' }}>
            <p className="ht-error" style={{ marginBottom: 16, justifyContent: 'center' }}>
              <IcoErro size={16} />
              {erro}
            </p>
            <Link href="/" className="ht-btn ht-btn-primary" style={{ textDecoration: 'none' }}>
              Voltar para a Central
            </Link>
          </div>
        )}

        {ex && (
          <>
            <div>
              <Link
                href="/"
                style={{
                  color: 'var(--ht-text-dim)',
                  fontSize: 13,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <IcoVoltar size={15} />
                Voltar para a Central
              </Link>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                <span className="ht-tag">Exercício — Aula {ex.day_index}</span>
                {ex.aula?.video_id && (
                  <a
                    href={youtubeUrl(ex.aula.video_id)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: 'var(--ht-text-dim)',
                      fontSize: 13,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <IcoYoutube size={15} />
                    Rever a aula no YouTube
                  </a>
                )}
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 5vw, 34px)', textTransform: 'uppercase', marginTop: 12 }}>
                {ex.titulo}
              </h1>
              {ex.objetivo && (
                <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, lineHeight: 1.55, marginTop: 10 }}>
                  {ex.objetivo}
                </p>
              )}
              {ex.descricao && (
                <p style={{ color: 'var(--ht-text-muted)', fontSize: 14, lineHeight: 1.55, marginTop: 8 }}>
                  {ex.descricao}
                </p>
              )}
            </div>

            {ex.concluido && (
              <p className="ht-success-msg" style={{ marginTop: 0 }}>
                <IcoConcluida size={16} />
                Exercício concluído{msg ? ` — ${msg}` : '. Você pode revisar e ajustar suas respostas.'}
              </p>
            )}

            {!gate && (
            <div className="ht-card" style={{ padding: '24px' }}>
              <ExercicioForm campos={ex.campos} respostas={respostas} onChange={setRespostas} />

              {erro && (
                <p className="ht-error">
                  <IcoErro size={16} />
                  {erro}
                </p>
              )}
              {msg && !ex.concluido && <p className="ht-success-msg">{msg}</p>}

              <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap', alignItems: 'center' }}>
                {!ex.concluido ? (
                  <>
                    <button className="ht-btn ht-btn-primary" onClick={concluir} disabled={busy}>
                      <IcoCheck size={17} strokeWidth={2.5} />
                      {busy ? 'Concluindo…' : 'Concluir exercício'}
                    </button>
                    <button className="ht-btn ht-btn-ghost" onClick={salvarRascunho} disabled={busy}>
                      Salvar rascunho
                    </button>
                    {salvo === 'salvo' && (
                      <span style={{ color: 'var(--ht-text-muted)', fontSize: 13 }}>Rascunho salvo.</span>
                    )}
                  </>
                ) : (
                  <button className="ht-btn ht-btn-primary" onClick={salvarEditado} disabled={busy}>
                    {busy ? 'Salvando…' : 'Salvar alterações'}
                  </button>
                )}
              </div>
            </div>
            )}
          </>
        )}

        {/* Pergunta obrigatória em toda entrada: assistiu ao vivo, replay ou
            ainda não? Fechar sem responder volta para a Central. */}
        {ex && gate && (
          <WatchGate
            exercicio={ex}
            onClose={() => router.push('/')}
            onLiberado={() => setGate(false)}
          />
        )}
      </main>
      <WhatsAppFloat url={me?.carrinho?.whatsapp_url} />
    </div>
  );
}

export default function ExercicioPage() {
  return (
    <Guard>
      <ExercicioView />
    </Guard>
  );
}
