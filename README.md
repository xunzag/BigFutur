# Big Futur Digital website

Four-page marketing site (Home, Services, About Us, Contact Us + 404) built from
"Big Futur Digital - Website Copy and Development Scope.docx" (v2.0).

Stack: Vite (static multi-page build), GSAP + ScrollTrigger + SplitText, Lenis smooth scroll.
Fonts are self-hosted (Montserrat to match the logo, Inter for body, Instrument Serif for accents).
No images beyond the logo: all visuals are CSS/SVG/canvas, so nothing implies client work.

## Run
    npm install
    npm run dev        # local dev server
    npm run build      # production build -> dist/ (clean URLs: /services/, /about/, /contact/)
    npm run preview    # serve dist/

`PREVIEW=1 npm run build` writes dist-preview/ with links pointing at index.html files,
for hosts that do not serve folder indexes.

## Deploy on Vercel
Import the repo; settings are in vercel.json (Framework: Vite, Build: `npm run build`, Output: `dist`).
404.html is served automatically for unknown URLs with a 404 status.

## Where things live
- index.html, services/, about/, contact/, 404.html: page copy (edit text here)
- vite.config.js: shared header, footer, privacy dialog, service list, office list, icons, site URL
- src/style.css: design tokens and all styles
- src/main.js: smooth scroll, page transitions, reveals, cursor, nav
- src/home.js: hero warp canvas, horizontal services, network graph, stacking cards, process
- public/: favicons, social image, robots.txt, sitemap.xml (regenerate icons with `node scripts-gen-assets.mjs`)
- partials-mark.json: the BF mark traced to SVG paths from "BF logos/1.png"

## Before launch
- Contact form: set `data-endpoint` on the form in contact/index.html to a real handler
  (server route or form service) that emails hello@bigfuturdigital.com. Until then the form
  validates and then opens the visitor's email app instead of sending.
- Privacy notice text in vite.config.js is a draft; replace with the approved wording.
- Site URL is assumed to be https://bigfuturdigital.com (SITE in vite.config.js, robots.txt, sitemap.xml).
- Serve 404.html as the not-found page with a real 404 status.
