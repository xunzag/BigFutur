const NS = 'http://www.w3.org/2000/svg';
const W = 400, H = 130, G = 124; // viewBox width/height, ground line

function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }
const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

// Simplified landmark silhouettes (drawn in brand red)
const LANDMARKS = {
  dubai: (x) => `M${x - 14} ${G} L${x - 10} 86 L${x - 7} 86 L${x - 5} 52 L${x - 3} 52 L${x - 1.5} 18 L${x} 2 L${x + 1.5} 18 L${x + 3} 52 L${x + 5} 52 L${x + 7} 86 L${x + 10} 86 L${x + 14} ${G} Z`,
  london: (x) => `M${x - 8} ${G} L${x - 8} 52 L${x - 10} 48 L${x - 10} 40 L${x + 10} 40 L${x + 10} 48 L${x + 8} 52 L${x + 8} ${G} Z M${x - 10} 40 L${x} 14 L${x + 10} 40 Z M${x + 50} ${G} L${x + 66} 20 L${x + 82} ${G} Z`,
  karachi: (x) => `M${x - 34} ${G} L${x - 34} 82 L${x + 34} 82 L${x + 34} ${G} Z M${x - 24} 82 C${x - 24} 54 ${x + 24} 54 ${x + 24} 82 Z M${x - 2} 58 L${x} 48 L${x + 2} 58 Z`,
};
const LM_X = { dubai: 250, london: 120, karachi: 210 };
const SEED = { dubai: 11, london: 23, karachi: 37 };

function skyline(city) {
  const r = rng(SEED[city]);
  const svg = el('svg', { class: 'skyline', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMax slice', 'aria-hidden': 'true' });
  const builds = el('g', {});
  let x = -10;
  while (x < W + 10) {
    const w = 18 + r() * 30;
    const h = 24 + r() * (city === 'dubai' ? 70 : 52);
    const g = el('g', { class: 'bld' });
    g.appendChild(el('rect', { class: 'b', x, y: G - h, width: w - 3, height: h }));
    // window grid
    for (let wy = G - h + 8; wy < G - 6; wy += 9) for (let wx = x + 4; wx < x + w - 8; wx += 7) if (r() > 0.55) g.appendChild(el('rect', { class: 'w', x: wx, y: wy, width: 2.6, height: 4 }));
    builds.appendChild(g);
    x += w;
  }
  svg.appendChild(builds);
  const lm = el('path', { class: 'lm', d: LANDMARKS[city](LM_X[city]) });
  svg.appendChild(lm);
  svg.appendChild(el('rect', { class: 'ground', x: 0, y: G, width: W, height: H - G }));
  return svg;
}

export default function init({ gsap, reduced }) {
  document.querySelectorAll('[data-skyline]').forEach((card) => {
    const svg = skyline(card.dataset.skyline);
    card.appendChild(svg);
    if (reduced) return;
    const blds = svg.querySelectorAll('.bld');
    gsap.set(blds, { scaleY: 0, transformOrigin: '50% 100%', transformBox: 'fill-box' });
    gsap.set(svg.querySelector('.lm'), { yPercent: 100, transformBox: 'fill-box' });
    const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 80%', once: true } });
    tl.to(blds, { scaleY: 1, duration: 1, ease: 'expo.out', stagger: { each: 0.03, from: 'random' } })
      .to(svg.querySelector('.lm'), { yPercent: 0, duration: 1.2, ease: 'expo.out' }, 0.25);
  });
  if (reduced) return;
  document.querySelectorAll('.office__city').forEach((c) => {
    gsap.from(c, { letterSpacing: '0.1em', opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%', once: true } });
  });
}
