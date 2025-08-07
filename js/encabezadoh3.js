const subtitulo = document.querySelector('.typewriter-subtitulo');

subtitulo.addEventListener('animationend', (e) => {
  if (e.animationName === 'typing-subtitulo') {
    subtitulo.style.borderRight = 'none';
  }
});