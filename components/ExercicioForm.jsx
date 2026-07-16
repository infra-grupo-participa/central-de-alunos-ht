'use client';

import { aplicarMascara, propsDoTipo } from '@/lib/masks.js';

// Renderizador genérico do formulário do exercício, guiado pelo `campos` jsonb
// vindo do banco (ht.exercises.campos). Tipos suportados:
//   text · nome · tel · moeda · textarea · select · checkbox · repeater
// Trocar as perguntas de um exercício é editar o jsonb — sem deploy.
// tel/moeda/nome entram com máscara: o dado nasce limpo, sem depender de
// higiene do usuário.

const TIPOS_MASCARADOS = new Set(['tel', 'moeda', 'nome']);

function InputMascarado({ tipo, valor, onChange, placeholder }) {
  const extras = propsDoTipo(tipo);
  return (
    <input
      className="ht-input"
      type="text"
      {...extras}
      placeholder={placeholder || extras.placeholder || ''}
      value={valor || ''}
      onChange={(e) => onChange(aplicarMascara(tipo, e.target.value))}
    />
  );
}

function LinhaRepeater({ campo, linha, i, onChange }) {
  return (
    <div className="ht-rep-row">
      <span className="ht-rep-idx">{i + 1}</span>
      <div className="ht-rep-fields" data-cols={Math.min(campo.fields?.length || 1, 4)}>
        {(campo.fields || []).map((f) => {
          const valor = linha?.[f.key] ?? '';
          if (f.type === 'select') {
            return (
              <label key={f.key} className="ht-rep-field">
                <span>{f.label}</span>
                <select
                  className="ht-input"
                  value={valor}
                  onChange={(e) => onChange(i, f.key, e.target.value)}
                >
                  <option value="">Selecione…</option>
                  {(f.options || []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            );
          }
          if (TIPOS_MASCARADOS.has(f.type)) {
            return (
              <label key={f.key} className="ht-rep-field">
                <span>{f.label}</span>
                <InputMascarado
                  tipo={f.type}
                  valor={valor}
                  placeholder={f.placeholder}
                  onChange={(v) => onChange(i, f.key, v)}
                />
              </label>
            );
          }
          return (
            <label key={f.key} className="ht-rep-field">
              <span>{f.label}</span>
              <input
                className="ht-input"
                type="text"
                placeholder={f.placeholder || ''}
                value={valor}
                onChange={(e) => onChange(i, f.key, e.target.value)}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function Repeater({ campo, valor, onChange }) {
  const minhas = Array.isArray(valor) ? valor : [];
  const minimo = campo.min_rows || 1;
  const linhas = minhas.length >= minimo ? minhas : [...minhas, ...Array(minimo - minhas.length).fill({})];

  function setLinha(i, key, v) {
    const novas = linhas.map((l, j) => (j === i ? { ...l, [key]: v } : l));
    onChange(novas);
  }

  return (
    <div>
      {campo.help && (
        <p style={{ color: 'var(--ht-text-muted)', fontSize: 13, margin: '4px 0 12px' }}>{campo.help}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {linhas.map((linha, i) => (
          <LinhaRepeater key={i} campo={campo} linha={linha} i={i} onChange={setLinha} />
        ))}
      </div>
      <button
        type="button"
        className="ht-btn ht-btn-ghost"
        style={{ marginTop: 12, padding: '10px 18px', fontSize: 14 }}
        onClick={() => onChange([...linhas, {}])}
      >
        + Adicionar linha
      </button>
    </div>
  );
}

export default function ExercicioForm({ campos, respostas, onChange, disabled = false }) {
  function set(key, valor) {
    onChange({ ...respostas, [key]: valor });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, opacity: disabled ? 0.7 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {(campos || []).map((campo) => {
        const valor = respostas?.[campo.key];

        if (campo.type === 'repeater') {
          return (
            <div key={campo.key}>
              <strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>{campo.label}</strong>
              <Repeater campo={campo} valor={valor} onChange={(v) => set(campo.key, v)} />
            </div>
          );
        }

        if (campo.type === 'textarea') {
          return (
            <label key={campo.key} style={{ display: 'block' }}>
              <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>{campo.label}</strong>
              {campo.help && (
                <p style={{ color: 'var(--ht-text-muted)', fontSize: 13, margin: '0 0 8px' }}>{campo.help}</p>
              )}
              <textarea
                className="ht-input"
                style={{ minHeight: 110, resize: 'vertical' }}
                placeholder={campo.placeholder || ''}
                value={valor || ''}
                onChange={(e) => set(campo.key, e.target.value)}
              />
            </label>
          );
        }

        if (campo.type === 'select') {
          return (
            <label key={campo.key} style={{ display: 'block' }}>
              <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>{campo.label}</strong>
              <select className="ht-input" value={valor || ''} onChange={(e) => set(campo.key, e.target.value)}>
                <option value="">Selecione…</option>
                {(campo.options || []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (campo.type === 'checkbox') {
          return (
            <label key={campo.key} className="ht-check">
              <input
                type="checkbox"
                checked={!!valor}
                onChange={(e) => set(campo.key, e.target.checked)}
              />
              <span>{campo.label}</span>
            </label>
          );
        }

        if (TIPOS_MASCARADOS.has(campo.type)) {
          return (
            <label key={campo.key} style={{ display: 'block' }}>
              <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>{campo.label}</strong>
              {campo.help && (
                <p style={{ color: 'var(--ht-text-muted)', fontSize: 13, margin: '0 0 8px' }}>{campo.help}</p>
              )}
              <InputMascarado
                tipo={campo.type}
                valor={valor}
                placeholder={campo.placeholder}
                onChange={(v) => set(campo.key, v)}
              />
            </label>
          );
        }

        // default: text
        return (
          <label key={campo.key} style={{ display: 'block' }}>
            <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>{campo.label}</strong>
            <input
              className="ht-input"
              type="text"
              placeholder={campo.placeholder || ''}
              value={valor || ''}
              onChange={(e) => set(campo.key, e.target.value)}
            />
          </label>
        );
      })}
    </div>
  );
}
