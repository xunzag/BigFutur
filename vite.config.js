import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

/*
 * Tiny static-site layer:
 *  - <!--@header:page-->, <!--@footer-->, <!--@chrome--> are swapped for shared partials
 *  - href="@/services/#x" style links are rewritten relative to the current page,
 *    so the build works from any folder (and with PREVIEW=1, as plain index.html files).
 */
const PREVIEW = process.env.PREVIEW === '1';
const SITE = 'https://bigfuturdigital.com';
const markParts = JSON.parse(readFileSync(resolve(__dirname, 'partials-mark.json'), 'utf8'));

export const markSVG = (cls = '', { animate = false } = {}) => animate ? `
<svg class="mark ${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
  <circle class="mark__disc" cx="50" cy="50" r="50"/>
  ${markParts.map((d, i) => `<path class="mark__part mark__part--${i}" data-part d="${d}"/>`).join('')}
</svg>` : `<svg class="mark ${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle class="mark__disc" cx="50" cy="50" r="50"/><use class="mark__part" href="#bf-glyph"/></svg>`;

const markSymbol = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="bf-glyph" viewBox="0 0 100 100">${markParts.map((d) => `<path d="${d}"/>`).join('')}</symbol></svg>`;


const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICONS = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  social: I('<path d="M4 5h16v10H9l-5 4V5z"/><path d="M12 12.2c-1.9-1.3-3-2.3-3-3.4A1.6 1.6 0 0 1 12 8a1.6 1.6 0 0 1 3 .8c0 1.1-1.1 2.1-3 3.4z"/>'),
  profile: I('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10.5" r="2.3"/><path d="M5.5 16.5c.8-1.7 2-2.5 3.5-2.5s2.7.8 3.5 2.5M14.5 9.5h3.5M14.5 13h3.5"/>'),
  company: I('<path d="M4 20V6l7-3v17M11 20V9l9 3v8M2 20h20M7 8v.01M7 11v.01M7 14v.01M15 14v.01M15 17v.01"/>'),
  network: I('<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><circle cx="12" cy="13" r="1.6"/><path d="M12 7.2v4.2M10.7 14l-4 2.8M13.3 14l4 2.8M7.2 18h9.6"/>'),
  wordpress: I('<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M2.5 8.5h19M6 6.3v.01M8.5 6.3v.01M9 13l-2 2 2 2M15 13l2 2-2 2M13 12.5l-2 5"/>'),
  shopify: I('<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>'),
  mobile: I('<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>'),
  ai: I('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>'),
  target: I('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>'),
  compass: I('<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
  people: I('<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.9-3 2.9-4.5 5.5-4.5s4.6 1.5 5.5 4.5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M16 14.6c2.3-.2 3.9 1.3 4.5 3.9"/>'),
};

const NAV = [
  ['home', 'Home', '@/'],
  ['services', 'Services', '@/services/'],
  ['about', 'About Us', '@/about/'],
  ['contact', 'Contact Us', '@/contact/'],
];

const SERVICES = [
  ['social-media-management', 'Social Media Management'],
  ['linkedin-profile-management', 'LinkedIn Profile Management'],
  ['linkedin-company-page-management', 'LinkedIn Company Page Management'],
  ['linkedin-lead-generation', 'LinkedIn Network Building & Lead Generation'],
  ['wordpress-development', 'WordPress Website Development'],
  ['shopify-development', 'Shopify Store Development'],
  ['mobile-app-development', 'Mobile App Development'],
  ['ai-development', 'AI Development'],
];

const OFFICES = [
  ['Pakistan Head Office', 'Karachi', 'Anum Empire, Shahra-e-Faisal, Jinnah Housing Society P.E.C.H.S., Karachi, 74200', 'Asia/Karachi'],
  ['UK Office', 'London', '30 Riverhead Close, London, England, E17 5PY', 'Europe/London'],
  ['UAE Office', 'Dubai', 'Office 2309, Clover Bay Tower, Business Bay, Dubai, UAE.', 'Asia/Dubai'],
];

const logo = () => `
<a class="logo" href="@/" aria-label="Big Futur Digital, home">
  ${markSVG('logo__mark')}
  <span class="logo__type"><span class="logo__big">BIG FUTUR</span><span class="logo__digital">DIGITAL</span></span>
</a>`;

const header = (page) => `
<a class="skip" href="#main">Skip to content</a>
<header class="nav" data-nav>
  <div class="nav__inner">
    ${logo()}
    <nav class="nav__links" aria-label="Main">
      ${NAV.map(([k, label, href]) => `<a href="${href}"${k === page ? ' aria-current="page"' : ''}><span data-roll>${label}</span></a>`).join('')}
    </nav>
    <a class="btn btn--red btn--sm nav__cta" href="@/contact/" data-magnetic><span data-roll>Discuss Your Project</span></a>
    <button class="nav__burger" type="button" aria-expanded="false" aria-controls="menu" data-burger>
      <span class="sr-only">Menu</span><i></i><i></i>
    </button>
  </div>
</header>
<div class="menu" id="menu" data-menu hidden>
  <nav class="menu__links" aria-label="Mobile">
    ${NAV.map(([k, label, href], i) => `<a href="${href}"${k === page ? ' aria-current="page"' : ''}><small>0${i + 1}</small>${label}</a>`).join('')}
  </nav>
  <div class="menu__foot">
    <a href="mailto:hello@bigfuturdigital.com">hello@bigfuturdigital.com</a>
    <span>Karachi · London · Dubai</span>
  </div>
</div>`;

const footer = () => `
<footer class="footer" data-theme="dark">
  <div class="wrap">
    <div class="footer__top">
      <div class="footer__brand">
        ${logo()}
        <p>Big Futur Digital provides social media and LinkedIn management, network building, lead generation, websites, mobile apps, and AI development.</p>
        <a class="btn btn--red" href="@/contact/" data-magnetic><span data-roll>Discuss Your Project</span></a>
      </div>
      <nav class="footer__col" aria-label="Footer">
        <h2 class="eyebrow">Pages</h2>
        ${NAV.map(([, label, href]) => `<a href="${href}"><span data-roll>${label}</span></a>`).join('')}
      </nav>
      <div class="footer__col">
        <h2 class="eyebrow">Email</h2>
        <a href="mailto:hello@bigfuturdigital.com"><span data-roll>hello@bigfuturdigital.com</span></a>
        <a href="mailto:hr@bigfuturdigital.com"><span data-roll>hr@bigfuturdigital.com</span></a>
        <h2 class="eyebrow">Locations</h2>
        <p>Karachi | London | Dubai</p>
      </div>
      <details class="footer__offices">
        <summary><span class="eyebrow">Office details</span><span class="plus" aria-hidden="true">+</span></summary>
        ${OFFICES.map(([t, , a]) => `<p><strong>${t}</strong><br>${a}</p>`).join('')}
      </details>
    </div>
    <div class="footer__giant" aria-hidden="true"><span>BIG FUTUR</span></div>
    <div class="footer__bottom">
      <p>© <span data-year>2026</span> Big Futur Digital. All rights reserved.</p>
      <button type="button" class="linkish" data-open-privacy>Privacy Notice</button>
      <button type="button" class="linkish" data-to-top>Back to top ↑</button>
    </div>
  </div>
</footer>`;

const chrome = () => `
${markSymbol()}
<div class="curtain" data-curtain aria-hidden="true">
  <div class="curtain__panel"></div>
  ${markSVG('curtain__mark', { animate: true })}
</div>
<div class="cursor" data-cursor aria-hidden="true"><span></span></div>
<dialog class="privacy" data-privacy aria-labelledby="privacy-title">
  <form method="dialog" class="privacy__inner">
    <p class="eyebrow">Draft for approval</p>
    <h2 id="privacy-title">Privacy Notice</h2>
    <p>When you send an enquiry, Big Futur Digital uses the details you provide (your name, company, email address, phone number, selected service, and project details) only to respond to your enquiry and discuss the services you asked about.</p>
    <p>We do not sell your details or add them to marketing lists without your consent. You can ask us to update or delete your information at any time by emailing <a href="mailto:hello@bigfuturdigital.com">hello@bigfuturdigital.com</a>.</p>
    <p class="privacy__note">This notice is a draft. Final wording must match Big Futur Digital's actual data handling before launch.</p>
    <button class="btn btn--red" value="close"><span data-roll>Close</span></button>
  </form>
</dialog>`;

const headCommon = (title, desc) => `
  <link rel="canonical" href="{{canonical}}">
  <meta name="theme-color" content="#0b0b0c">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Big Futur Digital">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="{{canonical}}">
  <meta property="og:image" content="{{site}}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">`;

function rewriteLinks(html, depth) {
  const root = depth === 0 ? './' : '../'.repeat(depth);
  return html.replace(/(href|action)="@\/([^"]*)"/g, (_, attr, rest) => {
    const m = rest.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
    let [, path, query = '', hash = ''] = m;
    if (PREVIEW && (path === '' || path.endsWith('/'))) path += 'index.html';
    return `${attr}="${root}${path}${query}${hash}"`;
  });
}

function preloadFonts() {
  return {
    name: 'bf-preload-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const depth = ctx.path.replace(/^\//, '').split('/').length - 1;
        const root = depth === 0 ? './' : '../'.repeat(depth);
        const files = Object.keys(ctx.bundle).filter((f) => /(montserrat-latin-wght|inter-latin-wght)-normal.*\.woff2$/.test(f));
        const tags = files.map((f) => `<link rel="preload" href="${root}${f}" as="font" type="font/woff2" crossorigin>`).join('');
        return html.replace('<meta name="description"', tags + '\n  <meta name="description"');
      },
    },
  };
}

function partials() {
  return {
    name: 'bf-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const rel = ctx.path.replace(/^\//, '');
        const depth = rel.split('/').length - 1;
        const urlPath = rel.replace(/index\.html$/, '');
        const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
        const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
        html = html.replace('<!--@headcommon-->', headCommon(title, desc));
        html = html
          .replace(/<!--@header:(\w+)-->/, (_, p) => header(p))
          .replace('<!--@footer-->', footer())
          .replace('<!--@chrome-->', chrome())
          .replace('<!--@base404-->', PREVIEW ? '' : '<base href="/">')
          .replace(/<!--@markparts:([\w-]+)-->/g, (_, c) => markSVG(c, { animate: true }))
          .replace(/<!--@mark:?([\w-]*)-->/g, (_, c) => markSVG(c))
          .replace(/<!--@icon:(\w+)-->/g, (_, n) => ICONS[n])
          .replace(/<!--@services-options-->/g, SERVICES.map(([v, l]) => `<option value="${v}">${l.replace('&', '&amp;')}</option>`).join(''))
          .replaceAll('{{canonical}}', `${SITE}/${urlPath}`)
          .replaceAll('{{site}}', SITE);
        html = html.replace('</head>', `<script>try{var s=sessionStorage;if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&(s.getItem('bf-transition')==='1'||!s.getItem('bf-visited')))document.documentElement.classList.add('is-loading')}catch(e){}</script>\n</head>`);
        return rewriteLinks(html, depth);
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [partials(), preloadFonts()],
  build: {
    outDir: PREVIEW ? 'dist-preview' : 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        services: resolve(__dirname, 'services/index.html'),
        about: resolve(__dirname, 'about/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        notfound: resolve(__dirname, '404.html'),
      },
    },
  },
});
