// Formulario de contacto con FormSubmit (https://formsubmit.co).
// Funciona en GitHub Pages: no necesita servidor ni PHP.
//
// ACTIVACIÓN (solo una vez): envía un mensaje de prueba desde la web publicada.
// FormSubmit mandará un correo a laura.ordonez.dev@gmail.com con el botón "Activate Form".
// Tras activarlo, FormSubmit te da una dirección aleatoria para no mostrar tu correo:
// sustituye FORM_ENDPOINT por https://formsubmit.co/ajax/TU_CODIGO_ALEATORIO
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/laura.ordonez.dev@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');

  if (!form || !window.fetch) {
    return; // Sin JavaScript el formulario se envía de forma normal (action del <form>).
  }

  const button = form.querySelector('button[type="submit"]');
  const buttonText = form.querySelector('.contact-form__submit-text');
  const status = form.querySelector('.contact-form__status');

  const checkIcon = '<svg class="status-check" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M7.5 12.5l3 3 6-6.5"></path></svg>';

  const setStatus = (message, type) => {
    status.textContent = message;
    if (type === 'success' && message) {
      status.insertAdjacentHTML('afterbegin', checkIcon);
    }
    status.classList.toggle('is-success', type === 'success');
    status.classList.toggle('is-error', type === 'error');
  };

  const setSending = (sending) => {
    button.disabled = sending;
    buttonText.textContent = sending ? 'Enviando…' : 'Enviar mensaje';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Si un bot rellena el campo oculto, se descarta en silencio.
    if (form.elements._honey && form.elements._honey.value) {
      return;
    }

    setSending(true);
    setStatus('', null);

    const data = Object.fromEntries(new FormData(form).entries());
    delete data._honey;

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || String(result.success) !== 'true') {
        const error = new Error(result.message || `Error ${response.status}`);
        error.pending = /activat/i.test(result.message || '');
        throw error;
      }

      form.reset();
      setStatus('Mensaje enviado. Te responderé lo antes posible.', 'success');
    } catch (error) {
      console.warn('Formulario de contacto:', error.message);

      if (error.pending) {
        // Solo pasa hasta que se pulsa "Activate Form" en el correo de FormSubmit.
        setStatus('El formulario está pendiente de activación. Mientras tanto, escríbeme a laura.ordonez.dev@gmail.com.', 'error');
      } else {
        setStatus('No se ha podido enviar. Inténtalo de nuevo o escríbeme a laura.ordonez.dev@gmail.com.', 'error');
      }
    } finally {
      setSending(false);
    }
  });
});
