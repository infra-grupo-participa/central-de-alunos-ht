'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Guard from '@/components/Guard.jsx';
import Navbar from '@/components/Navbar.jsx';
import WhatsAppFloat from '@/components/WhatsAppFloat.jsx';
import { useMe } from '@/components/MeProvider.jsx';
import { api } from '@/lib/supabase-browser.js';
import { maskNome, maskTelefone, telefoneValido } from '@/lib/masks.js';
import { IcoVoltar, IcoCheck, IcoConcluida, IcoErro } from '@/components/icons.jsx';

// Ficha de interesse — Holding Masters (formulário interno, estrutura básica).
// A copy final das perguntas será alinhada depois; as respostas vão em jsonb,
// então trocar as perguntas aqui não exige migração no banco.
const PERGUNTAS = [
  { key: 'nome', type: 'nome', label: 'Nome completo', placeholder: 'Seu nome' },
  { key: 'whatsapp', type: 'tel', label: 'WhatsApp (com DDD)', placeholder: '(11) 99999-9999' },
  {
    key: 'atuacao',
    type: 'select',
    label: 'Qual a sua atuação hoje?',
    options: ['Advogado(a)', 'Contador(a)', 'Advogado(a) e contador(a)', 'Outra'],
  },
  {
    key: 'tempo_atuacao',
    type: 'select',
    label: 'Há quanto tempo você atua?',
    options: ['Menos de 2 anos', '2 a 5 anos', '5 a 10 anos', 'Mais de 10 anos'],
  },
  {
    key: 'experiencia_holding',
    type: 'select',
    label: 'Você já trabalhou com holding familiar?',
    options: ['Nunca', 'Estudei, mas nunca apliquei', 'Já participei de alguma', 'Já conduzi contratos'],
  },
  {
    key: 'momento',
    type: 'select',
    label: 'Qual frase descreve melhor o seu momento?',
    options: [
      'Quero sair do contencioso e mudar de área',
      'Quero somar holding ao que já faço',
      'Já atuo e quero estruturar método e escala',
      'Estou começando a carreira agora',
    ],
  },
  {
    key: 'motivo',
    type: 'textarea',
    label: 'Por que o Holding Masters faz sentido para você agora?',
    placeholder: 'Conte em poucas linhas o que você busca.',
  },
];

function FichaView() {
  const router = useRouter();
  const { me, refresh } = useMe();
  const [respostas, setRespostas] = useState({});
  const [estado, setEstado] = useState('carregando'); // carregando | aberta | bloqueada | enviada
  const [erro, setErro] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/ficha')
      .then((f) => {
        setRespostas(f.respostas || {});
        if (f.status === 'respondida') setEstado('enviada');
        else if (!f.liberada) setEstado('bloqueada');
        else setEstado('aberta');
      })
      .catch(() => setEstado('aberta'));
  }, []);

  // Máscara por tipo: o dado entra limpo na digitação.
  function set(key, valor, tipo) {
    const v = tipo === 'nome' ? maskNome(valor) : tipo === 'tel' ? maskTelefone(valor) : valor;
    setRespostas((r) => ({ ...r, [key]: v }));
  }

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    if (!String(respostas.nome || '').trim()) {
      setErro('Preencha o seu nome completo.');
      return;
    }
    if (!telefoneValido(respostas.whatsapp)) {
      setErro('WhatsApp inválido — informe o DDD e o número completo.');
      return;
    }
    if (!respostas.atuacao) {
      setErro('Selecione a sua atuação.');
      return;
    }
    setBusy(true);
    try {
      await api('/api/ficha', { method: 'POST', body: JSON.stringify({ respostas }) });
      await refresh();
      setEstado('enviada');
    } catch {
      setErro('Não foi possível enviar agora. Tente de novo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ht-hero-glow" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 640,
          margin: '0 auto',
          padding: '26px 24px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div>
          <Link
            href="/"
            style={{
              color: 'var(--ht-text-dim)',
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <IcoVoltar size={15} />
            Voltar para a Central
          </Link>
          <span className="ht-tag" style={{ marginLeft: 12 }}>Holding Masters</span>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 34px)', textTransform: 'uppercase', marginTop: 12 }}>
            Ficha de interesse<span className="ht-accent">.</span>
          </h1>
          <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, lineHeight: 1.55, marginTop: 10 }}>
            Leva 2 minutos e garante o seu <strong style={{ color: 'var(--ht-orange)' }}>acesso
            antecipado</strong>: quando as vagas do Holding Masters abrirem, o seu carrinho abre 15
            minutos antes de todo mundo.
          </p>
        </div>

        {estado === 'bloqueada' && (
          <div className="ht-card" style={{ padding: 26, textAlign: 'center' }}>
            <p style={{ color: 'var(--ht-text-dim)', margin: 0 }}>
              A ficha abre junto com a <strong>Aula 4</strong>. Volte aqui depois dela.
            </p>
          </div>
        )}

        {estado === 'enviada' && (
          <div className="ht-card" style={{ padding: 26 }}>
            <p className="ht-success-msg" style={{ marginTop: 0 }}>
              <IcoConcluida size={17} />
              Ficha registrada. Seu carrinho abre 15 minutos antes da abertura geral.
            </p>
            <button className="ht-btn ht-btn-primary" style={{ marginTop: 12 }} onClick={() => router.push('/')}>
              Voltar para a Central
            </button>
          </div>
        )}

        {estado === 'aberta' && (
          <form className="ht-card" style={{ padding: 26 }} onSubmit={enviar}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {PERGUNTAS.map((p) => (
                <label key={p.key} style={{ display: 'block' }}>
                  <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>{p.label}</strong>
                  {p.type === 'select' ? (
                    <select
                      className="ht-input"
                      value={respostas[p.key] || ''}
                      onChange={(e) => set(p.key, e.target.value)}
                    >
                      <option value="">Selecione…</option>
                      {p.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : p.type === 'textarea' ? (
                    <textarea
                      className="ht-input"
                      style={{ minHeight: 100, resize: 'vertical' }}
                      placeholder={p.placeholder || ''}
                      value={respostas[p.key] || ''}
                      onChange={(e) => set(p.key, e.target.value)}
                    />
                  ) : (
                    <input
                      className="ht-input"
                      type="text"
                      inputMode={p.type === 'tel' ? 'tel' : undefined}
                      maxLength={p.type === 'tel' ? 16 : undefined}
                      placeholder={p.placeholder || ''}
                      value={respostas[p.key] || ''}
                      onChange={(e) => set(p.key, e.target.value, p.type)}
                    />
                  )}
                </label>
              ))}
            </div>

            {erro && (
              <p className="ht-error">
                <IcoErro size={16} />
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="ht-btn ht-btn-primary"
              disabled={busy}
              style={{ width: '100%', marginTop: 24, opacity: busy ? 0.7 : 1 }}
            >
              <IcoCheck size={17} strokeWidth={2.5} />
              {busy ? 'Enviando…' : 'Enviar ficha e garantir acesso antecipado'}
            </button>
          </form>
        )}
      </main>
      <WhatsAppFloat url={me?.carrinho?.whatsapp_url} />
    </div>
  );
}

export default function FichaPage() {
  return (
    <Guard>
      <FichaView />
    </Guard>
  );
}
