import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = () => window.matchMedia('(min-width: 900px)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ───────── Lenis (scroll suave) ───────── */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTo = (target) => (lenis ? lenis.scrollTo(target, { duration: 1.2 }) : target.scrollIntoView({ behavior: 'auto' }));

const chapters = $$('.chapter');

/* ───────── ProgressEQ ───────── */
function ProgressEQ() {
  const host = $('.progress-eq__bars');
  const n = isDesktop() ? 64 : 32;
  host.innerHTML = '<i></i>'.repeat(n);
  const bars = $$('i', host);
  const seed = bars.map((_, i) => 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const p = self.progress;
      const head = Math.floor(p * (n - 1));
      const v = Math.min(Math.abs(self.getVelocity()) / 2500, 1);
      bars.forEach((b, i) => {
        b.classList.toggle('on', i < head);
        b.classList.toggle('head', i === head);
        const h = i <= head ? 4 + seed[i] * 10 + v * 8 * seed[(i + 7) % n] : 4;
        b.style.height = `${h}px`;
      });
    },
  });
}

/* ───────── ChapterIndex + teclado ───────── */
function ChapterIndex() {
  const ol = $('.chapter-index ol');
  const btns = [];
  const setActive = (i) => btns.forEach((b, j) => b.setAttribute('aria-current', String(i === j)));
  chapters.forEach((ch, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = ch.dataset.title;
    btn.setAttribute('aria-label', `Ir a ${ch.dataset.title}`);
    btn.addEventListener('click', () => scrollTo(ch));
    li.append(btn);
    ol.append(li);
    btns.push(btn);
    ScrollTrigger.create({
      trigger: ch,
      start: 'top center',
      end: 'bottom center',
      refreshPriority: -1,
      onToggle: (self) => self.isActive && setActive(i),
    });
  });
  setActive(0);

  // Modo presentación: ↓/↑/espacio/PageDown saltan de capítulo
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    const next = ['ArrowDown', 'PageDown', ' '].includes(e.key) && !e.shiftKey;
    const prev = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
    if (!next && !prev) return;
    e.preventDefault();
    const y = window.scrollY + 2;
    const tops = chapters.map((c) => c.getBoundingClientRect().top + window.scrollY);
    let idx;
    if (next) idx = tops.findIndex((t) => t > y + 4);
    else idx = [...tops].reverse().findIndex((t) => t < y - 4), idx = idx === -1 ? 0 : tops.length - 1 - idx;
    if (idx === -1) idx = chapters.length - 1;
    scrollTo(chapters[idx]);
  });
}

/* ───────── HeadlineReveal (splitter propio) ───────── */
function splitWords(el) {
  if (el.dataset.split) return $$('.hr-word', el);
  const walk = (node) => {
    [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) return frag.append(document.createTextNode(' '));
          const mask = document.createElement('span');
          mask.className = 'hr-line';
          mask.style.display = 'inline-block';
          const word = document.createElement('span');
          word.className = 'hr-word';
          word.textContent = w;
          mask.append(word);
          frag.append(mask);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1) walk(c);
    });
  };
  walk(el);
  el.dataset.split = '1';
  return $$('.hr-word', el);
}

function HeadlineReveal(el, tl, at = 0) {
  const words = splitWords(el);
  tl.from(words, { yPercent: 110, rotate: 4, duration: 0.9, ease: 'power4.out', stagger: 0.05 }, at);
  return words;
}

/* ───────── StatCounter ───────── */
function StatCounter(stat, tl, at) {
  const num = $('[data-count]', stat);
  const target = Number(num.dataset.count);
  const obj = { v: 0 };
  tl.from(stat, { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, at);
  tl.to(obj, { v: target, duration: 1.4, ease: 'power2.out', onUpdate: () => (num.textContent = Math.round(obj.v)) }, at);
}

/* ───────── Capítulo genérico: entrada encadenada + salida ───────── */
function chapterTimeline(ch) {
  const tl = gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top 70%', toggleActions: 'play none none reverse' } });
  const tag = $('.tag, .badge-next', ch);
  if (tag) tl.from(tag, { x: -20, opacity: 0, duration: 0.5 }, 0);
  const h = $('[data-reveal]', ch);
  if (h) HeadlineReveal(h, tl, 0.1);
  const line = $('[data-line]', ch);
  if (line) tl.from(line, { y: 24, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.5);
  return tl;
}

function exitFade(ch, sel = '.wrap') {
  const el = $(sel, ch);
  if (!el) return;
  gsap.to(el, {
    opacity: 0.15, y: -60, ease: 'none',
    scrollTrigger: { trigger: ch, start: 'bottom 55%', end: 'bottom top', scrub: true },
  });
}

/* ───────── 0 · Intro ───────── */
function Intro() {
  const ch = $('#cap-0');
  const paths = $$('.intro__wave path', ch);
  const amp = { a: 6 };
  const draw = (t = 0) => {
    paths.forEach((p, k) => {
      let d = 'M0,150';
      for (let x = 0; x <= 1200; x += 12) {
        const env = Math.sin((x / 1200) * Math.PI);
        const y = 150 + Math.sin(x / (38 + k * 14) + t * (2 + k)) * amp.a * env * (k ? 0.6 : 1) + Math.sin(x / 9 + t * 5) * amp.a * 0.15 * env;
        d += ` L${x},${y.toFixed(1)}`;
      }
      p.setAttribute('d', d);
    });
  };
  draw();
  if (!reduced) gsap.ticker.add((time) => draw(time));

  const intro = gsap.timeline({ delay: 0.2 });
  HeadlineReveal($('h1', ch), intro, 0.1);
  intro.from('.intro__copy .kicker', { opacity: 0, y: 10, duration: 0.6 }, 0)
    .from('.intro__copy .line', { opacity: 0, y: 20, duration: 0.8 }, 0.6)
    .from('.intro__nachito', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'power3.out' }, 0.4)
    .from('.scroll-hint', { opacity: 0, duration: 0.6 }, 1.2);

  if (reduced) return;
  const st = gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top top', end: '+=120%', scrub: true, pinSpacing: true, pin: '.intro__pin' } });
  st.to(amp, { a: 110, ease: 'power1.in' }, 0)
    .to('.intro__copy', { opacity: 0, y: -80, ease: 'power1.in' }, 0.2)
    .to('.scroll-hint', { opacity: 0 }, 0)
    // Salida: zoom hacia la oreja de Nachito
    .to('.intro__nachito', { scale: 3.2, xPercent: isDesktop() ? 30 : 18, yPercent: 60, transformOrigin: '38% 18%', ease: 'power2.in' }, 0.3)
    .to('.intro__pin', { opacity: 0, ease: 'power1.in' }, 0.8);
}

/* ───────── 1 · Síntoma: dial sin señal ───────── */
function Sintoma() {
  const ch = $('#cap-1');
  const ticks = $('.dial__ticks', ch);
  for (let i = 0; i < 40; i++) {
    const a = (-135 + (270 / 39) * i) * (Math.PI / 180);
    const r1 = i % 5 ? 160 : 150;
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', 200 + Math.sin(a) * r1); l.setAttribute('y1', 200 - Math.cos(a) * r1);
    l.setAttribute('x2', 200 + Math.sin(a) * 172); l.setAttribute('y2', 200 - Math.cos(a) * 172);
    ticks.append(l);
  }
  const tl = chapterTimeline(ch);
  StatCounter($('[data-stat]', ch), tl, 0.8);
  tl.from('.dial', { scale: 0.85, opacity: 0, duration: 0.9, ease: 'power3.out' }, 0.2)
    .from('.dial__nosignal', { opacity: 0, y: 10, duration: 0.4 }, 1.2);
  if (!reduced) {
    gsap.fromTo('.dial__needle', { rotate: -130 }, {
      rotate: 130, ease: 'none',
      scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    });
  }
  exitFade(ch);
}

/* ───────── 2 · Núcleo: anuncio se tacha, trend crece ───────── */
function Nucleo() {
  const ch = $('#cap-2');
  const tl = chapterTimeline(ch);
  $$('[data-stat]', ch).forEach((s, i) => StatCounter(s, tl, 0.6 + i * 0.2));
  if (reduced) return;
  const st = gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top top', end: '+=140%', scrub: true, pinSpacing: true, pin: '.nucleo__pin' } });
  st.fromTo('.phone--trend', { scale: 0.35, opacity: 0, x: isDesktop() ? 220 : 60 }, { scale: 1, opacity: 1, x: 0, ease: 'power2.out' }, 0.3)
    .to('.ad__strike line', { strokeDashoffset: 0, stagger: 0.1, ease: 'none' }, 0)
    .to('.ad', { scale: 0.45, opacity: 0.25, x: isDesktop() ? -260 : -60, y: -60, rotate: -8, ease: 'power2.in' }, 0.35)
    .to('.nucleo__pin', { opacity: 0.2, ease: 'none' }, 0.92);
}

/* ───────── 3 · Personas ───────── */
function Publico() {
  const ch = $('#cap-3');
  const tl = chapterTimeline(ch);
  tl.from($$('[data-persona]', ch), { y: 60, opacity: 0, rotate: 2, duration: 0.7, ease: 'power3.out', stagger: 0.18 }, 0.7);
  exitFade(ch);
}

/* ───────── 4 · CycleDiagram ───────── */
function Cadena() {
  const ch = $('#cap-4');
  const labels = ['Trend que da risa', 'Se comparte', 'Nachito se viraliza', '“Radio ITESO” en la mente', 'Descubren el podcast', 'Lo escuchan', 'Vuelven a compartir'];
  const keyIdx = 3;
  const g = $('.cycle__nodes', ch);
  const R = 220, C = 300;
  const nodes = labels.map((txt, i) => {
    const a = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
    const x = C + Math.cos(a) * R, y = C + Math.sin(a) * R;
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    node.setAttribute('class', `cycle__node${i === keyIdx ? ' key' : ''}`);
    const lx = C + Math.cos(a) * (R + 44), ly = C + Math.sin(a) * (R + 44);
    const anchor = Math.abs(Math.cos(a)) < 0.25 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
    node.innerHTML = `<circle cx="${x}" cy="${y}" r="22"/><text class="n" x="${x}" y="${y + 8}" text-anchor="middle">${i + 1}</text><text x="${lx}" y="${ly + 6}" text-anchor="${anchor}">${txt}</text>`;
    g.append(node);
    return node;
  });
  const circ = 2 * Math.PI * R;
  const draw = $('.cycle__draw', ch);
  draw.style.strokeDasharray = circ;
  draw.style.strokeDashoffset = circ;

  const tl = chapterTimeline(ch);
  tl.from('.cadena__head .micro', { opacity: 0, duration: 0.5 }, 0.8);
  if (reduced) { draw.style.strokeDashoffset = 0; nodes.forEach((n) => n.classList.add('on')); return; }

  const prog = { p: 0 };
  gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top top', end: '+=220%', scrub: true, pinSpacing: true, pin: '.cadena__pin' } })
    .to(prog, {
      p: 1, ease: 'none', duration: 1,
      onUpdate: () => {
        draw.style.strokeDashoffset = circ * (1 - prog.p);
        nodes.forEach((n, i) => n.classList.toggle('on', prog.p >= i / labels.length + 0.01));
      },
    })
    .to('.cycle', { rotate: 8, scale: 0.94, opacity: 0.3, duration: 0.25 }, 1);
}

/* ───────── 5 · Nachito: revelación en capas + zoom a la playera ───────── */
function Nachito() {
  const ch = $('#cap-5');
  const tl = chapterTimeline(ch);
  if (reduced) return;
  gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top top', end: '+=160%', scrub: true, pinSpacing: true, pin: '.nachito__pin' } })
    .fromTo('.nachito__bg', { scale: 1.25, filter: 'brightness(.4)' }, { scale: 1, filter: 'brightness(1)', ease: 'power1.out', duration: 0.4 })
    // Zoom a la playera de Radio ITESO (Nachito al centro, pecho ~52% de alto)
    .to('.nachito__bg', { scale: isDesktop() ? 2.4 : 2.9, transformOrigin: '50% 54%', ease: 'power2.inOut', duration: 0.5 }, 0.45)
    .to('.nachito__copy', { y: -40, opacity: 0, duration: 0.2 }, 0.8);
  void tl;
}

/* ───────── 6 · PinnedVideo (scrub) ───────── */
function Experiencia() {
  const ch = $('#cap-6');
  const video = $('video[data-scrub]', ch);
  const steps = $$('[data-step]', ch);
  const tl = chapterTimeline(ch);
  StatCounter($('[data-stat]', ch), tl, 0.4);
  tl.from(steps, { x: -20, opacity: 0, stagger: 0.12, duration: 0.5 }, 0.3);
  // Marcas de paso (segundos dentro del video montado): escucha 0–6.7 s, baila 6.7–21.7 s, te toca 21.7 s+ (de 28.3 s)
  const marks = [0, 0.24, 0.77];
  const setStep = (p) => steps.forEach((s, i) => s.classList.toggle('on', p >= marks[i]));
  setStep(0);
  if (reduced) { steps.forEach((s) => s.classList.add('on')); return; }

  let ready = false;
  const load = () => {
    if (video.dataset.loaded) return;
    $$('source', video).forEach((s) => (s.src = s.dataset.src));
    video.dataset.loaded = '1';
    video.load();
    video.addEventListener('loadedmetadata', () => (ready = true), { once: true });
  };
  ScrollTrigger.create({ trigger: ch, start: 'top 200%', onEnter: load });

  let target = 0;
  gsap.timeline({
    scrollTrigger: {
      trigger: ch, start: 'top top', end: '+=320%', scrub: true, pinSpacing: true, pin: '.exp__pin',
      onUpdate: (self) => {
        setStep(self.progress);
        if (ready && video.duration) target = self.progress * (video.duration - 0.05);
      },
    },
  }).to('.phone--main', { rotate: -2, scale: 1.04, ease: 'none' });

  // Suaviza el seek para que el video avance fluido con el scroll
  gsap.ticker.add(() => {
    if (!ready) return;
    const d = target - video.currentTime;
    if (Math.abs(d) > 0.02) video.currentTime += d * 0.35;
  });
}

/* ───────── 7 · Meta: ecualizador ───────── */
function Meta() {
  const ch = $('#cap-7');
  const eq = $('.eq', ch);
  eq.innerHTML = '<i></i>'.repeat(24);
  const bars = $$('i', eq);
  const tl = chapterTimeline(ch);
  tl.from('.meta__visual img', { clipPath: 'inset(100% 0 0 0)', duration: 1.1, ease: 'power4.out' }, 0.1)
    .from($$('.chips li', ch), { y: 16, opacity: 0, stagger: 0.12, duration: 0.5 }, 0.8)
    .from('.flow-mini', { opacity: 0, duration: 0.5 }, 1.1)
    .from($('.btn', ch), { scale: 0.8, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, 1.2);
  if (!reduced) {
    bars.forEach((b, i) => gsap.to(b, { scaleY: () => 1.5 + Math.random() * 3.5, duration: 0.3 + (i % 5) * 0.07, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.03 }));
    gsap.to('.meta__visual img', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  exitFade(ch);
}

/* ───────── 8 · Jingle ───────── */
function Jingle() {
  const ch = $('#cap-8');
  const tl = chapterTimeline(ch);
  tl.from($$('[data-benefit]', ch), { y: 40, opacity: 0, stagger: 0.15, duration: 0.6 }, 0.8);
  if (!reduced) {
    gsap.fromTo('.jingle__text', { attr: { startOffset: '-60%' } }, {
      attr: { startOffset: '10%' }, ease: 'none',
      scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
  exitFade(ch);
}

/* ───────── 9 · ChainFeed + alcance ───────── */
function Contagio() {
  const ch = $('#cap-9');
  const svg = $('.reach', ch);
  const nodes = [
    { x: 300, y: 170, r: 16, cls: 'iteso', label: 'ITESO' },
    ...Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2; return { x: 300 + Math.cos(a) * 130, y: 170 + Math.sin(a) * 105, r: 8, cls: '' }; }),
    ...Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2 + 0.2; return { x: 300 + Math.cos(a) * 250, y: 170 + Math.sin(a) * 150, r: 5, cls: i % 3 ? '' : 'prepa' }; }),
  ];
  const links = $('.reach__links', svg), gn = $('.reach__nodes', svg);
  nodes.slice(1).forEach((n, i) => {
    const from = i < 9 ? nodes[0] : nodes[1 + ((i - 9) % 9)];
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', `M${from.x},${from.y} Q${(from.x + n.x) / 2},${(from.y + n.y) / 2 - 30} ${n.x},${n.y}`);
    links.append(p);
  });
  nodes.forEach((n) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', n.x); c.setAttribute('cy', n.y); c.setAttribute('r', n.r);
    if (n.cls) c.setAttribute('class', n.cls);
    gn.append(c);
  });
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', 300); t.setAttribute('y', 206); t.setAttribute('text-anchor', 'middle'); t.textContent = 'ITESO';
  gn.append(t);

  const tl = chapterTimeline(ch);
  const paths = $$('path', links);
  paths.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = reduced ? 0 : L; });
  if (reduced) return;
  const cards = $$('.chain__card', ch);
  const circles = $$('circle', gn);
  // Entrada al llegar (no depende del scrub): las tarjetas se "pasan el turno"
  tl.from(cards, { y: 80, opacity: 0, rotate: (i) => (i % 2 ? 6 : -6), stagger: 0.15, duration: 0.6, ease: 'power3.out' }, 0.5)
    .from(circles.slice(0, 1), { scale: 0, transformOrigin: 'center', duration: 0.4, ease: 'back.out(3)' }, 0.8);
  // Scrub: los shares salen del ITESO hacia otras unis y prepas
  gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top top', end: '+=200%', scrub: true, pinSpacing: true, pin: '.contagio__pin' } })
    .to(cards, { y: (i) => -i * 14, stagger: 0.05, duration: 0.3 }, 0)
    .from(circles.slice(1), { scale: 0, transformOrigin: 'center', stagger: 0.02, duration: 0.15 }, 0.05)
    .to(paths, { strokeDashoffset: 0, stagger: 0.02, duration: 0.2 }, 0.1)
    .to('.contagio__pin', { opacity: 0.2, duration: 0.15 }, 0.9);
}

/* ───────── 10 · StationMap + ScaleCompare ───────── */
function Donde() {
  const ch = $('#cap-10');
  const tl = chapterTimeline(ch);
  const path = $('.stationmap__path', ch);
  tl.from(path, { opacity: 0, duration: 0.6 }, 0.5)
    .from($$('.pins li', ch), { y: -30, opacity: 0, stagger: 0.14, duration: 0.5, ease: 'bounce.out' }, 0.7)
    .from('.scale__door', { opacity: 0, duration: 0.4 }, 0.9)
    .from('.scale__person', { y: 40, opacity: 0, duration: 0.5 }, 1)
    .from('.scale__nachito', { y: 60, opacity: 0, duration: 0.6, ease: 'back.out(1.6)' }, 1.15)
    .from($$('.scale__labels text', ch), { opacity: 0, stagger: 0.12, duration: 0.3 }, 1.4);
  exitFade(ch);
}

/* ───────── 11 · MetricCard ───────── */
function Medicion() {
  const ch = $('#cap-11');
  const tl = chapterTimeline(ch);
  tl.from($$('[data-metric]', ch), { y: 50, opacity: 0, stagger: 0.16, duration: 0.6 }, 0.7)
    .from($$('[data-metric] .check', ch), { scale: 0, stagger: 0.16, duration: 0.5, ease: 'back.out(3)' }, 1);
  exitFade(ch);
}

/* ───────── 12 · Negocio ───────── */
function Negocio() {
  const ch = $('#cap-12');
  const tl = chapterTimeline(ch);
  tl.from($$('[data-biz]', ch), { x: -40, opacity: 0, stagger: 0.15, duration: 0.5 }, 0.7)
    .from('.biz__pack', { opacity: 0, duration: 0.5 }, 1.4);
  exitFade(ch);
}

/* ───────── 13 · CTA ───────── */
function CTA() {
  const ch = $('#cap-13');
  const tl = chapterTimeline(ch);
  tl.from('.qr', { scale: 0.7, opacity: 0, duration: 0.8, ease: 'back.out(1.8)' }, 0.6)
    .from('.phone--cta', { y: 80, opacity: 0, duration: 0.8 }, 0.4);
  const video = $('.cta__video', ch);
  const btn = $('.mute', ch);
  btn.addEventListener('click', () => {
    video.muted = !video.muted;
    btn.setAttribute('aria-pressed', String(!video.muted));
    btn.setAttribute('aria-label', video.muted ? 'Activar sonido' : 'Silenciar');
    btn.textContent = video.muted ? '🔇 Sonido' : '🔊 Sonido';
    if (video.paused) video.play().catch(() => {});
  });
}

/* ───────── Lazy video (autoplay solo en pantalla) ───────── */
function LazyVideos() {
  $$('video[data-lazy-video]').forEach((v) => {
    if (reduced) return; // en reduced-motion solo se ve el póster
    ScrollTrigger.create({
      trigger: v, start: 'top 150%', end: 'bottom -50%',
      onEnter: () => {
        if (!v.dataset.loaded) { $$('source', v).forEach((s) => (s.src = s.dataset.src)); v.load(); v.dataset.loaded = '1'; }
        v.play().catch(() => {});
      },
      onEnterBack: () => v.play().catch(() => {}),
      onLeave: () => v.pause(),
      onLeaveBack: () => v.pause(),
    });
  });
}

/* ───────── Init ───────── */
ProgressEQ();
ChapterIndex();
Intro();
Sintoma();
Nucleo();
Publico();
Cadena();
Nachito();
Experiencia();
Meta();
Jingle();
Contagio();
Donde();
Medicion();
Negocio();
CTA();
LazyVideos();

if (reduced) {
  // Fades simples en lugar de las animaciones
  ScrollTrigger.getAll().forEach((st) => st.animation && st.animation.progress(1));
  gsap.utils.toArray('.chapter').forEach((ch) => gsap.from(ch, { opacity: 0, duration: 0.6, scrollTrigger: { trigger: ch, start: 'top 80%' } }));
}

window.addEventListener('load', () => ScrollTrigger.refresh());
