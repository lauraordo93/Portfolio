// Proyectos y contacto:
// 1) Vídeos de YouTube ligeros: se muestra la miniatura y el iframe solo se carga al pulsar.
// 2) Botón para copiar el correo al portapapeles.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.video-lite').forEach((wrapper) => {
    const button = wrapper.querySelector('.video-lite__play');
    const videoId = wrapper.dataset.videoId;

    if (!button || !videoId) {
      return;
    }

    button.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
      iframe.title = wrapper.dataset.title || 'Demo del proyecto';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;

      wrapper.classList.add('is-playing');
      wrapper.replaceChildren(iframe);
      iframe.focus();
    });
  });

  const copyButton = document.querySelector('[data-copy]');
  const status = document.querySelector('[data-copy-status]');
  const label = copyButton?.querySelector('.email-box__copy-text');

  if (copyButton && navigator.clipboard) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyButton.dataset.copy);
        copyButton.classList.add('is-copied');
        if (label) label.textContent = 'Copiado';
        if (status) status.textContent = 'Correo copiado al portapapeles';

        window.setTimeout(() => {
          copyButton.classList.remove('is-copied');
          if (label) label.textContent = 'Copiar';
          if (status) status.textContent = '';
        }, 2000);
      } catch (error) {
        window.location.href = `mailto:${copyButton.dataset.copy}`;
      }
    });
  } else if (copyButton) {
    // Sin API de portapapeles (p. ej. HTTP sin seguridad), el botón no aporta nada.
    copyButton.hidden = true;
  }
});
