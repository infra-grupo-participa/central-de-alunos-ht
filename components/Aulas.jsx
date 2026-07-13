'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/supabase-browser.js';

function faltamDias(unlockAt) {
  if (!unlockAt) return 0;
  const diff = new Date(unlockAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function Aulas() {
  const [aulas, setAulas] = useState(null);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    api('/api/lessons')
      .then((ls) => {
        setAulas(ls);
        const primeira = ls.find((l) => l.liberada);
        setSel(primeira || null);
      })
      .catch(() => setAulas([]));
  }, []);

  if (!aulas || aulas.length === 0) return null;

  return (
    <section>
      <h2 style={{ fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 14 }}>
        Suas aulas<span className="ht-accent">.</span>
      </h2>

      {sel && sel.liberada && (
        <div className="ht-card" style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div className="ht-video-wrap">
            <iframe
              key={sel.video_id}
              src={`https://www.youtube.com/embed/${sel.video_id}?rel=0`}
              title={sel.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div style={{ padding: '16px 20px' }}>
            <span className="ht-tag">Dia {sel.day_index}</span>
            <strong style={{ display: 'block', marginTop: 10, fontSize: 17 }}>{sel.titulo}</strong>
            {sel.resumo && (
              <p style={{ color: 'var(--ht-text-dim)', fontSize: 14, margin: '8px 0 0' }}>{sel.resumo}</p>
            )}
          </div>
        </div>
      )}

      <div className="ht-lessons">
        {aulas.map((l) => {
          const dias = faltamDias(l.unlock_at);
          const ativa = sel?.id === l.id;
          return (
            <button
              key={l.id}
              className={`ht-lesson ${ativa ? 'ht-lesson-ativa' : ''} ${l.liberada ? '' : 'ht-lesson-lock'}`}
              onClick={() => l.liberada && setSel(l)}
              disabled={!l.liberada}
            >
              <span className="ht-lesson-num">{l.day_index}</span>
              <span className="ht-lesson-body">
                <strong>{l.titulo}</strong>
                <small>
                  {l.concluida
                    ? '✓ Concluída'
                    : l.liberada
                      ? 'Disponível agora'
                      : `Libera em ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
                </small>
              </span>
              <span className="ht-lesson-tag">
                {l.concluida ? '✓' : l.liberada ? '▶' : '🔒'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
