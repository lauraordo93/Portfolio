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
// - "debug" abre el modo debug: un minijuego en el que hay que pulsar 10 bugs (de varios
//   tipos) en 15 segundos. Si se acaba el tiempo, los bugs se escapan: se va a Proyectos
//   y lo invaden durante 60 s.
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
  // Cada bug pulsado suma uno y el siguiente sale en otro sitio. Hay 15 s desde que se
  // pulsa START DEBUGGING: con 10 a tiempo se muestra DEBUG COMPLETE y, si se acaba el
  // tiempo, DEBUG FAILED con TRY AGAIN. Al salir, la BIOS y la consola siguen como estaban.
  // Cada bug es de un tipo (normal, móvil, rápido, pequeño, crítico) y a veces sale un
  // falso positivo que no cuenta; arreglar bugs seguidos y rápido hace combo (solo visual).
  const TOTAL = 10; // también escrito en el HTML del modo debug
  const TIME_LIMIT = 15; // segundos; también escrito en el HTML del modo debug
  const COMBO_WINDOW = 1500; // ms desde que sale un bug hasta pulsarlo para seguir el combo
  const FAKE_TIME = 1200; // ms que se queda el falso positivo si no se pulsa
  const KINDS = {
    normal: { label: 'BUG', name: 'Bug' },
    moving: { label: 'MOVING BUG', name: 'Moving bug', speed: 75 },
    fast: { label: 'FAST BUG', name: 'Fast bug', speed: 260, turn: 350, dash: 1300 },
    small: { label: 'SMALL BUG', name: 'Small bug' },
    critical: { label: 'CRITICAL BUG', name: 'Critical bug', speed: 125, turn: 700 },
    fake: { label: 'FALSE POSITIVE', name: 'Bug' },
  }; // speed en px/s; turn: cada cuánto tuerce un poco (ms); dash: cuánto corre antes de pararse (ms)
  const debugLayer = screen.querySelector('.boot-debug');
  const arena = debugLayer?.querySelector('.boot-debug__arena');
  const bug = debugLayer?.querySelector('.boot-debug__bug');
  const count = debugLayer?.querySelector('[data-debug-count]');
  const clock = debugLayer?.querySelector('[data-debug-time]');
  const message = debugLayer?.querySelector('.boot-debug__msg');
  const complete = debugLayer?.querySelector('[data-debug-done]');
  const usedTime = debugLayer?.querySelector('[data-debug-used]');
  const failed = debugLayer?.querySelector('[data-debug-failed]');
  const failedCount = debugLayer?.querySelector('[data-debug-failed-count]');
  const retryButton = debugLayer?.querySelector('[data-debug-retry]');
  const exitButton = debugLayer?.querySelector('[data-debug-exit]');
  let debugging = false;
  let playing = false; // hay una partida en marcha (se puede pulsar el bug)
  let round = 0; // número de partida, para descartar lo que quede pendiente de una anterior
  let byKeyboardPlay = false;
  let fixed = 0;
  let spot = { x: 0.5, y: 0.5 };
  let returnFocus = null;
  let timer = null;
  let endsAt = 0;
  let deck = []; // tipos de los 10 bugs de la partida, en orden
  let fakeBefore = -1; // con cuántos arreglados sale el falso positivo (-1: en esta no sale)
  let kind = 'normal'; // tipo del bug que se ve ahora
  let spawnedAt = 0;
  let combo = 0;
  let bestCombo = 0;
  let motion = 0; // requestAnimationFrame del bug que se mueve
  let fakeTimer = null;

  const say = (...parts) => {
    const span = document.createElement('span');
    span.append(...parts);
    message.replaceChildren(span);
  };

  const setSpot = (x, y) => {
    spot = { x, y };
    bug.style.setProperty('--x', x.toFixed(3));
    bug.style.setProperty('--y', y.toFixed(3));
  };

  // Nueva posición al azar (0–1 en cada eje), lejos de la anterior para que se note el salto.
  const moveBug = () => {
    let next = spot;
    for (let i = 0; i < 20 && Math.hypot(next.x - spot.x, next.y - spot.y) < 0.35; i += 1) {
      next = { x: Math.random(), y: Math.random() };
    }
    setSpot(next.x, next.y);
    bug.style.setProperty('--r', `${Math.floor(Math.random() * 4) * 90}deg`);
  };

  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  // Orden de la partida: empieza con uno normal, el crítico es el 8.º o el 9.º y en medio
  // hay al menos un móvil, un rápido y un pequeño. En 3 de cada 4 partidas sale además un
  // falso positivo antes de uno de los bugs 3.º a 7.º.
  const buildDeck = () => {
    deck = ['normal', ...shuffle(['moving', 'fast', 'small', 'normal', 'normal', 'normal',
      pick(['moving', 'small']), pick(['normal', 'fast'])])];
    deck.splice(7 + Math.floor(Math.random() * 2), 0, 'critical');
    if (reduceMotion) {
      // Sin movimiento: los que corren pasan a ser normales.
      deck = deck.map((type) => (type === 'moving' || type === 'fast' ? 'normal' : type));
    }
    fakeBefore = Math.random() < 0.75 ? 2 + Math.floor(Math.random() * 5) : -1;
  };

  const stopMotion = () => {
    window.cancelAnimationFrame(motion);
    motion = 0;
    bug.classList.remove('is-dashing');
  };

  // Movimiento de los bugs móvil, rápido y crítico: avanzan en línea recta (en px/s, igual
  // en cualquier pantalla), rebotan en los bordes de la zona y miran hacia donde van.
  // El rápido corre un rato torciendo un poco y luego se para; el crítico tuerce a veces.
  const startMotion = () => {
    stopMotion();
    const { speed, turn, dash } = KINDS[kind];
    if (!speed || reduceMotion) {
      return;
    }
    const start = performance.now();
    let angle = Math.random() * Math.PI * 2;
    let last = start;
    let turnAt = turn ? start + turn : Infinity;
    bug.classList.toggle('is-dashing', Boolean(dash));

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // El rápido frena en 300 ms al acabar su carrera y se queda quieto.
      const pace = dash ? Math.min(1, Math.max(0, 1 - (now - start - dash) / 300)) : 1;
      if (!pace) {
        stopMotion();
        return;
      }
      if (now > turnAt) {
        angle += (Math.random() - 0.5) * 1.2;
        turnAt = now + turn;
      }

      // Lo que puede recorrer en cada eje (la zona menos el bug y el margen de 8 px).
      const w = Math.max(1, arena.clientWidth - bug.offsetWidth - 16);
      const h = Math.max(1, arena.clientHeight - bug.offsetHeight - 16);
      let x = spot.x + (Math.cos(angle) * speed * pace * dt) / w;
      let y = spot.y + (Math.sin(angle) * speed * pace * dt) / h;
      if (x < 0 || x > 1) {
        angle = Math.PI - angle;
        x = x < 0 ? -x : 2 - x;
      }
      if (y < 0 || y > 1) {
        angle = -angle;
        y = y < 0 ? -y : 2 - y;
      }
      setSpot(Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y)));
      bug.style.setProperty('--r', `${Math.round((angle * 180) / Math.PI) + 90}deg`);
      motion = window.requestAnimationFrame(frame);
    };
    motion = window.requestAnimationFrame(frame);
  };

  // Saca el siguiente bug de la partida (o el falso positivo, si le toca).
  const spawn = () => {
    const fake = fixed === fakeBefore;
    if (fake) {
      fakeBefore = -1;
    }
    kind = fake ? 'fake' : deck[fixed];
    bug.dataset.kind = kind;
    bug.setAttribute('aria-label', KINDS[kind].name);
    moveBug();
    bug.classList.remove('is-caught');
    spawnedAt = performance.now();
    startMotion();

    window.clearTimeout(fakeTimer);
    if (fake) {
      // Si no se pulsa, se va solo y sale un bug de verdad: ignorarlo no cuesta nada.
      fakeTimer = window.setTimeout(() => {
        if (playing && kind === 'fake' && !bug.classList.contains('is-caught')) {
          bug.classList.add('is-caught');
          say(tint('> False positive ignored.', 'dim'));
          spawnNext(round);
        }
      }, FAKE_TIME);
    }
  };

  // Tras la animación de desaparecer, si la partida sigue, sale el siguiente.
  const spawnNext = (thisRound) => {
    window.setTimeout(() => {
      if (debugging && playing && round === thisRound) {
        spawn();
      }
    }, reduceMotion ? 0 : 200);
  };

  // "+1" (y el combo) que sube y se desvanece donde estaba el bug.
  const popUp = () => {
    if (reduceMotion) {
      return;
    }
    const pop = document.createElement('span');
    pop.className = 'boot-debug__pop';
    pop.setAttribute('aria-hidden', 'true');
    pop.append(tint('+1', 'ok'));
    if (combo > 1) {
      pop.append(tint(`COMBO x${combo}`, 'hl'));
    }
    const center = bug.offsetLeft + bug.offsetWidth / 2;
    pop.style.left = `${Math.min(Math.max(center, 48), arena.clientWidth - 48)}px`;
    pop.style.top = `${bug.offsetTop}px`;
    pop.addEventListener('animationend', () => pop.remove());
    arena.append(pop);
  };

  // Temporizador: un único intervalo por partida (startRound siempre para el anterior).
  // Los segundos se calculan con la hora de fin, no contando ticks, para que no se desvíe.
  const stopTimer = () => {
    window.clearInterval(timer);
    timer = null;
  };

  const showTime = (seconds) => {
    clock.textContent = `${seconds}s`;
    clock.classList.toggle('ok', seconds > 5);
    clock.classList.toggle('hl', seconds <= 5);
  };

  // Tiempo agotado: la partida se para y ya no se puede pulsar el bug.
  const fail = () => {
    stopTimer();
    stopMotion();
    window.clearTimeout(fakeTimer);
    playing = false;
    bug.hidden = true;
    message.replaceChildren();
    failedCount.textContent = String(fixed);
    // TRY AGAIN se puede pulsar cuando ya se ve (ver "animationend" más abajo): así un
    // toque de más justo al acabarse el tiempo no reinicia la partida sin ver el resultado.
    retryButton.disabled = !reduceMotion;
    failed.hidden = false;
    if (reduceMotion && byKeyboardPlay) {
      retryButton.focus({ preventScroll: true });
    }
    document.dispatchEvent(new CustomEvent('debug:fallido', { detail: { fixed } }));
  };

  const tick = () => {
    const left = Math.max(0, Math.ceil((endsAt - performance.now()) / 1000));
    showTime(left);
    if (left === 0) {
      fail();
    }
  };

  // Empieza (o vuelve a empezar) una partida: 0 / 10, 15 s, orden de bugs nuevo y el
  // primero en un sitio al azar.
  // byKeyboard: si se ha pulsado con el teclado, el foco va al bug para seguir jugando con INTRO.
  const startRound = (byKeyboard) => {
    stopTimer();
    stopInvasion(); // si la fuga de la partida anterior no había salido aún, se cancela
    round += 1;
    playing = true;
    byKeyboardPlay = byKeyboard;
    fixed = 0;
    combo = 0;
    bestCombo = 0;
    count.textContent = '0';
    showTime(TIME_LIMIT);
    say('> Click or tap the bugs to fix them.');
    complete.hidden = true;
    failed.hidden = true;
    arena.querySelectorAll('.boot-debug__pop').forEach((pop) => pop.remove());
    bug.hidden = false;
    buildDeck();
    spawn();

    if (byKeyboard) {
      bug.focus({ preventScroll: true });
    } else {
      // Con ratón o dedo no se marca nada (y en el móvil se cierra el teclado de la consola).
      document.activeElement?.blur();
    }

    endsAt = performance.now() + TIME_LIMIT * 1000;
    timer = window.setInterval(tick, 100);
  };

  const startDebug = (trigger, byKeyboard) => {
    if (!debugLayer || debugging || closing) {
      return;
    }
    debugging = true;
    returnFocus = trigger;
    screen.classList.add('is-debug');
    debugLayer.hidden = false;
    startRound(byKeyboard);
  };

  const exitDebug = () => {
    if (!debugging) {
      return;
    }
    debugging = false;
    playing = false;
    stopTimer();
    stopMotion();
    window.clearTimeout(fakeTimer);
    debugLayer.hidden = true;
    screen.classList.remove('is-debug');
    returnFocus?.focus();
  };

  bug?.addEventListener('click', (event) => {
    // Mientras desaparece no cuenta otra vez (doble clic o doble toque).
    if (!playing || bug.classList.contains('is-caught')) {
      return;
    }
    const byKeyboard = event.detail === 0;
    const thisRound = round;
    const now = performance.now();
    byKeyboardPlay = byKeyboard;
    stopMotion();
    bug.classList.add('is-caught');

    // Falso positivo: no suma, no quita tiempo ni rompe el combo; sale un bug de verdad.
    if (kind === 'fake') {
      window.clearTimeout(fakeTimer);
      say('FALSE POSITIVE ', tint("(it's a feature)", 'dim'));
      spawnNext(thisRound);
      return;
    }

    // Combo: sigue si este bug se ha pulsado poco después de salir; si no, empieza de nuevo.
    combo = now - spawnedAt <= COMBO_WINDOW ? combo + 1 : 1;
    bestCombo = Math.max(bestCombo, combo);
    fixed += 1;
    count.textContent = String(fixed);
    say(`${KINDS[kind].label} FIXED `, tint('+1', 'ok'), ...(combo > 1 ? ['  ', tint(`COMBO x${combo}`, 'hl')] : []));
    popUp();

    // El décimo para el reloj en el momento del clic, no al acabar la animación.
    const seconds = TIME_LIMIT - (endsAt - now) / 1000;
    if (fixed < TOTAL) {
      spawnNext(thisRound);
      return;
    }
    stopTimer();
    playing = false;

    window.setTimeout(() => {
      // Nada si se ha salido o empezado otra partida entretanto.
      if (!debugging || round !== thisRound) {
        return;
      }

      // 10 de 10: de momento el logro solo se muestra; se avisa por si otra parte lo quiere guardar.
      bug.hidden = true;
      usedTime.textContent = seconds.toFixed(1);
      complete.hidden = false;
      if (byKeyboard) {
        exitButton.focus({ preventScroll: true });
      }
      document.dispatchEvent(new CustomEvent('debug:completo', { detail: { seconds, combo: bestCombo } }));
    }, reduceMotion ? 0 : 200);
  });

  retryButton?.addEventListener('animationend', () => {
    retryButton.disabled = false;
    if (byKeyboardPlay) {
      retryButton.focus({ preventScroll: true });
    }
  });

  retryButton?.addEventListener('click', (event) => {
    if (debugging) {
      startRound(event.detail === 0);
    }
  });

  exitButton?.addEventListener('click', exitDebug);

  // Fuga e invasión: al perder por tiempo (evento debug:fallido) los bugs se escapan.
  // 1. En DEBUG FAILED salen "CONTAINMENT FAILURE" y "Bugs escaping..." y unos pocos bugs
  //    salen corriendo de la zona de juego hacia los bordes de la pantalla.
  // 2. Se sale del modo debug y se va a Proyectos con la navegación de la BIOS (como la tecla P).
  // 3. Al llegar (evento inicio:fin) empieza la invasión: 60 s de bugs por el portfolio, en una
  //    capa fija encima de todo que no se puede pulsar (pointer-events: none), así que los
  //    enlaces, botones, el menú y el scroll funcionan igual. Salen poco a poco (más cuantos
  //    menos bugs se arreglaron) y se mueven con animaciones CSS: JS solo decide cuántos hay
  //    y a dónde va cada uno. Al acabar se quita todo y sale "SYSTEM RESTORED" unos segundos.
  // TRY AGAIN antes de salir del modo debug cancela la fuga; EXIT no (la fuga ocurre igual).
  const ESCAPE_AT = 2800; // ms desde DEBUG FAILED: salen los primeros bugs del juego
  const LEAVE_AT = 4600; // ms desde DEBUG FAILED: se va a Proyectos
  const INVASION_TIME = 60000;
  const INVASION_MAX = 40; // bugs a la vez como mucho
  // Bugs a la vez según los segundos que lleva (con 5 / 10 arreglados en una pantalla grande)
  const INVASION_CURVE = [[0, 5], [10, 9], [30, 18], [50, 30], [60, 36]];
  const BUG_PATH = bug?.querySelector('path')?.getAttribute('d');
  let invasion = null;

  const random = (min, max) => min + Math.random() * (max - min);

  // Temporizadores de la fuga y la invasión: se guardan para poder pararlos todos de una vez.
  const invasionLater = (fn, ms) => {
    const id = window.setTimeout(() => {
      invasion?.timers.delete(id);
      fn();
    }, ms);
    invasion.timers.add(id);
  };

  const invasionTarget = (seconds) => {
    let n = INVASION_CURVE[INVASION_CURVE.length - 1][1];
    for (let i = 1; i < INVASION_CURVE.length; i += 1) {
      const [t0, n0] = INVASION_CURVE[i - 1];
      const [t1, n1] = INVASION_CURVE[i];
      if (seconds <= t1) {
        n = n0 + ((n1 - n0) * (seconds - t0)) / (t1 - t0);
        break;
      }
    }
    return Math.min(INVASION_MAX, Math.round(n * invasion.scale));
  };

  // Un bug escapado. El exterior se desplaza (translate) y el dibujo de dentro mira hacia
  // donde va. Cada tramo del recorrido es una animación CSS; al acabar se encadena el
  // siguiente y, cuando ha salido de la pantalla, se quita. Con el tiempo hay más tipos
  // de recorrido y van más rápido.
  // from: si se da, es uno de los que huyen del juego: sale de ahí corriendo hacia un borde.
  const releaseBug = (seconds, from) => {
    const w = document.documentElement.clientWidth;
    const h = window.innerHeight;
    const size = pick([16, 22, 22, 22]);
    const el = invasion.template.cloneNode(true);
    el.style.setProperty('--s', `${size}px`);

    let type = 'run';
    if (!from) {
      invasion.escaped += 1;
      type = reduceMotion ? 'stay' : pick(seconds < 10 ? ['walk', 'walk', 'walk', 'hop', 'blink']
        : seconds < 30 ? ['walk', 'walk', 'zigzag', 'hop', 'blink'] : ['walk', 'zigzag', 'zigzag', 'hop', 'blink']);
    }
    const inside = () => [random(0.05, 0.95) * (w - size), random(0.05, 0.95) * (h - size)];
    // Justo fuera de un borde (izquierda, derecha, arriba o abajo), para que entre o salga.
    const sides = ['left', 'right', 'top', 'bottom'];
    const edge = (side) => [
      side === 'left' ? -size : side === 'right' ? w : random(0, w - size),
      side === 'top' ? -size * 1.2 : side === 'bottom' ? h : random(0.04, 0.94) * (h - size),
    ];

    // Recorrido: puntos por los que pasa (los que se quedan quietos no tienen).
    let path = null;
    let step = 0;
    const speed = from ? random(380, 480)
      : pick([random(50, 80), random(90, 140), random(170, 240)]) * (1 + seconds / 120);
    const run = () => {
      const [x0, y0] = path[step];
      const [x1, y1] = path[step + 1];
      el.style.setProperty('--x0', `${x0}px`);
      el.style.setProperty('--y0', `${y0}px`);
      el.style.setProperty('--x1', `${x1}px`);
      el.style.setProperty('--y1', `${y1}px`);
      el.style.setProperty('--t', `${Math.hypot(x1 - x0, y1 - y0) / speed}s`);
      el.style.setProperty('--r', `${Math.round((Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI) + 90}deg`);
      // Otro nombre de animación para que el tramo nuevo empiece desde el principio.
      el.style.animationName = step % 2 ? 'invasionRunB' : 'invasionRunA';
    };

    if (type === 'run') {
      path = [from, edge(pick(sides))];
      run();
    } else if (type === 'stay' || type === 'blink') {
      // Aparece en un sitio, se queda un momento y desaparece (sin moverse).
      const [x, y] = inside();
      el.classList.add(`is-${type}`);
      el.style.setProperty('--x0', `${x}px`);
      el.style.setProperty('--y0', `${y}px`);
      el.style.setProperty('--t', `${type === 'stay' ? random(5, 9) : random(1.8, 3.2)}s`);
      el.style.setProperty('--r', `${Math.floor(Math.random() * 4) * 90}deg`);
    } else if (type === 'zigzag') {
      // Entra por un lado, cambia de dirección dos veces y sale por otro.
      path = [edge(pick(sides)), inside(), inside(), edge(pick(sides))];
      run();
    } else {
      // Cruza de un lado a otro, subiendo o bajando un poco (y saltando, si es de los que saltan).
      const fromLeft = Math.random() < 0.5;
      const start = edge(fromLeft ? 'left' : 'right');
      const end = edge(fromLeft ? 'right' : 'left');
      end[1] = Math.min(h - size, Math.max(0, start[1] + random(-0.15, 0.15) * h));
      path = [start, end];
      el.classList.toggle('is-hop', type === 'hop');
      run();
    }

    el.addEventListener('animationend', (event) => {
      // El "zap" (al pulsarlo o al acabar la invasión) es del dibujo de dentro; los
      // tramos y el parpadeo, del propio bug. Las patas y el salto no acaban nunca.
      const zap = event.animationName === 'invasionZap';
      if (!zap && event.target !== el) {
        return;
      }
      if (!zap && path && step < path.length - 2) {
        step += 1;
        run();
        return;
      }
      el.remove();
    });
    invasion.swarm.append(el);
  };

  // Pulsar donde pasa un bug lo hace desaparecer con un parpadeo. No se cancela el
  // clic: lo que hay debajo (un enlace, un botón) funciona igual.
  const zapAt = (event) => {
    for (const el of invasion?.swarm.children ?? []) {
      const r = el.getBoundingClientRect();
      const hit = event.clientX >= r.left - 6 && event.clientX <= r.right + 6
        && event.clientY >= r.top - 6 && event.clientY <= r.bottom + 6;
      if (hit && !el.classList.contains('is-zapped')) {
        if (reduceMotion) {
          el.remove();
        } else {
          el.classList.add('is-zapped');
        }
        return;
      }
    }
  };

  // Empieza la invasión en Proyectos: desde aquí cuentan los 60 s.
  const beginInvasion = () => {
    document.removeEventListener('inicio:fin', beginInvasion);
    if (!invasion || invasion.startedAt) {
      return;
    }
    invasion.swarm.replaceChildren(); // los que huían del juego ya se han ido
    invasion.startedAt = performance.now();
    document.addEventListener('pointerdown', zapAt, true);

    // Cada 400 ms se mira cuántos debería haber y salen, como mucho, dos más.
    const direct = () => {
      const seconds = (performance.now() - invasion.startedAt) / 1000;
      const target = invasionTarget(seconds);
      for (let i = 0; i < 2 && invasion.swarm.childElementCount < target; i += 1) {
        releaseBug(seconds);
      }
    };
    direct();
    invasion.director = window.setInterval(direct, 400);
    invasionLater(endInvasion, INVASION_TIME);
  };

  // Para la fuga o la invasión del todo: temporizadores, intervalo, escuchas y la capa entera.
  const stopInvasion = () => {
    if (!invasion) {
      return;
    }
    invasion.timers.forEach((id) => window.clearTimeout(id));
    window.clearInterval(invasion.director);
    document.removeEventListener('pointerdown', zapAt, true);
    document.removeEventListener('inicio:fin', beginInvasion);
    invasion.layer.remove();
    invasion = null;
  };

  // A los 60 s: todos los bugs desaparecen (con un último parpadeo) y sale el informe 6 s.
  const endInvasion = () => {
    const { layer, swarm, escaped } = invasion;
    window.clearInterval(invasion.director);
    document.removeEventListener('pointerdown', zapAt, true);
    layer.classList.add('is-over');

    invasionLater(() => {
      swarm.remove();
      const report = document.createElement('div');
      report.className = 'invasion__report';
      report.setAttribute('role', 'status');
      const line = (...parts) => {
        const p = document.createElement('p');
        p.append(...parts);
        report.append(p);
      };
      line(tint('SYSTEM RESTORED', 'ok'));
      line('BUGS CONTAINED: ', tint(String(escaped), 'hl'));
      layer.append(report);
      invasionLater(stopInvasion, 6000);
    }, reduceMotion ? 0 : 350);
  };

  // Prepara la capa (vacía) en cuanto se pierde; los bugs llegan después.
  const createInvasion = (fixed) => {
    const layer = document.createElement('div');
    layer.className = 'invasion';
    layer.lang = 'en';

    // El dibujo es el mismo del modo debug, una sola vez, y cada bug lo reutiliza con <use>.
    const svgNS = 'http://www.w3.org/2000/svg';
    const sprite = document.createElementNS(svgNS, 'svg');
    const symbol = document.createElementNS(svgNS, 'symbol');
    const shape = document.createElementNS(svgNS, 'path');
    sprite.setAttribute('class', 'invasion__sprite');
    sprite.setAttribute('aria-hidden', 'true');
    symbol.id = 'invasion-bug';
    symbol.setAttribute('viewBox', '0 0 11 12');
    shape.setAttribute('fill', 'currentColor');
    shape.setAttribute('d', BUG_PATH);
    symbol.append(shape);
    sprite.append(symbol);

    const template = document.createElement('span');
    const body = document.createElement('span');
    const icon = document.createElementNS(svgNS, 'svg');
    const use = document.createElementNS(svgNS, 'use');
    template.className = 'invasion__bug';
    body.className = 'invasion__body';
    icon.setAttribute('viewBox', '0 0 11 12');
    icon.setAttribute('focusable', 'false');
    use.setAttribute('href', '#invasion-bug');
    icon.append(use);
    body.append(icon);
    template.append(body);

    const swarm = document.createElement('div');
    swarm.className = 'invasion__swarm';
    swarm.setAttribute('aria-hidden', 'true');
    layer.append(sprite, swarm);
    document.body.append(layer);

    // Cuántos: menos en pantallas pequeñas y con movimiento reducido; más cuantos menos
    // bugs se arreglaron (0 / 10: x1,5; 5 / 10: x1; 9 / 10: x0,6).
    const w = document.documentElement.clientWidth;
    const area = Math.min(1, Math.max(0.45, (w * window.innerHeight) / (1280 * 800)));
    invasion = {
      layer,
      swarm,
      template,
      scale: (1.5 - fixed * 0.1) * area * (reduceMotion ? 0.4 : 1),
      escaped: 0,
      timers: new Set(),
      startedAt: 0,
      director: null,
    };
  };

  document.addEventListener('debug:fallido', (event) => {
    stopInvasion();
    if (!BUG_PATH) {
      return;
    }
    createInvasion(event.detail?.fixed ?? 0);

    // Unos pocos bugs salen corriendo desde la zona de juego hacia los bordes.
    if (!reduceMotion) {
      invasionLater(() => {
        const r = arena.getBoundingClientRect();
        for (let i = 0; i < 8; i += 1) {
          releaseBug(0, [random(r.left + 20, r.right - 40), random(r.top + 20, Math.min(r.bottom, window.innerHeight) - 40)]);
        }
      }, ESCAPE_AT);
    }

    // Fuera del modo debug, a Proyectos; la invasión empieza al llegar. Si ya se ha salido
    // de la BIOS por otro camino, empieza donde se esté.
    invasionLater(() => {
      if (!root.classList.contains('boot')) {
        beginInvasion();
        return;
      }
      document.addEventListener('inicio:fin', beginInvasion);
      if (!closing) {
        go('#proyectos');
      }
    }, reduceMotion ? 3000 : LEAVE_AT);
  });

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
    // (el bug, EXIT o TRY AGAIN) y Tab no sale del modo.
    if (debugging) {
      if (key === 'escape') {
        exitDebug();
      } else if (key === 'tab') {
        const last = !failed.hidden ? retryButton : bug.hidden ? exitButton : bug;
        trapTab(event, exitButton, last);
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
