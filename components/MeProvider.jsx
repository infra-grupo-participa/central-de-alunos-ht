'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider.jsx';
import { api } from '@/lib/supabase-browser.js';

// Estado do aluno (profile, cohort, settings, ficha) vindo de GET /api/me.
const MeContext = createContext(null);

export function useMe() {
  return useContext(MeContext);
}

export function MeProvider({ children }) {
  const { session } = useAuth();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session) {
      setMe(null);
      return null;
    }
    setLoading(true);
    try {
      const data = await api('/api/me');
      setMe(data);
      return data;
    } catch {
      setMe(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <MeContext.Provider value={{ me, loading, refresh }}>{children}</MeContext.Provider>;
}
