// Config do servidor. O Next carrega .env / .env.local / .env.production
// automaticamente em process.env.
//
// Toda a persistencia passa pela Data API do Supabase (supabase-js) — NAO ha
// conexao Postgres direta (nada de DATABASE_URL). O backend usa o service_role
// para acessar o schema `ht`. Sem service_role o app sobe em modo degradado:
// front/login funcionam; funcoes de banco respondem erro claro ate ser setado.
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL || 'https://mbvybujpkwuorhtdzcde.supabase.co',
  supabaseAnonKey:
    process.env.SUPABASE_ANON_KEY || 'sb_publishable_ZCwMkDCoJ5_H7DHZ476TsQ_CesBbG9J',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  adminEmails: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  resendApiKey: process.env.RESEND_API_KEY,
  resendFrom: process.env.RESEND_FROM || 'Holding Total <central@holdingtotal.com.br>',
  hotmartHottok: process.env.HOTMART_HOTTOK,
  centralUrl: process.env.CENTRAL_URL || 'http://localhost:3000',
};

export const isProd = env.nodeEnv === 'production';

// service_role presente = funcoes de banco ativas.
export const hasServiceRole = !!env.supabaseServiceKey;
