'use client';

import { useState } from 'react';
import { api } from '@/lib/supabase-browser.js';
import { youtubeUrl } from '@/components/Cronograma.jsx';
import { IcoLive, IcoAssistir, IcoUrgente, IcoYoutube, IcoErro } from '@/components/icons.jsx';

// Gate do exercício: antes de abrir a tarefa, o aluno confirma COMO assistiu a
// aula. "Ao vivo" ou "replay" liberam direto; "ainda não assisti" abre um
// segundo passo de alerta — dá pra ir mesmo assim, mas ciente do risco.
export default function WatchGate({ exercicio, onClose, onLiberado }) {
  const [passo, setPasso] = useState(1);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState(null);

  const aula = exercicio?.aula;
  if (!aula) return null;

  async function confirmar(modo) {
    setBusy(true);
    setErro(null);
    try {
      await api(`/api/lessons/${aula.id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'confirmar_visto', watch_mode: modo }),
      });
      onLiberado(exercicio);
    } catch {
      setErro('Não foi possível registrar agora. Tente de novo.');
      setBusy(false);
    }
  }

  return (
    <div className="ht-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ht-modal ht-card" onClick={(e) => e.stopPropagation()}>
        {passo === 1 ? (
          <>
            <span className="ht-tag">Aula {exercicio.day_index}</span>
            <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', textTransform: 'uppercase', margin: '14px 0 8px' }}>
              Você já assistiu a aula {exercicio.day_index}?
            </h2>
            <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
              O exercício foi desenhado para ser executado logo depois da aula. Confirme como você
              assistiu para liberar a tarefa.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="ht-btn ht-btn-primary" disabled={busy} onClick={() => confirmar('ao_vivo')}>
                <IcoLive size={17} />
                Assisti ao vivo
              </button>
              <button className="ht-btn ht-btn-primary" disabled={busy} onClick={() => confirmar('replay')}>
                <IcoAssistir size={16} />
                Assisti no replay
              </button>
              <button className="ht-btn ht-btn-ghost" disabled={busy} onClick={() => setPasso(2)}>
                Ainda não assisti
              </button>
            </div>
          </>
        ) : (
          <>
            <span
              className="ht-banner-ico"
              style={{ color: 'var(--ht-danger)', marginBottom: 14 }}
              aria-hidden="true"
            >
              <IcoUrgente size={22} />
            </span>
            <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Sem a aula, é improviso.
            </h2>
            <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, margin: '0 0 8px', lineHeight: 1.55 }}>
              Holding familiar é <strong style={{ color: 'var(--ht-text)' }}>método, não improviso</strong>.
              Fazer o exercício sem assistir a aula é executar sem as técnicas e o contexto que o
              Marcio entrega — e isso compromete o seu plano do primeiro contrato.
            </p>
            <p style={{ color: 'var(--ht-text-muted)', fontSize: 13, margin: '0 0 20px' }}>
              Nossa recomendação: assista primeiro, execute depois.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                className="ht-btn ht-btn-primary"
                style={{ textDecoration: 'none' }}
                href={youtubeUrl(aula.video_id)}
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
              >
                <IcoYoutube size={17} />
                Assistir a aula no YouTube
              </a>
              <button className="ht-btn ht-btn-ghost" disabled={busy} onClick={() => confirmar('nao_assistiu')}>
                Entendo o risco — fazer mesmo assim
              </button>
            </div>
          </>
        )}
        {erro && (
          <p className="ht-error">
            <IcoErro size={16} />
            {erro}
          </p>
        )}
        <button className="ht-modal-fechar" onClick={onClose} aria-label="Fechar">
          ×
        </button>
      </div>
    </div>
  );
}
