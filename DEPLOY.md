# Deploy na Hostinger (Next.js)

A Central é um app **Next.js** (App Router): as páginas e as rotas de API
(`/api/*`) rodam no mesmo app. O deploy é feito pela tela **"Configurações e
reimplantação"** da Hostinger (build a partir do Git).

## 1. Subdomínio + DNS

hPanel → **Domínios → Subdomínios**: crie `central` em `holdingtotal.com.br`
→ `central.holdingtotal.com.br`.

## 2. Configuração de compilação (tela de deploy)

| Campo | Valor |
|---|---|
| Configuração predefinida | **Next.js** |
| Branch | `main` |
| Versão do node | **20.x** |
| Diretório raiz | `./` |
| Comando de construção | `npm run build` |
| Gerenciador de pacotes | `npm` |
| Diretório de saída | `.next` |

> Esses são os defaults do preset Next.js — agora **batem** com o projeto.
> A Hostinger roda `npm install` → `npm run build` (`next build`) → sobe o app
> (`next start` / `npm start` → `node server.js`). A `PORT` é injetada pelo
> ambiente e o `server.js` a respeita.

## 3. Variáveis de ambiente (seção "Variáveis de ambiente" → Adicionar)

Obrigatórias:

```
NODE_ENV=production
SUPABASE_URL=https://mbvybujpkwuorhtdzcde.supabase.co
SUPABASE_ANON_KEY=sb_publishable_ZCwMkDCoJ5_H7DHZ476TsQ_CesBbG9J
SUPABASE_SERVICE_ROLE_KEY=<secreto — Supabase → Settings → API>
DATABASE_URL=<pooler — Supabase → Settings → Database → Connection string (Transaction)>
ADMIN_EMAILS=marcio@advmais.com
CENTRAL_URL=https://central.holdingtotal.com.br
NEXT_PUBLIC_SUPABASE_URL=https://mbvybujpkwuorhtdzcde.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ZCwMkDCoJ5_H7DHZ476TsQ_CesBbG9J
```

Próximos épicos (deixar em branco por enquanto): `RESEND_API_KEY`,
`RESEND_FROM`, `HOTMART_HOTTOK`.

> **Modo degradado:** sem `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL` o app
> **sobe mesmo assim** (front + login funcionam); as funções de banco (perfil,
> ficha, avisos, ranking) só ativam quando essas duas forem definidas.
> As `NEXT_PUBLIC_*` têm default no código, mas defini-las é boa prática.

## 4. Deploy

Clique em **Salvar e reimplantar**. A cada `git push` na `main`, reimplante
(ou configure o auto-deploy).

## Checklist pós-deploy

- [ ] `https://central.holdingtotal.com.br/api/health` → `{"status":"ok","db":"ok","modo":"completo"}`
- [ ] `/login` carrega com a identidade HT (preto + laranja)
- [ ] Login → primeiro acesso cai em `/trocar-senha`; depois abre a Central
- [ ] Se `db` != `ok`, revisar `DATABASE_URL` (pooler) e `SUPABASE_SERVICE_ROLE_KEY`

## Estrutura

- `app/` — páginas (`/`, `/login`, `/trocar-senha`, `/bem-vindo`) + API (`app/api/*`)
- `components/` — providers de auth/estado do aluno e UI (client components)
- `lib/` — servidor: `db.js` (pg → schema `ht`), `supabase-admin.js` (service_role),
  `auth.js`, `env.js`; e `supabase-browser.js` (Auth no cliente)
- `server.js` — arquivo base de inicialização (sobe o Next respeitando `PORT`)
