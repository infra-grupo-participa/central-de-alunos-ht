import './globals.css';
import { Archivo, Inter } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider.jsx';
import { MeProvider } from '@/components/MeProvider.jsx';

// Fontes via next/font: self-hosted no build (zero requisição externa em
// runtime, sem FOIT/flash) — antes era <link> bloqueante pro Google Fonts.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

// Renderiza tudo de forma dinamica: evita que o Next marque as paginas como
// estaticas e a CDN da Hostinger (hcdn) as trave em cache por 1 ano
// (s-maxage=31536000), o que fazia o deploy novo nunca aparecer.
export const dynamic = 'force-dynamic';

export const metadata = {
  metadataBase: new URL('https://aluno.holdingtotal.com.br'),
  title: {
    default: 'Central do Aluno · Holding Total',
    template: '%s · Central do Aluno HT',
  },
  description:
    'A Central do Aluno do Holding Total: cronograma de aulas, exercícios do plano do primeiro contrato e o seu workbook completo. Acesse com o e-mail da compra do ingresso.',
  applicationName: 'Central do Aluno HT',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Central do Aluno · Holding Total',
    title: 'Central do Aluno · Holding Total',
    description:
      'Cronograma de aulas, exercícios do plano do primeiro contrato e workbook completo do Holding Total.',
    images: ['/logo-ht.png'],
  },
  twitter: {
    card: 'summary',
    title: 'Central do Aluno · Holding Total',
    description:
      'Cronograma de aulas, exercícios do plano do primeiro contrato e workbook completo do Holding Total.',
  },
  alternates: { canonical: '/' },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: '#0A0A0B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${inter.variable}`}>
      <head>
        {/* As thumbs das aulas vêm do YouTube — abre a conexão cedo. */}
        <link rel="preconnect" href="https://i.ytimg.com" />
      </head>
      <body>
        <AuthProvider>
          <MeProvider>{children}</MeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
