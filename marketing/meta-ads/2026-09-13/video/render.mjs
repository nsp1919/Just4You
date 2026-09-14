import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const output = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(output, '../../../..');
const assets = path.join(output, 'assets');
const source = path.join(root, 'generated-reels/reel-03-recipient-experience/assets/website-captures');
const fps = 30;
const scenes = [
  { id: 'hook', duration: 3, lines: ['A birthday wish.', 'Made personal.'], asset: '01-hero.png', crop: [0, 520, 1080, 850] },
  { id: 'name', duration: 3, lines: ['Their name.', 'Their celebration.'], asset: '01-hero.png', crop: [0, 620, 1080, 740] },
  { id: 'photos', duration: 4, lines: ['Your photos.', 'A place of their own.'], asset: '03-gallery.png', crop: [0, 80, 1080, 1040] },
  { id: 'message', duration: 4, lines: ['The words', 'only you can write.'], asset: '04-message.png', crop: [30, 130, 1020, 800] },
  { id: 'link', duration: 4, lines: ['One celebration.', 'One shareable link.'], asset: '01-hero.png', crop: [0, 610, 1080, 1310] },
  { id: 'cta', duration: 3, lines: ['Message SURPRISE', 'for the demo'], asset: '01-hero.png', crop: [0, 620, 1080, 740] },
];
const formats = [{ id: '9x16', width: 1080, height: 1920 }, { id: '4x5', width: 1080, height: 1350 }];
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
function run(command, args) {
  const result = spawnSync(command, args, { cwd: output, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command}: ${result.stderr || result.error}`);
  return result.stdout;
}
function text(value, x, y, size, color = '#36182B', family = 'Georgia', weight = 'normal') {
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="0">${escape(value)}</text>`.replace('<text ', `<text fill="${color}" `);
}
function background(scene, format) {
  const portrait = format.id === '9x16';
  const closing = scene.id === 'cta';
  const brandY = portrait ? 315 : 120;
  const titleY = portrait ? 450 : 250;
  const ctaY = portrait ? 1125 : 970;
  const title = closing
    ? text('Made for their birthday.', 90, titleY, 63)
    : scene.lines.map((line, index) => text(line, 90, titleY + index * 95, scene.id === 'photos' ? 70 : 76, index ? '#B91F58' : '#36182B')).join('');
  const cta = closing ? `${text(scene.lines[0], 90, ctaY, 78, '#B91F58', 'Trebuchet MS', 'bold')}${text(scene.lines[1], 90, ctaY + 86, 61)}` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${format.height}">
    <defs><pattern id="paper" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="0.7" fill="#DCA8BA" opacity="0.32"/></pattern></defs>
    <rect width="1080" height="${format.height}" fill="#FFF3F6"/><rect width="1080" height="${format.height}" fill="url(#paper)"/>
    <path d="M1010 0V${format.height}" stroke="#F1C3D2" stroke-width="2"/>
    ${text('Just4You', 90, brandY, 46, '#36182B', 'Trebuchet MS', 'bold')}
    ${text('PERSONALISED CELEBRATION WEBSITES', 90, brandY + 49, 24, '#17676B', 'Trebuchet MS', 'bold')}
    ${title}${cta}
    ${text('Demo / sample', 90, portrait ? 1460 : 1220, 30, '#68505E', 'Trebuchet MS')}
  </svg>`;
}
async function prepare(scene, format) {
  const portrait = format.id === '9x16';
  const closing = scene.id === 'cta';
  const maxHeight = closing ? (portrait ? 410 : 420) : (portrait ? 720 : 590);
  const [left, top, width, height] = scene.crop;
  const screenshot = await sharp(path.join(assets, scene.asset)).extract({ left, top, width, height }).resize({ width: 800, height: maxHeight, fit: 'inside' }).png().toBuffer();
  const metadata = await sharp(screenshot).metadata();
  const panel = path.join(assets, `${format.id}-${scene.id}-panel.png`);
  await sharp({ create: { width: metadata.width + 12, height: metadata.height + 12, channels: 4, background: '#36182B' } }).composite([{ input: screenshot, left: 6, top: 6 }]).png().toFile(panel);
  const bg = path.join(assets, `${format.id}-${scene.id}-background.png`);
  await sharp(Buffer.from(background(scene, format))).png().toFile(bg);
  return { bg, panel, x: Math.round((980 - metadata.width - 12) / 2), y: closing ? (portrait ? 605 : 395) : (portrait ? 650 : 435) };
}
async function main() {
  await fs.mkdir(assets, { recursive: true });
  for (const filename of [...new Set(scenes.map((scene) => scene.asset))]) {
    const destination = path.join(assets, filename);
    try { await fs.access(destination); } catch { await fs.copyFile(path.join(source, filename), destination); }
  }
  const probe = process.argv.includes('--probe');
  const manifest = { createdAt: new Date().toISOString(), duration: 21, fps, audio: 'Intentionally absent: user requested no voiceover, music or sound effects.', sourceUrl: 'https://just4you.buzz/demo/galaxy', originalCaptureManifest: 'generated-reels/reel-03-recipient-experience/website-capture-manifest.json', rights: 'Existing public staged/demo captures. Paid-media rights for demo photography are NOT verified. No private customer media used. Confirm rights before publication.', safeZone9x16: { top: 250, bottom: 420, right: 130 }, scenes, formats, assets: [...new Set(scenes.map((scene) => scene.asset))].map((filename) => ({ local: `assets/${filename}`, original: `generated-reels/reel-03-recipient-experience/assets/website-captures/${filename}` })) };
  for (const format of formats) {
    const segments = [];
    for (const scene of probe ? [scenes[0]] : scenes) {
      const layer = await prepare(scene, format);
      const base = `${format.id}-${scene.id}`;
      const motion = scene.id === 'cta' ? `${layer.x}:${layer.y}` : `${layer.x}+8*sin(t*0.65):${layer.y}+10*(1-cos(t*0.6))`;
      const filter = `[0:v][1:v]overlay=x='${motion.split(':')[0]}':y='${motion.split(':')[1]}':eval=frame,setsar=1,format=yuv420p[v]`;
      const target = path.join(output, probe ? `probe-${format.id}.png` : `${base}.mp4`);
      const args = ['-y', '-hide_banner', '-loglevel', 'error', '-loop', '1', '-framerate', '30', '-i', layer.bg, '-loop', '1', '-framerate', '30', '-i', layer.panel, '-filter_complex', filter, '-map', '[v]', '-an'];
      if (probe) args.push('-frames:v', '1');
      else args.push('-t', String(scene.duration), '-r', '30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p');
      run('ffmpeg', [...args, target]);
      segments.push(target);
      console.log(`Rendered ${base}${probe ? ' test frame' : ''}`);
    }
    if (!probe) {
      const concatFile = path.join(output, `concat-${format.id}.txt`);
      await fs.writeFile(concatFile, segments.map((segment) => `file '${path.basename(segment)}'`).join('\n'));
      const final = path.join(output, `just4you-message-demo-${format.id}.mp4`);
      run('ffmpeg', ['-n', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', concatFile, '-map', '0:v:0', '-c:v', 'copy', '-an', '-movflags', '+faststart', final]);
    }
  }
  await fs.writeFile(path.join(output, 'source-manifest.json'), JSON.stringify(manifest, null, 2));
}
await main();