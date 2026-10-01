const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Hero canvas: a forward "warp" of particles over a perspective floor grid.
   Cheap 2D canvas, capped DPR, pauses off-screen. */
function heroCanvas({ reduced, finePointer }) {
  const canvas = $('[data-hero-canvas]');
  if (!canvas) return { boost: () => {} };
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, running = true, raf = 0;
  const N = innerWidth < 760 ? 260 : 520;
  const pts = [];
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let speed = 1, targetSpeed = 1, gridOffset = 0;

  const rand = (a, b) => a + Math.random() * (b - a);
  const spawn = (p, far = true) => {
    p.x = rand(-1, 1) * 1.6;
    p.y = rand(-1, 1) * 1.0;
    p.z = far ? rand(0.6, 1) : rand(0.05, 1);
    p.red = Math.random() < 0.14;
    p.px = null; p.py = null;
  };
  for (let i = 0; i < N; i++) { const p = {}; spawn(p, false); pts.push(p); }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame() {
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    speed += (targetSpeed - speed) * 0.06;
    const cx = w * 0.5 + mouse.x * w * 0.06;
    const cy = h * 0.42 + mouse.y * h * 0.05;
    const fov = Math.min(w, h) * 0.55;
    ctx.clearRect(0, 0, w, h);

    // floor grid
    const horizon = cy + h * 0.06;
    gridOffset = (gridOffset + 0.004 * speed) % 1;
    ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      const t = (i + gridOffset) / 18;            // 0..1 toward viewer
      const y = horizon + Math.pow(t, 2.4) * (h - horizon + 40);
      ctx.strokeStyle = `rgba(236,32,39,${0.04 + t * 0.28})`;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    for (let i = -14; i <= 14; i++) {
      const xb = cx + i * (w / 9);
      ctx.strokeStyle = `rgba(255,255,255,${0.05 - Math.abs(i) * 0.002})`;
      ctx.beginPath(); ctx.moveTo(cx + i * 6, horizon); ctx.lineTo(xb + (xb - cx) * 1.6, h + 40); ctx.stroke();
    }
    // horizon fade
    const g = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 120);
    g.addColorStop(0, 'rgba(11,11,12,0)'); g.addColorStop(0.45, 'rgba(11,11,12,0.85)'); g.addColorStop(1, 'rgba(11,11,12,0)');
    ctx.fillStyle = g; ctx.fillRect(0, horizon - 60, w, 180);

    // particles
    for (const p of pts) {
      p.z -= 0.0032 * speed;
      if (p.z <= 0.02) { spawn(p); continue; }
      const sx = cx + (p.x / p.z) * fov;
      const sy = cy + (p.y / p.z) * fov;
      if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) { spawn(p); continue; }
      const a = Math.min(1, (1 - p.z) * 1.4);
      const size = (1 - p.z) * 2.2 + 0.3;
      if (p.px !== null && speed > 1.3) {
        ctx.strokeStyle = p.red ? `rgba(236,32,39,${a})` : `rgba(255,255,255,${a * 0.6})`;
        ctx.lineWidth = size;
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(sx, sy); ctx.stroke();
      }
      ctx.fillStyle = p.red ? `rgba(236,32,39,${a})` : `rgba(255,255,255,${a * 0.85})`;
      ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI * 2); ctx.fill();
      p.px = sx; p.py = sy;
    }
    if (running) raf = requestAnimationFrame(frame);
  }

  resize();
  addEventListener('resize', resize);
  if (finePointer) addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  if (reduced) { speed = 0.0001; frame(); running = false; return { boost: () => {} }; }
  const io = new IntersectionObserver(([en]) => {
    const vis = en.isIntersecting && !document.hidden;
    if (vis && !running) { running = true; raf = requestAnimationFrame(frame); }
    if (!vis) { running = false; cancelAnimationFrame(raf); }
  });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } });
  raf = requestAnimationFrame(frame);
  return { boost: (v) => (targetSpeed = v) };
}

function hero({ gsap, SplitText, tl, reduced, ScrollTrigger }, warp) {
  const title = $('[data-hero-title]');
  const fades = $$('[data-hero-fade]');
  if (reduced) return;
  const split = SplitText.create(title, { type: 'lines,words', mask: 'lines', linesClass: 'line' });
  gsap.set(fades, { opacity: 0, y: 26 });
  tl.add(() => warp.boost(6), '-=0.6')
    .from(split.words, { yPercent: 120, rotate: 4, duration: 1.3, ease: 'expo.out', stagger: 0.045 }, '-=0.35')
    .add(() => warp.boost(1), '-=0.6')
    .to(fades, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07 }, '-=1')
    .from('.hero__glow', { scale: 0.4, opacity: 0, duration: 2, ease: 'expo.out' }, 0.2)
    .from('.hero__bottom', { '--line': 0, borderTopColor: 'rgba(255,255,255,0)', duration: 1 }, '<');

  // scroll-out: title rises & fades, warp accelerates
  gsap.timeline({ scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: (s) => warp.boost(1 + s.progress * 5) } })
    .to('.hero__content', { yPercent: -18, opacity: 0.1, ease: 'none' }, 0)
    .to('.hero__glow', { scale: 1.5, opacity: 0.3, ease: 'none' }, 0);
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
  const warp = heroCanvas(ctx);
  hero(ctx, warp);
  dive(ctx);
  horizontal(ctx);
  network(ctx);
  stack(ctx);
  process(ctx);
  cta(ctx);
}
