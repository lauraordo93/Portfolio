// Animaciones del portfolio:
// 1) El nombre del hero se "decodifica" al cargar.
// 2) La línea del timeline se dibuja al hacer scroll y cada punto se ilumina al alcanzarlo.
// 3) Brillo que sigue al ratón en las tarjetas (solo ordenador).
// Todo se desactiva si el visitante prefiere reducir el movimiento.
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    return;
  }

  decodeTitle();
  drawTimeline();
  cardSpotlight();
  phoneShowcase();
});

/* ---------- 1. Nombre que se decodifica ---------- */
function decodeTitle() {
  const title = document.querySelector('[data-decode]');

  if (!title) {
    return;
  }

  // Caracteres de relleno sin letras muy anchas, para que la línea no salte.
  const glyphs = 'ABCDEFGHKLNOPRSTUVXYZ0123456789<>/{}#';
  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  const nodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.textContent.trim()) {
      nodes.push({ node, finalText: node.textContent });
    }
  }

  const totalChars = nodes.reduce((sum, item) => sum + item.finalText.length, 0);
  const duration = 950;
  const delay = 180;
  let start = null;

  const frame = (time) => {
    if (start === null) {
      start = time;
    }

    const elapsed = time - start - delay;
    const progress = Math.max(0, Math.min(1, elapsed / duration));
    const revealed = Math.floor(progress * totalChars);
    let index = 0;

    nodes.forEach(({ node, finalText }) => {
      let out = '';

      for (const char of finalText) {
        if (char === ' ' || index < revealed) {
          out += char;
        } else {
          out += glyphs[Math.floor(Math.random() * glyphs.length)];
        }
        index += 1;
      }

      node.textContent = out;
    });

    if (progress < 1) {
      window.requestAnimationFrame(frame);
    } else {
      nodes.forEach(({ node, finalText }) => {
        node.textContent = finalText;
      });
    }
  };

  window.requestAnimationFrame(frame);
}

/* ---------- 2. Timeline que se dibuja ---------- */
function drawTimeline() {
  const timeline = document.querySelector('[data-timeline]');

  if (!timeline) {
    return;
  }

  const items = Array.from(timeline.querySelectorAll('.timeline__item'));
  let ticking = false;

  timeline.classList.add('tl-live');

  const update = () => {
    ticking = false;
    const rect = timeline.getBoundingClientRect();
    const focus = window.innerHeight * 0.6;
    const progress = Math.max(0, Math.min(1, (focus - rect.top) / rect.height));

    timeline.style.setProperty('--tl', progress.toFixed(3));

    items.forEach((item) => {
      const dot = item.querySelector('.timeline__dot');
      const dotTop = dot ? dot.getBoundingClientRect().top : item.getBoundingClientRect().top;
      item.classList.toggle('is-lit', dotTop < focus);
    });
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

/* ---------- 3. Brillo en las tarjetas ---------- */
function cardSpotlight() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return;
  }

  document.addEventListener('pointermove', (event) => {
    const card = event.target.closest('.card');

    if (!card) {
      return;
    }

    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }, { passive: true });
}

/* ---------- 4. Móvil con la web completa que se recorre ---------- */
function phoneShowcase() {
  const showcase = document.querySelector('[data-showcase]');
  const screen = showcase?.querySelector('.phone__screen');
  const page = showcase?.querySelector('.phone__page');

  if (!showcase || !screen || !page) {
    return;
  }

  // Distancia a recorrer y duración proporcional (unos 280 px por segundo).
  const measure = () => {
    const dist = Math.max(0, page.getBoundingClientRect().height - screen.clientHeight);
    const seconds = Math.max(4, dist / 280);
    showcase.style.setProperty('--dist', `${Math.round(dist)}px`);
    showcase.style.setProperty('--dur', `${seconds.toFixed(1)}s`);
    showcase.style.setProperty('--loop', `${(seconds * 2 + 3).toFixed(1)}s`);
  };

  if (page.complete) {
    measure();
  } else {
    page.addEventListener('load', measure, { once: true });
  }
  window.addEventListener('resize', measure);

  // En pantallas táctiles se recorre sola solo mientras está visible.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        showcase.classList.toggle('is-playing', entry.isIntersecting);
      });
    }, { threshold: 0.4 });

    observer.observe(showcase);
  }
}
