// Generates PNG favicons + social image from public/favicon.svg (run: node scripts-gen-assets.mjs)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const svg = readFileSync('public/favicon.svg', 'utf8');
const b = await chromium.launch();
const p = await b.newPage();
for (const [name, size, pad] of [['favicon-32.png', 32, 0], ['apple-touch-icon.png', 180, 0.12], ['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 0.16]]) {
  await p.setViewportSize({ width: size, height: size });
  const bg = pad ? '#0b0b0c' : 'transparent';
  await p.setContent(`<html><body style="margin:0;background:${bg};display:grid;place-items:center;width:${size}px;height:${size}px">
    <div style="width:${size * (1 - pad * 2)}px;height:${size * (1 - pad * 2)}px">${svg.replace('<svg', '<svg width="100%" height="100%"')}</div></body></html>`);
  await p.screenshot({ path: `public/${name}`, omitBackground: !pad });
}
const font = (f) => readFileSync(f).toString('base64');
const mont = font('node_modules/@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2');
const serif = font('node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2');
await p.setViewportSize({ width: 1200, height: 630 });
await p.setContent(`<html><head><style>
@font-face{font-family:M;src:url(data:font/woff2;base64,${mont}) format('woff2');font-weight:100 900}
@font-face{font-family:S;font-style:italic;src:url(data:font/woff2;base64,${serif}) format('woff2')}
body{margin:0;width:1200px;height:630px;background:#0b0b0c;color:#fff;font-family:M;position:relative;overflow:hidden}
.g{position:absolute;right:-200px;top:-260px;width:900px;height:900px;border-radius:50%;background:radial-gradient(closest-side,rgba(236,32,39,.5),transparent)}
.m{position:absolute;right:80px;top:120px;width:300px;height:300px}
.c{position:absolute;left:80px;bottom:80px}
h1{font-size:78px;line-height:.95;letter-spacing:-3.5px;font-weight:800;margin:0 0 30px;max-width:720px}
em{font-family:S;font-weight:400;color:#ec2027;letter-spacing:-1px}
.l{display:flex;align-items:center;gap:14px}.l b{font-size:26px;font-weight:800}.l span{font-size:14px;letter-spacing:6px;color:rgba(255,255,255,.6)}
</style></head><body><div class="g"></div><div class="m">${svg.replace('<svg', '<svg width="100%" height="100%"')}</div>
<div class="c"><h1>Build Your Brand. Move Your Business <em>Forward.</em></h1><div class="l"><b>BIG FUTUR</b><span>DIGITAL</span></div></div></body></html>`);
await p.waitForTimeout(300);
await p.screenshot({ path: 'public/og-image.png' });
await b.close();
writeFileSync('public/site.webmanifest', JSON.stringify({
  name: 'Big Futur Digital', short_name: 'Big Futur', start_url: './', display: 'standalone', background_color: '#0b0b0c', theme_color: '#0b0b0c',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }, { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
}, null, 2));
console.log('done');
