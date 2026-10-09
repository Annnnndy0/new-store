/* Preguntas frecuentes: acordeón.

   - Cada pregunta es un botón (aria-expanded) que abre o cierra su respuesta; solo hay una
     abierta a la vez. La animación (alto del panel, borde irisado, + que gira a ×, párrafos en
     cascada) está en styles.css: aquí solo se cambian las clases.
   - Los paneles cerrados quedan fuera del tabulador y del lector de pantalla (inert).
   - Sin JS no se pliega nada: .faq.is-ready activa el plegado.
   - Entrada al llegar con el scroll, con el mismo lenguaje que el resto de secciones. */
(() => {
  'use strict';

  const section = document.querySelector('.faq');
  const list = section && section.querySelector('[data-faq]');
  if (!list) return;

  const items = [...list.querySelectorAll('.faq__item')];
  const head = section.querySelector('.faq__head');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const EASE_MASK = 'cubic-bezier(0.2, 0.9, 0.1, 1)';
  const MASK = [{ translate: '0 110%' }, { translate: '0 0' }];
  const POP = [{ opacity: 0, scale: 0.9, translate: '0 10px' }, { opacity: 1, scale: 1, translate: '0 0' }];
  const RISE = [{ opacity: 0, translate: '0 14px', filter: 'blur(6px)' }, { opacity: 1, translate: '0 0', filter: 'blur(0px)' }];

  /* ---------- abrir y cerrar ---------- */

  function set(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq__btn').setAttribute('aria-expanded', String(open));
    item.querySelector('.faq__panel').inert = !open;
  }

  for (const item of items) {
    // Orden de cada párrafo, para que entren en cascada al abrir
    item.querySelectorAll('.faq__body p').forEach((p, i) => p.style.setProperty('--i', i));
    set(item, item.classList.contains('is-open'));
  }
  section.classList.add('is-ready');

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq__btn');
    if (!btn) return;
    const item = btn.closest('.faq__item');
    const open = !item.classList.contains('is-open');
    for (const other of items) if (other !== item && other.classList.contains('is-open')) set(other, false);
    set(item, open);
  });

  /* ---------- entrada al llegar con el scroll ---------- */

  function enter(el, keyframes, duration, delay, easing = EASE_OUT) {
    if (!el) return null;
    return el.animate(keyframes, { duration, delay, easing, fill: 'backwards' });
  }

  // Cada palabra del título en una máscara para revelarla de abajo arriba (conserva <em>)
  function splitWords(el) {
    for (const child of [...el.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        splitWords(child);
        continue;
      }
      if (child.nodeType !== Node.TEXT_NODE) continue;
      const frag = document.createDocumentFragment();
      for (const part of child.textContent.split(/([ \t\n\r\f]+)/)) {
        if (!part) continue;
        if (/^[ \t\n\r\f]+$/.test(part)) {
          frag.append(' ');
          continue;
        }
        const w = document.createElement('span');
        const i = document.createElement('span');
        w.className = 'w';
        i.className = 'w__i';
        i.textContent = part;
        w.append(i);
        frag.append(w);
      }
      child.replaceWith(frag);
    }
  }

  splitWords(section.querySelector('.faq__title'));

  function arrive() {
    enter(head.querySelector('.chip'), POP, 700, 0);
    head.querySelectorAll('.faq__title .w__i').forEach((w, i) => enter(w, MASK, 1150, 90 + i * 60, EASE_MASK));
    items.forEach((item, i) => enter(item, [
      { opacity: 0, transform: 'translateY(28px)', filter: 'blur(6px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' },
    ], 900, 300 + i * 70));
    enter(section.querySelector('.faq__all'), RISE, 800, 300 + items.length * 70 + 60);
    enter(section.querySelector('.faq__more'), RISE, 800, 300 + items.length * 70 + 120);
    section.classList.remove('is-armed');
  }

  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    section.classList.add('is-armed');
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      arrive();
    }, { rootMargin: '0px 0px -18% 0px' });
    io.observe(head);
    io.observe(list);
  }
})();
