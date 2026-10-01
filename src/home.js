const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Hero: one-shot assembly of the BF mark + headline, then a light word cycler.
   Only transform/opacity are animated, so it stays smooth without GPU acceleration. */
function hero({ gsap, SplitText, tl, reduced, finePointer }) {
  const sec = $('[data-hero]');
  if (!sec) return;
  const title = $('[data-hero-title]', sec);
  const fades = $$('[data-hero-fade]', sec);
  const stage = $('[data-hero-stage]', sec);
  const disc = $('.hero__mark .mark__disc', sec);
  const parts = $$('.hero__mark [data-part]', sec);
  const words = $$('[data-word]', sec);
  const bar = $('[data-cycler-bar]', sec);

  // --- word cycler ---
  let i = 0, cycle = null, visible = true;
  words[0].classList.add('is-on');
  const HOLD = 2.4;
  const step = () => {
    const cur = words[i], next = words[(i = (i + 1) % words.length)];
    gsap.to(cur, { yPercent: -110, duration: 0.6, ease: 'expo.inOut', onComplete: () => { cur.classList.remove('is-on'); gsap.set(cur, { clearProps: 'transform' }); } });
    gsap.fromTo(next, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'expo.inOut', onStart: () => next.classList.add('is-on') });
    runBar();
  };
  const runBar = () => gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: HOLD + 0.6, ease: 'none' });
  const start = () => { if (cycle || reduced) return; runBar(); cycle = gsap.delayedCall(HOLD + 0.6, function loop() { if (visible) step(); cycle = gsap.delayedCall(HOLD + 0.6, loop); }); };
  // pause everything while the hero is off screen
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; sec.classList.toggle('is-idle', !visible); }).observe(sec);

  if (reduced) { gsap.set(bar, { scaleX: 1 }); return; }

  // --- load sequence ---
  const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'line' });
  gsap.set(fades, { opacity: 0, y: 24 });
  gsap.set(stage, { opacity: 0 });
  const from = [ // where each glyph piece flies in from: slash, B, lower bar, upper bar
    { x: -60, y: 90, rotate: -25 }, { x: -110, y: -30, rotate: 20 }, { x: 120, y: 60, rotate: 15 }, { x: 140, y: -70, rotate: -20 },
  ];
  tl.add('hero', '-=0.45')
    .from(split.lines, { yPercent: 110, duration: 1.15, ease: 'expo.out', stagger: 0.1 }, 'hero')
    .set(stage, { opacity: 1 }, 'hero')
    .from('.hero__halo', { scale: 0.3, opacity: 0, duration: 1.6, ease: 'expo.out' }, 'hero')
    .from(disc, { scale: 0, transformOrigin: '50% 50%', duration: 1.1, ease: 'back.out(1.5)' }, 'hero+=0.1')
    .from(parts, { x: (k) => from[k].x, y: (k) => from[k].y, rotate: (k) => from[k].rotate, opacity: 0, transformOrigin: '50% 50%', duration: 1.1, ease: 'expo.out', stagger: 0.09 }, 'hero+=0.35')
    .from('.hero__ring', { opacity: 0, scale: 0.85, duration: 1.2, ease: 'expo.out' }, 'hero+=0.6')
    .to(fades, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.07 }, 'hero+=0.35')
    .add(start, 'hero+=1.2');

  // gentle tilt toward the pointer (desktop only, transform only)
  if (finePointer) {
    const rx = gsap.quickTo(stage, 'rotationY', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(stage, 'rotationX', { duration: 0.8, ease: 'power3' });
    gsap.set(stage, { transformPerspective: 900 });
    sec.addEventListener('pointermove', (e) => { rx((e.clientX / innerWidth - 0.5) * 14); ry(-(e.clientY / innerHeight - 0.5) * 14); });
    sec.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  // scroll-out: text lifts away, the mark turns and shrinks a little
  gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__text', { yPercent: -14, opacity: 0.15, ease: 'none' }, 0)
    .to('.hero__art', { yPercent: 10, rotate: 18, scale: 0.9, ease: 'none' }, 0);
}

/* Services: pin + horizontal scroll on wide screens */
function horizontal({ gsap, ScrollTrigger, reduced }) {
  const section = $('[data-hs]');
  if (!section) return;
  const track = $('[data-hs-track]', section);
  const bar = $('[data-hs-bar]', section);
  const counter = $('[data-hs-current]', section);
  const cards = $$('.card', track);
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    if (reduced) return;
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: section, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (s) => {
          gsap.set(bar, { scaleX: s.progress });
          counter.textContent = String(Math.min(8, Math.floor(s.progress * 7.999) + 1)).padStart(2, '0');
        },
      },
    });
    // cards ease in as they enter from the right
    cards.forEach((c) => {
      gsap.from(c, { opacity: 0.25, scale: 0.92, rotate: 2, ease: 'none',
        scrollTrigger: { trigger: c, containerAnimation: tween, start: 'left 100%', end: 'left 60%', scrub: true } });
    });
  });
  mm.add('(max-width: 860px)', () => {
    if (reduced) return;
    cards.forEach((c) => gsap.from(c, { opacity: 0, y: 60, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%', once: true } }));
  });
}

/* LinkedIn network graph: nodes + edges that draw in on scroll */
function network({ gsap, reduced }) {
  const svg = $('[data-network-svg]');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  // deterministic pseudo-random layout
  let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const nodes = [{ x: 300, y: 300, hub: true }];
  for (let ring = 1; ring <= 3; ring++) {
    const count = ring * 6;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + ring * 0.6 + r() * 0.3;
      const d = ring * 82 + r() * 26;
      nodes.push({ x: 300 + Math.cos(a) * d, y: 300 + Math.sin(a) * d, ring });
    }
  }
  const edges = [];
  nodes.forEach((n, i) => {
    if (i === 0) return;
    // connect to nearest node in inner ring
    let best = 0, bd = Infinity;
    nodes.forEach((m, j) => { if (j !== i && (m.ring ?? 0) < n.ring) { const d = Math.hypot(m.x - n.x, m.y - n.y); if (d < bd) { bd = d; best = j; } } });
    edges.push([best, i]);
    if (r() < 0.35) { const j = 1 + Math.floor(r() * (nodes.length - 1)); if (j !== i && Math.hypot(nodes[j].x - n.x, nodes[j].y - n.y) < 140) edges.push([i, j]); }
  });
  const hot = new Set([0]);
  // a highlighted path: hub -> a few nodes outward
  [1, 8, 20].forEach((i) => hot.add(i));
  const gEdges = document.createElementNS(NS, 'g');
  const gNodes = document.createElementNS(NS, 'g');
  svg.append(gEdges, gNodes);
  const lines = edges.map(([a, b]) => {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', nodes[a].x); l.setAttribute('y1', nodes[a].y);
    l.setAttribute('x2', nodes[b].x); l.setAttribute('y2', nodes[b].y);
    l.setAttribute('class', 'edge' + (hot.has(a) && hot.has(b) || (a === 0 && hot.has(b)) ? ' hot' : ''));
    const len = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
    l.style.strokeDasharray = len; l.style.strokeDashoffset = reduced ? 0 : len;
    gEdges.appendChild(l);
    return l;
  });
  const circles = nodes.map((n, i) => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', n.x); c.setAttribute('cy', n.y);
    c.setAttribute('r', n.hub ? 18 : hot.has(i) ? 9 : 4 + (3 - n.ring) * 1.5);
    c.setAttribute('class', 'node' + (hot.has(i) ? ' hot' : ''));
    gNodes.appendChild(c);
    if (hot.has(i)) {
      const p = document.createElementNS(NS, 'circle');
      p.setAttribute('cx', n.x); p.setAttribute('cy', n.y); p.setAttribute('r', n.hub ? 18 : 9);
      p.setAttribute('class', 'pulse'); p.style.animationDelay = `${i * 0.13}s`;
      gNodes.appendChild(p);
    }
    return c;
  });
  if (reduced) return;
  gsap.set(circles, { scale: 0, transformOrigin: '50% 50%', transformBox: 'fill-box' });
  const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 75%', once: true } });
  tl.to(circles, { scale: 1, duration: 0.8, ease: 'back.out(2)', stagger: { each: 0.025, from: 'start' } })
    .to(lines, { strokeDashoffset: 0, duration: 1, ease: 'power2.out', stagger: 0.015 }, 0.2)
    .from('.network__chip', { opacity: 0, y: 20, scale: 0.9, duration: 0.8, ease: 'expo.out', stagger: 0.15 }, 0.6);
  // slow orbit
  gsap.to(gNodes, { rotate: 360, transformOrigin: '300px 300px', duration: 160, repeat: -1, ease: 'none' });
  gsap.to(gEdges, { rotate: 360, transformOrigin: '300px 300px', duration: 160, repeat: -1, ease: 'none' });
}

/* Stacking development cards: each scales back as the next arrives */
function stack({ gsap, reduced }) {
  const cards = $$('.stack__card');
  if (reduced || innerWidth < 861) return;
  cards.forEach((card, i) => {
    if (i === cards.length - 1) return;
    gsap.to(card, {
      scale: 0.9 + i * 0.02, filter: 'brightness(0.45)', ease: 'none',
      scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top top+=120', scrub: true },
    });
  });
}

/* Process: line draws, steps light up */
function process({ gsap, ScrollTrigger }) {
  const sec = $('[data-process]');
  if (!sec) return;
  const line = $('[data-process-line]', sec);
  const steps = $$('[data-step]', sec);
  const vertical = innerWidth <= 860;
  gsap.to(line, { [vertical ? 'scaleY' : 'scaleX']: 1, ease: 'none',
    scrollTrigger: { trigger: sec.querySelector('.process__steps'), start: 'top 75%', end: vertical ? 'bottom 60%' : 'top 30%', scrub: true,
      onUpdate: (s) => steps.forEach((st, i) => st.classList.toggle('is-on', s.progress >= i / steps.length + 0.02)) } });
  gsap.from(steps, { opacity: 0, y: 40, duration: 1, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: sec.querySelector('.process__steps'), start: 'top 85%', once: true } });
}

/* Dive: rows slide, then the camera zooms through a gap in the mark until the screen is brand red */
function dive({ gsap, reduced }) {
  const sec = $('[data-dive]');
  if (!sec || reduced) return;
  const sticky = $('[data-dive-sticky]', sec);
  const mark = $('.dive__mark', sec);
  const rows = $$('[data-dive-row]', sec);
  const cap = $('[data-dive-cap]', sec);
  const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
  rows.forEach((r, i) => tl.fromTo(r, { xPercent: i % 2 ? -30 : 0 }, { xPercent: i % 2 ? 0 : -30, ease: 'none', duration: 1 }, 0));
  tl.fromTo(mark, { scale: 0.6, rotate: -120 }, { scale: 1, rotate: 0, ease: 'power2.out', duration: 0.35 }, 0)
    .to(cap, { opacity: 0, y: 30, duration: 0.15 }, 0.4)
    .to(mark, { scale: 26, transformOrigin: '62% 53%', ease: 'power3.in', duration: 0.5 }, 0.45)
    .to(rows, { opacity: 0, scale: 1.4, duration: 0.3, ease: 'power2.in' }, 0.5)
    .to(sticky, { backgroundColor: '#ec2027', duration: 0.12, ease: 'none' }, 0.83)
    .set(mark, { opacity: 0 }, 0.96);
}

/* CTA marks parallax */
function cta({ gsap, reduced }) {
  if (reduced) return;
  gsap.fromTo('.cta__mark', { rotate: -25, yPercent: 20 }, { rotate: 10, yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.cta__mark2', { rotate: 30 }, { rotate: -30, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
}

export default function init(ctx) {
  hero(ctx);
  dive(ctx);
  horizontal(ctx);
  network(ctx);
  stack(ctx);
  process(ctx);
  cta(ctx);
}
