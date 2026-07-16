// Máscaras e sanitização de input — o dado entra certo na digitação, não na
// limpeza depois. Cada formatador recebe o valor cru e devolve o formatado.

export function soDigitos(v, max = 20) {
  return String(v || '').replace(/\D/g, '').slice(0, max);
}

// Telefone BR: (11) 99999-9999 / (11) 9999-9999. Aceita só dígitos.
export function maskTelefone(v) {
  const d = soDigitos(v, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function telefoneValido(v) {
  const d = soDigitos(v);
  return d.length === 10 || d.length === 11;
}

// Moeda BRL: digita só números, formata como R$ 1.234,56 (centavos implícitos
// desligados: tratamos como valor inteiro em reais, que é como se fala preço
// de honorário/inventário — "R$ 45 mil", não "R$ 45.000,17").
export function maskMoeda(v) {
  const d = soDigitos(v, 12);
  if (!d) return '';
  const n = parseInt(d, 10);
  if (Number.isNaN(n)) return '';
  return `R$ ${n.toLocaleString('pt-BR')}`;
}

// Nome próprio: letras (com acento), espaço, hífen e apóstrofo. Sem números.
export function maskNome(v) {
  return String(v || '')
    .replace(/[^\p{L}\s'’-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 80);
}

// Aplica a máscara pelo tipo declarado no campo (jsonb do exercício).
export function aplicarMascara(tipo, valor) {
  if (tipo === 'tel') return maskTelefone(valor);
  if (tipo === 'moeda') return maskMoeda(valor);
  if (tipo === 'nome') return maskNome(valor);
  return valor;
}

// inputMode/placeholder padrão por tipo — teclado certo no mobile.
export function propsDoTipo(tipo) {
  if (tipo === 'tel') return { inputMode: 'tel', placeholder: '(11) 99999-9999', maxLength: 16 };
  if (tipo === 'moeda') return { inputMode: 'numeric', placeholder: 'R$ 0' };
  if (tipo === 'nome') return { autoCapitalize: 'words', spellCheck: false };
  return {};
}
