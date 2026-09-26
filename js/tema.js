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

  button?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);

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
