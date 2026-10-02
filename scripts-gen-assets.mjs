// Generates PNG favicons + social image from public/favicon.svg (run: node scripts-gen-assets.mjs)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
// One 1200x630 share card per page (public/og/<page>.jpg)
const OG = {
  home: ['Digital Agency', 'Build Your Brand. Grow Your Network. Move Your Business <em>Forward.</em>', 'Social · LinkedIn · Web · Apps · AI'],
  services: ['Services', 'Digital Services Built Around Your Business <em>Goals</em>', 'Social · LinkedIn · Web · Apps · AI'],
  about: ['About Us', 'A Digital Agency Built Around Your Business <em>Goals</em>', 'Karachi · London · Dubai'],
  contact: ['Contact', 'Let&rsquo;s Discuss Your Business <em>Goals</em>', 'hello@bigfuturdigital.com'],
};
mkdirSync('public/og', { recursive: true });
await p.setViewportSize({ width: 1200, height: 630 });
for (const [key, [eyebrow, title, foot]] of Object.entries(OG)) {
  await p.setContent(`<html><head><style>
@font-face{font-family:M;src:url(data:font/woff2;base64,${mont}) format('woff2');font-weight:100 900}
@font-face{font-family:S;font-style:italic;src:url(data:font/woff2;base64,${serif}) format('woff2')}
*{box-sizing:border-box}
body{margin:0;width:1200px;height:630px;background:#0b0b0c;color:#fff;font-family:M;position:relative;overflow:hidden}
.g{position:absolute;right:-260px;top:-300px;width:1000px;height:1000px;border-radius:50%;background:radial-gradient(closest-side,rgba(236,32,39,.55),rgba(236,32,39,.12) 55%,transparent)}
.g2{position:absolute;left:-300px;bottom:-420px;width:800px;height:800px;border-radius:50%;background:radial-gradient(closest-side,rgba(236,32,39,.16),transparent)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:60px 60px;-webkit-mask-image:radial-gradient(ellipse at 70% 30%,#000,transparent 70%)}
.m{position:absolute;right:70px;top:92px;width:330px;height:330px;filter:drop-shadow(0 30px 60px rgba(0,0,0,.5))}
.top{position:absolute;left:72px;top:64px;right:72px;display:flex;align-items:center;gap:14px}
.top b{font-size:24px;font-weight:800;letter-spacing:-.5px}.top span{font-size:13px;letter-spacing:6px;color:rgba(255,255,255,.6)}
.c{position:absolute;left:72px;bottom:72px;right:72px}
.e{display:inline-flex;align-items:center;gap:12px;font-size:16px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,.75);margin-bottom:26px}
.e:before{content:'';width:34px;height:2px;background:#ec2027}
h1{font-size:${title.length > 80 ? 66 : 74}px;line-height:.98;letter-spacing:-3px;font-weight:800;margin:0 0 34px;max-width:760px}
em{font-family:S;font-weight:400;color:#ec2027;letter-spacing:-1px;padding-right:4px}
.f{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.14);padding-top:22px;font-size:17px;color:rgba(255,255,255,.7);letter-spacing:.5px}
.f i{font-style:normal;color:#fff;font-weight:600}
</style></head><body><div class="g"></div><div class="g2"></div><div class="grid"></div>
<div class="top"><b>BIG FUTUR</b><span>DIGITAL</span></div>
<div class="m">${svg.replace('<svg', '<svg width="100%" height="100%"')}</div>
<div class="c"><div class="e">${eyebrow}</div><h1>${title}</h1><div class="f"><span>${foot}</span><i>big futur digital</i></div></div></body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `public/og/${key}.jpg`, type: 'jpeg', quality: 88 });
}
await b.close();
writeFileSync('public/site.webmanifest', JSON.stringify({
  name: 'Big Futur Digital', short_name: 'Big Futur', start_url: './', display: 'standalone', background_color: '#0b0b0c', theme_color: '#0b0b0c',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }, { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
}, null, 2));
console.log('done');
