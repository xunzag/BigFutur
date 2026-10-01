export default function init({ gsap, ScrollTrigger, reduced }) {
  const chips = [...document.querySelectorAll('[data-chip]')];
  chips.forEach((chip) => {
    const sec = document.getElementById(chip.dataset.chip);
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (s) => chip.classList.toggle('is-active', s.isActive),
    });
  });
  if (reduced) return;
  gsap.from(chips, { opacity: 0, y: 16, duration: 0.8, ease: 'expo.out', stagger: 0.04, delay: 0.6 });
  document.querySelectorAll('[data-svc-num]').forEach((n) => {
    gsap.from(n, { yPercent: 60, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: n, start: 'top 88%', once: true } });
  });
  // FAQ: animate open/close height
  document.querySelectorAll('.faq details').forEach((d) => {
    const s = d.querySelector('summary');
    const a = d.querySelector('.faq__a');
    s.addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) {
        gsap.to(a, { height: 0, duration: 0.5, ease: 'expo.inOut', onComplete: () => { d.open = false; gsap.set(a, { clearProps: 'height' }); ScrollTrigger.refresh(); } });
      } else {
        d.open = true;
        gsap.from(a, { height: 0, duration: 0.6, ease: 'expo.out', onComplete: () => ScrollTrigger.refresh() });
      }
    });
  });
}
