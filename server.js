const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');

// Hostinger enforces a shared task/thread ceiling across web apps. Next's
// native config loader otherwise sizes Rust pools from the host CPU count.
process.env.TOKIO_WORKER_THREADS ||= '1';
process.env.RAYON_NUM_THREADS ||= '1';

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0';

// Debug: print what port/env Hostinger is injecting
console.log(`[server.js] process.env.PORT = "${process.env.PORT}" → binding to port ${port}`);

// Resolve 'next' from the web app directory to handle npm workspace hoisting
const nextResolved = require.resolve('next', { paths: [path.join(__dirname, 'apps/web')] });
const next = require(nextResolved);

const app = next({
  dev: false,
  hostname,
  port,
  dir: path.join(__dirname, 'apps/web'),
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Just4You web app ready on http://${hostname}:${port}`);
    });
});
