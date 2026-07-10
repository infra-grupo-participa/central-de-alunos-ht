# Central do Aluno HT (Holding Total)

Sistema de captação + gamificação para alunos do HT. Aulas liberadas por dia,
player com marcação de conclusão, deveres de casa, avisos, ficha de interesse e
um **ranking com participantes simulados** para prova social e engajamento
durante a semana de lançamento.

Subdomínio de produção: `central.holdingtotal.com.br`

## Stack

- **Backend:** Node + Fastify (`server/`) — API, webhook Hotmart, motor de ranking
- **Frontend:** React + Vite (`client/`) — identidade visual HT (preto + laranja)
- **Banco/Auth:** Supabase (projeto hub `mbvybujpkwuorhtdzcde`, schema isolado `ht`)
- **Player:** YouTube embutido + timer de conclusão (trocável por Panda)
- **Email:** Resend · **Checkout:** Hotmart · **Host:** Hostinger (Node app)

## Setup local

```bash
npm install                    # instala server + client (workspaces)
cp .env.example .env           # preencher SERVICE_ROLE_KEY e DATABASE_URL
cp client/.env.example client/.env
npm run dev                    # API :8787 + Web :5173
```

Faltando no `.env` (pegar no painel Supabase → Settings):
- `SUPABASE_SERVICE_ROLE_KEY` (API)
- `DATABASE_URL` (Database → Connection string / pooler)

## Banco de dados

Schema `ht` no projeto Supabase hub. Migração inicial já aplicada
(`ht_schema_init`). Tabelas: cohorts, profiles, lessons, homeworks,
lesson_progress, homework_submissions, ficha_interesse, points_ledger,
announcements, fake_personas, settings, admins.

Já semeado: 1 cohort-template com as 6 aulas apontando para os vídeos do YouTube.

## Roadmap (épicos)

- [x] **Épico 0** — Fundação: schema `ht`, repo, tema HT, health check
- [ ] **Épico 1** — Central & Captação (home, avisos, ficha, contagem regressiva)
- [ ] **Épico 2** — Provisionamento (webhook Hotmart, senha genérica, email)
- [ ] **Épico 3** — Aulas & Player (YouTube + timer 10min + conclusão)
- [ ] **Épico 4** — Progresso & Admin (cronograma-template, monitor)
- [ ] **Épico 5** — Gamificação & Ranking manipulado
- [ ] **Épico 6** — Semana da Live (takeover agressivo)
