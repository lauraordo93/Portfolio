// Aparición suave al hacer scroll.
// - .reveal: el bloque aparece entero.
// - .stagger: sus hijos aparecen en cascada, uno detrás de otro.
// Se ejecuta una sola vez por bloque y se desactiva con reducción de movimiento.
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.reveal, .stagger');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!items.length || reduceMotion || !('IntersectionObserver' in window)) {
    return;
  }

  // Índice de cada hijo para calcular el retraso de la cascada.
  document.querySelectorAll('.stagger').forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      child.style.setProperty('--i', index);
    });
  });

  document.documentElement.classList.add('reveal-ready');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const el = entry.target;
      el.classList.add('is-visible');
      obs.unobserve(el);

      // Al terminar la cascada se quitan los retrasos para que el hover responda al instante.
      if (el.classList.contains('stagger')) {
        const total = el.children.length * 90 + 650;
        window.setTimeout(() => el.classList.add('stagger-done'), total);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach((item) => observer.observe(item));
});
