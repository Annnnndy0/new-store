/* A quién va dirigido: carrusel de perfiles con las tarjetas apiladas.

   - Cada tarjeta tiene su sitio (data-pos): 0 delante, -1 y 1 detrás asomando a cada lado y "far"
     escondida detrás de la de delante (si hay más de 3). Los sitios y su aspecto están en CSS.
   - Al pasar, giran como un carrusel circular: se mide dónde está cada tarjeta, se cambian los
     sitios y cada una viaja de su forma de antes a la nueva con un muelle. La que da la vuelta de
     un lado al otro pasa por detrás, haciéndose pequeña a mitad de camino. La de delante y la que
     llega se cruzan: la nueva pasa al frente a mitad del giro, y su texto entra por capas. La
     profundidad de cada una (z-index) se anima con el giro, así que pasar rápido nunca desordena
     el mazo: al cancelar un giro a medias, cada tarjeta vuelve a la profundidad de su sitio.
   - Se mueve con las flechas, los puntos, el teclado (← →), arrastrando o pulsando una de detrás.
   - Las de detrás quedan fuera del lector de pantalla y del tabulador; un aviso lee el perfil
     nuevo. */
(() => {
  'use strict';

  const root = document.querySelector('[data-aud]');
  if (!root) return;

  const section = root.closest('.aud');
  const deck = root.querySelector('.aud__deck');
  const cards = [...deck.querySelectorAll('.acard')];
  const dots = [...root.querySelectorAll('.aud__dot')];
  const arrows = [...root.querySelectorAll('.aud__arrow')];
  const status = root.querySelector('[data-aud-status]');
  const n = cards.length;
  if (!n) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const EASE_MASK = 'cubic-bezier(0.2, 0.9, 0.1, 1)';

  // Muelle (masa 1) convertido en curva linear(): asentamiento natural, sin rebote exagerado
  function spring(stiffness, damping) {
    const dt = 1 / 240;
    let x = 0;
    let v = 0;
    let t = 0;
    const xs = [];
    while (t < 3) {
      v += (-stiffness * (x - 1) - damping * v) * dt;
      x += v * dt;
      t += dt;
      xs.push(x);
      if (Math.abs(1 - x) < 0.0008 && Math.abs(v) < 0.02) break;
    }
    const steps = 64;
    const pts = [0];
    for (let i = 1; i < steps; i++) pts.push(+xs[Math.floor((i / steps) * xs.length)].toFixed(4));
    pts.push(1);
    return { easing: `linear(${pts.join(', ')})`, duration: Math.round(t * 1000) };
  }

  const TURN = CSS.supports('animation-timing-function', 'linear(0, 1)')
    ? spring(110, 17)
    : { easing: EASE_OUT, duration: 900 };

  const RISE = [{ opacity: 0, translate: '0 14px', filter: 'blur(6px)' }, { opacity: 1, translate: '0 0', filter: 'blur(0px)' }];
  const MASK = [{ translate: '0 110%' }, { translate: '0 0' }];
  const POP = [{ opacity: 0, scale: 0.9, translate: '0 10px' }, { opacity: 1, scale: 1, translate: '0 0' }];

  // Animación de entrada de un elemento: oculto hasta su turno, sin residuos al terminar
  function enter(el, keyframes, duration, delay, easing = EASE_OUT, extra = {}) {
    if (!el) return null;
    try {
      return el.animate(keyframes, { duration, delay, easing, fill: 'backwards', ...extra });
    } catch {
      return null;
    }
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

  const head = section.querySelector('.aud__head');
  splitWords(section.querySelector('.aud__title'));

  /* ---------- sitios ---------- */

  let active = Math.max(0, cards.findIndex((c) => c.classList.contains('is-active')));

  // Distancia circular a la activa: 0, 1 (siguiente), -1 (anterior) o "far"
  function posOf(i) {
    let d = (((i - active) % n) + n) % n;
    if (d > n / 2) d -= n;
    if (d === 0 || d === 1 || d === -1) return String(d);
    return 'far';
  }

  function apply() {
    cards.forEach((card, i) => {
      const pos = posOf(i);
      const front = pos === '0';
      card.dataset.pos = pos;
      card.classList.toggle('is-active', front);
      if (front) card.removeAttribute('aria-hidden');
      else card.setAttribute('aria-hidden', 'true');
      const link = card.querySelector('.acard__link');
      if (front) link.removeAttribute('tabindex');
      else link.tabIndex = -1;
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === active);
      if (i === active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  apply();
  deck.classList.add('is-ready');

  /* ---------- giro ---------- */

  const look = (card) => {
    const cs = getComputedStyle(card);
    return { transform: cs.transform, opacity: cs.opacity, wash: getComputedStyle(card, '::after').opacity };
  };

  // El texto de la tarjeta que llega al frente entra por capas
  function reveal(card, delay) {
    card.querySelectorAll('.acard__title .w__i').forEach((w, i) => enter(w, MASK, 900, delay + i * 28, EASE_MASK));
    enter(card.querySelector('.acard__top'), RISE, 700, delay);
    enter(card.querySelector('.acard__text'), RISE, 800, delay + 120);
    enter(card.querySelector('.acard__link'), RISE, 750, delay + 200);
    card.querySelectorAll('.acard__stats > div').forEach((s, i) => enter(s, POP, 750, delay + 260 + i * 70));
    enter(card.querySelector('.acard__media img'), [{ scale: 1.14 }, { scale: 1 }], 1400, delay - 120);
  }

  for (const card of cards) splitWords(card.querySelector('.acard__title'));

  function go(to) {
    to = ((to % n) + n) % n;
    if (to === active) return;

    const from = active;
    const before = cards.map(look);
    const posBefore = cards.map((_, i) => posOf(i));
    // Giros a medias: se parte de donde estén ahora mismo
    for (const card of cards) for (const a of card.getAnimations()) if (!a.effect || a.effect.target === card) a.cancel();

    active = to;
    apply();
    status.textContent = `Perfil ${active + 1} de ${n}: ${cards[active].querySelector('.acard__title').textContent.trim()}`;
    if (reduceMotion.matches) return;

    const after = cards.map(look);
    const { easing, duration } = TURN;

    // La profundidad (z-index) va dentro de las animaciones: al terminar o al cancelarlas (pases
    // rápidos), cada tarjeta vuelve sola a la de su sitio y el mazo nunca queda desordenado
    const depth = (card, frames, time) => card.animate(frames, { duration: time, easing: 'linear' });

    cards.forEach((card, i) => {
      const a = before[i];
      const b = after[i];
      const p0 = posBefore[i];
      const p1 = posOf(i);
      if (p0 === 'far' && p1 === 'far') return;

      if ((p0 === '-1' && p1 === '1') || (p0 === '1' && p1 === '-1')) {
        // De un lado al otro (solo con 3 tarjetas): da la vuelta por detrás de la de delante
        const time = duration * 1.15;
        card.animate([
          { transform: a.transform, opacity: a.opacity },
          { transform: 'translateX(0) scale(0.7)', opacity: 0.4, offset: 0.5 },
          { transform: b.transform, opacity: b.opacity },
        ], { duration: time, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' });
        depth(card, [{ zIndex: 0 }, { zIndex: 0 }], time);
      } else {
        card.animate([
          { transform: a.transform, opacity: a.opacity },
          { transform: b.transform, opacity: b.opacity },
        ], { duration, easing });
        // Las que salen o entran por el fondo viajan siempre por detrás
        if (p0 === 'far' || p1 === 'far') depth(card, [{ zIndex: 0 }, { zIndex: 0 }], duration);
      }
      if (a.wash !== b.wash) {
        enter(card, [{ opacity: a.wash }, { opacity: b.wash }], duration * 0.6, 0, EASE_OUT, { pseudoElement: '::after' });
      }
    });

    // La que estaba delante sigue delante hasta que se cruza con la que llega
    if (posOf(from) !== '0') {
      depth(cards[from], [{ zIndex: 4 }, { zIndex: 4, offset: 0.3 }, { zIndex: 2, offset: 0.3 }, { zIndex: 2 }], duration);
    }

    reveal(cards[active], 180);
  }

  /* ---------- controles ---------- */

  for (const arrow of arrows) arrow.addEventListener('click', () => go(active + Number(arrow.dataset.step)));
  dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));

  // Arrastre horizontal (ratón o dedo): más de 48 px pasa de perfil
  let drag = null;
  let dragged = false;

  deck.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('.aud__arrow')) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    dragged = false;
  });

  deck.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!dragged && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(e.clientY - drag.y)) dragged = true;
  });

  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    drag = null;
    if (dragged && Math.abs(dx) > 48) go(active + (dx < 0 ? 1 : -1));
  };

  deck.addEventListener('pointerup', release);
  deck.addEventListener('pointercancel', () => { drag = null; });

  // Un clic en una de detrás la trae al frente (y un arrastre no cuenta como clic)
  deck.addEventListener('click', (e) => {
    if (dragged) {
      e.preventDefault();
      dragged = false;
      return;
    }
    const card = e.target.closest('.acard');
    if (!card || card.dataset.pos === '0') return;
    e.preventDefault();
    go(Number(card.dataset.index));
  });

  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    go(active + (e.key === 'ArrowRight' ? 1 : -1));
  });

  /* ---------- entrada al llegar con el scroll ---------- */

  function arrive() {
    enter(head.querySelector('.chip'), POP, 700, 0);
    head.querySelectorAll('.aud__title .w__i').forEach((w, i) => enter(w, MASK, 1150, 90 + i * 60, EASE_MASK));
    enter(head.querySelector('.aud__lede'), RISE, 1000, 420);
    head.querySelectorAll('.aud__specs li').forEach((li, i) => enter(li, POP, 750, 520 + i * 80));

    // La de delante sube; las de detrás salen de detrás de ella hacia su sitio
    const front = cards[active];
    enter(front, [
      { opacity: 0, transform: 'translateY(56px) scale(0.96)', filter: 'blur(8px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' },
    ], 1200, 300);
    enter(front.querySelector('.acard__media img'), [{ scale: 1.18 }, { scale: 1 }], 1800, 300);
    cards.forEach((card) => {
      if (card === front || card.dataset.pos === 'far') return;
      const to = getComputedStyle(card).transform;
      enter(card, [{ opacity: 0, transform: 'scale(0.8)' }, { opacity: 1, transform: to }], 1300, 820, TURN.easing);
    });

    arrows.forEach((arrow, i) => enter(arrow, [{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }], 800, 1100 + i * 80));
    enter(root.querySelector('.aud__dots'), RISE, 800, 1150);
    section.querySelectorAll('.aud__foot > *').forEach((el, i) => enter(el, i ? RISE : POP, 850, 1200 + i * 100));

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
    io.observe(deck);
  }
})();
