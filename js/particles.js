// Fondo de partículas muy sutil. No se carga en móvil ni con reducción de movimiento.
window.addEventListener('load', () => {
  const container = document.getElementById('particles-js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmallScreen = window.matchMedia('(max-width: 640px)').matches;

  if (!window.particlesJS || !container || reduceMotion || isSmallScreen) {
    return;
  }

  window.particlesJS('particles-js', {
    particles: {
      number: { value: 30, density: { enable: true, value_area: 1000 } },
      color: { value: ['#00bcd4', '#ff9412'] },
      shape: { type: 'circle' },
      opacity: {
        value: 0.5,
        random: true,
        anim: { enable: true, speed: 0.6, opacity_min: 0.1, sync: false }
      },
      size: { value: 2.5, random: true },
      line_linked: { enable: false },
      move: { enable: true, speed: 0.6, direction: 'none', random: true, out_mode: 'out' }
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: false }, onclick: { enable: false }, resize: true }
    },
    retina_detect: true
  });
});
