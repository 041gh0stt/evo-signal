/* ============================================================
   PINGO — Landing Page interactions
   GSAP + ScrollTrigger + Lenis + canvas particles
   ============================================================ */

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  document.documentElement.classList.remove('no-js');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const hasGsap = typeof gsap !== 'undefined';

  if (hasGsap && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (!reduced && typeof Lenis !== 'undefined' && hasGsap) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // smooth anchors
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- Custom cursor ---------- */
  if (!isTouch && !reduced) {
    const cursor = $('.cursor');
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    if (cursor && dot && ring) {
      let mx = -100, my = -100, rx = -100, ry = -100;
      window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
      const loop = () => {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
        requestAnimationFrame(loop);
      };
      loop();
      document.addEventListener('mouseover', (e) => {
        cursor.classList.toggle('is-hover', !!e.target.closest('[data-cursor="hover"], a, button'));
      });
    }
  }

  /* ---------- Magnetic buttons ---------- */
  if (!isTouch && hasGsap && !reduced) {
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - r.left - r.width / 2) * 0.22,
          y: (e.clientY - r.top - r.height / 2) * 0.3,
          duration: 0.5, ease: 'power3.out',
        });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
      });
    });
  }

  /* ---------- Nav scrolled state + progress bar ---------- */
  const nav = $('#nav');
  const progress = $('#scrollProgress');
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 40);
    if (progress) {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Footer year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Loader ---------- */
  const loader = $('#loader');
  const LOADER_MS = reduced ? 0 : 1900;
  if (loader && hasGsap && !reduced) {
    if (lenis) lenis.stop();
    setTimeout(() => {
      gsap.to(loader, {
        autoAlpha: 0, duration: 0.6, ease: 'power2.inOut',
        onComplete: () => { loader.style.display = 'none'; if (lenis) lenis.start(); },
      });
    }, LOADER_MS - 500);
  } else if (loader) {
    loader.style.display = 'none';
  }

  /* ---------- Counter helper ---------- */
  function countUp(el, dur = 1.6) {
    const end = parseFloat(el.dataset.value || el.textContent) || 0;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (!hasGsap || reduced) { el.textContent = prefix + end + suffix; return; }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: dur, ease: 'power2.out',
      onUpdate: () => { el.textContent = prefix + Math.round(obj.v) + suffix; },
    });
  }

  /* ============================================================
     HERO
     ============================================================ */
  if (hasGsap && !reduced) {
    gsap.set('.ht-inner', { yPercent: 115 });
    gsap.set(['.hero-tag', '.hero-sub', '.hero-ctas', '.hero-proof'], { autoAlpha: 0, y: 24 });
    gsap.set('.mockup-scene', { autoAlpha: 0, y: 90, scale: 0.94 });
    gsap.set('.float-badge', { autoAlpha: 0, scale: 0.5 });
    gsap.set('.hero-mascot', { autoAlpha: 0, scale: 0.4, rotate: -16 });
    gsap.set('.hero-scroll', { autoAlpha: 0 });

    const intro = gsap.timeline({ delay: LOADER_MS / 1000 - 0.25 });
    intro
      .to('.hero-tag', { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' })
      .to('.ht-inner', { yPercent: 0, duration: 1.1, stagger: 0.11, ease: 'power4.out' }, '-=0.45')
      .to('.hero-sub', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.65')
      .to('.hero-ctas', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .to('.hero-proof', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.65')
      .to('.mockup-scene', { autoAlpha: 1, y: 0, scale: 1, duration: 1.3, ease: 'power3.out' }, '-=1.0')
      .to('.hero-mascot', { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.9, ease: 'back.out(1.8)' }, '-=0.7')
      .to('.float-badge', { autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.14, ease: 'back.out(2.2)' }, '-=0.5')
      .to('.hero-scroll', { autoAlpha: 1, duration: 0.8 }, '-=0.3')
      .add(() => {
        $$('.mk-num').forEach((el) => countUp(el, 1.4));
      }, '-=1.2')
      .from('.mk-bar i', { height: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, '-=1.1')
      .from('.mk-jrow i', { width: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, '-=0.9');

    // fade scroll hint away
    gsap.to('.hero-scroll', {
      autoAlpha: 0,
      scrollTrigger: { trigger: '.hero', start: '8% top', end: '20% top', scrub: true },
    });

    // gentle parallax of visual on scroll
    gsap.to('.hero-visual', {
      y: -70,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  } else {
    $$('.mk-num').forEach((el) => {
      el.textContent = (el.dataset.prefix || '') + (el.dataset.value || '') + (el.dataset.suffix || '');
    });
  }

  /* ---------- Hero 3D tilt + badge parallax ---------- */
  if (!isTouch && !reduced) {
    const heroVisual = $('#heroVisual');
    const scene = $('#mockupScene');
    const mockup = $('#mockup');
    if (heroVisual && scene && mockup) {
      let tRx = 0, tRy = 0, cRx = 0, cRy = 0;
      let tMx = 0, tMy = 0, cMx = 0, cMy = 0;
      const hero = $('.hero');
      hero.addEventListener('mousemove', (e) => {
        const r = heroVisual.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tRy = px * 10;
        tRx = -py * 8;
        tMx = px * -14;
        tMy = py * -10;
      }, { passive: true });
      hero.addEventListener('mouseleave', () => { tRx = tRy = tMx = tMy = 0; });
      const tick = () => {
        cRx += (tRx - cRx) * 0.07;
        cRy += (tRy - cRy) * 0.07;
        cMx += (tMx - cMx) * 0.07;
        cMy += (tMy - cMy) * 0.07;
        mockup.style.setProperty('--rx', cRx.toFixed(3) + 'deg');
        mockup.style.setProperty('--ry', cRy.toFixed(3) + 'deg');
        scene.style.setProperty('--mx', cMx.toFixed(2));
        scene.style.setProperty('--my', cMy.toFixed(2));
        requestAnimationFrame(tick);
      };
      tick();
    }
  }

  /* ---------- Hero canvas: leads viajando Meta → WhatsApp → evento ---------- */
  (function heroCanvas() {
    const canvas = $('#heroCanvas');
    if (!canvas || reduced) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, visible = true, last = 0;
    const parts = [], sparks = [];
    const BLUE = [59, 130, 246], GREEN = [16, 242, 163];

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

    const lerp = (a, b, t) => a + (b - a) * t;
    const qbez = (p0, p1, p2, t) => ({
      x: lerp(lerp(p0.x, p1.x, t), lerp(p1.x, p2.x, t), t),
      y: lerp(lerp(p0.y, p1.y, t), lerp(p1.y, p2.y, t), t),
    });

    function spawn() {
      const y0 = h * (0.2 + Math.random() * 0.6);
      const y2 = h * (0.3 + Math.random() * 0.4);
      parts.push({
        t: 0,
        speed: 0.0022 + Math.random() * 0.0028,
        p0: { x: -16, y: y0 },
        p1: { x: w * (0.35 + Math.random() * 0.18), y: Math.min(y0, y2) - h * (0.08 + Math.random() * 0.22) },
        p2: { x: w * (0.72 + Math.random() * 0.2), y: y2 },
        r: 1.4 + Math.random() * 1.4,
      });
    }

    function burst(x, y) {
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 0.4 + Math.random() * 1.3;
        sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1 });
      }
    }

    let spawnAcc = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = now; return; }
      const dt = Math.min(34, now - last || 16);
      last = now;

      ctx.clearRect(0, 0, w, h);
      spawnAcc += dt;
      if (spawnAcc > 420 && parts.length < 26) { spawnAcc = 0; spawn(); }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.t += p.speed * dt * 0.06;
        if (p.t >= 1) { burst(p.p2.x, p.p2.y); parts.splice(i, 1); continue; }
        const pos = qbez(p.p0, p.p1, p.p2, p.t);
        const c = [
          Math.round(lerp(BLUE[0], GREEN[0], p.t)),
          Math.round(lerp(BLUE[1], GREEN[1], p.t)),
          Math.round(lerp(BLUE[2], GREEN[2], p.t)),
        ];
        // trail
        const tail = qbez(p.p0, p.p1, p.p2, Math.max(0, p.t - 0.045));
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},0.22)`;
        ctx.lineWidth = p.r * 0.9;
        ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
        // dot
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.75)`;
        ctx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},0.9)`;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt * 0.0016;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        s.x += s.vx * dt * 0.06; s.y += s.vy * dt * 0.06;
        ctx.fillStyle = `rgba(16,242,163,${(s.life * 0.8).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  })();

  /* ============================================================
     SCROLL SECTIONS (GSAP required beyond here)
     ============================================================ */
  if (!hasGsap || typeof ScrollTrigger === 'undefined') return;

  /* ---------- Section heads reveal ---------- */
  if (!reduced) {
    $$('.section-head').forEach((head) => {
      gsap.from(head.children, {
        autoAlpha: 0, y: 34, duration: 0.9, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: head, start: 'top 82%', once: true },
      });
    });
  }

  /* ---------- Problema: linha que quebra ---------- */
  (function problema() {
    const panel = $('#flowBroken');
    if (!panel) return;
    if (reduced) { panel.classList.add('is-broken'); return; }
    const tl = gsap.timeline({
      scrollTrigger: { trigger: panel, start: 'top 72%', once: true },
      onComplete: () => gsap.set($$('.fb-node, .fb-seg, .fb-q', panel), { clearProps: 'opacity,visibility,transform' }),
    });
    tl.from($$('.fb-node', panel), { autoAlpha: 0, y: 20, duration: 0.5, stagger: 0.22, lazy: false, ease: 'power3.out' })
      .from($$('.fb-seg:not(.fb-seg--broken)', panel), { scaleY: 0, transformOrigin: 'top', duration: 0.4, stagger: 0.22 }, 0.18)
      .from('.fb-seg--broken', { autoAlpha: 0, duration: 0.4 }, '-=0.2')
      .add(() => panel.classList.add('is-broken'), '+=0.25')
      .from('.fb-q', { autoAlpha: 0, scale: 0.4, duration: 0.4, ease: 'back.out(3)' }, '<0.1')
      .fromTo(panel, { boxShadow: '0 0 0 rgba(244,63,94,0)' },
        { boxShadow: '0 0 70px -22px rgba(244,63,94,0.4)', duration: 0.8 }, '<');
  })();

  /* ---------- Solução: timeline acende com scroll ---------- */
  (function solucao() {
    const fill = $('#tlFill');
    const steps = $$('.tl-step');
    if (!fill || !steps.length) return;
    if (reduced) { steps.forEach((s) => s.classList.add('lit')); fill.style.transform = 'scaleX(1)'; return; }
    ScrollTrigger.create({
      trigger: '#timeline',
      start: 'top 78%',
      end: 'bottom 38%',
      scrub: 0.4,
      onUpdate: (self) => {
        fill.style.transform = `scaleX(${self.progress})`;
        steps.forEach((s, i) => {
          s.classList.toggle('lit', self.progress >= i / (steps.length - 1) - 0.02);
        });
      },
    });
    // mobile fallback: light each as it enters view
    ScrollTrigger.matchMedia ? null : null;
  })();

  /* ---------- Features: entrance + minis ---------- */
  if (!reduced) {
    $$('.bento .card').forEach((card, i) => {
      gsap.from(card, {
        autoAlpha: 0, y: 48, duration: 0.9, delay: (i % 3) * 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 88%', once: true },
      });
    });
    const funnel = $('.mini-funnel');
    if (funnel) {
      gsap.from($$('.f-fill', funnel), {
        width: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: funnel, start: 'top 85%', once: true },
      });
    }
    const miniChat = $('.mini-chat');
    if (miniChat) {
      gsap.from($$('.wa-msg, .wa-typing', miniChat), {
        autoAlpha: 0, y: 16, scale: 0.96, duration: 0.5, stagger: 0.22, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: miniChat, start: 'top 85%', once: true },
      });
    }
  }

  /* ---------- Jornada: cena pinada com scrub ---------- */
  (function journey() {
    const stage = $('#jrStage');
    if (!stage) return;
    const panels = $$('.jr-panel', stage);
    const links = $$('.jr-link', stage);

    if (reduced) { panels.forEach((p) => p.classList.add('is-on')); return; }

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      gsap.set(panels, { opacity: 0.16, y: 36 });
      gsap.set(links, { opacity: 0.1 });
      gsap.set($$('.wa-msgs .wa-msg', stage), { opacity: 0, y: 14 });
      gsap.set($$('.pg-row', stage), { opacity: 0, x: -14 });
      gsap.set($$('.mt-ev', stage), { opacity: 0, scale: 0.55 });
      gsap.set($('.mt-total', stage), { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.journey',
          start: 'top top',
          end: '+=2400',
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          onUpdate(self) {
            const idx = Math.min(3, Math.floor(self.progress * 4.2));
            panels.forEach((p, k) => p.classList.toggle('is-on', k <= idx && self.progress > 0.02));
          },
        },
      });

      tl.to(panels[0], { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
        .to(links[0], { opacity: 1, duration: 0.35 })
        .to(panels[1], { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '<0.15')
        .to($$('.wa-msgs .wa-msg', stage), { opacity: 1, y: 0, duration: 0.45, stagger: 0.3, ease: 'power2.out' })
        .to(links[1], { opacity: 1, duration: 0.35 })
        .to(panels[2], { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '<0.15')
        .to($$('.pg-row', stage), { opacity: 1, x: 0, duration: 0.4, stagger: 0.22 })
        .to(links[2], { opacity: 1, duration: 0.35 })
        .to(panels[3], { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '<0.15')
        .to($$('.mt-ev', stage), { opacity: 1, scale: 1, duration: 0.5, stagger: 0.3, ease: 'back.out(2.4)' })
        .to($('.mt-total', stage), { opacity: 1, duration: 0.4 })
        .to({}, { duration: 0.5 }); // hold

      return () => {
        gsap.set([panels, links, $$('.wa-msgs .wa-msg', stage), $$('.pg-row', stage), $$('.mt-ev', stage)], { clearProps: 'all' });
      };
    });

    mm.add('(max-width: 1023px)', () => {
      panels.forEach((p) => {
        p.classList.add('is-on');
        gsap.from(p, {
          autoAlpha: 0, y: 44, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: p, start: 'top 88%', once: true },
        });
      });
    });
  })();

  /* ---------- Benefícios: contadores ---------- */
  (function benefits() {
    const nums = $$('.bn-num');
    if (!nums.length) return;
    ScrollTrigger.create({
      trigger: '.benefits',
      start: 'top 72%',
      once: true,
      onEnter: () => nums.forEach((el, i) => setTimeout(() => countUp(el, 1.8), i * 160)),
    });
    if (!reduced) {
      gsap.from('.bn-item', {
        autoAlpha: 0, y: 40, duration: 0.9, stagger: 0.14, ease: 'power3.out',
        scrollTrigger: { trigger: '.bn-grid', start: 'top 82%', once: true },
      });
    }
  })();

  /* ---------- Para quem ---------- */
  if (!reduced) {
    gsap.from('.aud-card', {
      autoAlpha: 0, y: 44, duration: 0.9, stagger: 0.13, ease: 'power3.out',
      scrollTrigger: { trigger: '.aud-grid', start: 'top 84%', once: true },
    });
    gsap.from('.cta-inner > *', {
      autoAlpha: 0, y: 36, duration: 0.9, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.cta-final', start: 'top 70%', once: true },
    });
  }

  /* ---------- CTA canvas: partículas subindo ---------- */
  (function ctaCanvas() {
    const canvas = $('#ctaCanvas');
    if (!canvas || reduced) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, visible = false, last = 0;
    const COLORS = ['16,242,163', '16,242,163', '16,242,163', '59,130,246', '139,92,246'];
    const parts = [];

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

    function spawn() {
      parts.push({
        x: Math.random() * w,
        y: h + 10,
        vy: 0.25 + Math.random() * 0.55,
        amp: 12 + Math.random() * 26,
        phase: Math.random() * Math.PI * 2,
        freq: 0.0008 + Math.random() * 0.0014,
        r: 1 + Math.random() * 1.8,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        a: 0.25 + Math.random() * 0.45,
      });
    }

    let acc = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = now; return; }
      const dt = Math.min(34, now - last || 16);
      last = now;
      ctx.clearRect(0, 0, w, h);
      acc += dt;
      if (acc > 130 && parts.length < 70) { acc = 0; spawn(); }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.y -= p.vy * dt * 0.06;
        if (p.y < -12) { parts.splice(i, 1); continue; }
        const x = p.x + Math.sin(now * p.freq + p.phase) * p.amp;
        const fade = Math.min(1, (h - p.y) / 90) * Math.min(1, p.y / (h * 0.35));
        ctx.fillStyle = `rgba(${p.c},${(p.a * Math.max(0, fade)).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- refresh on fonts ready ---------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
