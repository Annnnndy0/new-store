/* Cómo funciona tu pedido: 4 tarjetas de paso con su objeto 3D asomando por arriba y, debajo,
   la banda de zonas de envío.

   - Entrada al llegar con el scroll, con el mismo lenguaje que el resto de secciones: encabezado
     por capas, tarjetas que suben en cascada y cada objeto que cae desde arriba y se asienta.
   - El objeto de la tarjeta bajo el puntero lo sigue un poco (se desplaza y gira hacia él) con las
     variables --mx y --my de styles.css; al salir vuelve a su sitio. Los objetos flotan despacio
     con una animación CSS (obj-float). */
(() => {
  'use strict';

  const section = document.querySelector('.order');
  if (!section) return;

  const head = section.querySelector('.order__head');
  const cards = [...section.querySelectorAll('.ostep')];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const EASE_MASK = 'cubic-bezier(0.2, 0.9, 0.1, 1)';
  const SPRING = 'cubic-bezier(0.34, 1.4, 0.5, 1)';

  const RISE = [{ opacity: 0, translate: '0 14px', filter: 'blur(6px)' }, { opacity: 1, translate: '0 0', filter: 'blur(0px)' }];
  const MASK = [{ translate: '0 110%' }, { translate: '0 0' }];
  const POP = [{ opacity: 0, scale: 0.9, translate: '0 10px' }, { opacity: 1, scale: 1, translate: '0 0' }];

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

  splitWords(section.querySelector('.order__title'));

  /* ---------- el objeto sigue al puntero ---------- */

  if (!reduceMotion.matches) {
    for (const card of cards) {
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        card.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--mx');
        card.style.removeProperty('--my');
      });
    }
  }

  /* ---------- entrada al llegar con el scroll ---------- */

  function arrive() {
    enter(head.querySelector('.chip'), POP, 700, 0);
    head.querySelectorAll('.order__title .w__i').forEach((w, i) => enter(w, MASK, 1150, 90 + i * 55, EASE_MASK));
    enter(head.querySelector('.order__lede'), RISE, 1000, 420);
    enter(head.querySelector('.order__proof'), RISE, 900, 520);
    head.querySelectorAll('.order__badges li').forEach((li, i) => enter(li, POP, 800, 580 + i * 80));

    cards.forEach((card, i) => {
      const delay = 420 + i * 120;
      enter(card, [
        { opacity: 0, transform: 'translateY(48px) scale(0.97)', filter: 'blur(8px)' },
        { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      ], 1150, delay);
      // El objeto cae desde arriba, girado, y se asienta con un pequeño rebote
      enter(card.querySelector('.ostep__obj'), [
        { opacity: 0, transform: 'translateY(-70px) rotate(-10deg) scale(0.86)' },
        { opacity: 1, transform: 'none' },
      ], 1300, delay + 260, SPRING);
      enter(card.querySelector('.ostep__title'), RISE, 850, delay + 360);
      enter(card.querySelector('.ostep__text'), RISE, 850, delay + 440);
    });

    // Zonas de envío: la banda sube tras las tarjetas y las fichas de país entran en cascada
    const ship = section.querySelector('.ship');
    if (ship) {
      enter(ship, [
        { opacity: 0, transform: 'translateY(40px)', filter: 'blur(8px)' },
        { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      ], 1100, 900);
      ship.querySelectorAll('.ship__intro > *, .ship__label').forEach((el, i) => enter(el, RISE, 800, 1050 + i * 70));
      ship.querySelectorAll('.ship__list li').forEach((li, i) => enter(li, POP, 600, 1250 + i * 28));
    }

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
    io.observe(section.querySelector('.order__grid'));
  }
})();
