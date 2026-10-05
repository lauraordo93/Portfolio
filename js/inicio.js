// Pantalla de inicio estilo BIOS.
// - Se muestra al entrar en la web una vez por visita (sessionStorage "arrancado"),
//   y no aparece si se llega con un enlace a una sección (#proyectos, #contacto…).
// - Tras el "arranque" deja elegir a dónde ir: INTRO (portfolio), P (proyectos),
//   S (servicios) o C (contacto), con el teclado o pulsando las opciones.
// - Al elegir, se "apaga" como un monitor CRT y lanza el evento "inicio:fin"
//   para que empiecen las animaciones del hero.
// - La línea C:\> es una pequeña consola: al pulsarla se puede escribir help, debug o clear.
//   Junto al cursor se ve "type 'help'" en gris hasta que se usa help, y mientras nadie
//   usa la consola, de vez en cuando se escribe sola "help" como refuerzo.
// - "debug" abre el modo debug: un minijuego en el que hay que pulsar 10 bugs.
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

  // Consola C:\>: se activa al pulsarla (o con Tab). Lo que se teclea va a un campo
  // invisible y se copia en la línea, delante del cursor.
  const promptLine = screen.querySelector('.boot-screen__prompt');
  const input = promptLine?.querySelector('.boot-screen__input');
  const typed = promptLine?.querySelector('.boot-screen__typed');
  const output = screen.querySelector('.boot-screen__output');
  let busy = false;

  const tint = (text, className) => {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
  };

  // Cada orden devuelve las líneas que imprime (texto o elementos), el retraso entre
  // ellas (ms) y, si quiere, qué hacer cuando termina de escribirlas.
  const commands = {
    help: () => {
      // Ya se sabe qué escribir: la pista fija de la línea C:\> deja de hacer falta.
      promptLine.classList.add('is-known');
      return { lines: ['Available commands:', '', 'help', 'debug', 'clear'] };
    },
    debug: () => {
      const start = document.createElement('button');
      start.type = 'button';
      start.className = 'boot-cmd';
      start.textContent = '[ START DEBUGGING ]';
      start.addEventListener('click', (event) => startDebug(start, event.detail === 0));

      return {
        lines: ['Searching for bugs...', '', 'No bugs found.', '', '...probably.', '',
          tint(`ERROR: ${TOTAL} BUGS DETECTED.`, 'hl'), 'DEBUG MODE ACTIVATED', '', start],
        step: 400,
        // Si se sigue en la consola, el foco pasa al botón: INTRO empieza a depurar.
        done: () => document.activeElement === input && start.focus(),
      };
    },
    clear: () => {
      output.textContent = '';
      return null;
    },
  };

  const print = (parts, delay = 0) => {
    const line = document.createElement('p');
    line.append(...parts);
    line.style.setProperty('--d', delay);
    output.append(line);
  };

  const echo = (text) => print([tint('C:\\>', 'dim'), tint(text, 'boot-screen__typed')]);

  const run = () => {
    if (busy) {
      return;
    }

    const text = input.value.trim();
    const name = text.toLowerCase();
    input.value = '';
    typed.textContent = '';
    echo(text);

    // INTRO sin nada escrito solo deja otra línea C:\>, como en un terminal.
    const result = Object.hasOwn(commands, name)
      ? commands[name]()
      : { lines: text ? ['Unknown command.', "Type 'help' for available commands."] : [] };

    if (result?.lines.length) {
      const step = reduceMotion ? 0 : result.step || 0;
      [...result.lines, ''].forEach((line, i) => print([line], i * step));

      // El prompt vuelve cuando ha terminado de escribirse la respuesta.
      busy = Boolean(step);
      promptLine.classList.toggle('is-busy', busy);
      window.setTimeout(() => {
        busy = false;
        promptLine.classList.remove('is-busy');
        result.done?.();
      }, result.lines.length * step);
    }

    // Como en un terminal, la pantalla baja hasta la última línea.
    screen.scrollTop = screen.scrollHeight;
  };

  input?.addEventListener('input', () => {
    typed.textContent = input.value;
  });

  // Refuerzo de la pista: mientras nadie use la consola, "help" se escribe solo en gris en
  // la línea C:\> (en lugar de "type 'help'") y se borra, para que se note que se puede
  // escribir. Sale 3 veces como mucho y deja de salir en cuanto se pulsa la consola.
  const HINT = 'help';
  const hintFrames = reduceMotion
    ? [[HINT, 2500], ['', 0]]
    : [
      ...[...HINT].map((_, i) => [HINT.slice(0, i + 1), i < HINT.length - 1 ? 130 : 1600]),
      ...[...HINT].map((_, i) => [HINT.slice(0, HINT.length - 1 - i), 70]),
    ];
  let hintsLeft = 3;
  let hintTimer = null;

  const playHint = (frame = 0) => {
    if (!hintsLeft || closing) {
      return;
    }
    // Con la pestaña en segundo plano no se gasta una pista: se vuelve a intentar luego.
    if (frame === 0 && document.hidden) {
      hintTimer = window.setTimeout(() => playHint(), 5000);
      return;
    }

    const [text, wait] = hintFrames[frame];
    promptLine.classList.add('is-hint');
    typed.textContent = text;

    if (frame < hintFrames.length - 1) {
      hintTimer = window.setTimeout(() => playHint(frame + 1), wait);
    } else {
      promptLine.classList.remove('is-hint');
      hintsLeft -= 1;
      if (hintsLeft) {
        hintTimer = window.setTimeout(() => playHint(), 20000);
      }
    }
  };

  if (input) {
    hintTimer = window.setTimeout(() => playHint(), 6000);
    input.addEventListener('focus', () => {
      hintsLeft = 0;
      window.clearTimeout(hintTimer);
      promptLine.classList.remove('is-hint');
      typed.textContent = input.value;
    }, { once: true });
  }

  // Modo debug: tapa la BIOS con una zona en la que aparece un bug en un sitio al azar.
  // Cada bug pulsado suma uno y el siguiente sale en otro sitio; al llegar a 10 se
  // muestra DEBUG COMPLETE. Al salir, la BIOS y la consola siguen como estaban.
  const TOTAL = 10; // también escrito en el HTML del modo debug
  const debugLayer = screen.querySelector('.boot-debug');
  const bug = debugLayer?.querySelector('.boot-debug__bug');
  const count = debugLayer?.querySelector('[data-debug-count]');
  const message = debugLayer?.querySelector('.boot-debug__msg');
  const complete = debugLayer?.querySelector('.boot-debug__done');
  const exitButton = debugLayer?.querySelector('[data-debug-exit]');
  let debugging = false;
  let fixed = 0;
  let spot = { x: 0.5, y: 0.5 };
  let returnFocus = null;

  const say = (...parts) => {
    const span = document.createElement('span');
    span.append(...parts);
    message.replaceChildren(span);
  };

  // Nueva posición al azar (0–1 en cada eje), lejos de la anterior para que se note el salto.
  const moveBug = () => {
    let next = spot;
    for (let i = 0; i < 20 && Math.hypot(next.x - spot.x, next.y - spot.y) < 0.35; i += 1) {
      next = { x: Math.random(), y: Math.random() };
    }
    spot = next;
    bug.style.setProperty('--x', spot.x.toFixed(3));
    bug.style.setProperty('--y', spot.y.toFixed(3));
    bug.style.setProperty('--r', `${Math.floor(Math.random() * 4) * 90}deg`);
  };

  // byKeyboard: si se ha pulsado con el teclado, el foco va al bug para seguir jugando con INTRO.
  const startDebug = (trigger, byKeyboard) => {
    if (!debugLayer || debugging || closing) {
      return;
    }
    debugging = true;
    returnFocus = trigger;
    fixed = 0;
    count.textContent = '0';
    say('> Click or tap the bugs to fix them.');
    complete.hidden = true;
    bug.hidden = false;
    bug.classList.remove('is-caught');
    moveBug();

    screen.classList.add('is-debug');
    debugLayer.hidden = false;
    if (byKeyboard) {
      bug.focus({ preventScroll: true });
    } else {
      // Con ratón o dedo no se marca nada (y en el móvil se cierra el teclado de la consola).
      document.activeElement?.blur();
    }
  };

  const exitDebug = () => {
    if (!debugging) {
      return;
    }
    debugging = false;
    debugLayer.hidden = true;
    screen.classList.remove('is-debug');
    returnFocus?.focus();
  };

  bug?.addEventListener('click', (event) => {
    // Mientras desaparece no cuenta otra vez (doble clic o doble toque).
    if (!debugging || bug.classList.contains('is-caught')) {
      return;
    }
    const byKeyboard = event.detail === 0;

    fixed += 1;
    count.textContent = String(fixed);
    say('BUG FOUND! ', tint('+1 DEBUG XP', 'ok'));
    bug.classList.add('is-caught');

    window.setTimeout(() => {
      if (!debugging) {
        return;
      }

      if (fixed < TOTAL) {
        moveBug();
        bug.classList.remove('is-caught');
        return;
      }

      // 10 de 10: de momento el logro solo se muestra; se avisa por si otra parte lo quiere guardar.
      bug.hidden = true;
      complete.hidden = false;
      if (byKeyboard) {
        exitButton.focus({ preventScroll: true });
      }
      document.dispatchEvent(new CustomEvent('debug:completo'));
    }, reduceMotion ? 0 : 200);
  });

  exitButton?.addEventListener('click', exitDebug);

  // Tab da la vuelta entre el primer y el último elemento en vez de salir de la pantalla.
  const trapTab = (event, first, last) => {
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onKey = (event) => {
    if (closing || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();

    // En el modo debug el menú no responde: Escape sale, INTRO pulsa el botón enfocado
    // (el bug o EXIT) y Tab no sale del modo.
    if (debugging) {
      if (key === 'escape') {
        exitDebug();
      } else if (key === 'tab') {
        trapTab(event, exitButton, bug.hidden ? exitButton : bug);
      }
      return;
    }

    // En la consola las teclas se escriben (P, S y C no navegan): INTRO ejecuta la orden
    // y Escape vuelve al menú.
    if (event.target === input && key !== 'tab') {
      if (key === 'enter') {
        event.preventDefault();
        run();
      } else if (key === 'escape') {
        options[0]?.focus();
      }
      return;
    }

    // INTRO sobre un botón de la consola ([ START DEBUGGING ]) lo pulsa, como cualquier botón.
    if (key === 'enter' && output?.contains(event.target)) {
      return;
    }

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

    // Tab no sale de la pantalla (la consola es el último elemento)
    if (key === 'tab' && options.length) {
      trapTab(event, options[0], input || options[options.length - 1]);
    }
  };

  window.addEventListener('keydown', onKey);
});
