'use client';

// Botão flutuante de suporte via WhatsApp — presente em toda a área logada.
// O glifo é o do WhatsApp mesmo (não um ícone genérico de chat): reconhecimento
// imediato é o que faz o botão cumprir o papel.
const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/5511999999999';

export default function WhatsAppFloat({ url }) {
  return (
    <a
      className="ht-whats-float"
      href={url || WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Suporte via WhatsApp"
      title="Fale com o suporte no WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true">
        <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.59 4.46 1.72 6.4L3.2 28.8l6.58-1.68a12.74 12.74 0 0 0 6.22 1.6h.01c7.06 0 12.79-5.74 12.79-12.8s-5.74-12.72-12.8-12.72zm0 23.36h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.9 1 1.04-3.8-.26-.4a10.55 10.55 0 0 1-1.63-5.65c0-5.86 4.77-10.63 10.64-10.63a10.57 10.57 0 0 1 10.62 10.64c0 5.86-4.77 10.55-10.71 10.55zm5.83-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.58-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.47 4.84.76.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37z" />
      </svg>
    </a>
  );
}
