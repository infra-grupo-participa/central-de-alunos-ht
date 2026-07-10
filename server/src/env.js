import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// .env na raiz do repo (ignorado se as vars ja vierem do ambiente, ex.: Hostinger)
config({ path: resolve(__dirname, '../../.env') });

export const env = {
  port: Number(process.env.PORT || 8787),
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
  adminEmails: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  resendApiKey: process.env.RESEND_API_KEY,
  resendFrom: process.env.RESEND_FROM || 'Holding Total <central@holdingtotal.com.br>',
  hotmartHottok: process.env.HOTMART_HOTTOK,
  centralUrl: process.env.CENTRAL_URL || 'http://localhost:5173',
};

export const isProd = env.nodeEnv === 'production';

// Falha cedo e com clareza se faltar configuracao essencial (evita stack
// trace obscuro do supabase-js/pg la na frente). Ajuste no painel da Hostinger
// (variaveis de ambiente) ou no arquivo .env local.
const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL'];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    '\n[Central HT] Configuracao ausente: ' +
      missing.join(', ') +
      '\n> Defina essas variaveis no painel Node.js da Hostinger (ou no .env local).' +
      '\n> Veja DEPLOY.md secao 4.\n'
  );
  process.exit(1);
}
