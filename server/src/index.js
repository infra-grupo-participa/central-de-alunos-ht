import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { env, isProd } from './env.js';
import healthRoutes from './routes/health.js';
import meRoutes from './routes/me.js';
import announcementsRoutes from './routes/announcements.js';
import fichaRoutes from './routes/ficha.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = Fastify({ logger: true });

await app.register(cors, { origin: true, credentials: true });

// Rotas de API
await app.register(healthRoutes);
await app.register(meRoutes);
await app.register(announcementsRoutes);
await app.register(fichaRoutes);
// (proximos epicos: aulas, ranking, admin, webhooks)

// Serve o build do client em producao (SPA fallback)
const clientDist = resolve(__dirname, '../../client/dist');
if (isProd && existsSync(clientDist)) {
  await app.register(fastifyStatic, { root: clientDist, wildcard: false });
  app.setNotFoundHandler((req, reply) => {
    if (req.raw.url?.startsWith('/api')) return reply.code(404).send({ error: 'nao_encontrado' });
    return reply.sendFile('index.html');
  });
}

app
  .listen({ port: env.port, host: '0.0.0.0' })
  .then(() => app.log.info(`Central HT API on :${env.port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
