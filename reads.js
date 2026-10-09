/* Guías: 1 tarjeta desplegada y 5 compactas que solo muestran texto (la pregunta y un resumen;
   la respuesta completa aparece al desplegarse). La desplegada vive en su
   propio hueco de la rejilla (.reads__stage), donde se queda fija al hacer scroll si las
   compactas son más altas que la ventana.

   Al pulsar una compacta, se despliega en el sitio de la grande y la grande se recoge en su hueco:
   1. Se mide dónde está cada tarjeta (y la imagen de la desplegada) antes del cambio.
   2. Se crean fantasmas de las dos que se cruzan: el marco blanco, la imagen y una copia del
      texto. Las reales se ocultan. Si en vez de imagen hay un lienzo animado ([data-live], el
      cerebro de constellation.js), el fantasma se lleva el propio lienzo, que sigue animándose,
      y lo devuelve a su tarjeta al terminar.
   3. Se cambia el DOM (la pulsada pasa a desplegada y la desplegada a su hueco) y se mide el
      destino.
   4. Los marcos viajan con un muelle. La imagen de la que se despliega nace en la cabecera de la
      compacta, crece hasta su sitio, se enfoca, respira y la cruza un destello; la de la que se
      recoge se encoge hacia la cabecera de su hueco y se disuelve (las compactas no llevan
      imagen). El texto viejo se disuelve.
   5. Casi al final, el texto nuevo entra por capas: etiqueta, pregunta palabra a palabra desde
      una máscara, respuesta, revisión y enlace. Al terminar, las tarjetas reales relevan a los
      fantasmas sin salto.

   SEO: preguntas, respuestas y enlaces están en el HTML desde el principio; aquí solo se anima.
   Sin JS, el título de cada tarjeta es un enlace que la cubre entera y lleva a su guía.

   También: entrada de la sección al llegar con el scroll y una luz que sigue al puntero. */
(() => {
  'use strict';

  const section = document.querySelector('.reads');
  const grid = section && section.querySelector('[data-reads]');
  if (!grid) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const EASE_MASK = 'cubic-bezier(0.2, 0.9, 0.1, 1)';
  const SHADOW = '0 0 0 1px rgb(13 13 13 / 0.045), 0 1px 2px rgb(13 13 13 / 0.04), 0 14px 34px -16px rgb(13 13 13 / 0.2)';
  const SHADOW_LIFT = '0 0 0 1px rgb(13 13 13 / 0.05), 0 6px 12px rgb(13 13 13 / 0.06), 0 44px 80px -28px rgb(13 13 13 / 0.38)';

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
    const n = 64;
    const pts = [0];
    for (let i = 1; i < n; i++) pts.push(+xs[Math.floor((i / n) * xs.length)].toFixed(4));
    pts.push(1);
    return { easing: `linear(${pts.join(', ')})`, duration: Math.round(t * 1000) };
  }

  const MORPH = CSS.supports('animation-timing-function', 'linear(0, 1)')
    ? spring(90, 16.5)
    : { easing: EASE_OUT, duration: 1000 };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const cards = () => [...grid.querySelectorAll('.read')];
  const all = grid.querySelector('.reads__all');

  // Animación de entrada de un elemento: oculto hasta su turno, sin residuos al terminar
  function enter(el, keyframes, duration, delay, easing = EASE_OUT) {
    if (!el) return null;
    return el.animate(keyframes, { duration, delay, easing, fill: 'backwards' });
  }

  const RISE = [{ opacity: 0, translate: '0 14px', filter: 'blur(6px)' }, { opacity: 1, translate: '0 0', filter: 'blur(0px)' }];
  const MASK = [{ translate: '0 110%' }, { translate: '0 0' }];
  const POP = [{ opacity: 0, scale: 0.9, translate: '0 8px' }, { opacity: 1, scale: 1, translate: '0 0' }];

  /* ---------- palabras ---------- */

  // Cada palabra en una máscara para revelarla de abajo arriba (conserva <em>, enlaces y espacios)
  function splitWords(el) {
    for (const child of [...el.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        splitWords(child);
        continue;
      }
      if (child.nodeType !== Node.TEXT_NODE) continue;
      const frag = document.createDocumentFragment();
      // Solo espacios normales: el de no separación (&nbsp;) mantiene unidas dos palabras
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

  /* ---------- preparación ---------- */

  // Cada compacta recibe un botón que la cubre y la despliega. Su enlace sale del orden de
  // tabulación (sigue en el HTML para los buscadores): con el teclado se despliega primero y
  // después se entra en la guía, igual que con el ratón.
  for (const card of cards()) {
    const title = card.querySelector('.read__title');
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'read__open';
    open.setAttribute('aria-label', `Desplegar la guía: ${title.textContent.trim()}`);
    card.append(open);
    splitWords(title);
  }

  function syncLinks() {
    for (const card of cards()) {
      const link = card.querySelector('.read__link');
      if (card.classList.contains('is-featured')) link.removeAttribute('tabindex');
      else link.tabIndex = -1;
    }
  }

  syncLinks();
  section.classList.add('is-ready');

  const head = section.querySelector('.reads__head');
  splitWords(section.querySelector('.reads__title'));

  // Las imágenes de las compactas no se pintan hasta que se despliegan: se precargan cuando la
  // sección se acerca, para que nazcan ya nítidas
  let preloaded = false;
  function preload() {
    if (preloaded) return;
    preloaded = true;
    for (const img of grid.querySelectorAll('.read:not(.is-featured) .read__pic img:not(.read__soft)')) {
      const pre = new Image();
      pre.decoding = 'async';
      pre.src = img.currentSrc || img.src;
    }
  }

  /* ---------- medidas y fantasmas ---------- */

  function rel(el, origin) {
    const r = el.getBoundingClientRect();
    return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
  }

  function measure(card, origin) {
    const m = { card: rel(card, origin) };
    if (card.classList.contains('is-featured')) m.media = rel(card.querySelector('.read__media'), origin);
    return m;
  }

  // Imagen plegada: en la cabecera de una compacta, con la proporción de la imagen desplegada
  // (así el recorte no cambia mientras crece o se encoge)
  function folded(card, media, pad) {
    const w = card.w - pad * 2;
    const h = Math.min(card.h - pad * 2, w * (media.h / media.w));
    return { x: card.x + pad, y: card.y + pad, w, h };
  }

  const box = (r) => ({ transform: `translate(${r.x}px, ${r.y}px)`, width: `${r.w}px`, height: `${r.h}px` });

  function place(el, r) {
    Object.assign(el.style, box(r));
  }

  function div(className) {
    const el = document.createElement('div');
    el.className = className;
    return el;
  }

  function makeGhost(card, rect) {
    const frame = div('fx-frame');
    place(frame, rect);

    const media = div('fx-media');
    const pic = div('fx-pic');
    const home = card.querySelector('.read__pic');
    const scale = parseFloat(getComputedStyle(home).scale) || 1;
    const live = home.querySelector('[data-live]');
    let restore = null;
    if (live) {
      // Lienzo animado (constellation.js): viaja dentro del fantasma sin dejar de moverse y
      // vuelve a su tarjeta al terminar
      pic.append(live);
      media.classList.add('fx-media--live');
      restore = () => home.append(live);
    } else {
      // Imagen nítida + copia desenfocada que funde el borde inferior
      const src = home.querySelector('img:not(.read__soft)');
      const position = getComputedStyle(src).objectPosition;
      const sharp = src.cloneNode();
      const soft = src.cloneNode();
      soft.className = 'fx-soft';
      soft.alt = '';
      for (const im of [sharp, soft]) {
        im.removeAttribute('loading');
        im.style.objectPosition = position;
      }
      pic.append(sharp, soft);
    }

    const fade = div('fx-fade');
    const sheen = div('fx-sheen');
    media.append(pic, fade, sheen);

    // La copia del texto se toma después de sacar el lienzo, para no duplicarlo
    const text = card.cloneNode(true);
    text.classList.add('fx-text');
    text.classList.remove('is-hidden');
    place(text, rect);

    return { frame, media, pic, scale, sheen, live, text, restore, nodes: [frame, media, text] };
  }

  function swapNodes(a, b) {
    const mark = document.createComment('');
    a.replaceWith(mark);
    b.replaceWith(a);
    mark.replaceWith(b);
  }

  /* ---------- texto nuevo ---------- */

  function revealText(card, featured) {
    const words = [...card.querySelectorAll('.read__title .w__i')];
    enter(card.querySelector('.read__top'), POP, 650, 0);
    if (featured) {
      words.forEach((w, i) => enter(w, MASK, 950, 70 + i * 34, EASE_MASK));
      enter(card.querySelector('.read__text'), RISE, 850, 240);
      enter(card.querySelector('.read__by'), RISE, 750, 380);
      enter(card.querySelector('.read__more'), POP, 800, 440);
    } else {
      words.forEach((w, i) => enter(w, MASK, 800, 40 + i * 24, EASE_MASK));
      enter(card.querySelector('.read__lede'), RISE, 700, 170);
      enter(card.querySelector('.read__by'), RISE, 650, 260);
      enter(card.querySelector('.read__go'), [
        { opacity: 0, scale: 0.6, rotate: '-45deg' },
        { opacity: 1, scale: 1, rotate: '0deg' },
      ], 700, 300);
    }
  }

  /* ---------- despliegue ---------- */

  let busy = false;

  function commit(card, featured) {
    swapNodes(card, featured);
    card.classList.add('is-featured');
    featured.classList.remove('is-featured');
    syncLinks();
  }

  // Si la desplegada queda casi entera por encima de la vista, el scroll la acompaña (se lleva a la
  // vista su hueco: la tarjeta es sticky y su posición depende del scroll)
  function follow(card, behavior) {
    const r = card.getBoundingClientRect();
    if (r.top < 0 && r.bottom < window.innerHeight * 0.6) {
      (card.closest('.reads__stage') || card).scrollIntoView({ behavior, block: 'start' });
    }
  }

  async function swap(card) {
    const featured = grid.querySelector('.read.is-featured');
    if (busy || !featured || card === featured) return;

    if (reduceMotion.matches) {
      commit(card, featured);
      follow(card, 'auto');
      card.querySelector('.read__title').focus({ preventScroll: true });
      return;
    }

    busy = true;
    const list = cards();
    const first = new Map(list.map((c) => [c, measure(c, grid.getBoundingClientRect())]));
    const pad = parseFloat(getComputedStyle(featured).paddingTop) || 0;

    // Fantasmas: primero la que se recoge, encima la que se despliega
    const out = makeGhost(featured, first.get(featured).card);
    const into = makeGhost(card, first.get(card).card);
    const layer = div('reads__fx');
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    layer.append(...out.nodes, ...into.nodes);

    grid.classList.add('is-swapping');
    featured.classList.add('is-hidden');
    card.classList.add('is-hidden');
    grid.append(layer);
    commit(card, featured);

    const origin = grid.getBoundingClientRect();
    const last = new Map(list.map((c) => [c, measure(c, origin)]));

    const fa = first.get(featured);
    const fb = last.get(featured);
    const ca = first.get(card);
    const cb = last.get(card);
    const outFrom = fa.media;
    const outTo = folded(fb.card, fa.media, pad);
    const inFrom = folded(ca.card, cb.media, pad);
    const inTo = cb.media;
    place(out.media, outFrom);
    place(into.media, inFrom);

    // El cerebro vuelve a armarse mientras su tarjeta se despliega
    if (into.live) into.live.dispatchEvent(new CustomEvent('constellation:replay'));

    follow(card, 'smooth');

    const { easing, duration } = MORPH;
    const ghostAnims = [];
    const ghost = (el, keyframes, options) => {
      const a = el.animate(keyframes, { fill: 'both', ...options });
      ghostAnims.push(a);
      return a;
    };

    // Marcos: los dos viajan con el muelle; la que sube se eleva a mitad de vuelo
    ghost(out.frame, [box(fa.card), box(fb.card)], { duration, easing });
    ghost(into.frame, [box(ca.card), box(cb.card)], { duration, easing, delay: 70 });
    ghost(into.frame, [{ boxShadow: SHADOW }, { boxShadow: SHADOW_LIFT, offset: 0.35 }, { boxShadow: SHADOW }], {
      duration, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', delay: 70,
    });

    // Imagen que se recoge: se encoge hacia la cabecera de su hueco y se disuelve pronto
    ghost(out.media, [box(outFrom), box(outTo)], { duration, easing });
    ghost(out.media, [
      { opacity: 1, filter: 'blur(0px)' },
      { opacity: 0, filter: 'blur(14px)' },
    ], { duration: duration * 0.42, easing: 'cubic-bezier(0.3, 0, 0.2, 1)' });
    ghost(out.pic, [{ scale: out.scale }, { scale: 1.08 }], { duration, easing });

    // Imagen que se despliega: nace en la cabecera de la compacta, crece, se enfoca y respira
    ghost(into.media, [box(inFrom), box(inTo)], { duration, easing, delay: 70 });
    ghost(into.media, [
      { opacity: 0, filter: 'blur(16px)' },
      { opacity: 1, filter: 'blur(4px)', offset: 0.45 },
      { opacity: 1, filter: 'blur(0px)' },
    ], { duration: duration * 0.8, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', delay: 90 });
    ghost(into.pic, [{ scale: 1.28 }, { scale: 1 }], {
      duration: duration * 1.2, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', delay: 70,
    });
    ghost(into.sheen, [{ translate: '-70% 0' }, { translate: '70% 0' }], {
      duration: duration * 0.9, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', delay: 260,
    });

    // Texto viejo: se disuelve en cuanto empieza el viaje
    for (const g of [out, into]) {
      ghost(g.text, [
        { opacity: 1, translate: '0 0', filter: 'blur(0px)' },
        { opacity: 0, translate: '0 -10px', filter: 'blur(10px)' },
      ], { duration: 300, easing: 'ease-out' });
    }

    // Las que no cambian: se desplazan si hace falta y respiran con el despliegue
    for (const c of [...list, all]) {
      if (!c || c === card || c === featured) continue;
      const a = c === all ? null : first.get(c).card;
      const b = c === all ? null : last.get(c).card;
      if (a && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 0.5) {
        c.animate([{ transform: `translate(${a.x - b.x}px, ${a.y - b.y}px)` }, { transform: 'none' }], { duration, easing });
      }
      c.animate([{ scale: 1 }, { scale: 0.975, offset: 0.3 }, { scale: 1 }], { duration: duration * 0.9, easing: 'ease-in-out', delay: 40 });
    }

    // Antes de que aterricen, el texto nuevo empieza a entrar sobre los fantasmas
    await wait(70 + duration * 0.6);
    for (const c of [card, featured]) {
      c.classList.remove('is-hidden');
      c.classList.add('is-revealing');
    }
    revealText(card, true);
    revealText(featured, false);

    await Promise.all(ghostAnims.map((a) => a.finished.catch(() => {})));

    // Relevo: las reales ya ocupan exactamente el sitio de los fantasmas (sin transición, para
    // que su sombra no se funda desde cero)
    for (const c of [card, featured]) {
      c.style.transition = 'none';
      c.classList.remove('is-revealing');
      void c.offsetWidth;
      c.style.transition = '';
    }
    for (const g of [out, into]) if (g.restore) g.restore();
    layer.remove();
    grid.classList.remove('is-swapping');
    card.querySelector('.read__title').focus({ preventScroll: true });
    busy = false;
  }

  grid.addEventListener('click', (e) => {
    const open = e.target.closest('.read__open');
    if (open) swap(open.closest('.read'));
  });

  /* ---------- luz que sigue al puntero ---------- */

  grid.addEventListener('pointermove', (e) => {
    const tile = e.target.closest('.read:not(.is-featured), .reads__all');
    if (!tile) return;
    const r = tile.getBoundingClientRect();
    tile.style.setProperty('--gx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    tile.style.setProperty('--gy', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  });

  grid.addEventListener('pointerover', preload, { once: true });

  /* ---------- entrada al llegar con el scroll ---------- */

  function arrive() {
    section.classList.remove('is-armed');
    enter(head.querySelector('.chip'), [{ opacity: 0, scale: 0.9, translate: '0 10px' }, { opacity: 1, scale: 1, translate: '0 0' }], 700, 0);
    head.querySelectorAll('.reads__title .w__i').forEach((w, i) => enter(w, MASK, 1150, 90 + i * 50, EASE_MASK));
    enter(head.querySelector('.reads__lede'), RISE, 1000, 420);

    // La desplegada primero; después las compactas en cascada y al final "Ver todas"
    const tiles = [...cards(), all].filter(Boolean);
    const anims = tiles.map((c, i) => enter(c, [
      { opacity: 0, transform: 'translateY(48px) scale(0.97)', filter: 'blur(8px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' },
    ], 1150, 240 + i * 85));
    const featured = grid.querySelector('.read.is-featured');
    enter(featured.querySelector('.read__pic'), [{ scale: 1.16 }, { scale: 1 }], 1900, 240);
    enter(featured.querySelector('.read__body'), RISE, 1000, 520);

    // Sin despliegues hasta que las tarjetas estén en su sitio
    busy = true;
    Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => { busy = false; });
  }

  if ('IntersectionObserver' in window) {
    // Precarga con margen, antes de que la sección se vea
    const near = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      near.disconnect();
      preload();
    }, { rootMargin: '600px 0px' });
    near.observe(grid);
  }

  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    section.classList.add('is-armed');
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      arrive();
    }, { rootMargin: '0px 0px -18% 0px' });
    io.observe(grid);
    io.observe(head);
  }
})();
