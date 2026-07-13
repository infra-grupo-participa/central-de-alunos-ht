'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/supabase-browser.js';
import { IcoConcluida, IcoAssistir, IcoBloqueada } from '@/components/icons.jsx';

// Selo de estado da aula, a direita da linha: verde (feita), laranja (liberada),
// cinza (ainda travada).
function SeloEstado({ concluida, liberada }) {
  if (concluida) {
    return (
      <span className="ht-lesson-tag ht-lesson-tag-ok" title="Concluída">
        <IcoConcluida size={17} />
      </span>
    );
  }
  if (liberada) {
    return (
      <span className="ht-lesson-tag ht-lesson-tag-play" title="Assistir agora">
        <IcoAssistir size={15} fill="currentColor" />
      </span>
    );
  }
  return (
    <span className="ht-lesson-tag ht-lesson-tag-lock" title="Ainda bloqueada">
      <IcoBloqueada size={15} />
    </span>
  );
}

function faltamDias(unlockAt) {
  if (!unlockAt) return 0;
  const diff = new Date(unlockAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function Aulas() {
  const [aulas, setAulas] = useState(null);

  useEffect(() => {
    api('/api/lessons')
      .then(setAulas)
      .catch(() => setAulas([]));
  }, []);

  if (!aulas || aulas.length === 0) return null;

  return (
    <section>
      <h2 style={{ fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 14 }}>
        Suas aulas<span className="ht-accent">.</span>
      </h2>

      <div className="ht-lessons">
        {aulas.map((l) => {
          const dias = faltamDias(l.unlock_at);
          const status = l.concluida
            ? 'Concluída'
            : l.liberada
              ? 'Assistir agora'
              : `Libera em ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
          const conteudo = (
            <>
              <span className="ht-lesson-num">{l.day_index}</span>
              <span className="ht-lesson-body">
                <strong>{l.titulo}</strong>
                <small>{status}</small>
              </span>
              <SeloEstado concluida={l.concluida} liberada={l.liberada} />
            </>
          );

          return l.liberada ? (
            <Link key={l.id} href={`/aula/${l.id}`} className="ht-lesson">
              {conteudo}
            </Link>
          ) : (
            <div key={l.id} className="ht-lesson ht-lesson-lock" aria-disabled="true">
              {conteudo}
            </div>
          );
        })}
      </div>
    </section>
  );
}
