document.addEventListener('DOMContentLoaded', () => {
  const techSection = document.querySelector('.tecnologias');
  const revealItems = new Set();

  document.querySelectorAll('.contenido-principal section > h2').forEach((heading) => {
    revealItems.add(heading);
    heading.classList.add('reveal-title');
  });

  if (techSection) {
    const techItems = techSection.querySelectorAll('.categoria, .icono');

    techItems.forEach((item) => {
      revealItems.add(item);

      if (item.classList.contains('icono')) {
        const siblings = Array.from(item.parentElement.children);
        const itemIndex = siblings.indexOf(item);
        item.style.setProperty('--reveal-delay', `${Math.min(itemIndex * 55, 220)}ms`);
      }
    });
  }

  const featureCards = document.querySelectorAll('.project-card, .experience-card');

  featureCards.forEach((card, cardIndex) => {
    const cardDelay = Math.min(cardIndex * 70, 180);

    revealItems.add(card);
    card.classList.add('reveal-card');
    card.style.setProperty('--reveal-delay', `${cardDelay}ms`);

    const animatedDetails = card.querySelectorAll(
      '.experience-header, .experience-summary, .project-tech-list, .experience-responsibilities li, .video, .proyecto-imagen, .project-actions'
    );

    animatedDetails.forEach((detail, detailIndex) => {
      const detailDelay = Math.min(cardDelay + 120 + detailIndex * 70, cardDelay + 620);

      revealItems.add(detail);
      detail.classList.add('reveal-detail');
      detail.style.setProperty('--reveal-delay', `${detailDelay}ms`);
    });
  });

  if (!revealItems.size) {
    return;
  }

  revealItems.forEach((item) => item.classList.add('reveal-on-scroll'));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  document.documentElement.classList.add('reveal-ready');

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = Number.parseInt(entry.target.style.getPropertyValue('--reveal-delay'), 10) || 0;

        window.setTimeout(() => {
          entry.target.classList.add('is-visible');
          entry.target.style.removeProperty('--reveal-delay');
        }, delay);

        currentObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px',
  });

  revealItems.forEach((item) => observer.observe(item));
});
