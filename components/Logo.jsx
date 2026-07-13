// Logo oficial HT (Holding Total) — monograma laranja+branco, PNG transparente.
// Usada no header/navbar/splash. `size` controla a altura (a largura acompanha
// a proporcao da arte).
export default function Logo({ size = 34 }) {
  return (
    <img
      src="/logo-ht.png"
      alt="Holding Total"
      width={Math.round(size * 0.91)}
      height={size}
      style={{ height: size, width: 'auto', display: 'block', flexShrink: 0 }}
    />
  );
}
