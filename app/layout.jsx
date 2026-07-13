import './globals.css';
import { AuthProvider } from '@/components/AuthProvider.jsx';
import { MeProvider } from '@/components/MeProvider.jsx';

// Renderiza tudo de forma dinamica: evita que o Next marque as paginas como
// estaticas e a CDN da Hostinger (hcdn) as trave em cache por 1 ano
// (s-maxage=31536000), o que fazia o deploy novo nunca aparecer.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Central do Aluno · Holding Total',
  description: 'Central do Aluno HT — sua jornada começa aqui.',
};

export const viewport = {
  themeColor: '#0A0A0B',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <MeProvider>{children}</MeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
