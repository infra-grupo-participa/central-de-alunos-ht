'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider.jsx';
import { api } from '@/lib/supabase-browser.js';

// Estado do aluno (profile, cohort, settings, ficha) vindo de GET /api/me.
const MeContext = createContext(null);

export function useMe() {
  return useContext(MeContext);
}

export function MeProvider({ children }) {
  const { session } = useAuth();
  // Chave estavel: o id do usuario NAO muda quando o token e renovado (ex.: ao
  // voltar pra aba). Antes dependiamos do objeto `session` inteiro, entao todo
  // refresh de token re-disparava /api/me e reexibia "Carregando sua Central".
  const userId = session?.user?.id ?? null;
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);
  const loadedFor = useRef(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setMe(null);
      loadedFor.current = null;
      return null;
    }
    setLoading(true);
    try {
      const data = await api('/api/me');
      setMe(data);
      loadedFor.current = userId;
      return data;
    } catch {
      // Erro transitorio (ex.: token sendo renovado): mantem o `me` atual em vez
      // de zerar e cair no Splash.
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <MeContext.Provider value={{ me, loading, refresh }}>{children}</MeContext.Provider>;
}
