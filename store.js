/* Tienda (prototipo) y formularios.

   - Carrito en este navegador (localStorage "lab-cart"): [{ id, qty }]. Precios y envío salen de
     catalog.js (lo genera build.mjs a partir de _src/data.mjs).
   - Cualquier botón con data-add="p1" añade ese producto; dentro de una caja [data-buy] usa la
     cantidad de su selector. Con data-then="checkout" va directo a finalizar el pedido.
   - Contador del dock ([data-cart-count]), aviso de "añadido", página del carrito, checkout,
     confirmación y consulta del pedido (los pedidos se guardan en "lab-orders").
   - Nada se envía a ningún servidor: es un prototipo hasta conectar la plataforma de la tienda.
     De cada pedido solo se guardan el email (para consultarlo), el nombre, la ciudad, el país y
     los productos; nunca el teléfono ni la dirección. */
(() => {
  'use strict';

  const C = window.CATALOG;
  if (!C) return;

  const ROOT = document.body.dataset.root || '';
  const CART = 'lab-cart';
  const ORDERS = 'lab-orders';
  const MAX = 10;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  const money = (cents) => fmt.format(cents / 100);
  const cents = (n) => Math.round(n * 100);
  const url = (path) => ROOT + path;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const longDate = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const shortDate = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  function load(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* sin almacenamiento (modo privado): el carrito dura lo que dure la página */
    }
  }

  /* ---------- Carrito ---------- */

  const valid = (list) => (Array.isArray(list) ? list : [])
    .filter((it) => it && C.products[it.id] && Number.isInteger(it.qty) && it.qty > 0)
    .map((it) => ({ id: it.id, qty: Math.min(MAX, it.qty) }));

  let cart = valid(load(CART, []));

  function commit(next) {
    cart = next;
    save(CART, cart);
    render();
  }

  function add(id, qty = 1) {
    const next = cart.map((it) => ({ ...it }));
    const line = next.find((it) => it.id === id);
    if (line) line.qty = Math.min(MAX, line.qty + qty);
    else next.push({ id, qty: Math.min(MAX, qty) });
    commit(next);
  }

  const setQty = (id, qty) => commit(cart.map((it) => (it.id === id ? { ...it, qty: Math.max(1, Math.min(MAX, qty)) } : it)));
  const remove = (id) => commit(cart.filter((it) => it.id !== id));
  const count = (list = cart) => list.reduce((n, it) => n + it.qty, 0);

  function totals(list = cart) {
    const sub = list.reduce((s, it) => s + cents(C.products[it.id].price) * it.qty, 0);
    const freeFrom = cents(C.shipping.freeFrom);
    const free = sub >= freeFrom;
    const ship = sub === 0 || free ? 0 : cents(C.shipping.cost);
    return { sub, ship, free, total: sub + ship, missing: Math.max(0, freeFrom - sub) };
  }

  // Otra pestaña cambió el carrito
  window.addEventListener('storage', (e) => {
    if (e.key !== CART) return;
    cart = valid(load(CART, []));
    render();
  });

  /* ---------- Piezas que se pintan ---------- */

  function fillTotals(scope, t) {
    scope.querySelectorAll('[data-t-sub]').forEach((el) => { el.textContent = money(t.sub); });
    scope.querySelectorAll('[data-t-ship]').forEach((el) => { el.textContent = t.ship ? money(t.ship) : 'Gratis'; });
    scope.querySelectorAll('[data-t-total]').forEach((el) => { el.textContent = money(t.total); });
  }

  function fillMeter(scope, t) {
    scope.querySelectorAll('[data-meter]').forEach((m) => {
      const text = m.querySelector('[data-meter-text]');
      const bar = m.querySelector('[data-meter-bar]');
      const p = t.free ? 1 : t.sub / cents(C.shipping.freeFrom);
      m.classList.toggle('is-free', t.free);
      bar.style.setProperty('--p', String(Math.min(1, p)));
      text.innerHTML = t.free
        ? '<strong>Tu envío es gratis.</strong>'
        : `Te faltan <strong>${money(t.missing)}</strong> para el envío gratis.`;
    });
  }

  const totalsHTML = (t) => `
    <dl class="totals">
      <div><dt>Productos</dt><dd>${money(t.sub)}</dd></div>
      <div><dt>Envío</dt><dd>${t.ship ? money(t.ship) : 'Gratis'}</dd></div>
      <div class="totals__sum"><dt>Total a pagar al recibirlo</dt><dd>${money(t.total)}</dd></div>
    </dl>`;

  const itemsHTML = (list) => `<ul class="sitems">${list.map((it) => {
    const p = C.products[it.id];
    return `
      <li class="sitem">
        <span class="sitem__pic"><img src="${url(p.img)}" alt="" width="1244" height="2294"><span class="sitem__q">${it.qty}</span></span>
        <div><p class="sitem__name">${esc(p.name)}</p><p class="sitem__meta">${money(cents(p.price))} / unidad</p></div>
        <p class="sitem__total">${money(cents(p.price) * it.qty)}</p>
      </li>`;
  }).join('')}</ul>`;

  /* ---------- Contador del dock ---------- */

  let lastCount = count();

  function renderBadges() {
    const n = count();
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = n > 99 ? '99+' : String(n);
      el.hidden = n === 0;
      if (n > lastCount && !reduceMotion) {
        el.classList.remove('is-bump');
        void el.offsetWidth;
        el.classList.add('is-bump');
      }
    });
    document.querySelectorAll('.dock__btn[href$="carrito/"]').forEach((a) => {
      a.setAttribute('aria-label', n ? `Carrito: ${plural(n, 'producto', 'productos')}` : 'Carrito vacío');
    });
    lastCount = n;
  }

  /* ---------- Aviso de "añadido" ---------- */

  let live;
  function announce(text) {
    if (!live) {
      live = document.createElement('p');
      live.className = 'sr-only';
      live.setAttribute('aria-live', 'polite');
      document.body.append(live);
    }
    live.textContent = '';
    setTimeout(() => { live.textContent = text; }, 60);
  }

  let toastEl;
  let toastTimer;
  function toast(id, qty) {
    const p = C.products[id];
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.innerHTML = `
        <span class="toast__pic"><img alt="" width="1244" height="2294"></span>
        <div><p class="toast__k"><i class="ph ph-check-circle" aria-hidden="true"></i>Añadido al pedido</p><p class="toast__name"></p></div>
        <button class="toast__close" type="button" aria-label="Cerrar aviso"><i class="ph ph-x" aria-hidden="true"></i></button>
        <div class="toast__actions">
          <a class="toast__cart" href="${url('carrito/')}">Ver carrito</a>
          <a class="toast__go" href="${url('checkout/')}">Finalizar pedido</a>
        </div>`;
      document.body.append(toastEl);
      toastEl.querySelector('.toast__close').addEventListener('click', hideToast);
      toastEl.addEventListener('pointerenter', () => clearTimeout(toastTimer));
      toastEl.addEventListener('pointerleave', () => armToast());
      toastEl.addEventListener('focusin', () => clearTimeout(toastTimer));
      toastEl.addEventListener('focusout', () => armToast());
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideToast(); });
    }
    toastEl.querySelector('img').src = url(p.img);
    toastEl.querySelector('.toast__name').textContent = qty > 1 ? `${p.name} × ${qty}` : p.name;
    toastEl.classList.add('is-shown');
    armToast();
  }

  function armToast() {
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 5200);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    toastEl?.classList.remove('is-shown');
  }

  /* ---------- Botones "Añadir" ---------- */

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const id = btn.dataset.add;
    const p = C.products[id];
    if (!p) return;
    const box = btn.closest('[data-buy]');
    const qty = box ? Number(box.querySelector('[data-qty]')?.textContent) || 1 : 1;
    add(id, qty);

    if (btn.dataset.then === 'checkout') {
      location.href = url('checkout/');
      return;
    }

    // El botón confirma un momento ("Añadido") y vuelve a su texto
    const label = btn.querySelector('span:not([class])') || btn.querySelector('span');
    if (label && !btn.dataset.label) {
      btn.dataset.label = label.textContent;
      label.textContent = 'Añadido';
      setTimeout(() => { label.textContent = btn.dataset.label; delete btn.dataset.label; }, 1600);
    }

    announce(`${p.name} añadido al pedido. Llevas ${plural(count(), 'producto', 'productos')}.`);
    if (!document.querySelector('[data-cart]')) toast(id, qty);
  });

  /* ---------- Caja de compra de la ficha: cantidad y total de la línea ---------- */

  document.querySelectorAll('[data-buy]').forEach((box) => {
    const p = C.products[box.dataset.id];
    const out = box.querySelector('[data-qty]');
    const total = box.querySelector('[data-line-total]');
    if (!p || !out) return;
    const [dec, inc] = box.querySelectorAll('[data-step]');
    const sync = (q) => {
      out.textContent = String(q);
      if (total) total.textContent = money(cents(p.price) * q);
      if (dec) dec.disabled = q <= 1;
      if (inc) inc.disabled = q >= MAX;
    };
    box.addEventListener('click', (e) => {
      const step = e.target.closest('[data-step]');
      if (!step) return;
      sync(Math.max(1, Math.min(MAX, (Number(out.textContent) || 1) + Number(step.dataset.step))));
    });
    sync(1);
  });

  function renderFreeNotes() {
    const t = totals();
    document.querySelectorAll('[data-free-note]').forEach((el) => {
      el.innerHTML = t.free
        ? '<strong>Tu pedido ya tiene envío gratis.</strong>'
        : t.sub
          ? `Envío gratis a partir de ${money(cents(C.shipping.freeFrom))}: te faltan <strong>${money(t.missing)}</strong>.`
          : `Envío gratis a partir de ${money(cents(C.shipping.freeFrom))}.`;
    });
  }

  /* ---------- Página del carrito ---------- */

  const cartWrap = document.querySelector('[data-cart]');

  function cartRow(id) {
    const p = C.products[id];
    const li = document.createElement('li');
    li.className = 'citem';
    li.dataset.id = id;
    li.innerHTML = `
      <a class="citem__pic" href="${url(p.url)}" tabindex="-1" aria-hidden="true"><img src="${url(p.img)}" alt="" width="1244" height="2294"></a>
      <div class="citem__info">
        <a class="citem__name" href="${url(p.url)}">${esc(p.name)}</a>
        <p class="citem__meta">${money(cents(p.price))} / unidad</p>
      </div>
      <div class="qty qty--sm" role="group" aria-label="Cantidad de ${esc(p.name)}">
        <button type="button" data-row-step="-1" aria-label="Quitar una unidad"><i class="ph ph-minus" aria-hidden="true"></i></button>
        <output data-row-qty aria-live="polite"></output>
        <button type="button" data-row-step="1" aria-label="Añadir una unidad"><i class="ph ph-plus" aria-hidden="true"></i></button>
      </div>
      <p class="citem__total" data-row-total></p>
      <button class="citem__del" type="button" data-row-del aria-label="Quitar ${esc(p.name)} del pedido"><i class="ph ph-trash" aria-hidden="true"></i></button>`;
    return li;
  }

  function renderCart() {
    if (!cartWrap) return;
    const list = cartWrap.querySelector('[data-cart-items]');
    const empty = cartWrap.querySelector('[data-cart-empty]');
    const aside = cartWrap.querySelector('[data-cart-summary]');
    const lines = cartWrap.querySelector('[data-cart-lines]');

    const rows = new Map([...list.children].map((li) => [li.dataset.id, li]));
    for (const it of cart) {
      let li = rows.get(it.id);
      if (!li) list.append(li = cartRow(it.id));
      rows.delete(it.id);
      li.querySelector('[data-row-qty]').textContent = String(it.qty);
      li.querySelector('[data-row-total]').textContent = money(cents(C.products[it.id].price) * it.qty);
      li.querySelector('[data-row-step="-1"]').disabled = it.qty <= 1;
      li.querySelector('[data-row-step="1"]').disabled = it.qty >= MAX;
    }
    rows.forEach((li) => li.remove());

    const has = cart.length > 0;
    list.hidden = !has;
    empty.hidden = has;
    aside.hidden = !has;
    lines.textContent = has ? plural(count(), 'producto', 'productos') : '';
    const t = totals();
    fillTotals(aside, t);
    fillMeter(aside, t);
  }

  cartWrap?.addEventListener('click', (e) => {
    const li = e.target.closest('.citem');
    if (!li) return;
    const it = cart.find((x) => x.id === li.dataset.id);
    if (!it) return;
    const step = e.target.closest('[data-row-step]');
    if (step) {
      setQty(it.id, it.qty + Number(step.dataset.rowStep));
      return;
    }
    if (e.target.closest('[data-row-del]')) {
      const name = C.products[it.id].name;
      const next = li.nextElementSibling?.querySelector('[data-row-del]') || li.previousElementSibling?.querySelector('[data-row-del]');
      const go = () => {
        remove(it.id);
        announce(`${name} quitado del pedido.`);
        (next || cartWrap.querySelector('[data-cart-empty] a'))?.focus();
      };
      if (reduceMotion) go();
      else {
        li.classList.add('is-leaving');
        setTimeout(go, 320);
      }
    }
  });

  /* ---------- Validación de formularios ---------- */

  const MESSAGES = {
    email: 'Escribe un email válido, como nombre@dominio.com.',
    phone: 'Escribe un teléfono válido, con el prefijo si es de otro país.',
    required: 'Este campo es obligatorio.',
  };

  function fieldError(el) {
    const v = el.value.trim();
    if (el.required && !v) return MESSAGES.required;
    if (v && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return MESSAGES.email;
    if (v && el.type === 'tel' && !/^\+?[\d\s().-]{6,20}$/.test(v)) return MESSAGES.phone;
    return '';
  }

  function showError(el, msg) {
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const err = el.id && document.getElementById(`${el.id}-err`);
    if (err) {
      err.textContent = msg;
      err.hidden = !msg;
    }
  }

  // Devuelve el primer campo con error (o null) y marca todos los que fallan
  function validate(form) {
    let first = null;
    form.querySelectorAll('input:not([type=checkbox]):not([type=radio]), textarea').forEach((el) => {
      const msg = fieldError(el);
      showError(el, msg);
      if (msg && !first) first = el;
    });
    const boxes = [...form.querySelectorAll('input[type=checkbox][required]')];
    const missing = boxes.filter((b) => !b.checked);
    boxes.forEach((b) => b.setAttribute('aria-invalid', b.checked ? 'false' : 'true'));
    const checksErr = form.querySelector('[data-checks-err]');
    if (checksErr) checksErr.hidden = missing.length === 0;
    return first || missing[0] || null;
  }

  // Al corregir un campo marcado, el error se va en cuanto vuelve a ser válido
  function liveValidation(form) {
    form.addEventListener('input', (e) => {
      const el = e.target;
      if (el.getAttribute('aria-invalid') === 'true' && el.type !== 'checkbox') showError(el, fieldError(el));
    });
    form.addEventListener('focusout', (e) => {
      const el = e.target;
      if (el.matches('input:not([type=checkbox]):not([type=radio]), textarea') && el.value.trim()) showError(el, fieldError(el));
    });
    form.addEventListener('change', (e) => {
      const el = e.target;
      if (el.type !== 'checkbox' || !el.required) return;
      el.setAttribute('aria-invalid', 'false');
      const checksErr = form.querySelector('[data-checks-err]');
      if (checksErr && [...form.querySelectorAll('input[type=checkbox][required]')].every((b) => b.checked)) checksErr.hidden = true;
    });
  }

  /* ---------- Checkout ---------- */

  const coForm = document.querySelector('[data-checkout]');

  function renderCheckout() {
    if (!coForm) return;
    const wrap = document.querySelector('[data-checkout-wrap]');
    const empty = document.querySelector('[data-checkout-empty]');
    const has = cart.length > 0;
    wrap.hidden = !has;
    empty.hidden = has;
    const aside = wrap.querySelector('.co__aside');
    aside.querySelector('[data-sum-items]').outerHTML = itemsHTML(cart).replace('<ul class="sitems">', '<ul class="sitems" data-sum-items>');
    const t = totals();
    fillTotals(aside, t);
    fillMeter(aside, t);
  }

  function newOrderId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return `BR-${[...bytes].map((b) => chars[b % chars.length]).join('')}`;
  }

  if (coForm) {
    const pickup = document.querySelector('[data-pickup-note]');
    const customs = document.querySelector('[data-customs-note]');
    const country = coForm.querySelector('[data-country]');
    const msg = coForm.querySelector('[data-co-msg]');
    const syncCountry = () => { customs.hidden = !C.outsideEU.includes(country.value); };
    syncCountry();
    liveValidation(coForm);

    coForm.addEventListener('change', (e) => {
      if (e.target.name === 'delivery') pickup.hidden = e.target.value === 'home';
      if (e.target === country) syncCountry();
    });

    coForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!cart.length) return;
      const bad = validate(coForm);
      if (bad) {
        msg.textContent = 'Revisa los campos marcados en rojo.';
        bad.focus();
        return;
      }
      msg.textContent = '';
      const data = new FormData(coForm);
      const order = {
        id: newOrderId(),
        date: new Date().toISOString(),
        items: cart.map((it) => ({ ...it })),
        totals: totals(),
        email: String(data.get('email')).trim().toLowerCase(),
        name: String(data.get('name')).trim(),
        city: String(data.get('city')).trim(),
        country: String(data.get('country')),
        delivery: String(data.get('delivery')),
      };
      save(ORDERS, [order, ...load(ORDERS, [])].slice(0, 20));
      cart = [];
      save(CART, cart);
      location.href = url('pedido-confirmado/');
    });
  }

  /* ---------- Pedido confirmado ---------- */

  const okCard = document.querySelector('[data-confirmed]');
  if (okCard) {
    const order = load(ORDERS, [])[0];
    if (!order || !Array.isArray(order.items)) {
      okCard.hidden = true;
      document.querySelector('[data-no-order]').hidden = false;
    } else {
      okCard.querySelector('[data-order-id]').textContent = order.id;
      okCard.querySelector('[data-order-line]').hidden = false;
      const sum = okCard.querySelector('[data-order-summary]');
      const items = valid(order.items);
      sum.innerHTML = `<p class="osum__head"><span>Resumen · ${plural(count(items), 'producto', 'productos')}</span><span>${longDate(order.date)}</span></p>${itemsHTML(items)}${totalsHTML(totals(items))}`;
      sum.hidden = false;
    }
  }

  /* ---------- Consultar mi pedido ---------- */

  const trackForm = document.querySelector('[data-track]');
  if (trackForm) {
    const result = document.querySelector('[data-track-result]');
    const list = document.querySelector('[data-orders]');
    const none = document.querySelector('[data-orders-empty]');
    const orders = load(ORDERS, []).filter((o) => o && o.id && Array.isArray(o.items));
    liveValidation(trackForm);

    list.innerHTML = orders.map((o) => {
      const items = valid(o.items);
      return `<li><button type="button" data-open-order="${esc(o.id)}">
        <span><span class="olist__id">${esc(o.id)}</span><span class="olist__meta">${shortDate(o.date)} · ${plural(count(items), 'producto', 'productos')} · ${money(totals(items).total)}</span></span>
        <i class="ph ph-arrow-right olist__go" aria-hidden="true"></i></button></li>`;
    }).join('');
    none.hidden = orders.length > 0;

    const show = (o) => {
      const items = valid(o.items);
      const place = { home: 'domicilio', point: 'punto de recogida', locker: 'casillero' }[o.delivery] || 'domicilio';
      result.innerHTML = `
        <article class="card ostatus" tabindex="-1" aria-labelledby="os-id">
          <header class="ostatus__head">
            <div><p class="chip chip--dot">Pedido recibido</p><p class="ostatus__id" id="os-id">${esc(o.id)}</p></div>
            <p class="ostatus__date">Hecho el ${longDate(o.date)} · entrega en ${place}${o.city ? `, ${esc(o.city)}` : ''}</p>
          </header>
          <ol class="tl" aria-label="Estado del pedido">
            <li class="is-done"><span class="tl__dot" aria-hidden="true"><i class="ph ph-check"></i></span><strong>Recibido</strong><span>${shortDate(o.date)}</span></li>
            <li class="is-now" aria-current="step"><span class="tl__dot" aria-hidden="true"></span><strong>Verificación</strong><span class="draft">Aquí cómo y cuándo se verifica</span></li>
            <li class="is-next"><span class="tl__dot" aria-hidden="true"></span><strong>Enviado</strong><span>3–7 días laborables</span></li>
            <li class="is-next"><span class="tl__dot" aria-hidden="true"></span><strong>Entregado y pagado</strong><span>Pagas al recibirlo</span></li>
          </ol>
          ${itemsHTML(items)}
          ${totalsHTML(totals(items))}
          <p class="note"><i class="ph-light ph-info" aria-hidden="true"></i><span>Prototipo: el estado real llegará del sistema de pedidos de la tienda.</span></p>
        </article>`;
      const card = result.querySelector('.ostatus');
      card.focus({ preventScroll: true });
      card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    };

    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-open-order]');
      const o = b && orders.find((x) => x.id === b.dataset.openOrder);
      if (o) show(o);
    });

    trackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = validate(trackForm);
      if (bad) {
        bad.focus();
        return;
      }
      const data = new FormData(trackForm);
      const id = String(data.get('id')).trim().toUpperCase().replace(/\s+/g, '');
      const email = String(data.get('email')).trim().toLowerCase();
      const o = orders.find((x) => x.id === id && x.email === email);
      if (o) show(o);
      else {
        result.innerHTML = `
          <div class="card empty empty--inline" tabindex="-1">
            <span class="empty__icon" aria-hidden="true"><i class="ph-light ph-magnifying-glass"></i></span>
            <p class="empty__title">No encontramos ese pedido</p>
            <p class="empty__text">Revisa el número (empieza por BR-) y el email con el que lo hiciste, o <a href="${url('contacto/')}">escríbenos</a>.</p>
          </div>`;
        result.firstElementChild.focus();
      }
    });
  }

  /* ---------- Contacto (prototipo: no envía nada) ---------- */

  const contact = document.querySelector('[data-contact]');
  if (contact) {
    const msg = contact.querySelector('[data-contact-msg]');
    liveValidation(contact);
    contact.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = validate(contact);
      if (bad) {
        msg.classList.remove('is-ok');
        msg.textContent = '';
        bad.focus();
        return;
      }
      msg.classList.add('is-ok');
      msg.innerHTML = '<i class="ph ph-check-circle" aria-hidden="true"></i><span>Mensaje listo. Prototipo: todavía no se envía a ningún sitio; <span class="draft">aquí irá el envío real del formulario</span>.</span>';
      contact.reset();
    });
  }

  /* ---------- Pintar todo ---------- */

  function render() {
    renderBadges();
    renderFreeNotes();
    renderCart();
    renderCheckout();
  }

  render();
})();
