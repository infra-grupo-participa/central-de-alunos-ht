import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider.jsx';
import { api } from './lib/supabase.js';
import Login from './pages/Login.jsx';
import TrocarSenha from './pages/TrocarSenha.jsx';
import Home from './pages/Home.jsx';
import BemVindo from './pages/BemVindo.jsx';
import Logo from './components/Logo.jsx';

// ------------------------------------------------------------------ useMe
// Estado do aluno (profile, cohort, settings, ficha) vindo de GET /api/me.
const MeContext = createContext(null);

export function useMe() {
  return useContext(MeContext);
}

function MeProvider({ children }) {
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

  return (
    <MeContext.Provider value={{ me, loading, refresh }}>{children}</MeContext.Provider>
  );
}

// --------------------------------------------------------------- Proteção

function Splash() {
  return (
    <div
      className="ht-hero-glow"
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <Logo size={46} />
      <span style={{ color: 'var(--ht-text-dim)', fontSize: 14, letterSpacing: '0.08em' }}>
        CARREGANDO SUA CENTRAL...
      </span>
    </div>
  );
}

// Redireciona p/ /login sem sessão e p/ /trocar-senha se must_change_password.
function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const { me, loading: meLoading } = useMe();
  const location = useLocation();

  if (loading) return <Splash />;
  if (!session) return <Navigate to="/login" replace />;
  if (!me && meLoading) return <Splash />;

  const mustChange = !!me?.profile?.must_change_password;
  if (mustChange && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }
  if (!mustChange && location.pathname === '/trocar-senha') {
    return <Navigate to="/" replace />;
  }
  return children;
}

// ------------------------------------------------------------------ Rotas

export default function App() {
  return (
    <MeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/bem-vindo" element={<BemVindo />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trocar-senha"
          element={
            <ProtectedRoute>
              <TrocarSenha />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MeProvider>
  );
}
