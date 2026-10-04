// Secreto del portfolio (easter egg):
// el código Konami (↑ ↑ ↓ ↓ ← → ← → B A) en el teclado, o 5 toques seguidos en el
// icono </> del logo en móvil, abren una caja de diálogo estilo RPG de 16 bits.
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
    // No se abre mientras está la pantalla de inicio BIOS ni si ya está abierto.
    if (!dialog.hidden || root.classList.contains('boot')) {
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

    const key = event.key.toLowerCase();
    position = key === code[position] ? position + 1 : (key === code[0] ? 1 : 0);

    if (position === code.length) {
      position = 0;
      open();
    }
  });

  // En móvil: 5 toques seguidos (en menos de 2,5 s) en el icono </> del logo del menú.
  const brand = document.querySelector('.nav-header .nav-brand');
  let taps = 0;
  let tapTimer = null;

  brand?.addEventListener('click', (event) => {
    if (!event.target.closest('i')) {
      return;
    }

    taps += 1;
    window.clearTimeout(tapTimer);
    tapTimer = window.setTimeout(() => { taps = 0; }, 2500);

    if (taps >= 5) {
      taps = 0;
      event.preventDefault();
      open();
    }
  });
});
