// Logo HT — bloco laranja com a sigla, mesmo visual do teaser do Épico 0.
export default function Logo({ size = 34 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size / 4.25),
        background: 'linear-gradient(180deg, var(--ht-orange-bright), var(--ht-orange-deep))',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--ht-font-display)',
        fontWeight: 900,
        color: '#fff',
        fontSize: Math.round(size * 0.47),
        flexShrink: 0,
      }}
    >
      HT
    </div>
  );
}
