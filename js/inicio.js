// Pantalla de inicio estilo BIOS.
// - Se muestra al entrar en la web una vez por visita (sessionStorage "arrancado"),
//   y no aparece si se llega con un enlace a una sección (#proyectos, #contacto…).
// - Tras el "arranque" deja elegir a dónde ir: INTRO (portfolio), P (proyectos),
//   S (servicios) o C (contacto), con el teclado o pulsando las opciones.
// - Al elegir, se "apaga" como un monitor CRT y lanza el evento "inicio:fin"
//   para que empiecen las animaciones del hero.
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const screen = document.getElementById('boot-screen');

  if (!screen) {
    return;
  }

  if (!root.classList.contains('boot')) {
    screen.remove();
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const options = Array.from(screen.querySelectorAll('[data-boot-go]'));
  const keys = { enter: '#inicio', p: '#proyectos', s: '#servicios', c: '#contacto' };
  let closing = false;

  // El resto de la página no se puede usar con el teclado mientras está la pantalla.
  const main = document.getElementById('contenido');
  const header = document.querySelector('.nav-header');
  [main, header].forEach((el) => el && el.setAttribute('inert', ''));

  // Foco en la primera opción cuando aparece el menú.
  window.setTimeout(() => options[0]?.focus({ preventScroll: true }), reduceMotion ? 0 : 1950);

  const go = (target) => {
    if (closing) {
      return;
    }
    closing = true;

    try {
      sessionStorage.setItem('arrancado', '1');
    } catch (error) {
      // Sin almacenamiento: volverá a salir en la próxima carga.
    }

    const finish = () => {
      root.classList.remove('boot');
      [main, header].forEach((el) => el && el.removeAttribute('inert'));
      screen.remove();

      const section = document.querySelector(target);
      if (section && target !== '#inicio') {
        section.scrollIntoView({ behavior: 'instant' });
        history.replaceState(null, '', target);
      } else {
        window.scrollTo(0, 0);
      }

      document.dispatchEvent(new CustomEvent('inicio:fin'));
    };

    if (reduceMotion) {
      finish();
    } else {
      screen.classList.add('is-off');
      window.setTimeout(finish, 480);
    }
  };

  options.forEach((option) => {
    option.addEventListener('click', (event) => {
      event.preventDefault();
      go(option.dataset.bootGo);
    });
  });

  const onKey = (event) => {
    if (closing || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();

    // INTRO sobre una opción enfocada la activa; si no, entra al portfolio.
    if (key === 'enter') {
      event.preventDefault();
      const focused = document.activeElement?.closest('[data-boot-go]');
      go(focused ? focused.dataset.bootGo : keys.enter);
      return;
    }

    if (keys[key]) {
      event.preventDefault();
      go(keys[key]);
    }

    // Tab no sale de la pantalla
    if (key === 'tab' && options.length) {
      const first = options[0];
      const last = options[options.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  window.addEventListener('keydown', onKey);
});
