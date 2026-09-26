// Navegación: menú móvil, estado al hacer scroll y enlace activo según la sección visible.
document.addEventListener('DOMContentLoaded', () => {
  const navHeader = document.querySelector('.nav-header');
  const toggleBtn = document.querySelector('.menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const sectionLinks = document.querySelectorAll('.nav-list a');
  const toggleIcon = toggleBtn?.querySelector('i');

  if (!navHeader || !toggleBtn || !navLinks) {
    return;
  }

  const isOpen = () => navLinks.classList.contains('active');

  const setMenuState = (open) => {
    navLinks.classList.toggle('active', open);
    navHeader.classList.toggle('nav-open', open);
    document.body.classList.toggle('nav-open', open);
    toggleBtn.setAttribute('aria-expanded', String(open));
    toggleBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');

    if (toggleIcon) {
      toggleIcon.classList.toggle('fa-bars', !open);
      toggleIcon.classList.toggle('fa-xmark', open);
    }
  };

  const closeMenu = () => setMenuState(false);

  toggleBtn.addEventListener('click', () => setMenuState(!isOpen()));

  // Cualquier enlace del menú (secciones, CV o redes) cierra el panel.
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Clic fuera del menú.
  document.addEventListener('click', (event) => {
    if (isOpen() && !event.target.closest('.navbar')) {
      closeMenu();
    }
  });

  // Escape cierra y devuelve el foco al botón.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      closeMenu();
      toggleBtn.focus();
    }
  });

  // Si se pasa a escritorio con el menú abierto, se cierra.
  window.matchMedia('(min-width: 861px)').addEventListener('change', (event) => {
    if (event.matches) {
      closeMenu();
    }
  });

  // Fondo del header más opaco al hacer scroll.
  const updateHeaderState = () => {
    navHeader.classList.toggle('is-scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', updateHeaderState, { passive: true });
  updateHeaderState();

  // Enlace activo. "Tech Stack" no está en el menú, así que marca "Sobre mí".
  const aliases = { tecnologias: 'sobre-mi' };

  const setActiveLink = (sectionId) => {
    const id = aliases[sectionId] || sectionId;

    sectionLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', active);

      if (active) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const sections = ['inicio', 'sobre-mi', 'tecnologias', 'experiencia', 'proyectos', 'contacto']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => setActiveLink(entry.target.id));
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((section) => observer.observe(section));
  }
});
