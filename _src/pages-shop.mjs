// Páginas de la tienda: catálogo, ficha de producto, carrito, checkout, confirmación y consulta
// del pedido. El carrito, el checkout y la consulta son un prototipo (store.js): guardan en este
// navegador y no envían nada a ningún servidor.
import { PRODUCTS, GUIDES, STUDIES, FAQ_GROUPS, COUNTRIES, SHIPPING, d } from './data.mjs';
import {
  money, esc, crumbs, phead, bhead, pill, ghost, tlink, chip, acc, toc, legalNote,
  productCard, guideCard, paperCard,
} from './layout.mjs';

const findQ = (q) => FAQ_GROUPS.flatMap((g) => g.items).find((it) => it.q === q);

// Las cuatro promesas de compra (textos del index: "Cómo funciona tu pedido" y "Zonas de envío")
const PLEDGES = (r) => [
  ['ph-hand-coins', 'Pagas al recibirlo', 'No pagas nada hasta que el pedido llega a tu puerta.'],
  ['ph-package', 'Envío discreto', 'Cartón neutro, sin marcas ni alusiones al contenido.'],
  ['ph-truck', SHIPPING.days, 'Con seguimiento, desde nuestro almacén en la UE.'],
  ['ph-arrow-u-up-left', '14 días para desistir', `<a href="${r('devoluciones/')}">Cómo devolver un pedido</a>`],
];

const pledgeList = (r, cls = '') => `
  <ul class="pledges ${cls}">${PLEDGES(r).map(([icon, t, s]) => `
    <li><i class="ph-light ${icon}" aria-hidden="true"></i><div><strong>${t}</strong><span>${s}</span></div></li>`).join('')}
  </ul>`;

/* ---------- Catálogo ---------- */

function productsHub() {
  return {
    path: 'productos/',
    title: 'Nuestros 4 productos',
    desc: 'Los 4 productos de la gama, con su precio con IVA incluido. Pagas al recibir el pedido y el envío es gratis a partir de 150 €.',
    main: (r) => `
${phead(r, {
  trail: [{ label: 'Tienda' }],
  kicker: 'Tienda',
  title: 'Nuestros 4 <em>productos</em>',
  lede: d('Aquí una línea que presente la gama y en qué se diferencian los cuatro productos.'),
  aside: `<div class="card phead__card">${pledgeList(r, 'pledges--compact')}</div>`,
})}
      <section class="panel" aria-labelledby="pgrid-title">
        <div class="wrap">
          <h2 class="sr-only" id="pgrid-title">Los 4 productos</h2>
          <div class="pgrid">${PRODUCTS.map((p) => productCard(r, p)).join('')}</div>
        </div>
      </section>

      <section class="panel" aria-label="Ayuda para elegir">
        <div class="wrap duo">
          <div class="band rv">
            <div>
              <p class="band__k"><i class="ph-light ph-scales" aria-hidden="true"></i>¿Dudas entre dos?</p>
              <h2 class="band__title">Compara los 4 productos <em>en una tabla</em></h2>
              <p class="band__text">Formato, contenido, uso según la ficha, duración del envase y precio, uno al lado del otro, y tres preguntas prácticas para ayudarte a elegir.</p>
            </div>
            ${pill(r('#comparar'), 'Ir al comparador')}
          </div>
          <div class="band band--ink rv">
            <div>
              <p class="band__k"><i class="ph-light ph-hand-coins" aria-hidden="true"></i>Sin pago por adelantado</p>
              <h2 class="band__title">Cómo funciona <em>tu pedido</em></h2>
              <p class="band__text">Eliges el producto, indicas la dirección, lo recibes en un embalaje discreto y pagas al recibirlo.</p>
            </div>
            ${pill(r('#pedido'), 'Ver los 4 pasos', 'ph-arrow-right', 'pill--light')}
          </div>
        </div>
      </section>`,
  };
}

/* ---------- Ficha de producto (la misma plantilla para los 4) ---------- */

function productPage(p) {
  const others = PRODUCTS.filter((x) => x.id !== p.id);
  const guides = [(p.n - 1) % 6, (p.n + 1) % 6, (p.n + 3) % 6].map((i) => GUIDES[i]);
  const studies = [p.n - 1, p.n % 5];
  const faq = ['¿Cuándo pago mi pedido?', '¿Cuánto tarda la entrega?', '¿Necesito receta?', '¿Puedo tomarlo con otros medicamentos?'].map(findQ);
  const shots = [
    { cap: 'Envase', icon: 'ph-package' },
    { cap: 'Etiqueta', icon: 'ph-tag', empty: 'Aquí la foto de la etiqueta' },
    { cap: 'Prospecto', icon: 'ph-file-text', empty: 'Aquí la foto del prospecto' },
    { cap: 'En uso', icon: 'ph-hand', empty: 'Aquí una foto del producto en uso' },
  ];
  const sections = [
    ['descripcion', 'Descripción'],
    ['composicion', 'Composición'],
    ['uso', 'Modo de uso'],
    ['advertencias', 'Advertencias'],
    ['conservacion', 'Conservación'],
    ['ficha', 'Ficha técnica'],
    ['estudios', 'Estudios'],
    ['preguntas', 'Preguntas'],
  ];
  const kv = (rows) => `<dl class="kv">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

  return {
    path: `productos/${p.slug}/`,
    title: p.name,
    desc: `${p.name}: precio con IVA incluido, composición, modo de uso, advertencias y ficha técnica. Pagas al recibir el pedido y el envío es gratis a partir de 150 €.`,
    bodyClass: 'is-pdp',
    ld: {
      '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.id,
      offers: { '@type': 'Offer', price: p.price.toFixed(2), priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
    },
    main: (r) => `
      <!-- Compra -->
      <section class="panel pdp" aria-labelledby="pdp-title">
        <div class="wrap">
          ${crumbs(r, [{ label: 'Tienda', href: r('productos/') }, { label: p.name }])}
          <div class="pdp__grid">

            <div class="pdp__gallery" data-gallery>
              <figure class="pdp__stage">
                <img class="pdp__img" data-gallery-img src="${r(p.img)}" width="1244" height="2294" alt="Envase de ${p.name}" fetchpriority="high">
                <div class="pdp__empty" data-gallery-empty hidden><i class="ph-light ph-image" aria-hidden="true"></i><span class="draft" data-gallery-empty-text></span></div>
                <figcaption class="pdp__fig"><span data-gallery-cap>Fig. 01 · Envase</span></figcaption>
                <span class="pdp__badge"><i class="ph ph-hand-coins" aria-hidden="true"></i>Pagas al recibirlo</span>
              </figure>
              <ul class="pdp__thumbs" aria-label="Fotos del producto">${shots.map((s, i) => `
                <li><button class="pdp__thumb${i === 0 ? ' is-on' : ''}${s.empty ? ' pdp__thumb--empty' : ''}" type="button" aria-pressed="${i === 0}"
                  data-cap="Fig. 0${i + 1} · ${s.cap}"${s.empty ? ` data-empty="${esc(s.empty)}"` : ` data-src="${r(p.img)}" data-alt="Envase de ${p.name}"`} aria-label="Foto: ${s.cap.toLowerCase()}">
                  ${s.empty ? `<i class="ph-light ${s.icon}" aria-hidden="true"></i><span>${s.cap}</span>` : `<img src="${r(p.img)}" width="1244" height="2294" alt="" loading="lazy" decoding="async">`}
                </button></li>`).join('')}
              </ul>
            </div>

            <div class="pdp__buy" data-buy data-id="${p.id}">
              <div class="pdp__top">
                <p class="chip chip--dot">Producto ${String(p.n).padStart(2, '0')}</p>
                <p class="pdp__fmt">${d(`Aquí el formato ${p.n} · contenido`)}</p>
              </div>
              <h1 class="pdp__title" id="pdp-title">${p.name}</h1>
              <p class="pdp__lede">${d('Aquí, en una o dos frases, qué es y para quién está pensado, según su ficha oficial.')}</p>

              <div class="pdp__price">
                <p class="pdp__amount"><strong class="price" data-line-total>${money(p.price)}</strong> <small>IVA incl.</small></p>
                <p class="pdp__unit">${money(p.price)} / unidad · ${d('Aquí los días que dura un envase')}</p>
              </div>

              <div class="pdp__row">
                <div class="qty" role="group" aria-label="Cantidad">
                  <button type="button" data-step="-1" aria-label="Quitar una unidad"><i class="ph ph-minus" aria-hidden="true"></i></button>
                  <output data-qty aria-live="polite">1</output>
                  <button type="button" data-step="1" aria-label="Añadir una unidad"><i class="ph ph-plus" aria-hidden="true"></i></button>
                </div>
                <button class="pill pill--grow" type="button" data-add="${p.id}">
                  <span>Añadir al pedido</span><span class="pill__icon" aria-hidden="true"><i class="ph ph-handbag"></i></span>
                </button>
              </div>
              <button class="ghost ghost--wide" type="button" data-add="${p.id}" data-then="checkout">
                <i class="ph ph-lightning" aria-hidden="true"></i><span>Comprar ahora · pagas al recibirlo</span>
              </button>
              <p class="pdp__free" data-free-note>Envío gratis a partir de ${money(SHIPPING.freeFrom)}</p>

              ${pledgeList(r)}
              ${legalNote()}
            </div>

          </div>
        </div>
      </section>

      <!-- Información detallada -->
      <section class="panel pinfo" aria-label="Información del producto">
        <div class="wrap pinfo__grid">
          <aside class="pinfo__aside">
            ${toc('En esta ficha', sections)}
            <div class="mini">
              <img src="${r(p.img)}" width="1244" height="2294" alt="" loading="lazy" decoding="async">
              <div><p class="mini__name">${p.name}</p><p class="mini__price">${money(p.price)}</p></div>
              <button class="mini__add" type="button" data-add="${p.id}" aria-label="Añadir ${p.name} al carrito"><i class="ph ph-plus" aria-hidden="true"></i></button>
            </div>
          </aside>

          <div class="pinfo__main">
            <section class="block rv" id="descripcion" aria-labelledby="h-descripcion">
              <h2 class="block__title" id="h-descripcion">Descripción</h2>
              <p>${d('Aquí la descripción completa y factual: qué es, cómo se presenta y en qué se diferencia de los otros tres productos.')}</p>
              <p>${d('Aquí un segundo párrafo si hace falta, sin promesas de curación ni resultados garantizados.')}</p>
              <ul class="facts">
                <li><i class="ph-light ph-package" aria-hidden="true"></i><span>Formato</span><strong>${d(`Aquí el formato ${p.n}`)}</strong></li>
                <li><i class="ph-light ph-stack" aria-hidden="true"></i><span>Contenido</span><strong>${d('Aquí el contenido')}</strong></li>
                <li><i class="ph-light ph-calendar" aria-hidden="true"></i><span>Duración del envase</span><strong>${d('Aquí los días')}</strong></li>
              </ul>
            </section>

            <section class="block rv" id="composicion" aria-labelledby="h-composicion">
              <h2 class="block__title" id="h-composicion">Composición</h2>
              <p>Tal como figura en la ficha oficial del producto.</p>
              <div class="table-wrap">
                <table class="spec">
                  <caption class="sr-only">Composición de ${p.name}</caption>
                  <thead><tr><th scope="col">Componente</th><th scope="col">Cantidad por unidad</th><th scope="col">Función</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">${d('Aquí el principio activo')}</th><td>${d('XX mg')}</td><td>${d('Principio activo')}</td></tr>
                    <tr><th scope="row">${d('Aquí el componente 2')}</th><td>${d('XX mg')}</td><td>${d('Aquí su función')}</td></tr>
                    <tr><th scope="row">${d('Aquí el componente 3')}</th><td>${d('XX mg')}</td><td>${d('Aquí su función')}</td></tr>
                  </tbody>
                </table>
              </div>
              ${kv([['Excipientes', d('Aquí la lista de excipientes')], ['Alérgenos', d('Aquí los alérgenos o «no contiene»')]])}
            </section>

            <section class="block rv" id="uso" aria-labelledby="h-uso">
              <h2 class="block__title" id="h-uso">Modo de uso</h2>
              <p>${d('Aquí el modo de uso según el prospecto, en una frase.')}</p>
              <ol class="nsteps">
                <li><span class="nsteps__n" aria-hidden="true">1</span><p>${d('Aquí el primer paso: cuánto se toma.')}</p></li>
                <li><span class="nsteps__n" aria-hidden="true">2</span><p>${d('Aquí el segundo paso: cuándo y cómo (con o sin comida).')}</p></li>
                <li><span class="nsteps__n" aria-hidden="true">3</span><p>${d('Aquí el tercer paso: durante cuánto tiempo y qué hacer si se olvida una toma.')}</p></li>
              </ol>
              ${tlink(r('guias/como-se-toma/'), 'Guía: cómo se toma y en qué dosis')}
            </section>

            <section class="block rv" id="advertencias" aria-labelledby="h-advertencias">
              <h2 class="block__title" id="h-advertencias">Advertencias y contraindicaciones</h2>
              <ul class="ticks ticks--warn">
                <li>${d('Aquí la primera contraindicación de la ficha oficial.')}</li>
                <li>${d('Aquí la advertencia sobre embarazo, lactancia y menores.')}</li>
                <li>${d('Aquí las interacciones con otros medicamentos.')}</li>
              </ul>
              ${legalNote('Si tienes síntomas o dudas médicas, consulta a un profesional sanitario antes de usarlo.')}
              <div class="links">
                ${tlink(r('guias/quien-no-deberia-usarlo/'), 'Guía: quién no debería usarlo')}
                ${tlink(r('guias/efectos-secundarios/'), 'Guía: efectos secundarios e interacciones')}
              </div>
            </section>

            <section class="block rv" id="conservacion" aria-labelledby="h-conservacion">
              <h2 class="block__title" id="h-conservacion">Conservación</h2>
              ${kv([
                ['Temperatura', d('Aquí la temperatura de conservación')],
                ['Una vez abierto', d('Aquí cuánto dura abierto y cómo guardarlo')],
                ['Caducidad', d('Aquí dónde se lee la fecha de caducidad en el envase')],
              ])}
            </section>

            <section class="block rv" id="ficha" aria-labelledby="h-ficha">
              <h2 class="block__title" id="h-ficha">Ficha técnica</h2>
              ${kv([
                ['Formato', d(`Aquí el formato ${p.n}`)],
                ['Contenido', d('Aquí el contenido')],
                ['Principio activo', d('Aquí el principio activo')],
                ['Uso según la ficha', d('Aquí el uso oficial')],
                ['Duración del envase', d('Aquí los días')],
                ['Clasificación en la UE', d('Aquí: medicamento, complemento o producto sanitario')],
                ['Nº de registro', d('Aquí el número de registro')],
                ['Titular y fabricante', d('Aquí el titular y el fabricante')],
                ['Lote y análisis', d('Aquí dónde consultar el análisis de cada lote')],
              ])}
              <p class="block__actions"><span class="ghost is-off" aria-disabled="true"><i class="ph ph-download-simple" aria-hidden="true"></i><span>${d('Aquí el prospecto en PDF')}</span></span></p>
            </section>

            <section class="block block--bare rv" id="estudios" aria-labelledby="h-estudios">
              <h2 class="block__title" id="h-estudios">Estudios relacionados</h2>
              <p class="block__lede">${d('Aquí qué estudios citan este producto o su principio activo.')}</p>
              <div class="papers">${studies.map((i) => paperCard(r, STUDIES[i], i)).join('')}</div>
              ${tlink(r('evidencia/'), 'Ver todos los estudios')}
            </section>

            <section class="block block--bare rv" id="preguntas" aria-labelledby="h-preguntas">
              <h2 class="block__title" id="h-preguntas">Preguntas sobre este producto</h2>
              ${acc(faq.map((f) => ({ q: f.q, a: f.a(r) })), `pf-${p.n}`)}
              ${tlink(r('preguntas-frecuentes/'), 'Ver todas las preguntas frecuentes')}
            </section>
          </div>
        </div>
      </section>

      <section class="panel" aria-labelledby="rel-guides">
        <div class="wrap">
          ${bhead({ kicker: 'Guías', title: 'Antes de <em>empezar</em>', id: 'rel-guides', lede: 'Guías revisadas para entender el producto, cómo se toma y quién no debería usarlo.' })}
          <div class="ggrid">${guides.map((g) => guideCard(r, g)).join('')}</div>
        </div>
      </section>

      <section class="panel" aria-labelledby="rel-products">
        <div class="wrap">
          ${bhead({ kicker: 'Tienda', title: 'Otros <em>productos</em>', id: 'rel-products' })}
          <div class="pgrid pgrid--3">${others.map((x) => productCard(r, x)).join('')}</div>
          <p class="center rv">${tlink(r('#comparar'), 'Comparar los 4 productos')}</p>
        </div>
      </section>

      <!-- Barra de compra fija en el móvil (aparece al pasar la caja de compra) -->
      <div class="buybar" data-buybar hidden>
        <img src="${r(p.img)}" width="1244" height="2294" alt="" loading="lazy" decoding="async">
        <div class="buybar__info"><p class="buybar__name">${p.name}</p><p class="buybar__price">${money(p.price)}</p></div>
        <button class="pill pill--sm" type="button" data-add="${p.id}"><span>Añadir</span><span class="pill__icon" aria-hidden="true"><i class="ph ph-plus"></i></span></button>
      </div>`,
  };
}

/* ---------- Pasos del pedido (carrito → datos → confirmación) ---------- */

const flow = (r, at) => {
  const steps = [['carrito/', 'Carrito'], ['checkout/', 'Datos y entrega'], ['pedido-confirmado/', 'Confirmación']];
  return `<ol class="flow" aria-label="Pasos del pedido">${steps.map(([href, label], i) => {
    const state = i < at ? 'done' : i === at ? 'now' : 'next';
    const inner = `<span class="flow__n" aria-hidden="true">${i < at ? '<i class="ph ph-check"></i>' : i + 1}</span><span>${label}</span>`;
    return `<li class="flow__step is-${state}"${i === at ? ' aria-current="step"' : ''}>${i < at && i < 2 ? `<a href="${r(href)}">${inner}</a>` : inner}</li>`;
  }).join('<li class="flow__line" aria-hidden="true"></li>')}</ol>`;
};

const totalsBlock = (label = 'Total a pagar al recibirlo') => `
  <dl class="totals" data-totals>
    <div><dt>Productos</dt><dd data-t-sub>—</dd></div>
    <div><dt>Envío <small>${d('importe de muestra')}</small></dt><dd data-t-ship>—</dd></div>
    <div class="totals__sum"><dt>${label}</dt><dd data-t-total>—</dd></div>
  </dl>`;

const meter = () => `
  <div class="meter" data-meter>
    <p class="meter__text" data-meter-text>Envío gratis a partir de ${money(SHIPPING.freeFrom)}</p>
    <span class="meter__bar" aria-hidden="true"><span data-meter-bar></span></span>
  </div>`;

/* ---------- Carrito ---------- */

function cartPage() {
  return {
    path: 'carrito/',
    title: 'Tu pedido',
    desc: 'Revisa los productos de tu pedido. No pagas nada ahora: pagas al recibirlo.',
    noindex: true,
    bodyClass: 'is-cart',
    main: (r) => `
      <section class="panel cart" aria-labelledby="cart-title">
        <div class="wrap">
          <div class="flowbar">${crumbs(r, [{ label: 'Carrito' }])}${flow(r, 0)}</div>
          <div class="cart__grid" data-cart>
            <div class="cart__main card">
              <header class="cart__head">
                <h1 class="cart__title" id="cart-title">Tu <em>pedido</em></h1>
                <p class="cart__count" data-cart-lines></p>
              </header>
              <ul class="citems" data-cart-items></ul>
              <div class="empty" data-cart-empty hidden>
                <span class="empty__icon" aria-hidden="true"><i class="ph-light ph-handbag"></i></span>
                <h2 class="empty__title">Tu pedido está vacío</h2>
                <p class="empty__text">Elige entre nuestros 4 productos. Pagas al recibirlo.</p>
                ${pill(r('productos/'), 'Ver los productos')}
              </div>
              <noscript><p class="note">Para hacer un pedido necesitas activar JavaScript.</p></noscript>
            </div>
            <aside class="cart__aside card" aria-labelledby="sum-title" data-cart-summary>
              <h2 class="sum__title" id="sum-title">Resumen</h2>
              ${meter()}
              ${totalsBlock()}
              <a class="pill pill--block" href="${r('checkout/')}" data-checkout-link><span>Finalizar pedido</span><span class="pill__icon" aria-hidden="true"><i class="ph ph-arrow-right"></i></span></a>
              <p class="sum__pay"><i class="ph-light ph-hand-coins" aria-hidden="true"></i><span><strong>Hoy no pagas nada.</strong> Pagas al recibirlo.</span></p>
              ${tlink(r('productos/'), 'Seguir comprando')}
            </aside>
          </div>
        </div>
      </section>

      <section class="panel" aria-labelledby="cart-more">
        <div class="wrap">
          ${bhead({ kicker: 'Tienda', title: 'Añade <em>otro producto</em>', id: 'cart-more' })}
          <div class="pgrid">${PRODUCTS.map((x) => productCard(r, x)).join('')}</div>
        </div>
      </section>`,
  };
}

/* ---------- Checkout ---------- */

function checkoutPage() {
  const field = (label, name, attrs = '', hint = '', cls = '') => `
    <div class="field ${cls}">
      <label for="co-${name}">${label}</label>
      <input id="co-${name}" name="${name}" ${attrs}>
      ${hint ? `<p class="field__hint" id="co-${name}-hint">${hint}</p>` : ''}
      <p class="field__err" id="co-${name}-err" hidden></p>
    </div>`;
  const eu = COUNTRIES.filter((c) => c[2] === 'ue');
  const out = COUNTRIES.filter((c) => c[2] === 'out');
  const opts = (list) => list.map(([code, name]) => `<option value="${code}"${code === 'ES' ? ' selected' : ''}>${name}</option>`).join('');
  const where = [
    ['home', 'ph-house', 'Domicilio particular', 'Te lo llevamos a la dirección que indiques.'],
    ['point', 'ph-storefront', 'Punto de recogida', d('Aquí si se puede pagar al recibir en el punto.')],
    ['locker', 'ph-lock-key', 'Casillero automatizado', d('Aquí si se puede pagar al recibir en el casillero.')],
  ];

  return {
    path: 'checkout/',
    title: 'Finalizar pedido',
    desc: 'Datos de contacto y de entrega. Hoy no pagas nada: pagas al recibir el pedido.',
    noindex: true,
    bodyClass: 'is-checkout',
    main: (r) => `
      <section class="panel checkout" aria-labelledby="co-title">
        <div class="wrap">
          <div class="flowbar">${crumbs(r, [{ label: 'Carrito', href: r('carrito/') }, { label: 'Finalizar pedido' }])}${flow(r, 1)}</div>

          <div class="checkout__grid" data-checkout-wrap>
            <form class="co card" data-checkout novalidate aria-labelledby="co-title">
              <h1 class="co__title" id="co-title">Finalizar <em>pedido</em></h1>
              <p class="co__banner"><i class="ph-light ph-hand-coins" aria-hidden="true"></i><span><strong>Hoy no pagas nada.</strong> Pagas al recibir el pedido, en la puerta.</span></p>

              <fieldset class="co__step">
                <legend><span class="co__n" aria-hidden="true">1</span>Contacto</legend>
                <div class="co__row">
                  ${field('Email', 'email', 'type="email" autocomplete="email" required aria-describedby="co-email-err"')}
                  ${field('Teléfono', 'phone', 'type="tel" autocomplete="tel" required aria-describedby="co-phone-hint co-phone-err"', d('Aquí para qué se usa: confirmar el pedido y que el transportista pueda avisarte.'))}
                </div>
              </fieldset>

              <fieldset class="co__step">
                <legend><span class="co__n" aria-hidden="true">2</span>Dónde lo recibes</legend>
                <div class="choices">${where.map(([v, icon, t, s], i) => `
                  <label class="choice">
                    <input type="radio" name="delivery" value="${v}"${i === 0 ? ' checked' : ''}>
                    <span class="choice__box"><i class="ph-light ${icon}" aria-hidden="true"></i><strong>${t}</strong><small>${s}</small></span>
                  </label>`).join('')}
                </div>
                <p class="note" data-pickup-note hidden><i class="ph-light ph-map-pin" aria-hidden="true"></i><span>${d('Aquí el buscador de puntos de recogida y casilleros del transportista. Mientras tanto, indica abajo la dirección del punto elegido.')}</span></p>
              </fieldset>

              <fieldset class="co__step">
                <legend><span class="co__n" aria-hidden="true">3</span>Dirección de entrega</legend>
                ${field('Nombre y apellidos', 'name', 'autocomplete="name" required aria-describedby="co-name-err"')}
                ${field('Dirección', 'address', 'autocomplete="address-line1" required aria-describedby="co-address-err"')}
                ${field('Piso, puerta… <small>(opcional)</small>', 'address2', 'autocomplete="address-line2"')}
                <div class="co__row co__row--3">
                  ${field('Código postal', 'zip', 'autocomplete="postal-code" required aria-describedby="co-zip-err"')}
                  ${field('Ciudad', 'city', 'autocomplete="address-level2" required aria-describedby="co-city-err"')}
                  <div class="field">
                    <label for="co-country">País</label>
                    <select id="co-country" name="country" autocomplete="country" required data-country>
                      <optgroup label="Unión Europea">${opts(eu)}</optgroup>
                      <optgroup label="Fuera de la UE">${opts(out)}</optgroup>
                    </select>
                  </div>
                </div>
                <p class="note" data-customs-note hidden><i class="ph-light ph-globe-hemisphere-west" aria-hidden="true"></i><span>Sale de la UE: el envío puede pasar aduana. ${d('Aquí quién paga los impuestos de importación.')}</span></p>
                <div class="field">
                  <label for="co-notes">Notas para el repartidor <small>(opcional)</small></label>
                  <textarea id="co-notes" name="notes" rows="2"></textarea>
                </div>
              </fieldset>

              <fieldset class="co__step">
                <legend><span class="co__n" aria-hidden="true">4</span>Pago</legend>
                <label class="choice choice--wide">
                  <input type="radio" name="payment" value="cod" checked>
                  <span class="choice__box"><i class="ph-light ph-hand-coins" aria-hidden="true"></i><strong>Pago al recibir (contra reembolso)</strong><small>${d('Aquí qué acepta el transportista en la puerta: efectivo, tarjeta o móvil.')}</small></span>
                </label>
              </fieldset>

              <div class="co__checks">
                <label class="check"><input type="checkbox" name="terms" required><span>He leído y acepto los <a href="${r('terminos/')}" target="_blank" rel="noopener">términos de venta</a>.</span></label>
                <label class="check"><input type="checkbox" name="withdrawal" required><span>He leído la información sobre el <a href="${r('devoluciones/')}" target="_blank" rel="noopener">derecho de desistimiento</a> (14 días).</span></label>
                <p class="field__err" data-checks-err hidden>Marca las dos casillas para continuar.</p>
              </div>

              <button class="pill pill--block" type="submit" data-submit>
                <span>Confirmar pedido · pagas al recibirlo</span><span class="pill__icon" aria-hidden="true"><i class="ph ph-check"></i></span>
              </button>
              <p class="co__msg" data-co-msg role="alert"></p>
              <p class="note"><i class="ph-light ph-info" aria-hidden="true"></i><span>Prototipo: el pedido se guarda solo en este navegador y no se envía a ningún servidor. ${d('Aquí irá la conexión con la plataforma de la tienda.')}</span></p>
            </form>

            <aside class="co__aside card" aria-labelledby="co-sum-title">
              <div class="co__sumhead">
                <h2 class="sum__title" id="co-sum-title">Tu pedido</h2>
                ${tlink(r('carrito/'), 'Editar', 'ph-pencil-simple')}
              </div>
              <ul class="sitems" data-sum-items></ul>
              ${meter()}
              ${totalsBlock()}
              ${pledgeList(r, 'pledges--compact')}
            </aside>
          </div>

          <div class="empty card" data-checkout-empty hidden>
            <span class="empty__icon" aria-hidden="true"><i class="ph-light ph-handbag"></i></span>
            <h2 class="empty__title">Tu pedido está vacío</h2>
            <p class="empty__text">Añade algún producto para poder finalizar el pedido.</p>
            ${pill(r('productos/'), 'Ver los productos')}
          </div>
        </div>
      </section>`,
  };
}

/* ---------- Pedido confirmado ---------- */

function confirmedPage() {
  const next = [
    ['ph-seal-check', 'Verificamos tu pedido', d('Aquí cómo se confirma el pedido: llamada, SMS o email, y en cuánto tiempo.')],
    ['ph-truck', 'Lo enviamos con seguimiento', `Entrega en ${SHIPPING.days}, en un embalaje neutro y sin marcas. ${d('Aquí cuándo llega el número de seguimiento.')}`],
    ['ph-hand-coins', 'Pagas al recibirlo', d('Aquí qué acepta el transportista en la puerta: efectivo, tarjeta o móvil.')],
  ];
  return {
    path: 'pedido-confirmado/',
    title: 'Pedido recibido',
    desc: 'Hemos recibido tu pedido. Hoy no has pagado nada: pagas al recibirlo.',
    noindex: true,
    bodyClass: 'is-confirmed',
    main: (r) => `
      <section class="panel confirm" aria-labelledby="ok-title">
        <div class="wrap wrap--narrow">
          <div class="flowbar flowbar--center">${flow(r, 2)}</div>

          <div class="confirm__card card" data-confirmed>
            <span class="confirm__tick" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></span>
            <p class="chip chip--dot">Pedido recibido</p>
            <h1 class="confirm__title" id="ok-title">Gracias. <em>Hoy no has pagado nada.</em></h1>
            <p class="confirm__lede">Pagarás cuando recibas el pedido. <span data-order-line hidden>Tu número de pedido es <strong data-order-id></strong>: guárdalo para consultar su estado.</span></p>

            <ol class="next">${next.map(([icon, t, s], i) => `
              <li class="next__step"><span class="next__icon" aria-hidden="true"><i class="ph-light ${icon}"></i></span><div><p class="next__k">Paso ${i + 1}</p><h2 class="next__title">${t}</h2><p class="next__text">${s}</p></div></li>`).join('')}
            </ol>

            <div class="osum" data-order-summary hidden></div>

            <div class="confirm__actions">
              ${pill(r('cuenta/'), 'Consultar mi pedido')}
              ${ghost(r(''), 'Volver al inicio', 'ph-house')}
            </div>
          </div>

          <div class="empty card" data-no-order hidden>
            <span class="empty__icon" aria-hidden="true"><i class="ph-light ph-receipt"></i></span>
            <h2 class="empty__title">No hay ningún pedido reciente</h2>
            <p class="empty__text">No encontramos un pedido hecho en este navegador.</p>
            ${pill(r('productos/'), 'Ver los productos')}
          </div>
        </div>
      </section>`,
  };
}

/* ---------- Consultar mi pedido (botón "Cuenta") ---------- */

function accountPage() {
  return {
    path: 'cuenta/',
    title: 'Consulta tu pedido',
    desc: 'Consulta el estado de tu pedido con el número de pedido y el email. No necesitas crear una cuenta para comprar.',
    noindex: true,
    bodyClass: 'is-account',
    main: (r) => `
${phead(r, {
  trail: [{ label: 'Consultar mi pedido' }],
  kicker: 'Tu pedido',
  title: 'Consulta tu <em>pedido</em>',
  lede: 'No necesitas cuenta: compras sin registrarte y consultas el estado con tu número de pedido y el email que usaste.',
})}
      <section class="panel" aria-label="Consulta">
        <div class="wrap track">
          <div class="track__main">
            <form class="card track__form" data-track novalidate aria-labelledby="track-title">
              <h2 class="sum__title" id="track-title">Buscar un pedido</h2>
              <div class="co__row">
                <div class="field">
                  <label for="tr-id">Número de pedido</label>
                  <input id="tr-id" name="id" required placeholder="BR-XXXXXX" autocomplete="off" spellcheck="false" aria-describedby="tr-id-err">
                  <p class="field__err" id="tr-id-err" hidden></p>
                </div>
                <div class="field">
                  <label for="tr-email">Email</label>
                  <input id="tr-email" name="email" type="email" required autocomplete="email" aria-describedby="tr-email-err">
                  <p class="field__err" id="tr-email-err" hidden></p>
                </div>
              </div>
              <button class="pill" type="submit"><span>Consultar</span><span class="pill__icon" aria-hidden="true"><i class="ph ph-magnifying-glass"></i></span></button>
              <p class="note"><i class="ph-light ph-info" aria-hidden="true"></i><span>Prototipo: solo encuentra los pedidos hechos en este navegador. ${d('Aquí se consultará el sistema de pedidos de la tienda.')}</span></p>
            </form>
            <div class="track__result" data-track-result aria-live="polite"></div>
          </div>

          <aside class="track__aside">
            <div class="card">
              <h2 class="sum__title">Pedidos en este navegador</h2>
              <ul class="olist" data-orders></ul>
              <p class="olist__empty" data-orders-empty>Todavía no has hecho ningún pedido desde este navegador.</p>
            </div>
            <div class="card help">
              <h2 class="sum__title">¿Necesitas ayuda?</h2>
              <ul class="help__list">
                <li><a href="${r('preguntas-frecuentes/')}"><i class="ph-light ph-question" aria-hidden="true"></i>Preguntas frecuentes</a></li>
                <li><a href="${r('envios/')}"><i class="ph-light ph-truck" aria-hidden="true"></i>Envíos y plazos</a></li>
                <li><a href="${r('devoluciones/')}"><i class="ph-light ph-arrow-u-up-left" aria-hidden="true"></i>Devoluciones</a></li>
                <li><a href="${r('contacto/')}"><i class="ph-light ph-chat-circle" aria-hidden="true"></i>Contacto</a></li>
              </ul>
            </div>
          </aside>
        </div>
      </section>`,
  };
}

export const shopPages = [
  productsHub(),
  ...PRODUCTS.map(productPage),
  cartPage(),
  checkoutPage(),
  confirmedPage(),
  accountPage(),
];
