/* Comparador: por ahora solo visual. Aquí solo se anima la entrada al llegar con el scroll, con
   el mismo lenguaje que Guías: chip, título palabra a palabra desde una máscara, la tabla y el
   selector que suben desenfocados, los productos que se asientan girando y las filas y preguntas
   en cascada. "Añadir" y "Ver recomendación" todavía no hacen nada y las opciones del selector
   son radios normales (se marcan solo con CSS). */
(() => {
  'use strict';

  const section = document.querySelector('.compare');
  if (!section) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const EASE_MASK = 'cubic-bezier(0.2, 0.9, 0.1, 1)';

  const RISE = [{ opacity: 0, translate: '0 14px', filter: 'blur(6px)' }, { opacity: 1, translate: '0 0', filter: 'blur(0px)' }];
  const MASK = [{ translate: '0 110%' }, { translate: '0 0' }];
  const POP = [{ opacity: 0, scale: 0.9, translate: '0 10px' }, { opacity: 1, scale: 1, translate: '0 0' }];
  const CARD = [
    { opacity: 0, transform: 'translateY(48px) scale(0.97)', filter: 'blur(8px)' },
    { opacity: 1, transform: 'none', filter: 'blur(0px)' },
  ];

  // Animación de entrada de un elemento: oculto hasta su turno, sin residuos al terminar
  function enter(el, keyframes, duration, delay, easing = EASE_OUT) {
    if (!el) return null;
    return el.animate(keyframes, { duration, delay, easing, fill: 'backwards' });
  }

  // Cada palabra en una máscara para revelarla de abajo arriba (conserva <em> y espacios)
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

  const head = section.querySelector('.compare__head');
  splitWords(section.querySelector('.compare__title'));

  function arrive() {
    section.classList.remove('is-armed');

    enter(head.querySelector('.chip'), POP, 700, 0);
    head.querySelectorAll('.compare__title .w__i').forEach((w, i) => enter(w, MASK, 1150, 90 + i * 60, EASE_MASK));
    enter(head.querySelector('.compare__lede'), RISE, 1000, 420);

    enter(section.querySelector('.compare__card'), CARD, 1150, 240);
    enter(section.querySelector('.quiz'), CARD, 1150, 360);

    // Los productos llegan girados y se asientan en su inclinación de reposo
    section.querySelectorAll('.pcol__pic img').forEach((img, i) => enter(img, [
      { opacity: 0, translate: '0 22px', rotate: '-38deg', scale: 0.82 },
      { opacity: 1, translate: '0 0', rotate: '-16deg', scale: 1 },
    ], 1200, 420 + i * 90));
    section.querySelectorAll('.pcol__name').forEach((name, i) => enter(name, RISE, 800, 520 + i * 90));

    // Filas de la tabla: celda a celda, de arriba abajo
    section.querySelectorAll('.compare__table tbody tr').forEach((tr, row) => {
      [...tr.children].forEach((cell, col) => enter(cell, [
        { opacity: 0, translate: '0 10px' },
        { opacity: 1, translate: '0 0' },
      ], 750, 560 + row * 70 + col * 25));
    });

    // Selector: cada pregunta, sus opciones en cascada, el botón y el aviso
    section.querySelectorAll('.quiz__q').forEach((q, i) => {
      enter(q.querySelector('legend'), RISE, 800, 560 + i * 120);
      q.querySelectorAll('.opt').forEach((opt, j) => enter(opt, POP, 700, 620 + i * 120 + j * 45));
    });
    enter(section.querySelector('.quiz__go'), POP, 800, 960);
    enter(section.querySelector('.quiz__legal'), RISE, 800, 1040);
  }

  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    section.classList.add('is-armed');
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      arrive();
    }, { rootMargin: '0px 0px -18% 0px' });
    io.observe(head);
    io.observe(section.querySelector('.compare__layout'));
  }
})();
