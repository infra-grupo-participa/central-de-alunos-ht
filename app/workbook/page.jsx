'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Guard from '@/components/Guard.jsx';
import { useMe } from '@/components/MeProvider.jsx';
import { api } from '@/lib/supabase-browser.js';
import useTitle from '@/lib/useTitle.js';
import Logo from '@/components/Logo.jsx';
import { IcoVoltar, IcoImprimir } from '@/components/icons.jsx';

// Workbook completo: todas as aulas + os exercícios com as respostas do aluno,
// num layout organizado e pronto para virar PDF (impressão do navegador →
// "Salvar como PDF"). Sem dependência de lib de PDF: funciona em qualquer
// hospedagem e o resultado é fiel ao que está na tela.

function valorLegivel(v) {
  if (v === true) return 'Sim';
  if (v === false || v == null || v === '') return '—';
  return String(v);
}

function RespostaCampo({ campo, respostas }) {
  const valor = respostas?.[campo.key];

  if (campo.type === 'repeater') {
    const linhas = (Array.isArray(valor) ? valor : []).filter((l) =>
      (campo.fields || []).some((f) => String(l?.[f.key] || '').trim())
    );
    return (
      <div className="wb-campo">
        <strong>{campo.label}</strong>
        {linhas.length === 0 ? (
          <p className="wb-vazio">Sem registros.</p>
        ) : (
          <table className="wb-tabela">
            <thead>
              <tr>
                <th>#</th>
                {(campo.fields || []).map((f) => (
                  <th key={f.key}>{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  {(campo.fields || []).map((f) => (
                    <td key={f.key}>{valorLegivel(l?.[f.key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div className="wb-campo">
      <strong>{campo.label}</strong>
      <p className={String(valor || '').trim() || valor === true ? '' : 'wb-vazio'}>
        {valorLegivel(valor)}
      </p>
    </div>
  );
}

function WorkbookView() {
  useTitle('Workbook');
  const { me } = useMe();
  const [itens, setItens] = useState(null);

  useEffect(() => {
    api('/api/exercicios?full=1').then(setItens).catch(() => setItens([]));
  }, []);

  const nome = me?.profile?.nome || me?.profile?.email || '';
  const liberados = (itens || []).filter((e) => e.liberado);

  return (
    <div className="wb-page">
      {/* Barra de ações — some na impressão */}
      <div className="wb-toolbar">
        <Link href="/" className="ht-btn ht-btn-ghost" style={{ textDecoration: 'none' }}>
          <IcoVoltar size={16} />
          Voltar
        </Link>
        <button className="ht-btn ht-btn-primary" onClick={() => window.print()}>
          <IcoImprimir size={17} />
          Baixar em PDF
        </button>
      </div>

      {/* Capa */}
      <header className="wb-capa">
        <div className="wb-logo">
          <Logo size={54} />
        </div>
        <h1>
          Workbook
          <br />
          Holding Total
        </h1>
        <p className="wb-sub">Plano do primeiro contrato — aulas e exercícios executados</p>
        {nome && <p className="wb-aluno">{nome}</p>}
      </header>

      {/* Aulas + exercícios */}
      {itens === null ? (
        <p style={{ textAlign: 'center', color: 'var(--ht-text-dim)' }}>Montando seu workbook…</p>
      ) : (
        liberados.map((e) => (
          <section key={e.id} className="wb-aula">
            <div className="wb-aula-head">
              <span className="wb-dia">Aula {e.day_index}</span>
              <h2>{e.aula?.titulo?.replace(/^Aula \d+\s*[-—]\s*/, '') || e.titulo}</h2>
            </div>

            <div className="wb-exercicio">
              <h3>Exercício: {e.titulo}</h3>
              {e.objetivo && <p className="wb-objetivo">{e.objetivo}</p>}
              {(e.campos || []).map((campo) => (
                <RespostaCampo key={campo.key} campo={campo} respostas={e.respostas} />
              ))}
              <p className="wb-status">
                {e.concluido
                  ? `Concluído${e.completed_at ? ` em ${new Date(e.completed_at).toLocaleDateString('pt-BR')}` : ''}.`
                  : 'Ainda não concluído.'}
              </p>
            </div>
          </section>
        ))
      )}

      <footer className="wb-footer">
        <p>Holding familiar é método, não improviso.</p>
        <p>Holding Total · Time Holding Brasil</p>
      </footer>
    </div>
  );
}

export default function WorkbookPage() {
  return (
    <Guard>
      <WorkbookView />
    </Guard>
  );
}
