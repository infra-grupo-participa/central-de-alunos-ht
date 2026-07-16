'use client';

import { useEffect } from 'react';

// Título da aba por página. As páginas da Central são client components (não
// exportam `metadata`), então o título entra pelo DOM — mantendo o padrão do
// template do layout ("Página · Central do Aluno HT").
export default function useTitle(titulo) {
  useEffect(() => {
    if (!titulo) return;
    document.title = `${titulo} · Central do Aluno HT`;
  }, [titulo]);
}
