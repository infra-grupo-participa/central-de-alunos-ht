// Config do servidor. O Next carrega .env / .env.local / .env.production
// automaticamente em process.env — nao precisa de dotenv.
//
// Valores publicos (URL do projeto + chave publishable) tem default embutido,
// entao o app sobe mesmo sem env configurado. Os SECRETOS (service_role e
// DATABASE_URL) nao tem default: sem eles o app roda em modo degradado
// (front/login no ar; funcoes de banco respondem erro claro ate serem setadas).
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL || 'https://mbvybujpkwuorhtdzcde.supabase.co',
  supabaseAnonKey:
    process.env.SUPABASE_ANON_KEY || 'sb_publishable_ZCwMkDCoJ5_H7DHZ476TsQ_CesBbG9J',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
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

// Flags de configuracao. O app SOBE mesmo sem os secretos (nao derruba o deploy);
// apenas degrada as funcoes de banco ate serem configurados.
export const hasServiceRole = !!env.supabaseServiceKey;
export const hasDatabase = !!env.databaseUrl;
