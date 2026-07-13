import Logo from '@/components/Logo.jsx';
import { IcoCarregando } from '@/components/icons.jsx';

// Tela de carregamento enquanto sessão/estado do aluno resolvem.
export default function Splash() {
  return (
    <div
      className="ht-hero-glow"
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <Logo size={46} />
      <IcoCarregando size={22} className="ht-spin" style={{ color: 'var(--ht-orange)' }} />
      <span style={{ color: 'var(--ht-text-dim)', fontSize: 14, letterSpacing: '0.08em' }}>
        CARREGANDO SUA CENTRAL...
      </span>
    </div>
  );
}
