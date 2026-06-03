const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = process.env.PORT || 3000;
const app = next({ dev: false, dir: './apps/birthday' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Wish pages app ready on port ${port}`);
  });
});
