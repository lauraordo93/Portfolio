// Aparición suave de bloques al entrar en pantalla. Se ejecuta una sola vez por bloque
// y se desactiva si el usuario prefiere reducir el movimiento.
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!items.length || reduceMotion || !('IntersectionObserver' in window)) {
    return;
  }

  document.documentElement.classList.add('reveal-ready');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach((item) => observer.observe(item));
});
