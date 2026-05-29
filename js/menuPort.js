document.addEventListener('DOMContentLoaded', () => {
  const navHeader = document.querySelector('.nav-header');
  const navBrand = document.querySelector('.nav-brand');
  const toggleBtn = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-links a');
  const toggleIcon = toggleBtn?.querySelector('i');

  if (!navHeader || !toggleBtn || !navLinks || !links.length) {
    return;
  }

  const setMenuState = (isOpen) => {
    navLinks.classList.toggle('active', isOpen);
    navHeader.classList.toggle('nav-open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    toggleBtn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');

    if (toggleIcon) {
      toggleIcon.classList.toggle('fa-bars', !isOpen);
      toggleIcon.classList.toggle('fa-xmark', isOpen);
    }
  };

  const closeMenu = () => setMenuState(false);

  const updateHeaderState = () => {
    navHeader.classList.toggle('is-scrolled', window.scrollY > 20);
  };

  const scrollToTarget = (target) => {
    const headerOffset = navHeader.offsetHeight + 12;
    const targetPosition = target.id === 'inicio'
      ? 0
      : target.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({
      top: Math.max(targetPosition, 0),
      behavior: 'smooth',
    });
  };

  toggleBtn.addEventListener('click', () => {
    setMenuState(!navLinks.classList.contains('active'));
  });

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      const target = targetId?.startsWith('#') ? document.querySelector(targetId) : null;

      if (target) {
        event.preventDefault();
        scrollToTarget(target);
        history.pushState(null, '', targetId);
      }

      closeMenu();
    });
  });

  navBrand?.addEventListener('click', (event) => {
    const target = document.getElementById('inicio');

    if (target) {
      event.preventDefault();
      scrollToTarget(target);
      history.pushState(null, '', '#inicio');
      closeMenu();
    }
  });

  document.addEventListener('click', (event) => {
    const clickInsideNavbar = event.target.closest('.navbar');

    if (!clickInsideNavbar && navLinks.classList.contains('active')) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('active')) {
      closeMenu();
      toggleBtn.focus();
    }
  });

  const setActiveLink = (sectionId) => {
    const normalizedId = sectionId === 'proyectos-academicos' ? 'proyectos-personales' : sectionId;

    links.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${normalizedId}`;
      link.classList.toggle('active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const observedSections = ['sobre-mi', 'experiencia', 'proyectos-personales', 'proyectos-academicos', 'contacto']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && observedSections.length) {
    const activeObserver = new IntersectionObserver((entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visibleEntry) {
        setActiveLink(visibleEntry.target.id);
      }
    }, {
      rootMargin: '-35% 0px -50% 0px',
      threshold: [0.1, 0.25, 0.5],
    });

    observedSections.forEach((section) => activeObserver.observe(section));
  }

  window.addEventListener('scroll', updateHeaderState, { passive: true });
  updateHeaderState();
});
