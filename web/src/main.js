import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = () => window.matchMedia('(min-width: 900px)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
if (reduced) document.documentElement.classList.add('rm');

/* ═════════ Lenis ═════════ */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.1 }) : window.scrollTo(0, y));

const chapters = $$('.scene');
const TONES = { blue: [91, 124, 255], red: [255, 90, 95], amber: [255, 182, 39], green: [47, 224, 138] };

/* ═════════ TextFX: splitter + efectos ═════════ */
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ΔΣ';

function split(el, mode) {
  if (el._split) return el._split;
  const words = [], chars = [];
  const walk = (node) => {
    [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) return frag.append(document.createTextNode(' '));
          const mask = document.createElement('span');
          mask.className = 'w-mask';
          const w = document.createElement('span');
          w.className = 'w';
          if (mode === 'chars') {
            [...t].forEach((ch) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; s.dataset.ch = ch; w.append(s); chars.push(s); });
          } else w.textContent = t;
          mask.append(w);
          frag.append(mask);
          words.push(w);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && !c.classList.contains('type-cursor')) walk(c);
    });
  };
  walk(el);
  if (mode === 'chars') el.querySelectorAll('.w-mask').forEach((m) => (m.style.overflow = 'visible'));
  el._split = { words, chars };
  return el._split;
}

const markOn = (el) => $$('.mk', el).forEach((m) => m.classList.add('on'));
const markOff = (el) => $$('.mk', el).forEach((m) => m.classList.remove('on'));

function makeFX(el) {
  const kind = el.dataset.fx;
  const tl = gsap.timeline({ paused: true, onComplete: () => markOn(el), onReverseComplete: () => markOff(el) });
  if (kind === 'rise') {
    const { words } = split(el, 'words');
    tl.from(words, { yPercent: 115, rotate: 4, duration: 0.95, ease: 'power4.out', stagger: 0.06 });
  } else if (kind === 'chars3d') {
    const { chars } = split(el, 'chars');
    tl.from(chars, { yPercent: 70, rotateX: -95, opacity: 0, transformPerspective: 700, transformOrigin: '50% 100%', duration: 0.8, ease: 'back.out(1.8)', stagger: 0.035 });
  } else if (kind === 'blur') {
    const { words } = split(el, 'words');
    $$('.w-mask', el).forEach((m) => (m.style.overflow = 'visible'));
    tl.from(words, { opacity: 0, filter: 'blur(16px)', scale: 1.25, y: 18, duration: 0.9, ease: 'power3.out', stagger: 0.08 });
  } else if (kind === 'scramble') {
    const { chars } = split(el, 'chars');
    const n = chars.length;
    const st = { p: 0 };
    tl.to(st, {
      p: 1, duration: 1.5, ease: 'none',
      onUpdate() {
        chars.forEach((c, i) => {
          const r = (i / n) * 0.75;
          if (st.p >= r + 0.25) { c.textContent = c.dataset.ch; c.style.opacity = 1; c.style.color = ''; }
          else if (st.p >= r) { c.textContent = c.dataset.ch === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]; c.style.opacity = 0.75; c.style.color = 'var(--signal-red)'; }
          else { c.style.opacity = 0; }
        });
      },
    });
    chars.forEach((c) => (c.style.opacity = 0));
  } else if (kind === 'wipe') {
    el.style.position = 'relative';
    const bar = document.createElement('span');
    bar.setAttribute('aria-hidden', 'true');
    Object.assign(bar.style, { position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: 'var(--signal-amber)', transformOrigin: 'left', zIndex: 2 });
    el.append(bar);
    // Barra ámbar que barre el titular: el texto aparece detrás de ella
    const words = split(el, 'words').words;
    gsap.set(words, { opacity: 0 });
    gsap.set(bar, { scaleX: 0 });
    tl.to(bar, { scaleX: 1, duration: 0.45, ease: 'power3.in' })
      .set(words, { opacity: 1 })
      .set(bar, { transformOrigin: 'right' })
      .to(bar, { scaleX: 0, duration: 0.55, ease: 'power3.out' });
  } else if (kind === 'type' || kind === 'type-lg') {
    const { chars, words } = split(el, kind === 'type' ? 'chars' : 'words');
    const cur = document.createElement('span');
    cur.className = 'type-cursor';
    el.append(cur);
    gsap.set(cur, { opacity: 0 });
    tl.set(cur, { opacity: 1 });
    if (kind === 'type') tl.from(chars, { opacity: 0, duration: 0.01, stagger: Math.min(0.035, 1.4 / chars.length) });
    else tl.from(words, { opacity: 0, y: 14, duration: 0.25, stagger: 0.12, ease: 'power2.out' });
    tl.to(cur, { opacity: 0, duration: 0.3, delay: 0.6 });
  }
  return tl;
}

const fxMap = new Map();
$$('[data-fx]').forEach((el) => fxMap.set(el, makeFX(el)));
const fx = (el) => (el ? fxMap.get(el) : null);

/* Counter */
function counter(stat) {
  const num = $('[data-count]', stat);
  const obj = { v: 0 };
  return gsap.to(obj, { v: Number(num.dataset.count), duration: 1.4, ease: 'power2.out', paused: true, onUpdate: () => (num.textContent = Math.round(obj.v)) });
}

/* ═════════ Escenas (beats) ═════════ */
const beatTimes = []; // { tl, t }

function sceneTL(el) {
  const len = Number(el.dataset.len || 250);
  const tl = gsap.timeline({
    defaults: { duration: 1, ease: 'power2.inOut' },
    scrollTrigger: { trigger: el, start: 'top top', end: `+=${len}%`, scrub: 0.8, pin: $('.scene__inner', el), pinSpacing: true, invalidateOnRefresh: true, anticipatePin: 1 },
  });
  tl._beats = [0];
  return tl;
}
const beat = (tl, t) => tl._beats.push(t);

// Dispara un efecto de tiempo cuando el scrub cruza "at" (y lo revierte hacia atrás)
function cue(tl, at, anim, back = true) {
  if (!anim) return;
  tl.call(() => {
    const dir = tl.scrollTrigger ? tl.scrollTrigger.direction : 1;
    if (dir < 0) { if (back) anim.reverse(); } else anim.play();
  }, null, at);
}

// El titular empieza al centro y grande, luego viaja a su lugar
function centerDelta(el, box) {
  let x = 0, y = 0, n = el;
  while (n && n !== box) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { dx: box.clientWidth / 2 - (x + el.offsetWidth / 2), dy: box.clientHeight / 2 - (y + el.offsetHeight / 2) };
}
function heroMove(tl, el, box, hold = 0.5, dur = 1) {
  const s = () => Math.min(1.3, (box.clientWidth * 0.9) / el.offsetWidth);
  tl.fromTo(el, { x: () => centerDelta(el, box).dx, y: () => centerDelta(el, box).dy, scale: s },
    { x: 0, y: 0, scale: 1, duration: dur, ease: 'power3.inOut' }, hold);
  beat(tl, hold + dur);
}
// Al entrar la escena: reproducir el efecto del titular
function onEnterPlay(el, anim, start = 'top 65%') {
  if (!anim) return;
  ScrollTrigger.create({ trigger: el, start, onEnter: () => anim.play(), onLeaveBack: () => anim.reverse() });
}
function hold(tl, d = 0.8) { tl.to({}, { duration: d }); beat(tl, tl.duration()); }
function exit(tl, el) { tl.to($('.scene__inner > .wrap', el) || $('.scene__inner', el), { autoAlpha: 0, y: -50, duration: 0.6, ease: 'power2.in' }); }

// Deck en móvil: entra uno, sale el anterior
function deckSeq(tl, items, start, step = 0.9) {
  items.forEach((it, i) => {
    const t = start + i * step;
    tl.fromTo(it, { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out' }, t);
    if (i < items.length - 1) tl.to(it, { autoAlpha: 0, x: -60, duration: 0.4, ease: 'power3.in' }, t + step - 0.4);
    beat(tl, t + 0.45);
  });
}

/* ── 0 · Intro ── */
function Intro() {
  const el = $('#cap-0');
  const paths = $$('.intro__wave path', el);
  const amp = { a: 8 };
  const draw = (t = 0) => {
    paths.forEach((p, k) => {
      let d = 'M0,150';
      for (let x = 0; x <= 1200; x += 12) {
        const env = Math.sin((x / 1200) * Math.PI);
        const y = 150 + Math.sin(x / (34 + k * 16) + t * (2.2 + k * 0.7)) * amp.a * env * (1 - k * 0.25) + Math.sin(x / 8 + t * 6) * amp.a * 0.12 * env;
        d += ` L${x},${y.toFixed(1)}`;
      }
      p.setAttribute('d', d);
    });
  };
  draw();
  if (!reduced) gsap.ticker.add((time) => draw(time));

  const [kicker, h1, line] = [$('.kicker', el), $('h1', el), $('.line', el)];
  if (reduced) { [kicker, h1, line].forEach((e) => fx(e).progress(1)); return; }
  const tl = gsap.timeline({ delay: 0.3 });
  tl.add(fx(kicker).play(), 0)
    .add(fx(h1).play(), 0.5)
    .from('.intro__nachito', { yPercent: 45, opacity: 0, duration: 1.3, ease: 'power3.out' }, 0.6)
    .add(fx(line).play(), 1.3)
    .from('.scroll-hint', { opacity: 0, duration: 0.6 }, 2);

  gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: '+=130%', scrub: 0.8, pin: $('.scene__inner', el), pinSpacing: true } })
    .to(amp, { a: 120, ease: 'power1.in' }, 0)
    .to('.intro__copy', { autoAlpha: 0, y: -90, scale: 0.92, ease: 'power1.in' }, 0.15)
    .to('.scroll-hint', { opacity: 0 }, 0)
    .to('.intro__nachito', { scale: 3.4, xPercent: isDesktop() ? 30 : 16, yPercent: 62, transformOrigin: '38% 18%', ease: 'power2.in' }, 0.3)
    .to('.intro__rings', { scale: 3, autoAlpha: 0 }, 0.3)
    .to('#cap-0 .scene__inner', { autoAlpha: 0, ease: 'power1.in' }, 0.85);
}

/* ── 1 · Síntoma ── */
function Sintoma() {
  const el = $('#cap-1'), box = $('.scene__inner', el);
  const ticks = $('.dial__ticks', el);
  for (let i = 0; i < 44; i++) {
    const a = (-135 + (270 / 43) * i) * (Math.PI / 180);
    const r1 = i % 5 ? 164 : 152;
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', 200 + Math.sin(a) * r1); l.setAttribute('y1', 200 - Math.cos(a) * r1);
    l.setAttribute('x2', 200 + Math.sin(a) * 178); l.setAttribute('y2', 200 - Math.cos(a) * 178);
    ticks.append(l);
  }
  const h = $('.hero', el), line = $('[data-beat="line"]', el), dial = $('.dial', el), stat = $('.stat', el);
  const spark = $('.spark__line', el);
  const L = 330; spark.style.strokeDasharray = L;
  onEnterPlay(el, fx(h));
  const tl = sceneTL(el);
  heroMove(tl, h, box, 0.6);
  tl.from(dial, { autoAlpha: 0, scale: 0.6, rotate: -40, duration: 1 }, 1.0);
  cue(tl, 1.6, fx(line));
  tl.from(stat, { autoAlpha: 0, y: 50, duration: 0.7 }, 2.2);
  cue(tl, 2.3, counter(stat));
  tl.fromTo(spark, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1 }, 2.4)
    .from($$('.spark__pts circle', el), { scale: 0, transformOrigin: '50% 50%', stagger: 0.18, duration: 0.3 }, 2.4)
    .from($$('.spark__lbl text', el), { opacity: 0, stagger: 0.15, duration: 0.3 }, 2.6);
  beat(tl, 3.4);
  hold(tl, 0.8);
  tl.fromTo('#cap-1 .dial__needle', { rotate: -130 }, { rotate: 120, duration: tl.duration(), ease: 'none' }, 0);
  exit(tl, el);
  return tl;
}

/* ── 2 · Núcleo ── */
let reactionsOn = false;
function Nucleo() {
  const el = $('#cap-2'), box = $('.scene__inner', el);
  const a = $('.nucleo__a', el), b = $('.nucleo__b', el), ad = $('.ad', el), phone = $('.phone--trend', el);
  const stats = $$('.nucleo__stats .stat', el);
  onEnterPlay(el, fx(a));
  const tl = sceneTL(el);
  heroMove(tl, a, box, 0.5);
  tl.from(ad, { autoAlpha: 0, y: 70, rotate: 5, duration: 0.8 }, 1.2);
  beat(tl, 2.0);
  tl.to('#cap-2 .ad__strike line', { strokeDashoffset: 0, stagger: 0.15, duration: 0.5 }, 2.0)
    .to($('.strike', el), { '--strike': 1, duration: 0.6 }, 2.1)
    .to(a, { opacity: 0.45, duration: 0.4 }, 2.6)
    .to(ad, { scale: 0.45, xPercent: -40, yPercent: -30, rotate: -12, autoAlpha: 0, duration: 0.8, ease: 'power2.in' }, 2.7)
    .from(phone, { autoAlpha: 0, scale: 0.4, rotate: 8, duration: 0.9, ease: 'back.out(1.4)' }, 2.9);
  if (!isDesktop()) tl.to(a, { autoAlpha: 0, y: -30, duration: 0.4 }, 3.2);
  cue(tl, 3.5, fx(b));
  tl.call(() => (reactionsOn = tl.scrollTrigger.direction > 0), null, 3.5);
  beat(tl, 3.9);
  if (isDesktop()) {
    stats.forEach((s, i) => { tl.from(s, { autoAlpha: 0, y: 50, duration: 0.6 }, 4.1 + i * 0.6); cue(tl, 4.2 + i * 0.6, counter(s)); beat(tl, 4.7 + i * 0.6); });
  } else {
    deckSeq(tl, stats, 4.1, 1.0);
    stats.forEach((s, i) => cue(tl, 4.2 + i * 1.0, counter(s)));
  }
  hold(tl, 0.8);
  tl.call(() => (reactionsOn = tl.scrollTrigger.direction < 0), null, tl.duration());
  exit(tl, el);

  // Emisor de reacciones flotando sobre el video
  const host = $('.reactions', el);
  const EMO = ['😂', '🔥', '❤️', '🤣', '🎧', '😂'];
  setInterval(() => {
    if (!reactionsOn || reduced || document.hidden) return;
    const s = document.createElement('span');
    s.textContent = EMO[(Math.random() * EMO.length) | 0];
    host.append(s);
    gsap.fromTo(s, { y: 0, x: 0, opacity: 0, scale: 0.6 }, { y: -rand(160, 260), x: rand(-40, 10), opacity: 1, scale: rand(0.9, 1.4), duration: 2.2, ease: 'power1.out', onComplete: () => s.remove() });
    gsap.to(s, { opacity: 0, duration: 0.6, delay: 1.6 });
  }, 380);
  return tl;
}

/* ── 3 · Público ── */
function Publico() {
  const el = $('#cap-3'), box = $('.scene__inner', el);
  const h = $('.hero', el), line = $('[data-beat="line"]', el), cards = $$('.persona', el);
  $$('.slang span', el).forEach((s) => gsap.set(s, { left: `${rand(2, 86)}%`, top: `${rand(6, 86)}%`, rotate: rand(-12, 12) }));
  onEnterPlay(el, fx(h));
  const tl = sceneTL(el);
  heroMove(tl, h, box, 0.5);
  cue(tl, 1.5, fx(line));
  if (isDesktop()) {
    cards.forEach((c, i) => { tl.from(c, { autoAlpha: 0, y: 120, rotate: (i - 1) * 5, duration: 0.7, ease: 'power3.out' }, 1.9 + i * 0.6); beat(tl, 2.6 + i * 0.6); });
  } else deckSeq(tl, cards, 1.9, 1.0);
  hold(tl, 0.8);
  tl.to($$('.slang span', el), { y: (i) => (i % 2 ? -1 : 1) * rand(60, 160), duration: tl.duration(), ease: 'none' }, 0);
  exit(tl, el);
  return tl;
}

/* ── 4 · Cadena ── */
function Cadena() {
  const el = $('#cap-4'), box = $('.scene__inner', el);
  const labels = ['Trend que da risa', 'Se comparte', 'Nachito se viraliza', '“Radio ITESO” en la mente', 'Descubren el podcast', 'Lo escuchan', 'Vuelven a compartir'];
  const keyIdx = 3, R = 220, C = 300;
  const g = $('.cycle__nodes', el);
  const nodes = labels.map((txt, i) => {
    const a = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
    const x = C + Math.cos(a) * R, y = C + Math.sin(a) * R;
    const lx = C + Math.cos(a) * (R + 46), ly = C + Math.sin(a) * (R + 46);
    const anchor = Math.abs(Math.cos(a)) < 0.25 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    node.setAttribute('class', `cycle__node${i === keyIdx ? ' key' : ''}`);
    node.innerHTML = `<circle cx="${x}" cy="${y}" r="24"/><text class="n" x="${x}" y="${y + 8}" text-anchor="middle">${i + 1}</text><text x="${lx}" y="${ly + 6}" text-anchor="${anchor}">${txt}</text>`;
    g.append(node);
    return node;
  });
  if (!isDesktop()) $('.cycle', el).setAttribute('viewBox', '50 50 500 500');
  const draw = $('.cycle__draw', el);
  const circ = 2 * Math.PI * R;
  draw.style.strokeDasharray = circ;
  draw.style.strokeDashoffset = circ;
  const stepEl = $('.cycle__step', el), labelEl = $('.cycle__label', el);
  let cur = -1;
  const setStep = (i) => {
    if (i === cur) return;
    cur = i;
    nodes.forEach((n, j) => n.classList.toggle('on', j <= i));
    stepEl.textContent = String(i + 1).padStart(2, '0');
    labelEl.textContent = labels[i];
    labelEl.style.color = i === keyIdx ? 'var(--yellow)' : '';
    gsap.fromTo(labelEl, { yPercent: 40, opacity: 0, filter: 'blur(6px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' });
  };

  const h = $('.hero', el), line = $('[data-beat="line"]', el);
  onEnterPlay(el, fx(h));
  const tl = sceneTL(el);
  heroMove(tl, h, box, 0.5);
  cue(tl, 1.5, fx(line));
  tl.from('.cycle-wrap', { autoAlpha: 0, scale: 0.8, duration: 0.8 }, 1.2);
  const prog = { p: 0 };
  const per = 0.5;
  tl.to(prog, {
    p: 1, duration: labels.length * per, ease: 'none',
    onUpdate: () => {
      draw.style.strokeDashoffset = circ * (1 - prog.p);
      setStep(Math.min(labels.length - 1, Math.floor(prog.p * labels.length * 0.999)));
    },
  }, 1.8);
  tl.to('#cap-4 .cycle__orbit', { rotate: 360, duration: labels.length * per, ease: 'none' }, 1.8);
  labels.forEach((_, i) => beat(tl, 1.8 + (i + 0.6) * per));
  tl.from('.cadena__tag', { autoAlpha: 0, y: 20, duration: 0.5 }, tl.duration());
  hold(tl, 0.8);
  exit(tl, el);
  setStep(0);
  return tl;
}

/* ── 5 · Nachito ── */
function Nachito() {
  const el = $('#cap-5');
  const h = $('h2', el), stamp = $('.stamp', el), line = $('[data-beat="line"]', el);
  onEnterPlay(el, fx(h), 'top 30%');
  const tl = sceneTL(el);
  tl.fromTo('.nachito__bg', { scale: 1.3, filter: 'brightness(.35) saturate(.6)' }, { scale: 1, filter: 'brightness(1) saturate(1)', duration: 1 }, 0)
    .from(stamp, { autoAlpha: 0, scale: 3.2, rotate: -28, duration: 0.45, ease: 'back.out(2)' }, 1.0)
    .to(stamp, { x: '+=6', duration: 0.05, repeat: 5, yoyo: true, ease: 'none' }, 1.45);
  beat(tl, 1.5);
  cue(tl, 1.6, fx(line));
  tl.to('.nachito__bg', { scale: isDesktop() ? 2.4 : 2.9, transformOrigin: isDesktop() ? '50% 72%' : '50% 60%', duration: 1.1 }, 2.1)
    .to('.nachito__copy', { autoAlpha: 0, y: 40, duration: 0.4 }, 2.2)
    .to('.nachito__callout', { autoAlpha: 1, duration: 0.01 }, 3.0)
    .from('.nachito__callout-line', { scaleX: 0, duration: 0.4 }, 3.0)
    .from('.nachito__callout-txt', { autoAlpha: 0, x: -14, duration: 0.4 }, 3.25);
  beat(tl, 3.7);
  hold(tl, 0.8);
  tl.to('#cap-5 .scene__inner', { autoAlpha: 0, duration: 0.5 });
  return tl;
}

/* ── 6 · Experiencia (video con scrub) ── */
function Experiencia() {
  const el = $('#cap-6'), box = $('.scene__inner', el);
  const title = $('.exp__title', el), words = $$('.exp__title .w', el), seps = $$('.exp__title .sep', el);
  const video = $('video[data-scrub]', el), steps = $$('.steps li', el), ghosts = $$('.ghost span', el);
  const stat = $('.exp__stat', el), bar = $('.phone__timeline i', el), phone = $('.phone--main', el);
  const marks = [0, 0.24, 0.77]; // escucha 0–6.7 s · baila 6.7–21.7 s · te toca 21.7 s+ (de 28.3 s)
  let curStep = -1;
  const setStep = (p) => {
    const i = p >= marks[2] ? 2 : p >= marks[1] ? 1 : 0;
    if (i === curStep) return;
    curStep = i;
    steps.forEach((s, j) => s.classList.toggle('on', isDesktop() ? j <= i : j === i));
    ghosts.forEach((g, j) => gsap.to(g, { opacity: j === i ? 1 : 0, scale: j === i ? 1 : 0.9, duration: 0.5 }));
  };

  let ready = false, target = 0;
  const load = () => {
    if (video.dataset.loaded) return;
    $$('source', video).forEach((s) => (s.src = s.dataset.src));
    video.dataset.loaded = '1';
    video.load();
    video.addEventListener('loadedmetadata', () => (ready = true), { once: true });
  };
  ScrollTrigger.create({ trigger: el, start: 'top 250%', onEnter: load });
  gsap.ticker.add(() => {
    if (!ready) return;
    const d = target - video.currentTime;
    if (Math.abs(d) > 0.02) video.currentTime += d * 0.35;
  });

  const tl = sceneTL(el);
  // Cada palabra entra sola y grande
  tl.from(words, { autoAlpha: 0, scale: 1.8, yPercent: 30, duration: 0.35, stagger: 0.32, ease: 'back.out(1.6)' }, 0)
    .from(seps, { autoAlpha: 0, duration: 0.2, stagger: 0.32 }, 0.25);
  heroMove(tl, title, box, 1.0, 0.9);
  tl.from(phone, { autoAlpha: 0, y: 120, rotateY: -28, transformPerspective: 900, duration: 0.9 }, 1.5);
  if (isDesktop()) tl.from(steps, { autoAlpha: 0, x: -24, stagger: 0.15, duration: 0.4 }, 1.9);
  const vp = { p: 0 };
  tl.to(vp, {
    p: 1, duration: 6, ease: 'none',
    onUpdate: () => {
      setStep(vp.p);
      if (ready && video.duration) target = vp.p * (video.duration - 0.05);
      bar.style.transform = `scaleX(${vp.p})`;
    },
  }, 2.4);
  beat(tl, 2.6); beat(tl, 2.4 + 6 * 0.3); beat(tl, 2.4 + 6 * 0.8);
  if (isDesktop()) { tl.from(stat, { autoAlpha: 0, y: 40, duration: 0.5 }, 8.5); cue(tl, 8.6, counter(stat)); beat(tl, 9); }
  hold(tl, 0.6);
  tl.to(ghosts, { opacity: 0, duration: 0.3 }, tl.duration());
  exit(tl, el);
  setStep(0);
  return tl;
}

/* ── 7 · Meta ── */
function Meta() {
  const el = $('#cap-7'), box = $('.scene__inner', el);
  const a = $('.meta__a', el), b = $('.meta__b', el), fill = $('.fill', el), text = $('.meta__text', el), visual = $('.meta__visual', el);
  const eq = $('.eq', el);
  eq.innerHTML = '<i></i>'.repeat(26);
  if (!reduced) $$('i', eq).forEach((bEl, i) => gsap.to(bEl, { scaleY: () => 1.5 + Math.random() * 3.5, duration: 0.3 + (i % 5) * 0.07, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.03 }));
  onEnterPlay(el, fx(a));
  const tl = sceneTL(el);
  heroMove(tl, a, box, 0.5);
  tl.from(b, { autoAlpha: 0, y: 40, duration: 0.5 }, 1.3)
    .fromTo(fill, { '--fill': '0%' }, { '--fill': '100%', duration: 1.4, ease: 'none' }, 1.7);
  beat(tl, 3.1);
  if (isDesktop()) {
    tl.from(visual, { autoAlpha: 0, x: 80, duration: 0.7 }, 3.2)
      .from($('.meta__img', el), { clipPath: 'inset(100% 0 0 0)', duration: 0.8 }, 3.2)
      .from($$('.meta__info > *', el), { autoAlpha: 0, y: 24, stagger: 0.15, duration: 0.4 }, 3.7);
  } else {
    tl.to(text, { autoAlpha: 0, y: -50, duration: 0.5 }, 3.2)
      .from(visual, { autoAlpha: 0, y: 60, duration: 0.6 }, 3.5)
      .from($('.meta__img', el), { clipPath: 'inset(100% 0 0 0)', duration: 0.7 }, 3.5)
      .from($$('.meta__info > *', el), { autoAlpha: 0, y: 20, stagger: 0.12, duration: 0.35 }, 3.9);
  }
  beat(tl, 4.5);
  hold(tl, 0.8);
  exit(tl, el);
  return tl;
}

/* ── 8 · Jingle ── */
function Jingle() {
  const el = $('#cap-8'), box = $('.scene__inner', el);
  const h = $('.hero', el), line = $('[data-beat="line"]', el), cards = $$('.benefit', el);
  $$('.notes span', el).forEach((s) => gsap.set(s, { left: `${rand(4, 90)}%`, top: `${rand(8, 80)}%`, rotate: rand(-20, 20) }));
  onEnterPlay(el, fx(h));
  const tl = sceneTL(el);
  tl.from('.badge-next', { autoAlpha: 0, y: -20, duration: 0.4 }, 0.2);
  heroMove(tl, h, box, 0.5);
  cue(tl, 1.5, fx(line));
  tl.from('.jingle__wave', { autoAlpha: 0, duration: 0.5 }, 1.6)
    .fromTo('.jingle__text', { attr: { startOffset: '-70%' } }, { attr: { startOffset: '6%' }, duration: 3, ease: 'none' }, 1.6);
  if (isDesktop()) cards.forEach((c, i) => { tl.from(c, { autoAlpha: 0, y: 70, duration: 0.6 }, 2.3 + i * 0.6); beat(tl, 2.9 + i * 0.6); });
  else deckSeq(tl, cards, 2.3, 0.9);
  hold(tl, 0.8);
  tl.to($$('.notes span', el), { y: (i) => -rand(80, 220), rotate: (i) => rand(-40, 40), duration: tl.duration(), ease: 'none' }, 0);
  exit(tl, el);
  return tl;
}

/* ── 9 · Contagio ── */
function Contagio() {
  const el = $('#cap-9'), box = $('.scene__inner', el);
  const svg = $('.reach', el);
  const nodes = [
    { x: 300, y: 170, r: 16, cls: 'iteso' },
    ...Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2; return { x: 300 + Math.cos(a) * 120, y: 170 + Math.sin(a) * 100, r: 8, cls: '' }; }),
    ...Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2 + 0.2; return { x: 300 + Math.cos(a) * 250, y: 170 + Math.sin(a) * 150, r: 5, cls: i % 3 ? '' : 'prepa' }; }),
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
  const paths = $$('path', links);
  paths.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = reduced ? 0 : L; });
  const circles = $$('circle', gn);

  const h = $('.hero', el), line = $('[data-beat="line"]', el);
  onEnterPlay(el, fx(h));
  const tl = sceneTL(el);
  heroMove(tl, h, box, 0.5);
  cue(tl, 1.5, fx(line));
  const items = $$('.chain > *', el);
  tl.from(items, { autoAlpha: 0, y: 50, scale: 0.8, stagger: 0.28, duration: 0.45, ease: 'back.out(1.6)' }, 1.9);
  beat(tl, 3.9);
  tl.from('.reach-wrap', { autoAlpha: 0, duration: 0.4 }, 3.9)
    .from(circles[0], { scale: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(3)' }, 4.0)
    .from($$('.reach__rings circle', el), { scale: 0, transformOrigin: '50% 50%', stagger: 0.15, duration: 0.6 }, 4.0)
    .to(paths, { strokeDashoffset: 0, stagger: 0.03, duration: 0.3 }, 4.2)
    .from(circles.slice(1), { scale: 0, transformOrigin: '50% 50%', stagger: 0.03, duration: 0.25 }, 4.3);
  beat(tl, 5.2);
  hold(tl, 0.8);
  exit(tl, el);
  return tl;
}

/* ── 10 · Dónde vive ── */
function Donde() {
  const el = $('#cap-10'), box = $('.scene__inner', el);
  const grid = $('.stationmap__grid', el);
  for (let i = 1; i < 10; i++) grid.insertAdjacentHTML('beforeend', `<line x1="${i * 50}" y1="10" x2="${i * 50}" y2="350"/>`);
  for (let i = 1; i < 7; i++) grid.insertAdjacentHTML('beforeend', `<line x1="10" y1="${i * 50}" x2="490" y2="${i * 50}"/>`);
  const path = $('.stationmap__path', el);
  const L = path.getTotalLength();
  path.style.strokeDasharray = L;
  const h = $('.hero', el), line = $('[data-beat="line"]', el), map = $('.stationmap', el), scale = $('.scale', el);
  onEnterPlay(el, fx(h));
  const tl = sceneTL(el);
  heroMove(tl, h, box, 0.5);
  cue(tl, 1.5, fx(line));
  tl.from(map, { autoAlpha: 0, y: 50, duration: 0.6 }, 1.8)
    .fromTo(path, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.2, ease: 'none' }, 2.0)
    .from($$('.pins li', el), { autoAlpha: 0, y: -40, stagger: 0.24, duration: 0.4, ease: 'bounce.out' }, 2.1);
  beat(tl, 3.3);
  if (!isDesktop()) tl.to(map, { autoAlpha: 0, x: -60, duration: 0.4 }, 3.5);
  tl.from(scale, { autoAlpha: 0, y: 50, duration: 0.6 }, 3.6)
    .from('.scale__person', { y: 40, autoAlpha: 0, duration: 0.4 }, 3.8)
    .from('.scale__nachito', { y: 60, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.6)' }, 4.0)
    .from($$('.scale__dims line', el), { scaleY: 0, transformOrigin: '50% 100%', stagger: 0.12, duration: 0.4 }, 4.2)
    .from($$('.scale__labels text', el), { autoAlpha: 0, y: 10, stagger: 0.12, duration: 0.3 }, 4.4);
  beat(tl, 4.9);
  hold(tl, 0.8);
  exit(tl, el);
  return tl;
}

/* ── 11 · Medición ── */
function Medicion() {
  const el = $('#cap-11'), box = $('.scene__inner', el);
  const h = $('.hero', el), cards = $$('.metric', el);
  $$('.metric__check', el).forEach((s) => $$('circle, path', s).forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; }));
  onEnterPlay(el, fx(h));
  const tl = sceneTL(el);
  heroMove(tl, h, box, 0.8);
  const anim = (c, t) => {
    tl.to($$('.metric__check circle, .metric__check path', c), { strokeDashoffset: 0, stagger: 0.2, duration: 0.4 }, t + 0.3)
      .fromTo($('.metric__bar i', c), { scaleX: 0 }, { scaleX: 1, duration: 0.6 }, t + 0.4);
  };
  if (isDesktop()) cards.forEach((c, i) => { const t = 2.1 + i * 0.7; tl.from(c, { autoAlpha: 0, y: 70, duration: 0.5 }, t); anim(c, t); beat(tl, t + 0.7); });
  else { deckSeq(tl, cards, 2.1, 1.1); cards.forEach((c, i) => anim(c, 2.1 + i * 1.1)); }
  hold(tl, 0.8);
  exit(tl, el);
  return tl;
}

/* ── 12 · Negocio ── */
function Negocio() {
  const el = $('#cap-12'), box = $('.scene__inner', el);
  const h = $('.hero', el), line = $('[data-beat="line"]', el), items = $$('.biz li', el);
  onEnterPlay(el, fx(h));
  const tl = sceneTL(el);
  heroMove(tl, h, box, 0.5);
  cue(tl, 1.5, fx(line));
  tl.from('.biz__line', { scaleX: 0, transformOrigin: 'left center', duration: 1.8, ease: 'none' }, 1.9)
    .from(items, { autoAlpha: 0, y: 40, scale: 0.9, stagger: 0.45, duration: 0.45, ease: 'back.out(1.5)' }, 1.9)
    .from('.biz__pack', { autoAlpha: 0, duration: 0.4 }, 3.6);
  items.forEach((_, i) => beat(tl, 2.3 + i * 0.45));
  hold(tl, 0.8);
  exit(tl, el);
  return tl;
}

/* ── 13 · CTA ── */
function CTA() {
  const el = $('#cap-13');
  const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 60%', toggleActions: 'play none none reverse' } });
  tl.from('.cta__locked', { autoAlpha: 0, y: -12, duration: 0.4 }, 0)
    .from($$('.cta__w', el), { autoAlpha: 0, scale: 2.4, rotate: (i) => [-8, 6, -4][i], duration: 0.5, stagger: 0.22, ease: 'back.out(2)' }, 0.15)
    .from('#cap-13 .line', { autoAlpha: 0, y: 20, duration: 0.5 }, 0.9)
    .from('.qr', { autoAlpha: 0, scale: 0.6, duration: 0.7, ease: 'back.out(1.8)' }, 1.0)
    .from('#cap-13 .btn', { autoAlpha: 0, y: 20, duration: 0.4 }, 1.3)
    .from('.phone--cta', { autoAlpha: 0, y: 90, rotate: 6, duration: 0.8 }, 0.6);
  const video = $('.cta__video', el), btn = $('.mute', el);
  btn.addEventListener('click', () => {
    video.muted = !video.muted;
    btn.setAttribute('aria-pressed', String(!video.muted));
    btn.setAttribute('aria-label', video.muted ? 'Activar sonido' : 'Silenciar');
    btn.textContent = video.muted ? '🔇 Sonido' : '🔊 Sonido';
    if (video.paused) video.play().catch(() => {});
  });
  if (reduced) tl.progress(1);
}

/* ═════════ Sistemas globales ═════════ */
function ProgressEQ() {
  const host = $('.progress-eq__bars');
  const n = isDesktop() ? 64 : 32;
  host.innerHTML = '<i></i>'.repeat(n);
  const bars = $$('i', host);
  const seed = bars.map((_, i) => 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const head = Math.floor(self.progress * (n - 1));
      const v = Math.min(Math.abs(self.getVelocity()) / 2500, 1);
      bars.forEach((b, i) => {
        b.classList.toggle('on', i < head);
        b.classList.toggle('head', i === head);
        b.style.height = `${i <= head ? 4 + seed[i] * 10 + v * 8 * seed[(i + 7) % n] : 4}px`;
      });
    },
  });
}

let toneTarget = TONES.blue;
function ChapterIndex() {
  const ol = $('.chapter-index ol');
  const btns = [];
  const tCh = $('.tuner__ch'), tTitle = $('.tuner__title');
  const setActive = (i) => {
    btns.forEach((b, j) => b.setAttribute('aria-current', String(i === j)));
    tCh.textContent = String(i).padStart(2, '0');
    tTitle.textContent = chapters[i].dataset.title;
    toneTarget = TONES[chapters[i].dataset.tone] || TONES.blue;
  };
  chapters.forEach((ch, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = ch.dataset.title;
    btn.setAttribute('aria-label', `Ir a ${ch.dataset.title}`);
    btn.addEventListener('click', () => scrollToY(ch.getBoundingClientRect().top + window.scrollY));
    li.append(btn);
    ol.append(li);
    btns.push(btn);
    ScrollTrigger.create({ trigger: ch, start: 'top center', end: 'bottom center', refreshPriority: -1, onToggle: (self) => self.isActive && setActive(i) });
  });
  setActive(0);
}

/* Sintonizador: 88.0 → 95.1 FM a lo largo del recorrido */
function Tuner() {
  const tuner = $('.tuner'), freqEl = $('.tuner__freq'), needle = $('.tuner__needle'), ticks = $('.tuner__ticks');
  const MIN = 88, MAX = 108, TARGET = 95.1;
  for (let f = MIN; f <= MAX + 0.01; f += 0.5) {
    const i = document.createElement('i');
    if (Math.abs(f - 95) < 0.01) i.className = 'mark';
    ticks.append(i);
  }
  const cta = $('#cap-13');
  let vel = 0;
  const update = () => {
    const end = cta.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.4;
    const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, end)));
    const locked = p >= 1;
    let f = MIN + (TARGET - MIN) * p;
    if (!locked) f += (Math.random() - 0.5) * Math.min(vel / 1800, 1) * 0.6;
    freqEl.textContent = f.toFixed(1);
    const w = needle.parentElement.clientWidth;
    needle.style.transform = `translateX(${((f - MIN) / (MAX - MIN)) * w}px)`;
    tuner.classList.toggle('locked', locked);
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => { vel = Math.abs(self.getVelocity()); update(); } });
  window.addEventListener('resize', update);
  update();
}

/* Mundo: ondas de radio + partículas, color según el capítulo */
function World() {
  const cv = $('.world'), ctx = cv.getContext('2d');
  let W, H, dpr;
  const resize = () => { dpr = Math.min(window.devicePixelRatio || 1, 1.5); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; };
  resize();
  window.addEventListener('resize', resize);
  const col = [...TONES.blue];
  const parts = Array.from({ length: isDesktop() ? 80 : 40 }, () => ({ x: Math.random(), y: Math.random(), r: rand(0.6, 2.2), v: rand(0.00008, 0.0003), a: rand(0.15, 0.6) }));
  const rings = [];
  let last = 0, scrollV = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => (scrollV = Math.min(Math.abs(s.getVelocity()) / 3000, 1)) });
  const frame = (t) => {
    col.forEach((c, i) => (col[i] += (toneTarget[i] - c) * 0.04));
    const [r, g, b] = col.map((c) => c | 0);
    ctx.clearRect(0, 0, W, H);
    // halo
    const fx0 = W * (isDesktop() ? 0.72 : 0.5), fy0 = H * 0.42;
    const grd = ctx.createRadialGradient(fx0, fy0, 0, fx0, fy0, Math.max(W, H) * 0.6);
    grd.addColorStop(0, `rgba(${r},${g},${b},0.16)`);
    grd.addColorStop(1, 'rgba(5,10,28,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    // anillos
    if (t - last > 1.5 - scrollV) { rings.push({ r: 70 * dpr, a: 0.45 }); last = t; }
    ctx.lineWidth = 1.5 * dpr;
    for (let i = rings.length - 1; i >= 0; i--) {
      const k = rings[i];
      k.r += (1.4 + scrollV * 6) * dpr; k.a *= 0.992;
      if (k.a < 0.01 || k.r > Math.max(W, H)) { rings.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(${r},${g},${b},${k.a * 0.5})`;
      ctx.beginPath(); ctx.arc(fx0, fy0, k.r, 0, Math.PI * 2); ctx.stroke();
    }
    // partículas
    parts.forEach((p) => {
      p.y -= p.v * (1 + scrollV * 12);
      if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      ctx.fillStyle = `rgba(${r},${g},${b},${p.a})`;
      ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r * dpr, 0, Math.PI * 2); ctx.fill();
    });
  };
  if (reduced) frame(0);
  else gsap.ticker.add((time) => { if (!document.hidden) frame(time); });
}

/* Cursor */
function Cursor() {
  if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.body.classList.add('has-cursor');
  const c = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 }, rp = { ...pos };
  window.addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; c.classList.toggle('hover', !!e.target.closest('a, button')); });
  gsap.ticker.add(() => {
    rp.x += (pos.x - rp.x) * 0.18; rp.y += (pos.y - rp.y) * 0.18;
    dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${rp.x}px, ${rp.y}px) translate(-50%, -50%)`;
  });
}

/* Numerales gigantes con parallax */
function Numerals() {
  if (reduced) return;
  $$('.scene__num').forEach((n) => gsap.fromTo(n, { yPercent: 20 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: n.closest('.scene'), start: 'top bottom', end: 'bottom top', scrub: true } }));
}

/* Videos que se reproducen solo en pantalla */
function LazyVideos() {
  $$('video[data-lazy-video]').forEach((v) => {
    if (reduced) return;
    ScrollTrigger.create({
      trigger: v.closest('.scene'), start: 'top 150%', end: 'bottom -50%',
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

/* Modo presentación: ↓/espacio avanza tiempo por tiempo; ↑ regresa */
let beatPositions = [];
function computeBeats() {
  const ys = [0];
  scenes.forEach((tl) => {
    const st = tl.scrollTrigger;
    if (!st) return;
    const d = tl.duration();
    tl._beats.forEach((t) => ys.push(st.start + (Math.min(t, d) / d) * (st.end - st.start)));
  });
  ['#cap-13', '#cap-14'].forEach((s) => ys.push($(s).getBoundingClientRect().top + window.scrollY));
  beatPositions = [...new Set(ys.map((y) => Math.round(y)))].sort((a, b) => a - b);
  window.__beats = beatPositions;
}
function Keys() {
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    const next = ['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
    const prev = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
    if (!next && !prev) return;
    e.preventDefault();
    const y = lenis ? lenis.targetScroll : window.scrollY;
    let target;
    if (next) target = beatPositions.find((p) => p > y + 8);
    else target = [...beatPositions].reverse().find((p) => p < y - 8);
    if (target === undefined) target = next ? document.documentElement.scrollHeight : 0;
    scrollToY(target);
  });
}

/* ═════════ Init ═════════ */
const scenes = [];
ProgressEQ();
World();
Cursor();
Intro();
if (!reduced) {
  [Sintoma, Nucleo, Publico, Cadena, Nachito, Experiencia, Meta, Jingle, Contagio, Donde, Medicion, Negocio].forEach((f) => scenes.push(f()));
} else {
  // Sin animaciones: todo visible al final de su efecto
  fxMap.forEach((t) => t.progress(1));
  $$('[data-count]').forEach((n) => (n.textContent = n.dataset.count));
  gsap.utils.toArray('.scene').forEach((s) => gsap.from(s, { opacity: 0, duration: 0.5, scrollTrigger: { trigger: s, start: 'top 85%' } }));
}
CTA();
ChapterIndex();
Tuner();
Numerals();
LazyVideos();
Keys();
ScrollTrigger.addEventListener('refresh', computeBeats);
window.addEventListener('load', () => ScrollTrigger.refresh());
ScrollTrigger.refresh();
