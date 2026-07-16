'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import Guard from '@/components/Guard.jsx';
import Navbar from '@/components/Navbar.jsx';
import WhatsAppFloat from '@/components/WhatsAppFloat.jsx';
import { useMe } from '@/components/MeProvider.jsx';
import { api } from '@/lib/supabase-browser.js';
import useTitle from '@/lib/useTitle.js';
import { maskNome, maskTelefone, telefoneValido } from '@/lib/masks.js';
import { IcoVoltar, IcoCheck, IcoConcluida, IcoErro, IcoPerfil } from '@/components/icons.jsx';

const PROFISSOES = ['Advogado(a)', 'Contador(a)', 'Advogado(a) e contador(a)', 'Outra'];
const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR',
  'PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

// Meus dados — o aluno mantém as próprias informações. Linguagem simples,
// um campo por vez, máscara em tudo que aceita máscara.
function PerfilView() {
  useTitle('Meus dados');
  const { me, refresh } = useMe();
  const cardRef = useRef(null);
  const [form, setForm] = useState(null);
  const [erro, setErro] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  // Carrega o form com o que já existe no profile.
  useEffect(() => {
    if (!me?.profile || form) return;
    const p = me.profile;
    setForm({
      nome: p.nome || '',
      telefone: p.telefone || '',
      profissao: p.profissao || '',
      cidade: p.cidade || '',
      uf: p.uf || '',
      instagram: p.instagram || '',
    });
  }, [me, form]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !form) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const tween = gsap.fromTo(
      el,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', clearProps: 'transform,opacity' }
    );
    return () => tween.kill();
  }, [form]);

  function set(key, valor) {
    setMsg(null);
    setForm((f) => ({ ...f, [key]: valor }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(null);
    if (!String(form.nome || '').trim()) {
      setErro('Preencha o seu nome completo.');
      return;
    }
    if (form.telefone && !telefoneValido(form.telefone)) {
      setErro('WhatsApp inválido — informe o DDD e o número completo.');
      return;
    }
    setBusy(true);
    try {
      const r = await api('/api/me/perfil', { method: 'POST', body: JSON.stringify(form) });
      await refresh();
      setMsg(r.mensagem || 'Dados atualizados!');
    } catch {
      setErro('Não foi possível salvar agora. Tente de novo.');
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
          maxWidth: 620,
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
          <span className="ht-tag" style={{ marginLeft: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IcoPerfil size={13} />
            Meus dados
          </span>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 34px)', textTransform: 'uppercase', marginTop: 12 }}>
            Suas informações<span className="ht-accent">.</span>
          </h1>
          <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, lineHeight: 1.55, marginTop: 10 }}>
            Mantenha seus dados em dia — é por aqui que a equipe fala com você e personaliza a sua
            experiência no Holding Total.
          </p>
        </div>

        {form && (
          <form className="ht-card" style={{ padding: 26 }} onSubmit={salvar} ref={cardRef}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <label style={{ display: 'block' }}>
                <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>Nome completo</strong>
                <input
                  className="ht-input"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={form.nome}
                  onChange={(e) => set('nome', maskNome(e.target.value))}
                />
              </label>

              <label style={{ display: 'block' }}>
                <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>WhatsApp</strong>
                <input
                  className="ht-input"
                  type="text"
                  inputMode="tel"
                  maxLength={16}
                  placeholder="(11) 99999-9999"
                  value={form.telefone}
                  onChange={(e) => set('telefone', maskTelefone(e.target.value))}
                />
              </label>

              <label style={{ display: 'block' }}>
                <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>Sua atuação</strong>
                <select className="ht-input" value={form.profissao} onChange={(e) => set('profissao', e.target.value)}>
                  <option value="">Selecione…</option>
                  {PROFISSOES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 12 }}>
                <label style={{ display: 'block' }}>
                  <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>Cidade</strong>
                  <input
                    className="ht-input"
                    type="text"
                    placeholder="Sua cidade"
                    value={form.cidade}
                    onChange={(e) => set('cidade', maskNome(e.target.value))}
                  />
                </label>
                <label style={{ display: 'block' }}>
                  <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>UF</strong>
                  <select className="ht-input" value={form.uf} onChange={(e) => set('uf', e.target.value)}>
                    <option value="">—</option>
                    {UFS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label style={{ display: 'block' }}>
                <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>Instagram</strong>
                <input
                  className="ht-input"
                  type="text"
                  placeholder="@seuperfil"
                  value={form.instagram}
                  onChange={(e) => {
                    const s = e.target.value.replace(/^@+/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30);
                    set('instagram', s ? `@${s}` : '');
                  }}
                />
              </label>
            </div>

            {erro && (
              <p className="ht-error">
                <IcoErro size={16} />
                {erro}
              </p>
            )}
            {msg && (
              <p className="ht-success-msg">
                <IcoConcluida size={16} />
                {msg}
              </p>
            )}

            <button
              type="submit"
              className="ht-btn ht-btn-primary"
              disabled={busy}
              style={{ width: '100%', marginTop: 24, opacity: busy ? 0.7 : 1 }}
            >
              <IcoCheck size={17} strokeWidth={2.5} />
              {busy ? 'Salvando…' : 'Salvar meus dados'}
            </button>
          </form>
        )}
      </main>
      <WhatsAppFloat url={me?.carrinho?.whatsapp_url} />
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Guard>
      <PerfilView />
    </Guard>
  );
}
