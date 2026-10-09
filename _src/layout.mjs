// Estructura común de las subpáginas: <head>, barra superior, pie y piezas reutilizables.
// Todas las rutas son relativas: r('guias/') desde productos/producto-1/ da ../../guias/.
import { SITE, SHIPPING, PRODUCTS, GUIDES, PROFILES, d } from './data.mjs';

export const VERSION = 6;   // súbelo para forzar la recarga de site.css / site.js / store.js

export const money = (n) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n).replace(/\s/g, '&nbsp;');

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export const strip = (html) => String(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Ruta relativa desde una página a otra ruta del sitio ('' = index; '#x' = ancla del index)
export function makeR(path) {
  const depth = path.split('/').filter(Boolean).length;
  const root = '../'.repeat(depth);
  return (target = '') => {
    if (target.startsWith('#')) return root + target;
    return root + target || './';
  };
}

/* ---------- Logo: 24 rayos alternos (largo/corto) y un punto, sin ids para poder repetirlo ---------- */

export function brandMark(cls = 'brand__mark') {
  const rays = Array.from({ length: 24 }, (_, i) => {
    const y2 = i % 2 ? -33 : -47;
    return `<line x1="0" y1="-7" x2="0" y2="${y2}" transform="rotate(${i * 15})"/>`;
  }).join('');
  return `<svg class="${cls}" viewBox="-50 -50 100 100" aria-hidden="true"><g stroke="currentColor" stroke-width="1.4" stroke-linecap="round">${rays}</g><circle r="5.5" fill="currentColor"/></svg>`;
}

/* ---------- Piezas ---------- */

// Píldora negra con el icono en su propio círculo (como "Leer guía completa")
export const pill = (href, label, icon = 'ph-arrow-right', cls = '') =>
  `<a class="pill ${cls}" href="${href}"><span>${label}</span><span class="pill__icon" aria-hidden="true"><i class="ph ${icon}"></i></span></a>`;

// Píldora blanca con borde fino
export const ghost = (href, label, icon = '', cls = '') =>
  `<a class="ghost ${cls}" href="${href}">${icon ? `<i class="ph ${icon}" aria-hidden="true"></i>` : ''}<span>${label}</span></a>`;

// Enlace con subrayado que se dibuja al pasar por encima (como en Perfiles)
export const tlink = (href, label, icon = 'ph-arrow-right') =>
  `<a class="tlink" href="${href}">${label} <i class="ph ${icon}" aria-hidden="true"></i></a>`;

export const chip = (label, dot = false, cls = '') => `<p class="chip${dot ? ' chip--dot' : ''} ${cls}">${label}</p>`;

export function crumbs(r, trail) {
  const items = [{ label: 'Inicio', href: r('') }, ...trail];
  return `<nav class="crumbs" aria-label="Migas de pan"><ol>${items.map((it, i) => i === items.length - 1
    ? `<li><span aria-current="page">${it.label}</span></li>`
    : `<li><a href="${it.href}">${it.label}</a></li>`).join('')}</ol></nav>`;
}

// Encabezado de página: migas, etiqueta, título (con <em> en serif), entradilla y un lado opcional
export function phead(r, { trail, kicker, title, lede, aside = '', cls = '' }) {
  return `
  <section class="panel phead ${cls}">
    <div class="wrap phead__in${aside ? ' phead__in--split' : ''}">
      <div class="phead__main">
        ${crumbs(r, trail)}
        ${kicker ? chip(kicker, true, 'phead__chip') : ''}
        <h1 class="phead__title">${title}</h1>
        ${lede ? `<p class="phead__lede">${lede}</p>` : ''}
      </div>
      ${aside ? `<div class="phead__aside">${aside}</div>` : ''}
    </div>
  </section>`;
}

// Cabecera de bloque dentro de una página
export const bhead = ({ kicker, title, lede, center = false, id }) => `
  <header class="bhead${center ? ' bhead--center' : ''} rv">
    ${kicker ? chip(kicker, true) : ''}
    <h2 class="bhead__title"${id ? ` id="${id}"` : ''}>${title}</h2>
    ${lede ? `<p class="bhead__lede">${lede}</p>` : ''}
  </header>`;

// Acordeón con el aspecto de las FAQ del index (site.js lo pliega)
export function acc(items, prefix, { openFirst = true } = {}) {
  return `<div class="acc" data-acc>${items.map((it, i) => {
    const open = openFirst && i === 0;
    return `
    <div class="faq__item${open ? ' is-open' : ''}"${it.search ? ` data-q="${esc(it.search)}"` : ''}>
      <h3 class="faq__q">
        <button class="faq__btn" type="button" id="${prefix}-q${i + 1}" aria-expanded="${open}" aria-controls="${prefix}-a${i + 1}">
          <span class="faq__n" aria-hidden="true">${i + 1}</span>
          <span class="faq__text">${it.q}</span>
          <span class="faq__icon" aria-hidden="true"><i class="ph ph-plus"></i></span>
        </button>
      </h3>
      <div class="faq__panel" id="${prefix}-a${i + 1}" role="region" aria-labelledby="${prefix}-q${i + 1}">
        <div class="faq__clip"><div class="faq__body">${it.a}</div></div>
      </div>
    </div>`;
  }).join('')}
  </div>`;
}

// Índice lateral que marca la sección visible (site.js)
export const toc = (title, items) => `
  <nav class="toc" aria-label="${title}" data-toc>
    <p class="toc__title">${title}</p>
    <ol>${items.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join('')}</ol>
  </nav>`;

export const legalNote = (text = 'Información educativa: no sustituye el consejo de un profesional sanitario. Lee siempre el prospecto.') =>
  `<p class="note"><i class="ph-light ph-info" aria-hidden="true"></i><span>${text}</span></p>`;

/* ---------- Tarjetas ---------- */

export function productCard(r, p, { headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  return `
  <article class="pcard rv">
    <a class="pcard__pic" href="${r(`productos/${p.slug}/`)}" tabindex="-1" aria-hidden="true">
      <img src="${r(p.img)}" width="1244" height="2294" alt="" loading="lazy" decoding="async">
      <span class="pcard__n">${p.n}</span>
    </a>
    <div class="pcard__body">
      <p class="pcard__fmt">${d(`Aquí el formato ${p.n} · contenido`)}</p>
      <${h} class="pcard__name"><a href="${r(`productos/${p.slug}/`)}">${p.name}</a></${h}>
      <p class="pcard__price"><strong class="price">${money(p.price)}</strong> <small>IVA incl.</small></p>
      <div class="pcard__actions">
        <button class="add" type="button" data-add="${p.id}" aria-label="Añadir ${p.name} al carrito"><span>Añadir</span><span class="add__icon" aria-hidden="true"><i class="ph ph-plus"></i></span></button>
        ${tlink(r(`productos/${p.slug}/`), `Ver ficha<span class="sr-only">: ${p.name}</span>`)}
      </div>
    </div>
  </article>`;
}

export function guideCard(r, g, { headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  const href = r(`guias/${g.slug}/`);
  return `
  <article class="gcard rv" data-topic="${esc(g.tag)}">
    <div class="gcard__media${g.fit === 'contain' ? ' gcard__media--contain' : ''}"${g.focus ? ` style="--focus: ${g.focus}"` : ''}>
      <img src="${r(g.img)}" width="${g.w}" height="${g.h}" alt="${esc(g.alt)}" loading="lazy" decoding="async">
    </div>
    <div class="gcard__body">
      <div class="gcard__top"><span class="chip gcard__tag">${g.tag}</span><span class="gcard__time">${g.min} min de lectura</span></div>
      <${h} class="gcard__title"><a href="${href}">${g.title}</a></${h}>
      <p class="gcard__lede">${d(g.lede)}</p>
      <p class="gcard__by">${d('Revisado por [nombre] · fecha')}</p>
    </div>
    <span class="gcard__go" aria-hidden="true"><i class="ph-light ph-arrow-up-right"></i></span>
  </article>`;
}

// Ficha de estudio: el mismo marcado que las del index (.paper)
export function paperCard(r, s, i) {
  return `
  <article class="paper rv${s.trial ? ' paper--trial' : ''}" id="estudio-${i + 1}" data-topic="${esc(s.tag)}">
    <div class="paper__body">
      <div class="paper__top">
        <span class="paper__tag">${s.tag}</span>
        ${s.trial
          ? `<span class="paper__live"><span class="paper__pulse" aria-hidden="true"></span>${d('Activo')}</span>`
          : `<span class="paper__year">${d(s.year)}</span>`}
      </div>
      <p class="paper__source">${d(s.trial ? 'Registro: ClinicalTrials.gov' : 'Revista: aquí la revista')}</p>
      <h3 class="paper__title">${d(s.title)}</h3>
      <p class="paper__text">${d(s.text)}</p>
    </div>
    <footer class="paper__ref">
      <dl class="paper__ids">${s.ids.map(([k, v]) => `<div><dt>${k}</dt><dd>${d(v)}</dd></div>`).join('')}</dl>
      <a class="paper__link" href="${r(`evidencia/#estudio-${i + 1}`)}">
        <span>${s.link}<span class="sr-only">: ${s.tag.toLowerCase()}</span></span>
        <i class="ph ph-arrow-up-right" aria-hidden="true"></i>
      </a>
    </footer>
  </article>`;
}

/* ---------- Página completa ---------- */

/* ---------- Barra superior (todo el sitio; el index la recibe de build.mjs) ----------
   Tres menús por lo que busca el cliente: comprar (Tienda), entender el producto (Aprende) y
   resolver una duda o un pedido (Ayuda). Fija arriba: se aparta al bajar y vuelve al subir
   (nav.js); en el index aparece al dejar atrás la portada, que ya tiene logo y carrito.
   Sin JS, los botones de cada menú llevan a su página (data-href) y todo son enlaces normales. */

const HELP = [
  ['envios/', 'ph-truck', 'Envíos y plazos', `${SHIPPING.days}, gratis desde ${SHIPPING.freeFrom} €`],
  ['devoluciones/', 'ph-arrow-u-up-left', 'Devoluciones', '14 días para desistir'],
  ['preguntas-frecuentes/', 'ph-chats-circle', 'Preguntas frecuentes', 'Pago, aduana, uso del producto…'],
  ['cuenta/', 'ph-package', 'Consultar mi pedido', 'Con tu email, sin crear cuenta'],
  ['contacto/', 'ph-envelope-simple', 'Contacto', 'Escríbenos tu duda'],
];

export function topbar(r, path, { home = false } = {}) {
  const on = (href) => path === href || (href !== '' && path.startsWith(href));
  const cur = (href) => (on(href) ? ' aria-current="page"' : '');
  const shopOn = on('productos/') || on('carrito/') || on('checkout/');
  const learnOn = on('guias/') || on('perfiles/') || on('evidencia/');
  const helpOn = HELP.some(([href]) => on(href));
  const caret = '<i class="ph ph-caret-down nav__caret" aria-hidden="true"></i>';
  const trigger = (id, label, href, isOn) =>
    `<button class="nav__link${isOn ? ' is-current' : ''}" type="button" aria-expanded="false" aria-controls="nav-${id}" data-href="${href}"><span>${label}</span>${caret}</button>`;

  const shop = `
            <div class="nav__panel nav__panel--shop" id="nav-tienda" data-nav-panel>
              <ul class="nav__products">${PRODUCTS.map((p) => `
                <li class="nav__product">
                  <a class="nav__pic" href="${r(`productos/${p.slug}/`)}"${cur(`productos/${p.slug}/`)}>
                    <img src="${r(p.img)}" width="1244" height="2294" alt="" loading="lazy" decoding="async">
                    <span class="nav__pname">${p.name}</span>
                    <span class="nav__price">${money(p.price)}</span>
                  </a>
                  <button class="nav__add" type="button" data-add="${p.id}" aria-label="Añadir ${p.name} al carrito"><i class="ph ph-plus" aria-hidden="true"></i></button>
                </li>`).join('')}
              </ul>
              <div class="nav__aside">
                <a class="nav__row" href="${r('productos/')}"${cur('productos/')}><i class="ph-light ph-squares-four" aria-hidden="true"></i><span><b>Ver todos los productos</b><small>Fichas, formatos y precios</small></span></a>
                <a class="nav__row" href="${r('#comparar')}"><i class="ph-light ph-columns" aria-hidden="true"></i><span><b>Compararlos</b><small>Los 4, lado a lado</small></span></a>
                <a class="nav__row" href="${r('#pedido')}"><i class="ph-light ph-path" aria-hidden="true"></i><span><b>Cómo funciona tu pedido</b><small>4 pasos, sin pago por adelantado</small></span></a>
                <ul class="nav__pledges">
                  <li><i class="ph-light ph-hand-coins" aria-hidden="true"></i>Pagas al recibirlo</li>
                  <li><i class="ph-light ph-package" aria-hidden="true"></i>Envío discreto</li>
                </ul>
              </div>
            </div>`;

  const learn = `
            <div class="nav__panel nav__panel--learn" id="nav-aprende" data-nav-panel>
              <div class="nav__col">
                <p class="nav__h">Guías</p>
                <ul class="nav__links">${GUIDES.map((g) => `
                  <li><a href="${r(`guias/${g.slug}/`)}"${cur(`guias/${g.slug}/`)}><small>${g.tag}</small>${g.title}</a></li>`).join('')}
                </ul>
                <a class="nav__more" href="${r('guias/')}"${cur('guias/')}>Todas las guías <i class="ph ph-arrow-right" aria-hidden="true"></i></a>
              </div>
              <div class="nav__col">
                <p class="nav__h">¿Para quién?</p>
                <ul class="nav__links nav__links--areas">${PROFILES.filter((p) => p.area).map((p) => `
                  <li><a href="${r(`perfiles/${p.slug}/`)}"${cur(`perfiles/${p.slug}/`)}><i class="ph-light ${p.icon}" aria-hidden="true"></i>${p.area}</a></li>`).join('')}
                </ul>
                <a class="nav__more" href="${r('#perfiles')}">Los 6 perfiles <i class="ph ph-arrow-right" aria-hidden="true"></i></a>
                <a class="nav__card" href="${r('evidencia/')}"${cur('evidencia/')}>
                  <i class="ph-light ph-flask" aria-hidden="true"></i>
                  <span><b>Estudios</b><small>La evidencia científica, con sus fuentes</small></span>
                  <i class="ph ph-arrow-up-right nav__card-go" aria-hidden="true"></i>
                </a>
              </div>
            </div>`;

  const help = `
            <div class="nav__panel nav__panel--help" id="nav-ayuda" data-nav-panel>
              <ul class="nav__rows">${HELP.map(([href, icon, label, sub]) => `
                <li><a class="nav__row" href="${r(href)}"${cur(href)}><i class="ph-light ${icon}" aria-hidden="true"></i><span><b>${label}</b><small>${sub}</small></span></a></li>`).join('')}
              </ul>
            </div>`;

  return `
  <header class="nav${home ? ' is-home is-parked' : ''}" data-nav${home ? ' data-nav-home' : ''}>
    <div class="nav__bar">
      <a class="brand nav__brand" href="${r('')}" aria-label="${SITE.brand}, inicio">
        ${brandMark()}
        <span translate="no">${SITE.brand}</span>
      </a>
      <nav class="nav__main" id="nav-main" aria-label="Principal">
        <span class="nav__glide" aria-hidden="true"></span>
        <ul class="nav__list">
          <li class="nav__item" data-nav-item>
            ${trigger('tienda', 'Tienda', r('productos/'), shopOn)}${shop}
          </li>
          <li class="nav__item" data-nav-item>
            ${trigger('aprende', 'Aprende', r('guias/'), learnOn)}${learn}
          </li>
          <li class="nav__item" data-nav-item>
            ${trigger('ayuda', 'Ayuda', r('preguntas-frecuentes/'), helpOn)}${help}
          </li>
        </ul>
      </nav>
      <div class="nav__end">
        <a class="nav__icon" href="${r('cuenta/')}" aria-label="Consultar mi pedido"${cur('cuenta/')}><i class="ph ph-package" aria-hidden="true"></i></a>
        <a class="nav__cart" href="${r('carrito/')}" aria-label="Carrito" data-cart-link${cur('carrito/')}>
          <i class="ph ph-handbag" aria-hidden="true"></i><span class="nav__cart-label">Carrito</span><span class="dock__count" data-cart-count hidden>0</span>
        </a>
        <button class="nav__burger" type="button" aria-expanded="false" aria-controls="nav-main" aria-label="Menú">
          <span aria-hidden="true"></span><span aria-hidden="true"></span>
        </button>
      </div>
      <span class="nav__progress" aria-hidden="true"></span>
    </div>
  </header>`;
}

export function footer(r) {
  const col = (title, links) => `
      <div class="foot__col">
        <p class="foot__h">${title}</p>
        <ul>${links.map(([href, label]) => `<li><a href="${r(href)}">${label}</a></li>`).join('')}</ul>
      </div>`;
  return `
  <footer class="foot">
    <div class="foot__in">
      <div class="foot__brand">
        <a class="brand foot__logo" href="${r('')}" aria-label="${SITE.brand}, inicio">${brandMark()}<span translate="no">${SITE.brand}</span></a>
        <p class="foot__claim">El escudo que necesitas <span>para dar lo mejor de ti</span></p>
        <ul class="foot__pledges">
          <li><i class="ph-light ph-hand-coins" aria-hidden="true"></i>Pagas al recibirlo</li>
          <li><i class="ph-light ph-package" aria-hidden="true"></i>Envío discreto</li>
          <li><i class="ph-light ph-arrow-u-up-left" aria-hidden="true"></i>14 días para desistir</li>
        </ul>
      </div>
      <nav class="foot__nav" aria-label="Pie de página">
        ${col('Tienda', [['productos/', 'Todos los productos'], ...PRODUCTS.map((p) => [`productos/${p.slug}/`, p.name]), ['#comparar', 'Comparar'], ['carrito/', 'Carrito']])}
        ${col('Información', [['guias/', 'Guías'], ['evidencia/', 'Estudios'], ['#perfiles', 'A quién va dirigido'], ['#pedido', 'Cómo funciona tu pedido']])}
        ${col('Ayuda', [['preguntas-frecuentes/', 'Preguntas frecuentes'], ['envios/', 'Envíos y plazos'], ['devoluciones/', 'Devoluciones'], ['cuenta/', 'Consultar mi pedido'], ['contacto/', 'Contacto']])}
        ${col('Legal', [['aviso-legal/', 'Aviso legal'], ['privacidad/', 'Privacidad'], ['cookies/', 'Cookies'], ['terminos/', 'Términos de venta']])}
      </nav>
    </div>
    <div class="foot__base">
      <p>© ${SITE.year} <span translate="no">${SITE.brand}</span> · La información de este sitio es educativa y no sustituye el consejo de un profesional sanitario.</p>
      <p>${d('Aquí la razón social, el NIF y la dirección del titular')}</p>
    </div>
  </footer>`;
}

export function page({ path, title, desc, bodyClass = '', main, scripts = [], noindex = false, ld = null }) {
  const r = makeR(path);
  const v = `?v=${VERSION}`;
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${strip(title)} · ${SITE.brand}</title>
  <meta name="description" content="${esc(strip(desc))}">
${noindex ? '  <meta name="robots" content="noindex">\n' : ''}  <meta name="theme-color" content="#0d0d0d">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-50 -50 100 100'%3E%3Cg stroke='%230d0d0d' stroke-width='5' stroke-linecap='round'%3E%3Cpath d='M0-46V46M-46 0H46M-32.5-32.5L32.5 32.5M32.5-32.5L-32.5 32.5'/%3E%3C/g%3E%3Ccircle r='9' fill='%230d0d0d'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..600&family=Instrument+Serif:ital@1&family=Questrial&display=swap">
  <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
  <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/light/style.css">
  <link rel="stylesheet" href="${r('styles.css')}?v=40">
  <link rel="stylesheet" href="${r('site.css')}${v}">
${ld ? `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` : ''}</head>
<body class="sub ${bodyClass}" data-root="${r('') === './' ? '' : r('')}">
  <a class="skip" href="#contenido">Saltar al contenido</a>
  <div class="frame">
${topbar(r, path)}
    <main class="page" id="contenido" tabindex="-1">
${main(r)}
    </main>
  </div>
${footer(r)}

  <script src="${r('catalog.js')}${v}" defer></script>
  <script src="${r('store.js')}${v}" defer></script>
  <script src="${r('site.js')}${v}" defer></script>
  <script src="${r('nav.js')}${v}" defer></script>
${scripts.map((s) => `  <script src="${r(s)}${v}" defer></script>`).join('\n')}
</body>
</html>
`;
}
