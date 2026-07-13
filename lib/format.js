// Helpers de formatação pt-BR.

export function pad2(n) {
  return String(Math.max(0, n)).padStart(2, '0');
}

// Ex.: "segunda-feira, 20 de julho às 20:00"
export function formatDateLong(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Quebra um delta de ms em dias/horas/min/seg (nunca negativo).
export function splitCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    dias: Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60,
  };
}
