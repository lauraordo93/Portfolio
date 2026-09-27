// Tema claro / oscuro.
// - Si el visitante ya eligió un tema, se respeta (se guarda en localStorage).
// - Si no, se usa la preferencia de su sistema; por defecto, oscuro.
// El tema inicial se aplica con un pequeño script en el <head> para evitar parpadeos.
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const systemLight = window.matchMedia('(prefers-color-scheme: light)');

  const getSaved = () => {
    try {
      return localStorage.getItem('tema');
    } catch (error) {
      return null;
    }
  };

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);

    if (themeColor) {
      themeColor.setAttribute('content', theme === 'light' ? '#F6F8F9' : '#0C0F11');
    }

    if (button) {
      const isLight = theme === 'light';
      button.setAttribute('aria-pressed', String(isLight));
      button.setAttribute('aria-label', isLight ? 'Activar modo oscuro' : 'Activar modo claro');
      button.title = isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';
    }
  };

  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  button?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';

    // Efecto círculo desde el botón (navegadores con View Transitions). Si no, cambio directo.
    if (document.startViewTransition && !reduceMotion.matches) {
      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      const transition = document.startViewTransition(() => applyTheme(next));
      transition.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 550, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(() => {});
    } else {
      applyTheme(next);
    }

    try {
      localStorage.setItem('tema', next);
    } catch (error) {
      // Sin almacenamiento (modo privado estricto): el cambio vale para esta visita.
    }
  });

  // Si el visitante no ha elegido, sigue los cambios del sistema.
  systemLight.addEventListener('change', (event) => {
    if (!getSaved()) {
      applyTheme(event.matches ? 'light' : 'dark');
    }
  });
});
