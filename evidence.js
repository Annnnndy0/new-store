/* Estudios e información científica: entrada al hacer scroll. El encabezado, la barra del
   catálogo y las fichas suben y aparecen en cascada la primera vez que la sección asoma. Sin JS
   (o con movimiento reducido) todo se ve desde el principio. */
(() => {
  'use strict';

  const section = document.querySelector('.evid');
  if (!section || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const items = section.querySelectorAll('.evid__head > *, .evid__bar, .paper');
  items.forEach((el, i) => el.style.setProperty('--i', String(Math.min(i, 12))));

  // Si ya está a la vista al cargar, no se esconde
  if (section.getBoundingClientRect().top < window.innerHeight * 0.85) return;
  section.classList.add('is-armed');

  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    section.classList.add('is-in');
    requestAnimationFrame(() => section.classList.remove('is-armed'));
  }, { rootMargin: '0px 0px -15% 0px' });
  io.observe(section);
})();
