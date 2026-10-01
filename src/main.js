import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
root.classList.add('js');

/* ---------------- Smooth scroll ---------------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const navH = () => parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 76;
export function scrollToEl(el, immediate = false) {
  if (!el) return;
  const offset = -(navH() + 24);
  if (lenis) lenis.scrollTo(el, { offset, immediate, duration: 1.4 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: immediate ? 'auto' : 'smooth' });
}
window.__bf = { lenis, scrollToEl };

/* ---------------- Utilities ---------------- */
// hover "roll" text: duplicate label into two stacked spans
$$('[data-roll]').forEach((el) => {
  const t = el.textContent;
  el.innerHTML = `<span>${t}</span><span aria-hidden="true">${t}</span>`;
});
$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

// live office clocks
const clocks = $$('[data-clock]');
if (clocks.length) {
  const tick = () => clocks.forEach((el) => {
    const t = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: el.dataset.clock }).format(new Date());
    el.textContent = `${el.dataset.label || ''}${t} local time`;
  });
  tick();
  setInterval(tick, 20_000);
}

/* ---------------- Nav ---------------- */
const nav = $('[data-nav]');
let lastY = 0;
const onScroll = (y) => {
  nav.classList.toggle('is-scrolled', y > 40);
  const goingDown = y > lastY && y > 400;
  if (!menuOpen) nav.classList.toggle('is-hidden', goingDown);
  lastY = y;
};
if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

// mobile menu
const burger = $('[data-burger]');
const menu = $('[data-menu]');
let menuOpen = false;
function toggleMenu(open = !menuOpen) {
  menuOpen = open;
  root.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  if (open) {
    menu.hidden = false;
    lenis?.stop();
    gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' });
    gsap.fromTo($$('.menu__links a', menu), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.8, delay: 0.3, ease: 'expo.out' });
    burger.style.background = 'var(--ink)';
    burger.querySelectorAll('i').forEach((i) => (i.style.background = '#fff'));
  } else {
    lenis?.start();
    gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'expo.inOut', onComplete: () => (menu.hidden = true) });
    burger.style.background = '';
    burger.querySelectorAll('i').forEach((i) => (i.style.background = ''));
  }
}
burger?.addEventListener('click', () => toggleMenu());
addEventListener('keydown', (e) => e.key === 'Escape' && menuOpen && toggleMenu(false));

/* ---------------- Page transitions ---------------- */
const curtain = $('[data-curtain]');
const panel = $('.curtain__panel', curtain);
const markParts = $$('[data-part]', curtain);
const curtainMark = $('.curtain__mark', curtain);

function isInternal(a) {
  if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.protocol.indexOf('http') !== 0 && url.protocol !== 'file:') return false;
  if (a.getAttribute('href').startsWith('#')) return false;
  if (url.pathname === location.pathname && url.hash) return false; // same-page anchor
  return url.href !== location.href;
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  const href = a.getAttribute('href');
  // same-page anchors -> smooth scroll
  const url = new URL(a.href, location.href);
  if (href.startsWith('#') || (url.pathname === location.pathname && url.hash)) {
    const target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) {
      e.preventDefault();
      if (menuOpen) toggleMenu(false);
      scrollToEl(target);
      history.replaceState(null, '', url.hash);
    }
    return;
  }
  if (!isInternal(a) || reduced) return;
  e.preventDefault();
  if (menuOpen) toggleMenu(false);
  try { sessionStorage.setItem('bf-transition', '1'); } catch {}
  curtain.style.pointerEvents = 'auto';
  gsap.timeline({ onComplete: () => (location.href = a.href) })
    .set(panel, { y: 0, yPercent: 100, transformOrigin: '50% 100%' })
    .to(panel, { yPercent: 0, duration: 0.7, ease: 'expo.inOut' })
    .fromTo(curtainMark, { opacity: 0, scale: 0.6, rotate: -90 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(1.6)' }, '-=0.25');
});
// bfcache: make sure the curtain is gone when returning with back button
addEventListener('pageshow', (e) => { if (e.persisted) { gsap.set(panel, { y: 0, yPercent: 100 }); gsap.set(curtainMark, { opacity: 0 }); curtain.style.pointerEvents = 'none'; } });

function intro() {
  let fromTransition = false, firstVisit = true;
  try {
    fromTransition = sessionStorage.getItem('bf-transition') === '1';
    firstVisit = !sessionStorage.getItem('bf-visited');
    sessionStorage.removeItem('bf-transition');
    sessionStorage.setItem('bf-visited', '1');
  } catch {}
  const tl = gsap.timeline();
  root.classList.remove('is-loading');
  if (reduced || (!fromTransition && !firstVisit)) {
    gsap.set(panel, { y: 0, yPercent: 100 });
    return tl;
  }
  gsap.set(panel, { y: 0, yPercent: 0 });
  if (firstVisit && !fromTransition) {
    // brand loader: mark assembles, then the panel lifts
    gsap.set(curtainMark, { opacity: 1 });
    tl.from($('.mark__disc', curtainMark), { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'expo.out' })
      .from(markParts, { x: (i) => [-30, -40, 40, 40][i], y: (i) => [40, -10, 20, -20][i], opacity: 0, duration: 0.6, stagger: 0.07, ease: 'expo.out' }, '-=0.3')
      .to(curtainMark, { scale: 0.8, opacity: 0, duration: 0.45, ease: 'power3.in' }, '+=0.15');
  } else {
    gsap.set(curtainMark, { opacity: 1 });
    tl.to(curtainMark, { opacity: 0, scale: 0.85, duration: 0.35, ease: 'power2.in' });
  }
  tl.to(panel, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
    .add(() => (curtain.style.pointerEvents = 'none'));
  return tl;
}

/* ---------------- Cursor + magnetic ---------------- */
if (finePointer && !reduced) {
  root.classList.add('has-cursor');
  const cursor = $('[data-cursor]');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3' });
  addEventListener('pointermove', (e) => { cursor.classList.add('is-on'); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => cursor.classList.toggle('is-hover', !!e.target.closest('a, button, summary, [data-tilt], select, input, textarea, label')));

  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.28);
      y((e.clientY - r.top - r.height / 2) * 0.38);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });

  // spotlight origin for service cards
  $$('[data-tilt]').forEach((card) => {
    card.addEventListener('pointerenter', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
}

/* ---------------- Scroll reveals ---------------- */
function reveals() {
  if (reduced) return;
  // headings: masked line reveal
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      }),
    });
  });

  // generic reveal
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });
  ScrollTrigger.batch('[data-fade]', {
    start: 'top 92%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, duration: 1.2, ease: 'power2.out', stagger: 0.08 }),
  });

  // word-by-word scrub
  $$('[data-scrub-words]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words', wordsClass: 'word' });
    gsap.to(split.words, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  });

  // marquees: drift + scroll velocity
  $$('[data-marquee]').forEach((m) => {
    const track = $('.marquee__track', m);
    const group = $('.marquee__group', m);
    track.appendChild(group.cloneNode(true));
    const tween = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    let dir = 1;
    ScrollTrigger.create({
      trigger: m, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity();
        dir = v < 0 ? -1 : 1;
        gsap.to(tween, { timeScale: dir * Math.min(5, 1 + Math.abs(v) / 400), duration: 0.2, overwrite: true });
        gsap.to(tween, { timeScale: dir, duration: 1.2, delay: 0.2, ease: 'power2.out' });
      },
    });
  });

  // gentle float on mock visuals
  $$('[data-float]').forEach((el) => {
    gsap.fromTo(el, { y: 60, rotate: -3 }, { y: -40, rotate: 2, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // footer giant wordmark
  const giant = $('.footer__giant span');
  if (giant) gsap.from(giant, { yPercent: 60, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: giant, start: 'top 98%', once: true } });

  // inner-page hero mark rotation on scroll
  $$('.phero__mark').forEach((m) => gsap.to(m, { rotate: 40, yPercent: 30, ease: 'none', scrollTrigger: { trigger: m.parentElement, start: 'top top', end: 'bottom top', scrub: true } }));
}

/* ---------------- Inner page hero ---------------- */
function pageHero(tl) {
  const h = $('.phero h1');
  if (!h || reduced) return;
  const split = SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'line' });
  tl.from(split.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1 }, '-=0.45')
    .from($$('.phero [data-hero-fade]'), { opacity: 0, y: 30, duration: 1, ease: 'expo.out', stagger: 0.08 }, '-=0.9')
    .from($$('.phero__mark .mark__part'), { opacity: 0, scale: 0.9, transformOrigin: '50% 50%', duration: 1.2, stagger: 0.1, ease: 'expo.out' }, '<');
}

/* ---------------- Privacy dialog / misc ---------------- */
const privacy = $('[data-privacy]');
$$('[data-open-privacy]').forEach((b) => b.addEventListener('click', () => { privacy.showModal(); lenis?.stop(); }));
privacy?.addEventListener('close', () => lenis?.start());
privacy?.addEventListener('click', (e) => { if (e.target === privacy) privacy.close(); });
$$('[data-to-top]').forEach((b) => b.addEventListener('click', () => (lenis ? lenis.scrollTo(0, { duration: 1.8 }) : scrollTo({ top: 0, behavior: 'smooth' }))));

/* ---------------- Boot ---------------- */
async function boot() {
  try { await document.fonts.ready; } catch {}
  const tl = intro();
  const page = document.body.dataset.page;
  const mod = page === 'home' ? await import('./home.js')
    : page === 'services' ? await import('./services.js')
    : page === 'contact' ? await import('./contact.js')
    : page === 'about' ? await import('./about.js') : null;
  reveals();
  pageHero(tl);
  mod?.default?.({ gsap, ScrollTrigger, SplitText, tl, reduced, lenis, scrollToEl, finePointer });
  // deep link to a hash after layout settles
  if (location.hash) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) setTimeout(() => {
      ScrollTrigger.refresh();
      scrollToEl(target, true);
      requestAnimationFrame(() => {
        ScrollTrigger.update();
        // anything already on screen (or above it) after the jump should be visible
        $$('[data-reveal], [data-fade]').forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }); });
      });
    }, 60);
  }
  addEventListener('load', () => ScrollTrigger.refresh());
}
boot();
