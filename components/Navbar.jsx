'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo.jsx';
import { useAuth } from '@/components/AuthProvider.jsx';
import { useMe } from '@/components/MeProvider.jsx';
import { IcoSair, IcoMetricas } from '@/components/icons.jsx';

// Navbar enxuta: a Central agora é uma página só (cronograma + exercícios),
// então sobram a marca e a saída. A única aba é a de Métricas — e só pra quem
// é admin (o /api/me diz; quem protege os dados é o requireAdmin da API).
export default function Navbar() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { me } = useMe();

  async function sair() {
    await signOut();
    router.replace('/login');
  }

  return (
    <header className="ht-nav">
      <Link href="/" className="ht-nav-brand">
        <Logo />
        <strong>HOLDING TOTAL</strong>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {me?.is_admin && (
          <Link href="/admin" className="ht-btn ht-btn-ghost ht-nav-sair" style={{ textDecoration: 'none' }}>
            <IcoMetricas size={16} />
            <span className="ht-nav-sair-label">Métricas</span>
          </Link>
        )}
        <button className="ht-btn ht-btn-ghost ht-nav-sair" onClick={sair} aria-label="Sair">
          <IcoSair size={16} />
          <span className="ht-nav-sair-label">Sair</span>
        </button>
      </div>
    </header>
  );
}
