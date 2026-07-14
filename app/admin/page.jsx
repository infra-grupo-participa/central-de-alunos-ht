'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Guard from '@/components/Guard.jsx';
import Navbar from '@/components/Navbar.jsx';
import Splash from '@/components/Splash.jsx';
import { useMe } from '@/components/MeProvider.jsx';
import { api } from '@/lib/supabase-browser.js';
import { IcoBusca, IcoErro, IcoCarregando } from '@/components/icons.jsx';

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'nunca_acessaram', label: 'Nunca acessaram' },
  { id: 'sem_aula', label: 'Sem nenhuma aula' },
  { id: 'sem_ficha', label: 'Sem ficha' },
];

function desde(iso) {
  if (!iso) return 'nunca';
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1) return 'agora há pouco';
  if (h < 24) return `há ${Math.floor(h)}h`;
  const d = Math.floor(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

function AdminView() {
  const [m, setM] = useState(null);
  const [erro, setErro] = useState(null);
  const [alunos, setAlunos] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    api('/api/admin/metrics')
      .then(setM)
      .catch(() => setErro('Não foi possível carregar as métricas agora.'));
  }, []);

  const carregarAlunos = useCallback(async () => {
    const params = new URLSearchParams({ filtro });
    if (busca.trim()) params.set('q', busca.trim());
    try {
      setAlunos(await api(`/api/admin/alunos?${params}`));
    } catch {
      setAlunos({ total: 0, alunos: [] });
    }
  }, [busca, filtro]);

  // Busca com respiro: espera o gestor parar de digitar antes de bater na API.
  useEffect(() => {
    const t = setTimeout(carregarAlunos, 300);
    return () => clearTimeout(t);
  }, [carregarAlunos]);

  if (erro) {
    return (
      <p className="ht-error" style={{ maxWidth: 980, margin: '40px auto' }}>
        <IcoErro size={16} />
        {erro}
      </p>
    );
  }

  if (!m) {
    return (
      <p style={{ color: 'var(--ht-text-dim)', textAlign: 'center', marginTop: 60 }}>
        <IcoCarregando size={18} className="ht-spin" /> Carregando métricas...
      </p>
    );
  }

  const f = m.funil;

  return (
    <main
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 1080,
        margin: '0 auto',
        padding: '28px 24px 60px',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      <section>
        <span className="ht-tag">Painel interno</span>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 38px)', textTransform: 'uppercase', marginTop: 14 }}>
          Métricas da <span className="ht-accent">turma</span>.
        </h1>
        <p style={{ color: 'var(--ht-text-dim)', fontSize: 15, marginTop: 10 }}>
          {m.cohort?.nome || 'Sem turma ativa'} — {m.aulas_liberadas} de {m.aulas.length} aulas
          liberadas. Números reais de engajamento (o ranking do aluno não entra aqui).
        </p>
      </section>

      {/* Funil de alunos */}
      <section className="ht-card" style={{ padding: '22px 24px' }}>
        <strong className="ht-admin-titulo">Funil de alunos</strong>
        <div className="ht-admin-kpis">
          <Kpi n={f.total_alunos} l="Alunos na base" />
          <Kpi n={f.primeiro_acesso_feito} l="Fizeram o 1º acesso" total={f.total_alunos} />
          <Kpi n={f.ativos_24h} l="Ativos nas últimas 24h" total={f.total_alunos} />
          <Kpi n={f.ativos_7d} l="Ativos nos últimos 7 dias" total={f.total_alunos} />
          <Kpi n={f.nunca_acessaram} l="Nunca entraram" total={f.total_alunos} alerta />
          <Kpi n={f.sumidos_48h} l="Sumidos há +48h" total={f.total_alunos} alerta />
          <Kpi n={f.concluiram_tudo_liberado} l="Em dia com as aulas" total={f.total_alunos} />
        </div>
      </section>

      {/* Engajamento por aula */}
      <section className="ht-card" style={{ padding: '22px 24px' }}>
        <strong className="ht-admin-titulo">Engajamento por aula</strong>
        <div className="ht-tabela-wrap">
          <table className="ht-tabela">
            <thead>
              <tr>
                <th>Aula</th>
                <th>Abriram</th>
                <th>Assistindo</th>
                <th>Concluíram</th>
                <th>Taxa</th>
                <th>Tempo médio</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {m.aulas.map((a) => (
                <tr key={a.id} style={{ opacity: a.liberada ? 1 : 0.45 }}>
                  <td>
                    <strong>Aula {a.day_index}</strong>
                    <span className="ht-tabela-sub">
                      {a.liberada ? a.titulo : 'ainda bloqueada'}
                    </span>
                  </td>
                  <td>{a.abriram}</td>
                  <td>{a.assistindo}</td>
                  <td>{a.concluiram}</td>
                  <td>
                    <div className="ht-barra">
                      <div className="ht-barra-fill" style={{ width: `${a.taxa_conclusao}%` }} />
                    </div>
                    <span className="ht-tabela-sub">{a.taxa_conclusao}%</span>
                  </td>
                  <td>
                    {a.minutos_medios} min
                    <span className="ht-tabela-sub">de {a.min_watch_minutes} exigidos</span>
                  </td>
                  <td>
                    {a.nota_media ? (
                      <>
                        {a.nota_media}
                        <span className="ht-tabela-sub">{a.avaliacoes} avaliações</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {!m.aulas.length && (
                <tr>
                  <td colSpan={7} style={{ color: 'var(--ht-text-muted)' }}>
                    Nenhuma aula cadastrada na turma ativa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ficha de interesse */}
      <section className="ht-card" style={{ padding: '22px 24px' }}>
        <strong className="ht-admin-titulo">Ficha de interesse</strong>
        <div className="ht-admin-kpis">
          <Kpi n={m.ficha.respondida} l="Responderam" total={f.total_alunos} />
          <Kpi n={m.ficha.abriu_sem_responder} l="Abriram e não enviaram" alerta />
          <Kpi n={m.ficha.nao_abriu} l="Nem abriram" alerta />
          <Kpi n={`${m.ficha.taxa_resposta}%`} l="Taxa de resposta" />
        </div>
        <p style={{ color: 'var(--ht-text-muted)', fontSize: 13, marginTop: 14, marginBottom: 0 }}>
          &quot;Responderam&quot; é auto-declarado pelo aluno no botão &quot;Já respondi&quot; — o
          Respondi não devolve confirmação automática.
        </p>
      </section>

      {/* Lista de alunos */}
      <section className="ht-card" style={{ padding: '22px 24px' }}>
        <strong className="ht-admin-titulo">Alunos</strong>

        <div className="ht-admin-filtros">
          <div className="ht-field" style={{ margin: 0, flex: 1, minWidth: 220 }}>
            <input
              className="ht-input"
              placeholder="Buscar por nome ou e-mail"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <IcoBusca size={16} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTROS.map((x) => (
              <button
                key={x.id}
                className={`ht-chip ${filtro === x.id ? 'ht-chip-on' : ''}`}
                onClick={() => setFiltro(x.id)}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ht-tabela-wrap">
          <table className="ht-tabela">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Último acesso</th>
                <th>Aulas</th>
                <th>Assistido</th>
                <th>Pontos</th>
                <th>Ficha</th>
              </tr>
            </thead>
            <tbody>
              {(alunos?.alunos || []).map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.nome || a.email?.split('@')[0]}</strong>
                    <span className="ht-tabela-sub">{a.email}</span>
                  </td>
                  <td>
                    {desde(a.last_seen_at)}
                    {!a.primeiro_acesso_feito && (
                      <span className="ht-tabela-sub">não trocou a senha</span>
                    )}
                  </td>
                  <td>
                    {a.aulas_concluidas}
                    <span className="ht-tabela-sub">de {m.aulas_liberadas} liberadas</span>
                  </td>
                  <td>{a.minutos_assistidos} min</td>
                  <td>{a.pontos}</td>
                  <td>
                    <span
                      className={`ht-pill ${
                        a.ficha_status === 'respondida'
                          ? 'ht-pill-ok'
                          : a.ficha_abriu
                            ? 'ht-pill-meio'
                            : 'ht-pill-off'
                      }`}
                    >
                      {a.ficha_status === 'respondida'
                        ? 'respondida'
                        : a.ficha_abriu
                          ? 'abriu'
                          : 'pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {alunos && !alunos.alunos.length && (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--ht-text-muted)' }}>
                    Nenhum aluno encontrado com esse filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {alunos && (
          <p style={{ color: 'var(--ht-text-muted)', fontSize: 13, marginTop: 12, marginBottom: 0 }}>
            {alunos.total} aluno{alunos.total === 1 ? '' : 's'} — ordenados do menos engajado para o
            mais engajado.
          </p>
        )}
      </section>
    </main>
  );
}

function Kpi({ n, l, total, alerta }) {
  const pct = total && typeof n === 'number' ? Math.round((n / total) * 100) : null;
  return (
    <div className="ht-kpi">
      <span className={`ht-kpi-n ${alerta && n > 0 ? 'ht-kpi-alerta' : ''}`}>{n}</span>
      <span className="ht-kpi-l">{l}</span>
      {pct !== null && <span className="ht-kpi-pct">{pct}% da base</span>}
    </div>
  );
}

// So admin entra. O Guard ja garante sessao + senha trocada; aqui checamos o
// is_admin que veio do /api/me e devolvemos o aluno comum pra Central.
function SomenteAdmin({ children }) {
  const { me, loading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (me && !me.is_admin) router.replace('/');
  }, [me, router]);

  if (!me || loading) return <Splash />;
  if (!me.is_admin) return <Splash />;
  return children;
}

export default function AdminPage() {
  return (
    <Guard>
      <SomenteAdmin>
        <div
          className="ht-hero-glow"
          style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <Navbar />
          <AdminView />
        </div>
      </SomenteAdmin>
    </Guard>
  );
}
