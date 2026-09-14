import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const output = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(output, '../../../instagram/reel-01-assets');
const assets = path.join(output, 'assets');
await fs.mkdir(assets, { recursive: true });
const crops = [
  { input: 'clean-01-hero.png', output: 'demo-hero.png', region: { left: 0, top: 0, width: 355, height: 632 } },
  { input: 'clean-02-letter.png', output: 'demo-letter.png', region: { left: 0, top: 203, width: 355, height: 429 } },
];
for (const crop of crops) {
  await sharp(path.join(source, crop.input)).extract(crop.region).png().toFile(path.join(assets, crop.output));
}
for (const font of ['georgiab.ttf', 'trebuc.ttf', 'trebucbd.ttf']) {
  await fs.copyFile(path.join(process.env.WINDIR || 'C:/Windows', 'Fonts', font), path.join(assets, font));
}
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filename = path.resolve(output, `.${pathname}`);
    if (!filename.startsWith(output + path.sep)) throw new Error('Outside output directory');
    const types = { '.html': 'text/html', '.png': 'image/png', '.ttf': 'font/ttf' };
    response.setHeader('Content-Type', types[path.extname(filename)] || 'application/octet-stream');
    response.end(await fs.readFile(filename));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const results = [];
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const variants = process.argv.includes('--first')
    ? [['personal', '4x5']]
    : [['personal', '4x5'], ['personal', '9x16'], ['link', '4x5'], ['link', '9x16']];
  for (const [concept, format] of variants) {
    const height = format === '9x16' ? 1920 : 1350;
    const page = await browser.newPage({ viewport: { width: 1080, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    await page.goto(`${origin}/ads.html?concept=${concept}&format=${format}`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
    });
    const layout = await page.evaluate(({ height, format }) => {
      const bounds = element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      const visible = element => element.getBoundingClientRect().width > 0;
      const safe = { left: 64, top: format === '9x16' ? 250 : 64, right: format === '9x16' ? 950 : 1016, bottom: format === '9x16' ? 1500 : height - 64 };
      const text = [...document.querySelectorAll('[data-text]')].map(element => ({ text: element.textContent, ...bounds(element) }));
      const products = [...document.querySelectorAll('[data-product]')].filter(visible).map(bounds);
      const images = [...document.images].filter(visible).map(image => ({ source: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, scale: image.width / image.naturalWidth, ...bounds(image) }));
      const violations = [];
      for (const rect of text) {
        if (rect.left < safe.left || rect.top < safe.top || rect.right > safe.right || rect.bottom > safe.bottom) violations.push(`Unsafe text: ${rect.text}`);
      }
      const overlap = (first, second) => first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
      for (let index = 0; index < text.length; index++) {
        for (const next of text.slice(index + 1)) if (overlap(text[index], next)) violations.push(`Text overlap: ${text[index].text} / ${next.text}`);
        for (const product of products) if (overlap(text[index], product)) violations.push(`Product obscures text: ${text[index].text}`);
      }
      for (const element of document.querySelectorAll('[data-text]')) {
        const parent = bounds(element);
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          for (const rect of range.getClientRects()) {
            if (rect.left < parent.left - 1 || rect.right > parent.right + 1 || rect.top < parent.top - 3 || rect.bottom > parent.bottom + 3) violations.push(`Text spills box: ${walker.currentNode.textContent}`);
          }
        }
      }
      for (const image of images) {
        if (!image.loaded || image.scale > 1.25) violations.push(`Image loading or enlargement: ${image.source}`);
        if (image.right > safe.right || image.bottom > safe.bottom || image.left < safe.left || image.top < safe.top) violations.push(`Unsafe product: ${image.source}`);
      }
      return { safe, text, images, products, violations, fontsLoaded: document.fonts.check('700 66px Editorial') && document.fonts.check('400 30px Humanist') };
    }, { height, format });
    const filename = `just4you-${concept}-${format}.png`;
    await page.screenshot({ path: path.join(output, filename), type: 'png', fullPage: false });
    const metadata = await sharp(path.join(output, filename)).metadata();
    const pixels = await sharp(path.join(output, filename)).stats();
    const nonblank = pixels.channels.slice(0, 3).some(channel => channel.stdev > 15);
    const passed = !layout.violations.length && !errors.length && layout.fontsLoaded && nonblank && metadata.width === 1080 && metadata.height === height;
    results.push({ filename, width: metadata.width, height: metadata.height, nonblank, passed, errors, ...layout });
    console.log(JSON.stringify({ filename, passed, violations: layout.violations, errors }));
    await page.close();
  }
  await fs.writeFile(path.join(output, 'qa.json'), JSON.stringify({ generatedAt: new Date().toISOString(), browser: 'Local Microsoft Edge / Playwright', localOnly: true, network: 'Loopback only; all external requests blocked', rights: 'Staged demo assets; permissions unknown for paid use. Local preview only. Windows font copies for local rendering, redistribution rights not established.', crops, results }, null, 2));
  if (results.length === 4) {
    const tiles = [];
    for (const [index, result] of results.entries()) {
      tiles.push({ input: await sharp(path.join(output, result.filename)).resize({ width: 324 }).png().toBuffer(), left: 24 + index * 348, top: 24 });
    }
    await sharp({ create: { width: 1416, height: 624, channels: 3, background: '#e8e8e8' } }).composite(tiles).png().toFile(path.join(output, 'contact-sheet.png'));
  }
  if (results.some(result => !result.passed)) process.exitCode = 1;
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}