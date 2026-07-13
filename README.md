# Central do Aluno HT (Holding Total)

Sistema de captação + gamificação para alunos do HT. Aulas liberadas por dia,
player com marcação de conclusão, deveres de casa, avisos, ficha de interesse e
um **ranking com participantes simulados** para prova social e engajamento
durante a semana de lançamento.

Subdomínio de produção: `central.holdingtotal.com.br`

## Stack

- **Framework:** Next.js (App Router) — páginas + API (`/api/*`) no mesmo app
  - `app/` — páginas (`/`, `/login`, `/trocar-senha`, `/bem-vindo`) e rotas de API
  - `lib/` — servidor: pg → schema `ht`, Supabase `service_role`, auth, env
  - `components/` — providers (auth/estado do aluno) e UI, identidade HT (preto + laranja)
- **Banco/Auth:** Supabase (projeto hub `mbvybujpkwuorhtdzcde`, schema isolado `ht`)
- **Player:** YouTube embutido + timer de conclusão (trocável por Panda)
- **Email:** Resend · **Checkout:** Hotmart · **Host:** Hostinger (deploy Next.js via Git)

## Setup local

```bash
npm install                    # instala o Next.js
cp .env.example .env.local     # preencher SERVICE_ROLE_KEY e DATABASE_URL
npm run dev                    # app em http://localhost:3000
```

Faltando no `.env.local` (pegar no painel Supabase → Settings):
- `SUPABASE_SERVICE_ROLE_KEY` (Settings → API)
- `DATABASE_URL` (Settings → Database → Connection string / pooler)

Sem esses dois o app roda em **modo degradado**: front + login funcionam, mas
as funções de banco só ativam após configurá-los. Deploy: ver `DEPLOY.md`.

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
