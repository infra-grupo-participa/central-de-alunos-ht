'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo.jsx';
import { useAuth } from '@/components/AuthProvider.jsx';

const TABS = [
  { href: '/', label: 'Home' },
  { href: '/aulas', label: 'Aulas' },
  { href: '/ranking', label: 'Ranking' },
];

function ativo(href, pathname) {
  if (href === '/') return pathname === '/';
  if (href === '/aulas') return pathname === '/aulas' || pathname.startsWith('/aula/');
  return pathname.startsWith(href);
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

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

      <nav className="ht-nav-tabs">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`ht-nav-tab ${ativo(t.href, pathname) ? 'ht-nav-tab-on' : ''}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <button className="ht-btn ht-btn-ghost ht-nav-sair" onClick={sair}>
        Sair
      </button>
    </header>
  );
}
