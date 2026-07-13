// Arquivo base de inicializacao para deploy (Hostinger / Node app / Passenger).
// Sobe o Next.js programaticamente e respeita a PORT injetada pelo ambiente.
// Uso: `node server.js` (ou `npm start`). Requer `next build` antes (gera .next).
//
// CommonJS de proposito (package.json nao usa "type":"module"), para rodar
// direto como "Application startup file" sem transpilacao.
const { createServer } = require('node:http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
      console.log(
        `> Central HT (Next.js) no ar em http://${hostname}:${port}  [${dev ? 'dev' : 'producao'}]`
      );
    });
  })
  .catch((err) => {
    console.error('Falha ao iniciar o Next.js:', err);
    process.exit(1);
  });
