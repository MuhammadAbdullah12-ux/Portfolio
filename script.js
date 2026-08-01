// ============================================
// Respect reduced motion preference globally
// (declared first — loader and other modules below depend on this)
// ============================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================
// LOADER — progress fill then reveal page
// ============================================
(function loader() {
  const loaderEl = document.getElementById('loader');
  if (!loaderEl) {
    document.body.style.overflow = '';
    return;
  }

  const interval = setInterval(() => {
    pct += Math.random() * 18 + 6;
    if (pct >= 100) {
      pct = 100;
      clearInterval(interval);
      fill.style.width = '100%';
      pctLabel.textContent = '100%';
      setTimeout(() => {
        loaderEl.classList.add('loaded');
        document.body.style.overflow = '';
      }, 280);
      return;
    }
    fill.style.width = pct + '%';
    pctLabel.textContent = Math.floor(pct) + '%';
  }, 160);

  // safety net: never trap the user behind the loader
  setTimeout(() => {
    loaderEl.classList.add('loaded');
    document.body.style.overflow = '';
  }, 3200);
})();

// ============================================
// HERO CANVAS — "embedding space" visualization
// Nodes drift like vector embeddings; nodes near the
// cursor (the "query vector") light up and connect,
// mimicking nearest-neighbor retrieval.
// ============================================
(function embeddingCanvas() {
  const canvas = document.getElementById('embedding-canvas');
  const ctx = canvas.getContext('2d');
  let width, height, dpr;
  let nodes = [];
  let mouse = { x: -9999, y: -9999 };
  let animationId;
  let colors = { link: '120,170,255', node: '140,175,255', query: '76,224,196' };

  const NODE_COUNT_DESKTOP = 70;
  const NODE_COUNT_MOBILE = 32;
  const LINK_DIST = 130;
  const QUERY_RADIUS = 180;

  function readThemeColors() {
    const cs = getComputedStyle(document.documentElement);
    colors.link = cs.getPropertyValue('--canvas-link').trim() || colors.link;
    colors.node = cs.getPropertyValue('--canvas-node').trim() || colors.node;
    colors.query = cs.getPropertyValue('--canvas-query').trim() || colors.query;
  }
  window.addEventListener('themechange', readThemeColors);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initNodes() {
    const count = width < 700 ? NODE_COUNT_MOBILE : NODE_COUNT_DESKTOP;
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 1,
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    // update positions
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = width + 20;
      if (n.x > width + 20) n.x = -20;
      if (n.y < -20) n.y = height + 20;
      if (n.y > height + 20) n.y = -20;
    }

    // links between nearby nodes (ambient, faint)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          const alpha = (1 - dist / LINK_DIST) * 0.12;
          ctx.strokeStyle = `rgba(${colors.link}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // query radius: connect + highlight nodes near cursor
    for (const n of nodes) {
      const dx = n.x - mouse.x, dy = n.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < QUERY_RADIUS) {
        const strength = 1 - dist / QUERY_RADIUS;
        ctx.strokeStyle = `rgba(${colors.query}, ${strength * 0.55})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + strength * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colors.query}, ${0.5 + strength * 0.5})`;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colors.node}, 0.55)`;
        ctx.fill();
      }
    }

    animationId = requestAnimationFrame(step);
  }

  function handlePointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }

  function handlePointerLeave() {
    mouse.x = -9999;
    mouse.y = -9999;
  }

  function init() {
    readThemeColors();
    resize();
    initNodes();
    if (!prefersReducedMotion) {
      step();
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerleave', handlePointerLeave);
    } else {
      // static single frame, no animation loop
      step();
      cancelAnimationFrame(animationId);
    }
  }

  window.addEventListener('resize', () => {
    resize();
    initNodes();
  });

  init();
})();

// ============================================
// THEME TOGGLE — light/dark, persisted
// ============================================
(function themeToggle() {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');
  const initial = stored || 'dark';

  if (initial === 'light') root.setAttribute('data-theme', 'light');

  btn.addEventListener('click', () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    if (isLight) {
      root.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
    window.dispatchEvent(new Event('themechange'));
  });
})();

// ============================================
// SCROLL PROGRESS BAR
// ============================================
(function scrollProgress() {
  const bar = document.getElementById('scroll-progress');
  function update() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ============================================
// TYPEWRITER — hero eyebrow
// ============================================
(function typewriter() {
  const el = document.getElementById('typewriter');
  const phrases = ['ai/ml engineer', 'full-stack developer', 'rag systems builder', 'llm integration'];
  let phraseIndex = 0, charIndex = 0, deleting = false;

  if (prefersReducedMotion) {
    el.textContent = phrases[0];
    return;
  }

  function tick() {
    const current = phrases[phraseIndex];
    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? 35 : 65);
  }
  tick();
})();

// ============================================
// NAV — scroll background + mobile toggle + scroll spy
// ============================================
(function nav() {
  const siteNav = document.getElementById('site-nav');
  const toggle = document.getElementById('nav-toggle');
  const links = document.querySelector('.nav-links');
  const navLinkEls = document.querySelectorAll('.nav-links a[data-nav]');
  const sections = ['about', 'projects', 'experience', 'skills', 'techstack', 'contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  window.addEventListener('scroll', () => {
    siteNav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinkEls.forEach(a => a.classList.remove('active'));
        const match = document.querySelector(`.nav-links a[data-nav="${entry.target.id}"]`);
        if (match) match.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });

  sections.forEach(s => spyObserver.observe(s));
})();

// ============================================
// SCROLL REVEAL
// ============================================
(function scrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');

  if (prefersReducedMotion) {
    revealEls.forEach(el => el.classList.add('in-view'));
    return;
  }

  // stagger hero elements on load
  document.querySelectorAll('.hero .reveal').forEach((el, i) => {
    el.style.setProperty('--i', i);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => observer.observe(el));

  // hero reveals immediately on load rather than waiting for scroll
  requestAnimationFrame(() => {
    document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('in-view'));
  });
})();

// ============================================
// TILT MICRO-INTERACTION — project spec cards
// ============================================
(function tiltCards() {
  if (prefersReducedMotion) return;
  const cards = document.querySelectorAll('.project-spec');
  const MAX_TILT = 4;

  cards.forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${(-py * MAX_TILT).toFixed(2)}deg) rotateY(${(px * MAX_TILT).toFixed(2)}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
})();

// ============================================
// COPY EMAIL TO CLIPBOARD
// ============================================
(function copyEmail() {
  const link = document.getElementById('email-link');
  const hint = document.getElementById('copy-hint');
  if (!link) return;

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const email = link.textContent.trim().split('\n')[0].trim();
    navigator.clipboard.writeText(email).then(() => {
      const original = hint.textContent;
      hint.textContent = 'copied ✓';
      setTimeout(() => { hint.textContent = original; }, 1800);
    }).catch(() => {
      // fallback: just open mail client
      window.location.href = `mailto:${email}`;
    });
  });
})();

// ============================================
// CONTACT FORM SUBMISSION (Formspree-compatible)
// ============================================
(function contactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const submitBtn = form.querySelector('.form-submit');
  const submitLabel = submitBtn.querySelector('.btn-label');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const actionUrl = form.getAttribute('action');

    if (!actionUrl || actionUrl.includes('YOUR_FORM_ID')) {
      status.textContent = 'Form not connected yet — email directly instead.';
      status.className = 'form-status error';
      return;
    }

    submitLabel.textContent = 'Sending…';
    submitBtn.disabled = true;
    status.textContent = '';
    status.className = 'form-status';

    try {
      const res = await fetch(actionUrl, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });

      if (res.ok) {
        status.textContent = 'Message sent — thanks, I\u2019ll get back to you soon.';
        status.className = 'form-status success';
        form.reset();
      } else {
        status.textContent = 'Something went wrong — email directly instead.';
        status.className = 'form-status error';
      }
    } catch (err) {
      status.textContent = 'Network error — email directly instead.';
      status.className = 'form-status error';
    } finally {
      submitLabel.textContent = 'Send message';
      submitBtn.disabled = false;
    }
  });
})();
