/* Barra superior de todo el sitio (la genera _src/layout.mjs; el index la recibe de build.mjs).

   - Menús (Tienda, Aprende, Ayuda): en escritorio se abren al pasar el puntero, con un pequeño
     retardo para que cruzar la barra no los dispare; un clic con el ratón en el nombre lleva a la
     página de la sección y, con el teclado, abre o cierra el menú. Esc, un clic fuera o salir con
     el foco los cierran. Una píldora blanca se desliza bajo el menú señalado.
   - Móvil: el botón abre una hoja con los menús en acordeón y bloquea el scroll de detrás.
   - Al bajar, la barra se aparta; al subir, vuelve. Nunca se aparta con un menú abierto o con el
     foco dentro. En el index espera fuera hasta dejar atrás la portada (que ya tiene logo y carrito).
   - Una línea en el borde de abajo marca cuánto llevas de página. */
(() => {
  'use strict';

  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  const root = document.documentElement;
  const bar = nav.querySelector('.nav__bar');
  const items = [...nav.querySelectorAll('[data-nav-item]')];
  const burger = nav.querySelector('.nav__burger');
  const glide = nav.querySelector('.nav__glide');
  const desktop = window.matchMedia('(min-width: 901px)');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const stage = nav.hasAttribute('data-nav-home') ? document.querySelector('.stage') : null;
  const btnOf = (item) => item.querySelector('.nav__link');

  let openItem = null;
  let timer = 0;

  /* ---------- Menús ---------- */

  function setItem(item, open) {
    item.classList.toggle('is-open', open);
    btnOf(item).setAttribute('aria-expanded', String(open));
  }

  function openMenu(item) {
    clearTimeout(timer);
    if (openItem && openItem !== item) setItem(openItem, false);
    openItem = item;
    setItem(item, true);
    rest();
    sync();
  }

  function closeMenu() {
    clearTimeout(timer);
    if (openItem) setItem(openItem, false);
    openItem = null;
    rest();
    sync();
  }

  // Píldora bajo el menú abierto o, si no hay ninguno, bajo la sección actual
  function glideTo(btn) {
    if (!glide) return;
    if (!btn || !desktop.matches) { glide.style.opacity = '0'; return; }
    const x = btn.getBoundingClientRect().left - bar.getBoundingClientRect().left;
    glide.style.setProperty('--gx', `${x}px`);
    glide.style.width = `${btn.offsetWidth}px`;
    glide.style.opacity = '1';
  }

  const rest = () => glideTo(openItem ? btnOf(openItem) : null);

  for (const item of items) {
    const btn = btnOf(item);

    item.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !desktop.matches) return;
      clearTimeout(timer);
      glideTo(btn);
      // Si ya hay uno abierto se cambia al instante; si no, se espera un poco
      timer = setTimeout(() => openMenu(item), openItem ? 0 : 110);
    });

    item.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || !desktop.matches) return;
      clearTimeout(timer);
      timer = setTimeout(closeMenu, 240);
    });

    btn.addEventListener('click', (e) => {
      // Clic con el ratón en escritorio: a la página de la sección (el menú ya se abre al pasar)
      if (desktop.matches && hover.matches && e.detail > 0 && btn.dataset.href) {
        location.href = btn.dataset.href;
        return;
      }
      if (openItem === item) closeMenu();
      else openMenu(item);
    });
  }

  // Al salir del todo de la lista, la píldora vuelve a su sitio
  nav.querySelector('.nav__list')?.addEventListener('pointerleave', () => { if (!openItem) rest(); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (openItem) {
      const btn = btnOf(openItem);
      closeMenu();
      btn.focus();
    } else if (nav.classList.contains('is-open')) {
      setSheet(false);
      burger.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (nav.contains(e.target)) return;
    if (openItem && desktop.matches) closeMenu();
    if (nav.classList.contains('is-open')) setSheet(false);
  });

  nav.addEventListener('focusout', (e) => {
    if (desktop.matches && openItem && !nav.contains(e.relatedTarget)) closeMenu();
  });

  // Elegir un enlace cierra lo abierto (también los anclas del index, que no cambian de página)
  nav.addEventListener('click', (e) => {
    if (!e.target.closest('a')) return;
    closeMenu();
    setSheet(false);
  });

  /* ---------- Hoja del móvil ---------- */

  function setSheet(open) {
    if (!burger) return;
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Menú');
    root.classList.toggle('nav-lock', open);
    if (!open && !desktop.matches) closeMenu();
    sync();
  }

  burger?.addEventListener('click', () => setSheet(!nav.classList.contains('is-open')));

  desktop.addEventListener('change', () => {
    setSheet(false);
    closeMenu();
  });

  /* ---------- Apartarse al bajar, volver al subir ---------- */

  let lastY = window.scrollY;
  let hidden = false;
  let parked = !!stage;

  function sync() {
    // Solo el foco de teclado la retiene: tras un toque, el foco se queda en el botón y no debe impedir que se aparte
    const busy = openItem || nav.classList.contains('is-open') || nav.querySelector(':focus-visible');
    if (busy) hidden = false;
    nav.classList.toggle('is-hidden', hidden && !parked);
    nav.classList.toggle('is-parked', parked);
    nav.inert = parked;
    root.classList.toggle('nav-off', hidden || parked);
  }

  function onScroll() {
    const y = Math.max(0, window.scrollY);
    const dy = y - lastY;

    if (stage) parked = stage.getBoundingClientRect().bottom > bar.offsetHeight * 1.5;

    if (Math.abs(dy) > 6) {
      // Un menú de escritorio abierto se cierra si se baja de verdad
      if (openItem && desktop.matches && Math.abs(dy) > 40) closeMenu();
      hidden = y > 140 && dy > 0;
      lastY = y;
    } else if (y < 10) {
      hidden = false;
    }
    sync();

    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : '0');
  }

  // El evento ya llega a ritmo de fotograma y el trabajo es mínimo: se atiende directamente
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { rest(); onScroll(); });

  // Con el teclado, la barra vuelve si el foco entra en ella
  nav.addEventListener('focusin', () => {
    if (!nav.querySelector(':focus-visible')) return;
    hidden = false;
    sync();
  });

  nav.classList.add('is-ready');
  onScroll();
})();
