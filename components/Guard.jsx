'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider.jsx';
import { useMe } from '@/components/MeProvider.jsx';
import Splash from '@/components/Splash.jsx';

// Proteção de rota (equivalente ao ProtectedRoute do react-router):
// - sem sessão  → /login
// - must_change_password e fora de /trocar-senha → /trocar-senha
// - já trocou a senha e está em /trocar-senha → /
export default function Guard({ children }) {
  const { session, loading } = useAuth();
  const { me, loading: meLoading } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  const mustChange = !!me?.profile?.must_change_password;

  // Enquanto qualquer redirecionamento é necessário, mostramos o Splash.
  const redirecting =
    !loading &&
    (!session ||
      (mustChange && pathname !== '/trocar-senha') ||
      (!mustChange && !!me && pathname === '/trocar-senha'));

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!me && meLoading) return;
    if (mustChange && pathname !== '/trocar-senha') {
      router.replace('/trocar-senha');
      return;
    }
    if (!mustChange && me && pathname === '/trocar-senha') {
      router.replace('/');
    }
  }, [loading, session, me, meLoading, mustChange, pathname, router]);

  if (loading) return <Splash />;
  if (!session) return <Splash />;
  if (!me && meLoading) return <Splash />;
  if (redirecting) return <Splash />;
  return children;
}
