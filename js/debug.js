// Modo DEBUG: el minijuego de los bugs, la fuga a Proyectos y la invasión al perder, y las
// anomalías que lo dejan descubrir desde la BIOS o el portfolio.
// - Se abre siempre con openDebugGame(), que solo prepara la pantalla previa
//   (ERROR: 10 BUGS DETECTED / [ START DEBUGGING ]); el tiempo empieza al pulsar START.
//   Llegan a ella tres caminos: la consola de la BIOS (C:\> debug) y el "?" de
//   "Modo DEBUG" (los dos desde inicio.js, con el evento debug:abrir) y el bug
//   interactivo de las anomalías.
// - Anomalías: si no se ha descubierto DEBUG, en la BIOS o en el portfolio (donde se esté)
//   salen unos bugs sueltos, luego "WARNING: UNKNOWN PROCESS" y por fin un bug que se puede
//   pulsar. Una vez por visita (sessionStorage "debug"); al abrir DEBUG por cualquier camino
//   ya no salen.
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tint = (text, className) => {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
  };

  // Modo debug: tapa la BIOS o el portfolio con una zona en la que aparece un bug en un
  // sitio al azar.
  // Cada bug pulsado suma uno y el siguiente sale en otro sitio. Hay TIME_LIMIT segundos desde
  // que se pulsa START DEBUGGING: con 10 a tiempo se muestra DEBUG COMPLETE y, si se acaba el
  // tiempo, DEBUG FAILED con TRY AGAIN. Al salir, la BIOS y la consola siguen como estaban.
  // Cada bug es de un tipo (normal, móvil, rápido, pequeño, crítico) y a veces sale un
  // falso positivo que no cuenta; arreglar bugs seguidos y rápido hace combo (solo visual).
  const TOTAL = 10; // también escrito en el HTML del modo debug
  // Controlador de tiempo juego
  const TIME_LIMIT = 8; // segundos; también escrito en el HTML del modo debug
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
  const debugLayer = document.querySelector('.boot-debug');
  const ready = debugLayer?.querySelector('[data-debug-ready]');
  const startButton = debugLayer?.querySelector('[data-debug-start]');
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

  // Empieza (o vuelve a empezar) una partida: 0 / 10, el tiempo entero, orden de bugs nuevo y el
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
    ready.hidden = true;
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

  // Mientras está el modo debug, lo de detrás (BIOS o portfolio) no se puede usar ni hacer
  // scroll. Al cerrarlo se deja como estaba: si sigue la BIOS, el portfolio sigue bloqueado.
  const lockPage = (on) => {
    const behind = [...document.body.children].filter((el) => el !== debugLayer
      && el.tagName !== 'SCRIPT' && !el.classList.contains('invasion'));
    behind.forEach((el) => el.toggleAttribute('inert', on));
    if (!on && root.classList.contains('boot')) {
      document.getElementById('contenido')?.setAttribute('inert', '');
      document.querySelector('.nav-header')?.setAttribute('inert', '');
    }
    root.classList.toggle('debug-open', on);
    document.getElementById('boot-screen')?.classList.toggle('is-debug', on);
  };

  // Pantalla previa: 0 / 10 y el tiempo entero, parado hasta pulsar START DEBUGGING.
  const showReady = () => {
    stopTimer();
    stopMotion();
    window.clearTimeout(fakeTimer);
    playing = false;
    fixed = 0;
    count.textContent = '0';
    showTime(TIME_LIMIT);
    message.replaceChildren();
    bug.hidden = true;
    complete.hidden = true;
    failed.hidden = true;
    arena.querySelectorAll('.boot-debug__pop').forEach((pop) => pop.remove());
    ready.hidden = false;
  };

  // Única entrada al modo DEBUG (consola, "?" de la BIOS y bug de las anomalías): abre la
  // pantalla previa y no pone en marcha el tiempo, que empieza con START DEBUGGING.
  // trigger: lo que lo ha abierto, para devolverle el foco al salir.
  const openDebugGame = (trigger, byKeyboard = false) => {
    if (!debugLayer || debugging) {
      return;
    }
    discover();
    debugging = true;
    returnFocus = trigger;
    showReady();
    lockPage(true);
    debugLayer.classList.remove('is-off');
    debugLayer.hidden = false;
    debugLayer.scrollTop = 0;
    if (byKeyboard) {
      startButton.focus({ preventScroll: true });
    } else {
      // Con ratón o dedo no se marca nada (y en el móvil se cierra el teclado de la consola).
      document.activeElement?.blur();
    }
  };

  // Cierra el modo debug y para la partida (no la fuga, que sigue su curso si la hay).
  const closeDebug = () => {
    debugging = false;
    playing = false;
    stopTimer();
    stopMotion();
    window.clearTimeout(fakeTimer);
    debugLayer.hidden = true;
    debugLayer.classList.remove('is-off');
    lockPage(false);
  };

  const exitDebug = () => {
    if (!debugging) {
      return;
    }
    closeDebug();
    if (returnFocus?.isConnected) {
      returnFocus.focus({ preventScroll: true });
    }
  };

  startButton?.addEventListener('click', (event) => {
    if (debugging && !playing) {
      ready.hidden = true;
      startRound(event.detail === 0);
    }
  });

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
    // Con el modo debug ya "apagándose" camino de Proyectos (la fuga), TRY AGAIN no hace nada:
    // si no, empezaría una partida invisible con la página bloqueada detrás.
    if (debugging && !debugLayer.classList.contains('is-off')) {
      startRound(event.detail === 0);
    }
  });

  exitButton?.addEventListener('click', exitDebug);

  // Fuga e invasión: al perder por tiempo (evento debug:fallido) los bugs se escapan.
  // 1. En DEBUG FAILED salen "CONTAINMENT FAILURE" y "Bugs escaping..." y unos pocos bugs
  //    salen corriendo de la zona de juego hacia los bordes de la pantalla.
  // 2. Se sale del modo debug y se va a Proyectos: con la navegación de la BIOS (como la
  //    tecla P) si se jugaba desde ella, o bajando a la sección si se jugaba desde el portfolio.
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
  // Opciones: from (uno de los que huyen del juego: sale de ahí corriendo hacia un borde),
  // type y speed (para fijar el recorrido) y ctx (la capa: la invasión o las anomalías).
  // life: segundos que se queda uno quieto (con movimiento reducido). path, size y at: recorrido,
  // tamaño y sitio ya decididos (en la BIOS se buscan antes para no pasar por encima de nada).
  const releaseBug = (seconds, {
    from, type: fixedType, speed: fixedSpeed, life, path: fixedPath, size: fixedSize, at, ctx = invasion,
  } = {}) => {
    const w = document.documentElement.clientWidth;
    const h = window.innerHeight;
    const size = fixedSize || pick([16, 22, 22, 22]);
    const el = ctx.template.cloneNode(true);
    el.style.setProperty('--s', `${size}px`);

    let type = fixedType || 'run';
    if (!from && !fixedType) {
      ctx.escaped += 1;
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
    const speed = fixedSpeed || (from ? random(380, 480) : null)
      || pick([random(50, 80), random(90, 140), random(170, 240)]) * (1 + seconds / 120);
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

    if (fixedPath && type !== 'stay') {
      path = fixedPath;
      run();
    } else if (type === 'run') {
      path = [from, edge(pick(sides))];
      run();
    } else if (type === 'stay' || type === 'blink') {
      // Aparece en un sitio, se queda un momento y desaparece (sin moverse).
      const [x, y] = at || inside();
      el.classList.add(`is-${type}`);
      el.style.setProperty('--x0', `${x}px`);
      el.style.setProperty('--y0', `${y}px`);
      el.style.setProperty('--r', `${Math.floor(Math.random() * 4) * 90}deg`);
      if (type === 'blink') {
        el.style.setProperty('--t', `${random(1.8, 3.2)}s`);
      } else {
        // Quietos (movimiento reducido): ahí no hay animaciones, así que se quitan con un
        // temporizador de su capa (y se paran con ella).
        const id = window.setTimeout(() => {
          ctx.timers.delete(id);
          el.remove();
        }, (life || random(5, 9)) * 1000);
        ctx.timers.add(id);
      }
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
    ctx.swarm.append(el);
    return el;
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

  // Llegada a Proyectos: se quita el modo debug (si seguía abierto) y empieza la invasión.
  const arrive = () => {
    document.removeEventListener('inicio:fin', arrive);
    if (debugging) {
      closeDebug();
    }
    beginInvasion();
  };

  // Para la fuga o la invasión del todo: temporizadores, intervalo, escuchas y la capa entera.
  const stopInvasion = () => {
    if (!invasion) {
      return;
    }
    invasion.timers.forEach((id) => window.clearTimeout(id));
    window.clearInterval(invasion.director);
    document.removeEventListener('pointerdown', zapAt, true);
    document.removeEventListener('inicio:fin', arrive);
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

  // Capa fija encima de todo para bugs sueltos (invasión o anomalías), con el dibujo del
  // modo debug una sola vez: cada bug lo reutiliza con <use>.
  const buildLayer = () => {
    const layer = document.createElement('div');
    layer.className = 'invasion';
    layer.lang = 'en';

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
    return { layer, swarm, template };
  };

  // Prepara la capa (vacía) en cuanto se pierde; los bugs llegan después.
  const createInvasion = (fixed) => {
    const { layer, swarm, template } = buildLayer();

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
          releaseBug(0, { from: [random(r.left + 20, r.right - 40), random(r.top + 20, Math.min(r.bottom, window.innerHeight) - 40)] });
        }
      }, ESCAPE_AT);
    }

    // Fuera del modo debug (se "apaga" como un monitor CRT) y a Proyectos; la invasión
    // empieza al llegar.
    invasionLater(() => {
      if (debugging && !reduceMotion) {
        debugLayer.classList.add('is-off');
      }
      // Con la BIOS delante, se va con su navegación (como la tecla P) y se espera a que acabe.
      if (root.classList.contains('boot')) {
        document.addEventListener('inicio:fin', arrive);
        document.dispatchEvent(new CustomEvent('inicio:ir', { detail: { target: '#proyectos' } }));
        return;
      }
      // Desde el portfolio: se cierra el modo debug y se baja a Proyectos.
      invasionLater(() => {
        const section = document.getElementById('proyectos');
        if (section) {
          section.scrollIntoView({ behavior: 'instant' });
          history.replaceState(null, '', '#proyectos');
        }
        arrive();
      }, debugging && !reduceMotion ? 480 : 0);
    }, reduceMotion ? 3000 : LEAVE_AT);
  });

  // Teclado dentro del modo debug: Escape sale y Tab da la vuelta entre sus botones visibles
  // en vez de salir de él. INTRO pulsa el botón enfocado, como siempre.
  const trapTab = (event, first, last) => {
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  window.addEventListener('keydown', (event) => {
    if (!debugging || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (event.key === 'Escape') {
      exitDebug();
    } else if (event.key === 'Tab') {
      const buttons = [...debugLayer.querySelectorAll('button')]
        .filter((b) => !b.disabled && b.getClientRects().length);
      trapTab(event, buttons[0], buttons[buttons.length - 1]);
    }
  });

  // La BIOS (consola y "?") pide abrirlo con este evento.
  document.addEventListener('debug:abrir', (event) => {
    openDebugGame(event.detail?.trigger, event.detail?.byKeyboard);
  });

  // Anomalías: la forma de descubrir DEBUG sin conocerlo, en la BIOS o en el portfolio.
  // - Empiezan en la BIOS si está delante (a los ~5 s de verse el menú, y luego cada 5–8 s) o
  //   en el portfolio si se entra sin ella (8–12 s entre pasos; ahí cuentan desde que se ve el
  //   portfolio, no por sección: es una sola página).
  // 1. Un bug cruza la pantalla (no se puede pulsar).
  // 2. Uno o dos más y "WARNING: UNKNOWN PROCESS".
  // 3. Un bug se para ~8 s y este sí se puede pulsar: abre "UNKNOWN PROCESS FOUND /
  //    DEBUG MODE AVAILABLE / [ INVESTIGATE ]", que llama a openDebugGame().
  // En la BIOS solo pasan por huecos libres (sin texto, botones ni la consola) y el bug que se
  // puede pulsar va dentro de ella, entre el "?" y el menú, para que Tab llegue a él.
  // Por dónde va se guarda en sessionStorage ("debug": 1, 2, 3 o "descubierto"): si se sale de
  // la BIOS a mitad, el portfolio sigue desde ese paso, y al recargar no se repite. El paso 3
  // cuenta como hecho cuando el bug se va (si se sale con él en pantalla, vuelve a salir en el
  // portfolio). Al abrir DEBUG por cualquier camino se paran y ya no vuelven en esta visita.
  const STATE_KEY = 'debug';
  const BIOS_FIRST = [4500, 5500]; // ms desde que se ve el menú de la BIOS
  const BIOS_GAP = [5000, 8000];
  const WEB_GAP = [8000, 12000];
  const PROCESS_TIME = 8000;
  let anomaly = null;

  const readState = () => {
    try {
      return sessionStorage.getItem(STATE_KEY);
    } catch (error) {
      return null;
    }
  };

  const saveState = (value) => {
    try {
      sessionStorage.setItem(STATE_KEY, value);
    } catch (error) {
      // Sin almacenamiento: al recargar empezarían de nuevo, nada más.
    }
  };

  const anomalyLater = (fn, ms) => {
    const id = window.setTimeout(() => {
      anomaly?.timers.delete(id);
      fn();
    }, ms);
    anomaly.timers.add(id);
  };

  // Quita las anomalías del todo: temporizadores, escuchas, capa, bug y panel (también los
  // que van dentro de la BIOS).
  const stopAnomalies = () => {
    if (!anomaly) {
      return;
    }
    anomaly.timers.forEach((id) => window.clearTimeout(id));
    document.removeEventListener('keydown', anomaly.onKey);
    document.removeEventListener('pointerdown', anomaly.onOutside, true);
    document.removeEventListener('inicio:fin', anomaly.onLeaveBios);
    window.removeEventListener('scroll', anomaly.onScroll);
    anomaly.layer.remove();
    anomaly.process?.remove();
    anomaly.panel?.remove();
    anomaly = null;
  };

  // DEBUG descubierto (se ha abierto por cualquier camino): ya no hay anomalías en esta visita.
  const discover = () => {
    saveState('descubierto');
    stopAnomalies();
  };

  // Solo con la pantalla tranquila: pestaña visible, sin el modo debug, el menú móvil ni el
  // diálogo del secreto abiertos (y, en el portfolio, sin la BIOS delante). Si no, se espera.
  const whenCalm = (fn) => {
    const busy = document.hidden || debugging || (!anomaly.bios && root.classList.contains('boot'))
      || document.body.classList.contains('nav-open') || document.getElementById('rpg')?.hidden === false;
    if (busy) {
      anomalyLater(() => whenCalm(fn), 1500);
    } else {
      fn();
    }
  };

  // Zonas ocupadas de la BIOS: el texto (solo donde hay letras, no la línea entera), los
  // botones, las opciones, la consola y los paneles. skip: un elemento que no cuenta.
  // controlsOnly: solo lo que se puede pulsar o usar (el texto del arranque no cuenta).
  const biosObstacles = (skip, controlsOnly = false) => {
    const bios = document.getElementById('boot-screen');
    const rects = [];
    const range = document.createRange();
    const counts = (el) => !skip || (el !== skip && !skip.contains(el));
    bios.querySelectorAll('pre, p, kbd').forEach((el) => {
      if (controlsOnly || !counts(el)) {
        return;
      }
      range.selectNodeContents(el);
      rects.push(...range.getClientRects());
    });
    bios.querySelectorAll('a, button, label, .boot-screen__prompt, .boot-investigate, .anomaly-panel')
      .forEach((el) => counts(el) && rects.push(el.getBoundingClientRect()));
    return rects.filter((r) => r.width && r.height);
  };

  const isFree = (obstacles, x, y, w, h, gap) => !obstacles.some((r) => (
    x < r.right + gap && x + w > r.left - gap && y < r.bottom + gap && y + h > r.top - gap));

  // Recorrido de un bug que cruza la BIOS por un hueco libre: una franja horizontal sin nada
  // o, si no hay, una vertical (en escritorio, los márgenes). null si no cabe por ningún sitio.
  const biosPath = (size) => {
    const w = document.documentElement.clientWidth;
    const h = window.innerHeight;
    const obstacles = biosObstacles();
    const rows = [];
    for (let y = 4; y <= h - size * 1.2 - 4; y += 4) {
      if (isFree(obstacles, 0, y, w, size * 1.2, 4)) {
        rows.push(y);
      }
    }
    if (rows.length) {
      const y = pick(rows);
      return Math.random() < 0.5 ? [[-size, y], [w, y]] : [[w, y], [-size, y]];
    }
    const cols = [];
    for (let x = 4; x <= w - size - 4; x += 4) {
      if (isFree(obstacles, x, 0, size, h, 4)) {
        cols.push(x);
      }
    }
    if (cols.length) {
      const x = pick(cols);
      return Math.random() < 0.5 ? [[x, -size * 1.2], [x, h]] : [[x, h], [x, -size * 1.2]];
    }
    return null;
  };

  // Huecos libres de w × h en la BIOS (dentro de lo que se ve y del ancho de su contenido).
  // Opciones: soft (el logo cuenta como hueco), skip (un elemento que no cuenta como ocupado,
  // como el propio panel al colocarlo) y controlsOnly (solo estorban los controles).
  const biosSpots = (w, h, gap, { soft = false, skip = null, controlsOnly = false } = {}) => {
    const box = document.querySelector('.boot-screen__inner').getBoundingClientRect();
    let obstacles = biosObstacles(skip, controlsOnly);
    if (soft) {
      const logo = document.querySelector('.boot-screen__logo')?.getBoundingClientRect();
      obstacles = obstacles.filter((r) => !logo || r.top < logo.top - 1 || r.bottom > logo.bottom + 1);
    }
    const spots = [];
    for (let y = 8; y <= window.innerHeight - h - 8; y += 8) {
      for (let x = box.left; x <= box.right - w; x += 8) {
        if (isFree(obstacles, x, y, w, h, gap)) {
          spots.push([x, y]);
        }
      }
    }
    return spots;
  };

  const biosSpot = (w, h, gap, options) => {
    const spots = biosSpots(w, h, gap, options);
    return spots.length ? pick(spots) : null;
  };

  // Un bug que cruza la pantalla en unos 2–3 s (con movimiento reducido, aparece quieto un
  // momento). En la BIOS, solo por un hueco libre; si no hay ninguno, esta vez no sale.
  const crossBug = () => {
    if (!anomaly.bios) {
      releaseBug(0, {
        ctx: anomaly,
        type: reduceMotion ? 'stay' : 'walk',
        speed: document.documentElement.clientWidth / random(2.6, 3.4),
        life: 2.5,
      });
      return;
    }
    const size = pick([16, 22]);
    if (reduceMotion) {
      const at = biosSpot(size, size * 1.2, 4);
      if (at) {
        releaseBug(0, { ctx: anomaly, type: 'stay', size, at, life: 2.5 });
      }
      return;
    }
    const path = biosPath(size);
    if (path) {
      const [[x0, y0], [x1, y1]] = path;
      releaseBug(0, { ctx: anomaly, type: 'walk', size, path, speed: Math.hypot(x1 - x0, y1 - y0) / random(2.2, 3) });
    }
  };

  // "WARNING: UNKNOWN PROCESS" unos segundos: en el portfolio, en una esquina; en la BIOS, en
  // un hueco libre (abajo a la izquierda si cabe).
  const warn = () => {
    const line = document.createElement('p');
    line.className = 'anomaly-warning';
    line.setAttribute('role', 'status');
    line.append(tint('WARNING:', 'hl'), ' UNKNOWN PROCESS');
    anomaly.layer.append(line);
    if (anomaly.bios) {
      const w = document.documentElement.clientWidth;
      const h = window.innerHeight;
      const lw = line.offsetWidth;
      const lh = line.offsetHeight;
      const obstacles = biosObstacles();
      const corners = [[16, h - lh - 16], [w - lw - 16, h - lh - 16], [16, 16], [w - lw - 16, 16]];
      const spot = corners.find(([x, y]) => isFree(obstacles, x, y, lw, lh, 4)) || biosSpot(lw, lh, 4) || [8, 8];
      line.style.left = `${spot[0]}px`;
      line.style.top = `${spot[1]}px`;
      line.style.bottom = 'auto';
    }
    anomalyLater(() => line.remove(), 4500);
  };

  // Lo que se puede pulsar o usar en la página (enlaces, botones, campos...).
  const PRESSABLE = 'a, button, input, textarea, select, label, [tabindex]:not([tabindex="-1"])';

  // Sitio para que se pare el bug que se puede pulsar en el portfolio: dentro de la pantalla,
  // por debajo del menú y sin nada pulsable debajo (enlaces, botones, campos).
  const findSpot = (w, h, size) => {
    let spot = null;
    for (let i = 0; i < 25; i += 1) {
      spot = [random(0.08 * w, 0.92 * w - size), random(Math.max(96, 0.3 * h), 0.85 * h - size)];
      const [x, y] = spot;
      const covered = [[0, 0], [size, 0], [0, size], [size, size], [size / 2, size / 2]].some(([dx, dy]) => (
        document.elementFromPoint(x + dx, y + dy)?.closest(PRESSABLE)));
      if (!covered) {
        break;
      }
    }
    return spot;
  };

  const closePanel = () => {
    anomaly?.panel?.remove();
    if (anomaly) {
      anomaly.panel = null;
    }
  };

  // Panel de sistema junto al bug: la única forma de entrar a DEBUG desde aquí.
  const buildPanel = () => {
    const panel = document.createElement('div');
    panel.className = 'anomaly-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Unknown process');
    panel.lang = 'en';
    const line = (...parts) => {
      const p = document.createElement('p');
      p.append(...parts);
      panel.append(p);
    };
    line(tint('UNKNOWN PROCESS FOUND', 'hl'));
    line('DEBUG MODE AVAILABLE');
    const investigate = document.createElement('button');
    investigate.type = 'button';
    investigate.className = 'boot-cmd';
    investigate.textContent = '[ INVESTIGATE ]';
    // Al salir del modo debug, el foco vuelve al "?" de la BIOS (el bug ya no estará).
    investigate.addEventListener('click', (event) => {
      openDebugGame(anomaly?.bios ? document.querySelector('[data-boot-anomaly]') : null, event.detail === 0);
    });
    panel.append(investigate);
    return panel;
  };

  // Tamaño del panel en la BIOS (se mide fuera de la vista y se quita).
  const panelSize = (inner) => {
    const probe = buildPanel();
    probe.style.visibility = 'hidden';
    inner.append(probe);
    const size = [probe.offsetWidth, probe.offsetHeight];
    probe.remove();
    return size;
  };

  const openPanel = (bugEl, byKeyboard) => {
    if (anomaly.panel) {
      return;
    }
    const panel = buildPanel();
    const investigate = panel.querySelector('button');
    anomaly.panel = panel;

    const r = bugEl.getBoundingClientRect();
    if (anomaly.bios) {
      // En la BIOS va justo después del bug y se coloca en un hueco libre a su alrededor
      // (debajo, encima, a la derecha o a la izquierda), dentro de su contenido.
      bugEl.after(panel);
      const inner = document.querySelector('.boot-screen__inner').getBoundingClientRect();
      const pw = panel.offsetWidth;
      const ph = panel.offsetHeight;
      const clampX = (x) => Math.min(Math.max(inner.left, x), inner.right - pw);
      const clampY = (y) => Math.min(Math.max(8, y), window.innerHeight - ph - 8);
      const options = [
        [r.left + r.width / 2 - pw / 2, r.bottom + 8],
        [r.left + r.width / 2 - pw / 2, r.top - ph - 8],
        [r.right + 8, r.top + r.height / 2 - ph / 2],
        [r.left - pw - 8, r.top + r.height / 2 - ph / 2],
      ].map(([x, y]) => [clampX(x), clampY(y)]);
      // Junto al bug sin tapar nada; si no cabe, junto al bug tapando solo texto del arranque
      // (nunca INTRO/P/S/C, la consola ni el "?"); si tampoco, en otro hueco que se vea.
      const all = biosObstacles(panel);
      const controls = biosObstacles(panel, true);
      const [x, y] = options.find(([px, py]) => isFree(all, px, py, pw, ph, 4))
        || options.find(([px, py]) => isFree(controls, px, py, pw, ph, 4))
        || biosSpot(pw, ph, 4, { skip: panel })
        || biosSpot(pw, ph, 4, { skip: panel, controlsOnly: true })
        || options[0];
      panel.style.left = `${x - inner.left}px`;
      panel.style.top = `${y - inner.top}px`;
    } else {
      // Debajo del bug (o encima, si no cabe), sin salirse de la pantalla.
      anomaly.layer.append(panel);
      const w = document.documentElement.clientWidth;
      const pw = panel.offsetWidth;
      const ph = panel.offsetHeight;
      const top = r.bottom + 8 + ph < window.innerHeight - 8 ? r.bottom + 8 : Math.max(8, r.top - 8 - ph);
      panel.style.left = `${Math.min(Math.max(8, r.left + r.width / 2 - pw / 2), w - pw - 8)}px`;
      panel.style.top = `${top}px`;
    }
    if (byKeyboard) {
      investigate.focus({ preventScroll: true });
    }
  };

  // El bug que se puede pulsar. Se queda ~8 s con aspecto de "activo" (esquinas de selección
  // que parpadean y brillo; al pasar por encima, enfocarlo o tocarlo, crece y brilla más).
  // - En el portfolio entra andando por el lado más cercano y se va por el mismo.
  // - En la BIOS aparece de un parpadeo en un hueco libre (dentro de ella, entre el "?" y el
  //   menú en el orden del documento) y se va con otro.
  // Con movimiento reducido aparece y se va sin moverse. Si se ignora o se cierra el panel,
  // el paso 3 queda hecho y se acaban las anomalías de esta visita.
  const processBug = () => {
    const size = 44;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'invasion__bug is-process';
    el.lang = 'en';
    el.setAttribute('aria-label', 'Unknown process');
    el.append(anomaly.template.querySelector('.invasion__body').cloneNode(true));
    el.style.setProperty('--s', `${size}px`);

    let spot;
    let side = 0;
    if (anomaly.bios) {
      const inner = document.querySelector('.boot-screen__inner');
      // Mejor un hueco con sitio para el panel justo debajo o encima sin tapar controles.
      const [pw, ph] = panelSize(inner);
      const box = inner.getBoundingClientRect();
      const controls = biosObstacles(null, true);
      const roomFor = ([x, y]) => {
        const px = Math.min(Math.max(box.left, x + size / 2 - pw / 2), box.right - pw);
        return [y + size + 8, y - ph - 8].some((py) => py >= 8 && py + ph <= window.innerHeight - 8
          && isFree(controls, px, py, pw, ph, 4));
      };
      const spots = biosSpots(size, size, 8);
      const roomy = spots.filter(roomFor);
      const found = (roomy.length && pick(roomy)) || (spots.length && pick(spots)) || biosSpot(size, size, 8, { soft: true });
      if (!found) {
        // Sin hueco (por ejemplo, en un móvil muy lleno): se intenta un poco después.
        anomalyLater(() => whenCalm(processBug), 2000);
        return;
      }
      spot = [found[0] - box.left, found[1] - box.top];
      el.classList.add('is-bios');
      if (!reduceMotion) {
        el.classList.add('is-arriving');
      }
      inner.querySelector('.boot-screen__menu').before(el);
    } else {
      const w = document.documentElement.clientWidth;
      spot = findSpot(w, window.innerHeight, size);
      side = spot[0] < w / 2 ? -size : w;
      anomaly.layer.append(el);
    }
    anomaly.process = el;
    let leaving = false;

    const walk = (from, to, name) => {
      el.style.setProperty('--x0', `${from[0]}px`);
      el.style.setProperty('--y0', `${from[1]}px`);
      el.style.setProperty('--x1', `${to[0]}px`);
      el.style.setProperty('--y1', `${to[1]}px`);
      el.style.setProperty('--t', `${Math.hypot(to[0] - from[0], to[1] - from[1]) / 240}s`);
      el.style.setProperty('--r', `${Math.round((Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI) + 90}deg`);
      el.style.animationName = name;
    };
    const nextRun = () => (el.style.animationName === 'invasionRunA' ? 'invasionRunB' : 'invasionRunA');

    // Se va: paso 3 hecho y fin de las anomalías. Si tenía el foco, pasa al "?" de la BIOS.
    const leave = () => {
      if (!anomaly || anomaly.panel || leaving) {
        return;
      }
      leaving = true;
      saveState('3');
      const hadFocus = el.contains(document.activeElement);
      const done = () => {
        stopAnomalies();
        if (hadFocus) {
          document.querySelector('[data-boot-anomaly]')?.focus({ preventScroll: true });
        }
      };
      if (reduceMotion) {
        done();
      } else if (anomaly.bios) {
        el.classList.add('is-zapped');
        anomalyLater(done, 350);
      } else {
        walk(spot, [side, spot[1]], nextRun());
        anomalyLater(done, (Math.abs(spot[0] - side) / 240) * 1000 + 50);
      }
    };

    let walkIn = 0;
    if (reduceMotion || anomaly.bios) {
      el.style.setProperty('--x0', `${spot[0]}px`);
      el.style.setProperty('--y0', `${spot[1]}px`);
      el.style.setProperty('--r', '0deg');
      if (reduceMotion) {
        el.style.animation = 'none';
      }
    } else {
      walk([side, spot[1]], spot, 'invasionRunA');
      walkIn = (Math.abs(spot[0] - side) / 240) * 1000;
    }
    el.addEventListener('click', (event) => openPanel(el, event.detail === 0));
    anomalyLater(leave, walkIn + PROCESS_TIME);

    // En el portfolio el bug está fijo en la pantalla y el contenido pasa por debajo al hacer
    // scroll: si le queda debajo algo que se puede pulsar (un enlace, un campo...), se aparta a
    // otro hueco para no quitarle el clic. (En la BIOS va dentro del contenido y no hace falta.)
    if (!anomaly.bios) {
      let moving = !reduceMotion;
      let checking = false;
      anomalyLater(() => { moving = false; }, walkIn);
      const blocking = () => {
        const r = el.getBoundingClientRect();
        return [[0.5, 0.5], [0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]].some(([fx, fy]) => document
          .elementsFromPoint(r.left + r.width * fx, r.top + r.height * fy)
          .find((node) => !node.closest('.invasion'))?.closest(PRESSABLE));
      };
      const moveAway = () => {
        const next = findSpot(document.documentElement.clientWidth, window.innerHeight, size);
        if (reduceMotion) {
          el.style.setProperty('--x0', `${next[0]}px`);
          el.style.setProperty('--y0', `${next[1]}px`);
        } else {
          moving = true;
          walk(spot, next, nextRun());
          anomalyLater(() => { moving = false; }, (Math.hypot(next[0] - spot[0], next[1] - spot[1]) / 240) * 1000);
        }
        spot = next;
      };
      anomaly.onScroll = () => {
        if (checking || leaving || moving || anomaly?.panel) {
          return;
        }
        checking = true;
        anomalyLater(() => {
          checking = false;
          if (!leaving && !moving && !anomaly?.panel && blocking()) {
            moveAway();
          }
        }, 150);
      };
      window.addEventListener('scroll', anomaly.onScroll, { passive: true });
    }

    // Escape o pulsar fuera cierra el panel, y entonces el bug se va.
    anomaly.onKey = (event) => {
      if (event.key === 'Escape' && anomaly?.panel) {
        closePanel();
        el.focus({ preventScroll: true });
        leave();
      }
    };
    anomaly.onOutside = (event) => {
      if (anomaly?.panel && !anomaly.panel.contains(event.target) && !el.contains(event.target)) {
        closePanel();
        leave();
      }
    };
    document.addEventListener('keydown', anomaly.onKey);
    document.addEventListener('pointerdown', anomaly.onOutside, true);
  };

  const ANOMALIES = [
    () => {
      saveState('1');
      crossBug();
    },
    () => {
      saveState('2');
      crossBug();
      if (Math.random() < 0.5) {
        anomalyLater(crossBug, 700);
      }
      anomalyLater(warn, 2600);
    },
    () => processBug(),
  ];

  const nextAnomaly = (step, delay) => {
    anomalyLater(() => whenCalm(() => {
      ANOMALIES[step]();
      if (step + 1 < ANOMALIES.length) {
        nextAnomaly(step + 1, random(...(anomaly.bios ? BIOS_GAP : WEB_GAP)));
      }
    }), delay);
  };

  // Empieza (o sigue, desde el paso guardado) la secuencia: en la BIOS si está delante y, si
  // no, en el portfolio. Al salir de la BIOS se para la suya y sigue en el portfolio.
  const startAnomalies = () => {
    const state = readState();
    const done = Number(state) || 0;
    if (!BUG_PATH || anomaly || state === 'descubierto' || done >= ANOMALIES.length) {
      return;
    }
    const bios = root.classList.contains('boot') && !!document.querySelector('.boot-screen__inner');
    const { layer, swarm, template } = buildLayer();
    layer.classList.add('is-anomaly');
    anomaly = {
      bios, layer, swarm, template, escaped: 0, timers: new Set(),
      process: null, panel: null, onKey: null, onOutside: null, onLeaveBios: null, onScroll: null,
    };
    let delay = random(...WEB_GAP);
    if (bios) {
      anomaly.onLeaveBios = () => {
        stopAnomalies();
        startAnomalies();
      };
      document.addEventListener('inicio:fin', anomaly.onLeaveBios);
      // El menú de la BIOS aparece a los 1,95 s del arranque (sin animaciones, ya).
      delay = (reduceMotion ? 0 : 1950) + random(...BIOS_FIRST);
    }
    nextAnomaly(done, delay);
  };

  startAnomalies();
});
