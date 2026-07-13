'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo.jsx';
import { useAuth } from '@/components/AuthProvider.jsx';
import { IcoHome, IcoAulas, IcoRanking, IcoSair } from '@/components/icons.jsx';

const TABS = [
  { href: '/', label: 'Home', Ico: IcoHome },
  { href: '/aulas', label: 'Aulas', Ico: IcoAulas },
  { href: '/ranking', label: 'Ranking', Ico: IcoRanking },
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
        {TABS.map(({ href, label, Ico }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={`ht-nav-tab ${ativo(href, pathname) ? 'ht-nav-tab-on' : ''}`}
          >
            <Ico size={17} />
            <span className="ht-nav-tab-label">{label}</span>
          </Link>
        ))}
      </nav>

      <button className="ht-btn ht-btn-ghost ht-nav-sair" onClick={sair} aria-label="Sair">
        <IcoSair size={16} />
        <span className="ht-nav-sair-label">Sair</span>
      </button>
    </header>
  );
}
