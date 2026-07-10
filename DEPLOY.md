# Deploy na Hostinger (Node app)

A Central roda como **um único Node app**: o Fastify serve a API **e** o build do
React no mesmo domínio. O Hostinger usa Passenger, então basta apontar o
arquivo de inicialização e definir as variáveis de ambiente.

## 1. Subdomínio + DNS

No hPanel → **Domínios → Subdomínios**, crie `central` em `holdingtotal.com.br`
→ resultado: `central.holdingtotal.com.br`.

## 2. Criar a aplicação Node

hPanel → **Avançado → Node.js** (ou "Configurar aplicativo Node.js"):

| Campo | Valor |
|---|---|
| Versão do Node | 20 (ou 18+) |
| Modo | **Production** |
| Application root | pasta onde o repo foi clonado (ex.: `domains/central.holdingtotal.com.br/central-de-alunos-ht`) |
| Application URL | `central.holdingtotal.com.br` |
| **Application startup file** | `app.js` |

## 3. Colocar o código

Preferível via **Git** (na aba do app ou por SSH):

```bash
git clone https://github.com/infra-grupo-participa/central-de-alunos-ht.git
# atualizações futuras:
git pull
```

## 4. Variáveis de ambiente (na tela do app Node)

Obrigatórias:

```
NODE_ENV=production
SUPABASE_URL=https://mbvybujpkwuorhtdzcde.supabase.co
SUPABASE_ANON_KEY=sb_publishable_ZCwMkDCoJ5_H7DHZ476TsQ_CesBbG9J
SUPABASE_SERVICE_ROLE_KEY=<secreto — Supabase → Settings → API>
DATABASE_URL=<pooler — Supabase → Settings → Database → Connection string (Transaction)>
ADMIN_EMAILS=marcio@advmais.com
CENTRAL_URL=https://central.holdingtotal.com.br
```

Próximos épicos (deixar em branco por enquanto):

```
RESEND_API_KEY=
RESEND_FROM=Holding Total <central@holdingtotal.com.br>
HOTMART_HOTTOK=
```

> `PORT` **não** precisa ser definida — o Passenger injeta automaticamente e o
> servidor já a respeita.

## 5. Instalar e iniciar

Na tela do app, clique em **Run NPM Install**. Isso:
1. instala `server` + `client` (workspaces);
2. roda o `postinstall`, que **builda o client** para `client/dist`.

Depois clique em **Restart**. Pronto: `https://central.holdingtotal.com.br`.

> O `vite` está em `dependencies` (não devDependencies) de propósito, para o
> build funcionar mesmo com a instalação em modo produção.

## 6. Redeploy (a cada atualização)

```bash
git pull
```
→ **Run NPM Install** (rebuilda o client) → **Restart**.

## Como o app serve tudo

- `app.js` → `server/src/index.js` (Fastify).
- Rotas `/api/*` = backend.
- Qualquer outra rota = `client/dist/index.html` (SPA React Router).
- Só ativa o modo de servir estático quando `NODE_ENV=production`.

## Checklist pós-deploy

- [ ] `https://central.holdingtotal.com.br/api/health` → `{"status":"ok","db":"ok"}`
- [ ] Página de login carrega com a identidade HT (preto + laranja)
- [ ] Se `db` != `ok`, revisar `DATABASE_URL` (pooler) e `SUPABASE_SERVICE_ROLE_KEY`
