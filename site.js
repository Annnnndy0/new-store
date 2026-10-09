/* Subpáginas: acordeones, índice lateral que marca la sección visible, galería de la ficha, barra
   de compra del móvil, filtros, buscador de preguntas y entrada al hacer scroll. La barra superior
   va en nav.js. Sin JS todo se ve y funciona como enlaces normales. */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Acordeones (mismo comportamiento que las FAQ del index) ---------- */

  function setItem(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq__btn').setAttribute('aria-expanded', String(open));
    item.querySelector('.faq__panel').inert = !open;
  }

  for (const acc of $$('[data-acc]')) {
    const items = $$('.faq__item', acc);
    for (const item of items) {
      $$('.faq__body p', item).forEach((p, i) => p.style.setProperty('--i', i));
      setItem(item, item.classList.contains('is-open'));
    }
    acc.classList.add('is-ready');
    acc.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq__btn');
      if (!btn) return;
      const item = btn.closest('.faq__item');
      const open = !item.classList.contains('is-open');
      for (const other of items) if (other !== item && other.classList.contains('is-open')) setItem(other, false);
      setItem(item, open);
    });
  }

  // Abre la pregunta o el tema al que apunta la dirección (#tema-envio…)
  function openFromHash() {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (!target) return;
    const item = target.closest('.faq__item') || target.querySelector('.faq__item');
    if (item && !item.classList.contains('is-open')) item.querySelector('.faq__btn').click();
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ---------- Índice lateral: marca la sección visible ---------- */

  for (const toc of $$('[data-toc]')) {
    const links = $$('a[href^="#"]', toc);
    const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
    if (!targets.length || !('IntersectionObserver' in window)) continue;
    const visible = new Set();
    const mark = () => {
      const current = targets.find((t) => visible.has(t)) || null;
      links.forEach((a) => {
        const on = current && a.hash.slice(1) === current.id;
        a.classList.toggle('is-on', !!on);
        if (on) {
          a.setAttribute('aria-current', 'true');
          // En la barra de pastillas (pantallas estrechas) la activa se queda a la vista
          if (toc.scrollWidth > toc.clientWidth) {
            toc.scrollTo({ left: a.offsetLeft - toc.clientWidth / 2 + a.offsetWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
          }
        } else a.removeAttribute('aria-current');
      });
    };
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) en.isIntersecting ? visible.add(en.target) : visible.delete(en.target);
      mark();
    }, { rootMargin: '-25% 0px -55% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- Galería de la ficha ---------- */

  for (const gal of $$('[data-gallery]')) {
    const img = gal.querySelector('[data-gallery-img]');
    const empty = gal.querySelector('[data-gallery-empty]');
    const emptyText = gal.querySelector('[data-gallery-empty-text]');
    const cap = gal.querySelector('[data-gallery-cap]');
    const thumbs = $$('.pdp__thumb', gal);
    gal.addEventListener('click', (e) => {
      const t = e.target.closest('.pdp__thumb');
      if (!t) return;
      thumbs.forEach((x) => {
        x.classList.toggle('is-on', x === t);
        x.setAttribute('aria-pressed', String(x === t));
      });
      cap.textContent = t.dataset.cap;
      if (t.dataset.empty) {
        img.hidden = true;
        empty.hidden = false;
        emptyText.textContent = t.dataset.empty;
      } else {
        empty.hidden = true;
        img.hidden = false;
        img.src = t.dataset.src;
        img.alt = t.dataset.alt;
      }
    });
  }

  /* ---------- Barra de compra del móvil: aparece al pasar la caja de compra ---------- */

  const buybar = document.querySelector('[data-buybar]');
  const buyBox = document.querySelector('.pdp__buy');
  if (buybar && buyBox && 'IntersectionObserver' in window) {
    buybar.hidden = false;
    const mobile = window.matchMedia('(max-width: 900px)');
    let past = false;
    const sync = () => {
      const on = past && mobile.matches;
      buybar.classList.toggle('is-shown', on);
      document.body.classList.toggle('has-buybar', on);
      buybar.inert = !on;
    };
    new IntersectionObserver(([en]) => {
      past = !en.isIntersecting && en.boundingClientRect.top < 0;
      sync();
    }).observe(buyBox);
    mobile.addEventListener('change', sync);
    sync();
  }

  /* ---------- Filtros por tema (guías y estudios) ---------- */

  for (const group of $$('[data-filter]')) {
    const list = group.parentElement.querySelector('[data-filter-list]');
    if (!list) continue;
    const buttons = $$('.filter', group);
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter');
      if (!btn) return;
      const value = btn.dataset.value;
      buttons.forEach((b) => {
        b.classList.toggle('is-on', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      for (const card of list.children) {
        const show = !value || card.dataset.topic === value;
        if (show && card.hidden) {
          card.hidden = false;
          if (!reduceMotion) card.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        } else if (!show) card.hidden = true;
      }
    });
  }

  /* ---------- Buscador de preguntas frecuentes ---------- */

  const search = document.querySelector('[data-faq-search]');
  if (search) {
    const groups = $$('[data-faq-group]');
    const none = document.querySelector('[data-faq-none]');
    const countEl = document.querySelector('[data-faq-count]');
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const run = () => {
      const words = norm(search.value.trim()).split(/\s+/).filter(Boolean);
      let total = 0;
      for (const g of groups) {
        g.classList.remove('is-armed');   // al buscar, los resultados se ven ya, sin esperar al scroll
        let n = 0;
        for (const item of $$('.faq__item', g)) {
          const hit = words.every((w) => norm(item.dataset.q || item.textContent).includes(w));
          item.hidden = !hit;
          if (hit) n += 1;
        }
        g.hidden = n === 0;
        total += n;
      }
      none.hidden = total > 0;
      countEl.textContent = words.length ? `${total} ${total === 1 ? 'resultado' : 'resultados'}` : '';
    };
    search.addEventListener('input', run);
  }

  /* ---------- Entrada al hacer scroll ---------- */

  const reveal = $$('.rv');
  if (reveal.length && !reduceMotion && 'IntersectionObserver' in window) {
    const below = reveal.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.92);
    // Escalonado entre hermanos que entran juntos
    below.forEach((el) => {
      const sibs = [...el.parentElement.children].filter((x) => x.classList.contains('rv'));
      el.style.setProperty('--d', String(Math.min(sibs.indexOf(el), 6)));
      el.classList.add('is-armed');
    });
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target;
        io.unobserve(el);
        el.classList.add('is-in');
        requestAnimationFrame(() => el.classList.remove('is-armed'));
        el.addEventListener('transitionend', function done(ev) {
          if (ev.target !== el || ev.propertyName !== 'opacity') return;
          el.classList.remove('is-in');
          el.style.removeProperty('--d');
          el.removeEventListener('transitionend', done);
        });
      }
    }, { rootMargin: '0px 0px -10% 0px' });
    below.forEach((el) => io.observe(el));
  }
})();
