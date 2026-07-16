'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Guard from '@/components/Guard.jsx';
import Navbar from '@/components/Navbar.jsx';
import WhatsAppFloat from '@/components/WhatsAppFloat.jsx';
import { useMe } from '@/components/MeProvider.jsx';
import { api } from '@/lib/supabase-browser.js';
import useTitle from '@/lib/useTitle.js';
import { maskNome, maskTelefone, telefoneValido, soDigitos } from '@/lib/masks.js';
import { IcoVoltar, IcoCheck, IcoConcluida, IcoErro } from '@/components/icons.jsx';

// Ficha de interesse — Holding Masters (formulário interno, perguntas OFICIAIS).
// As respostas vão em jsonb (ht.ficha_interesse.respostas): mudar pergunta não
// exige migração. Tipos: nome · email · tel · select · numero · multi · simnao.
const PERGUNTAS = [
  { key: 'nome', type: 'nome', label: 'Informe seu nome', placeholder: 'Seu nome completo' },
  { key: 'email', type: 'email', label: 'Informe o seu e-mail', placeholder: 'seu@email.com' },
  { key: 'telefone', type: 'tel', label: 'Informe o seu telefone', placeholder: '(11) 99999-9999' },
  {
    key: 'profissao',
    type: 'select',
    label: 'Qual a sua profissão?',
    options: ['Advogado(a)', 'Contador(a)', 'Advogado(a) e contador(a)', 'Outra'],
  },
  {
    key: 'nivel_holding',
    type: 'select',
    label: 'Hoje você se considera em qual nível em Holding Familiar?',
    options: [
      'Iniciante absoluto',
      'Já estudei, mas nunca apliquei',
      'Já participei de alguma estruturação',
      'Já conduzo contratos de holding',
    ],
  },
  {
    key: 'anos_carreira',
    type: 'numero',
    label: 'Quantos anos você tem de carreira?',
    placeholder: 'Ex.: 10',
  },
  {
    key: 'dificuldades',
    type: 'multi',
    label: 'Qual é a sua maior dificuldade para fazer o trabalho com Holding Familiar se encaixar na sua carreira?',
    help: 'Pode marcar mais de uma.',
    options: [
      'Insegurança e receio de errar com o patrimônio do cliente',
      'Dificuldade de captar clientes',
      'Falta de um método claro, passo a passo',
      'Precificação e proposta (quanto e como cobrar)',
      'Falta de tempo na rotina atual',
      'Outra',
    ],
  },
  {
    key: 'listou_10',
    type: 'simnao',
    label: 'Você listou os 10 possíveis clientes do "Plano Primeiro Contrato"?',
  },
  {
    key: 'executou_passos',
    type: 'simnao',
    label: 'Você executou todos os passos do "Plano Primeiro Contrato" até agora?',
  },
  {
    key: 'interesse_parceria',
    type: 'simnao',
    label: 'Você tem interesse em celebrar uma parceria de negócio de Holding Familiar com o Prof. Marcio Carvalho de Sá?',
  },
];

function FichaView() {
  useTitle('Ficha de interesse');
  const router = useRouter();
  const { me, refresh } = useMe();
  const [respostas, setRespostas] = useState({});
  const [estado, setEstado] = useState('carregando'); // carregando | aberta | bloqueada | enviada
  const [erro, setErro] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/ficha')
      .then((f) => {
        // Pré-preenche com o que já sabemos do aluno — menos atrito.
        const base = {
          nome: me?.profile?.nome || '',
          email: me?.profile?.email || '',
          telefone: me?.profile?.telefone || '',
          ...(f.respostas || {}),
        };
        setRespostas(base);
        if (f.status === 'respondida') setEstado('enviada');
        else if (!f.liberada) setEstado('bloqueada');
        else setEstado('aberta');
      })
      .catch(() => setEstado('aberta'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(key, valor) {
    setRespostas((r) => ({ ...r, [key]: valor }));
  }

  function alternarMulti(key, opcao) {
    setRespostas((r) => {
      const atual = Array.isArray(r[key]) ? r[key] : [];
      return {
        ...r,
        [key]: atual.includes(opcao) ? atual.filter((o) => o !== opcao) : [...atual, opcao],
      };
    });
  }

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    if (!String(respostas.nome || '').trim()) return setErro('Informe o seu nome.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(respostas.email || '').trim()))
      return setErro('Informe um e-mail válido.');
    if (!telefoneValido(respostas.telefone))
      return setErro('Telefone inválido — informe o DDD e o número completo.');
    if (!respostas.profissao) return setErro('Selecione a sua profissão.');
    if (!respostas.nivel_holding) return setErro('Selecione o seu nível em Holding Familiar.');
    if (!String(respostas.anos_carreira || '').trim())
      return setErro('Informe quantos anos você tem de carreira.');
    if (!Array.isArray(respostas.dificuldades) || respostas.dificuldades.length === 0)
      return setErro('Marque ao menos uma dificuldade.');
    for (const k of ['listou_10', 'executou_passos', 'interesse_parceria']) {
      if (!respostas[k]) {
        return setErro('Responda todas as perguntas de Sim ou Não.');
      }
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

  function campo(p) {
    const valor = respostas[p.key];

    if (p.type === 'select') {
      return (
        <select className="ht-input" value={valor || ''} onChange={(e) => set(p.key, e.target.value)}>
          <option value="">Selecione…</option>
          {p.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }

    if (p.type === 'multi') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {p.options.map((o) => (
            <label key={o} className="ht-check">
              <input
                type="checkbox"
                checked={Array.isArray(valor) && valor.includes(o)}
                onChange={() => alternarMulti(p.key, o)}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      );
    }

    if (p.type === 'simnao') {
      return (
        <div className="ht-simnao" role="radiogroup" aria-label={p.label}>
          {['Sim', 'Não'].map((o) => (
            <button
              key={o}
              type="button"
              className={`ht-simnao-btn ${valor === o ? 'ht-simnao-on' : ''}`}
              aria-pressed={valor === o}
              onClick={() => set(p.key, o)}
            >
              {o}
            </button>
          ))}
        </div>
      );
    }

    // text-like com máscara por tipo
    return (
      <input
        className="ht-input"
        type={p.type === 'email' ? 'email' : 'text'}
        inputMode={p.type === 'tel' ? 'tel' : p.type === 'numero' ? 'numeric' : undefined}
        maxLength={p.type === 'tel' ? 16 : p.type === 'numero' ? 2 : undefined}
        placeholder={p.placeholder || ''}
        value={valor || ''}
        onChange={(e) => {
          const v = e.target.value;
          if (p.type === 'nome') return set(p.key, maskNome(v));
          if (p.type === 'tel') return set(p.key, maskTelefone(v));
          if (p.type === 'numero') return set(p.key, soDigitos(v, 2));
          set(p.key, v);
        }}
      />
    );
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {PERGUNTAS.map((p) => (
                <div key={p.key}>
                  <strong style={{ display: 'block', fontSize: 15, marginBottom: 8, lineHeight: 1.4 }}>
                    {p.label}
                  </strong>
                  {p.help && (
                    <p style={{ color: 'var(--ht-text-muted)', fontSize: 13, margin: '0 0 10px' }}>{p.help}</p>
                  )}
                  {campo(p)}
                </div>
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
