// Secreto del portfolio (easter egg):
// el código Konami (↑ ↑ ↓ ↓ ← → ← → B A) en el teclado, o 5 toques seguidos en el
// logo </> Laura.dev en móvil, abren una caja de diálogo estilo RPG de 16 bits.
// Pista: en el footer están las teclas del código, que se encienden al acertarlas y que en
// el móvil se pueden tocar en orden.
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const dialog = document.getElementById('rpg');
  const box = dialog?.querySelector('.rpg__box');
  const text = dialog?.querySelector('.rpg__text');

  if (!dialog || !box || !text) {
    return;
  }

  const message = '¡Has encontrado un secreto! Si has llegado hasta aquí, seguro que nos entendemos. ¿Hablamos de tu próxima web?';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let typing = null;
  let lastFocus = null;

  const open = () => {
    // No se abre mientras está la pantalla de inicio BIOS o el modo DEBUG (quedaría debajo,
    // sin verse) ni si ya está abierto.
    if (!dialog.hidden || root.classList.contains('boot') || root.classList.contains('debug-open')) {
      return;
    }

    lastFocus = document.activeElement;
    dialog.hidden = false;
    dialog.classList.remove('is-done');
    box.focus();

    if (reduceMotion) {
      text.textContent = message;
      dialog.classList.add('is-done');
      return;
    }

    // Texto que se escribe letra a letra, como en los RPG.
    let i = 0;
    text.textContent = '';
    window.clearInterval(typing);
    typing = window.setInterval(() => {
      i += 1;
      text.textContent = message.slice(0, i);
      if (i >= message.length) {
        window.clearInterval(typing);
        dialog.classList.add('is-done');
      }
    }, 28);
  };

  const close = () => {
    window.clearInterval(typing);
    dialog.hidden = true;
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true });
    }
  };

  dialog.querySelectorAll('[data-rpg-close]').forEach((el) => el.addEventListener('click', close));

  // Código Konami
  const code = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let position = 0;

  // Pista en el footer: las teclas del código se encienden según se aciertan y se apagan al
  // fallar. Al completarlo se quedan todas encendidas un momento.
  const hintKeys = [...document.querySelectorAll('[data-konami] [data-key]')];
  let hintTimer = null;
  const showProgress = () => hintKeys.forEach((el, i) => el.classList.toggle('is-lit', i < position));

  // Cada tecla (del teclado o tocada en el footer) avanza el código o lo reinicia.
  const feed = (key) => {
    position = key === code[position] ? position + 1 : (key === code[0] ? 1 : 0);
    window.clearTimeout(hintTimer);

    if (position === code.length) {
      position = 0;
      hintKeys.forEach((el) => el.classList.add('is-lit'));
      hintTimer = window.setTimeout(showProgress, 1200);
      open();
      return;
    }
    showProgress();
  };

  // En móvil (o con el ratón), tocar las teclas del footer en orden también vale.
  hintKeys.forEach((el) => el.addEventListener('click', () => feed(el.dataset.key)));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog.hidden) {
      close();
      return;
    }

    // No cuenta lo que se escribe en el formulario.
    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
      return;
    }

    feed(event.key.toLowerCase());
  });

  // En móvil: 5 toques rápidos seguidos (menos de 0,7 s entre uno y otro) en el logo del menú
  // (el icono </> o el nombre). Un toque suelto es un enlace normal al inicio; dentro de una
  // serie rápida, los toques extra no vuelven a navegar, para que la página no salte con cada uno.
  const brand = document.querySelector('.nav-header .nav-brand');
  let taps = 0;
  let lastTap = 0;

  brand?.addEventListener('click', (event) => {
    const now = performance.now();
    taps = now - lastTap < 700 ? taps + 1 : 1;
    lastTap = now;
    if (taps > 1) {
      event.preventDefault();
    }

    if (taps >= 5) {
      taps = 0;
      open();
    }
  });
});
