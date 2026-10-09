// Páginas informativas: guías, perfiles, estudios, preguntas frecuentes, envíos, devoluciones,
// contacto y textos legales.
import { PRODUCTS, GUIDES, PROFILES, STUDIES, FAQ_GROUPS, COUNTRIES, LEGAL, SHIPPING, d } from './data.mjs';
import {
  money, esc, crumbs, phead, bhead, pill, ghost, tlink, chip, acc, toc, legalNote,
  guideCard, paperCard,
} from './layout.mjs';

const TOPICS = [...new Set(GUIDES.map((g) => g.tag))];

const filters = (label, values, attr = 'data-filter') => `
  <div class="filters rv" role="group" aria-label="${label}" ${attr}>
    <button class="filter is-on" type="button" aria-pressed="true" data-value="">Todos</button>
    ${values.map((v) => `<button class="filter" type="button" aria-pressed="false" data-value="${esc(v)}">${v}</button>`).join('')}
  </div>`;

/* ---------- Guías ---------- */

function guidesHub() {
  return {
    path: 'guias/',
    title: 'Guías',
    desc: 'Todo lo que necesitas saber sobre [producto]: qué es, para qué se usa, cómo se toma, efectos secundarios, quién no debería usarlo y mitos.',
    main: (r) => `
${phead(r, {
  trail: [{ label: 'Guías' }],
  kicker: 'Guías',
  title: 'Todo lo que necesitas saber sobre <em>[producto]</em>',
  lede: d('Aquí una línea que presente las guías y cómo se revisan.'),
  aside: `
    <div class="card phead__card">
      <p class="phead__card-k">Cómo hacemos las guías</p>
      <ul class="ticks">
        <li>${d('Aquí quién las escribe')}</li>
        <li>${d('Aquí quién las revisa (profesional sanitario colegiado)')}</li>
        <li>${d('Aquí cada cuánto se actualizan y con qué fuentes')}</li>
      </ul>
    </div>`,
})}
      <section class="panel" aria-labelledby="gl-title">
        <div class="wrap">
          <h2 class="sr-only" id="gl-title">Las 6 guías</h2>
          ${filters('Filtrar por tema', TOPICS)}
          <div class="ggrid" data-filter-list>${GUIDES.map((g) => guideCard(r, g)).join('')}</div>
        </div>
      </section>

      <section class="panel" aria-label="Más ayuda">
        <div class="wrap duo">
          <div class="band rv">
            <div>
              <p class="band__k"><i class="ph-light ph-question" aria-hidden="true"></i>Pedido, envío y uso</p>
              <h2 class="band__title">Preguntas <em>frecuentes</em></h2>
              <p class="band__text">Respuestas cortas sobre el pago al recibir, los plazos de entrega, las devoluciones y el uso del producto.</p>
            </div>
            ${pill(r('preguntas-frecuentes/'), 'Ver las preguntas')}
          </div>
          <div class="band band--ink rv">
            <div>
              <p class="band__k"><i class="ph-light ph-flask" aria-hidden="true"></i>Evidencia</p>
              <h2 class="band__title">Estudios e información <em>científica</em></h2>
              <p class="band__text">Las publicaciones y los ensayos que citan las guías, con su DOI o su registro.</p>
            </div>
            ${pill(r('evidencia/'), 'Ver los estudios', 'ph-arrow-right', 'pill--light')}
          </div>
        </div>
      </section>`,
  };
}

function guidePage(g, gi) {
  const related = [1, 2, 3].map((k) => GUIDES[(gi + k) % GUIDES.length]);
  const product = PRODUCTS[gi % PRODUCTS.length];
  const refs = [gi % 6, (gi + 2) % 6, (gi + 4) % 6];
  const cite = (n) => `<sup class="cite"><a href="#ref-${n}" aria-label="Fuente ${n}">[${n}]</a></sup>`;
  const h2 = (t, i) => g.myths && i < 3 ? `<span class="verdict">${d('Mito')}</span> ${d(t)}` : t;
  const tocItems = [...g.sections.map((t, i) => [`s${i + 1}`, g.myths && i < 3 ? `Mito ${i + 1}` : t]), ['preguntas', 'Preguntas'], ['fuentes', 'Fuentes']];
  const faq = [1, 2, 3].map((n) => ({ q: d(`Aquí la pregunta frecuente ${n} de esta guía`), a: `<p>${d('Aquí la respuesta, de 40 a 80 palabras.')}</p>` }));

  const body = g.sections.map((t, i) => `
              <section class="prose__sec rv" id="s${i + 1}">
                <h2>${h2(t, i)}</h2>
                <p>${d('Aquí un párrafo corto que responda la pregunta en las dos primeras frases.')}${cite(Math.min(i + 1, 3))}</p>
                <p>${d('Aquí el desarrollo con datos concretos, siempre con su fuente. Frases cortas y sin promesas de resultados.')}</p>
                ${i === 1 ? `
                <div class="table-wrap">
                  <table class="spec">
                    <caption class="sr-only">Tabla de la guía</caption>
                    <thead><tr><th scope="col">${d('Aquí columna 1')}</th><th scope="col">${d('Aquí columna 2')}</th><th scope="col">${d('Aquí columna 3')}</th></tr></thead>
                    <tbody>
                      <tr><th scope="row">${d('Dato')}</th><td>${d('Dato')}</td><td>${d('Dato')}</td></tr>
                      <tr><th scope="row">${d('Dato')}</th><td>${d('Dato')}</td><td>${d('Dato')}</td></tr>
                    </tbody>
                  </table>
                </div>
                ${legalNote('Información educativa: no sustituye el consejo de un profesional sanitario.')}` : ''}
                ${i === 2 ? `<ul class="ticks"><li>${d('Aquí un punto clave')}</li><li>${d('Aquí otro punto clave')}</li><li>${d('Aquí un tercer punto clave')}</li></ul>` : ''}
              </section>`).join('');

  return {
    path: `guias/${g.slug}/`,
    title: g.title,
    desc: `${g.lede} Guía revisada, con fuentes verificables y fecha de actualización.`,
    bodyClass: 'is-guide',
    ld: { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, inLanguage: 'es' },
    main: (r) => `
      <section class="panel ghead" aria-labelledby="g-title">
        <div class="wrap ghead__in">
          <div class="ghead__text">
            ${crumbs(r, [{ label: 'Guías', href: r('guias/') }, { label: g.title }])}
            <div class="ghead__chips">
              <span class="chip">${g.tag}</span>
              <span class="ghead__time"><i class="ph-light ph-clock" aria-hidden="true"></i>${g.min} min de lectura</span>
            </div>
            <h1 class="ghead__title" id="g-title">${g.title}</h1>
            <p class="ghead__lede">${d(g.lede)}</p>
            <div class="byline">
              <div class="byline__p"><span class="avatar" aria-hidden="true">NN</span><div><small>Escrito por</small><strong>${d('[nombre]')}</strong></div></div>
              <div class="byline__p"><span class="avatar avatar--ink" aria-hidden="true"><i class="ph ph-seal-check"></i></span><div><small>Revisión médica</small><strong>${d('[nombre y nº de colegiado]')}</strong></div></div>
              <div class="byline__p"><div><small>Actualizada</small><strong>${d('fecha')}</strong></div></div>
            </div>
          </div>
          <figure class="ghead__media${g.fit === 'contain' ? ' ghead__media--contain' : ''}"${g.focus ? ` style="--focus: ${g.focus}"` : ''}>
            <img src="${r(g.img)}" width="${g.w}" height="${g.h}" alt="${esc(g.alt)}" fetchpriority="high">
          </figure>
        </div>
      </section>

      <section class="panel gbody" aria-label="Guía">
        <div class="wrap gbody__grid">
          <aside class="gbody__aside">${toc('En esta guía', tocItems)}</aside>
          <article class="prose" aria-labelledby="g-title">
            <div class="answer rv">
              <p class="answer__k"><i class="ph ph-lightning" aria-hidden="true"></i>Respuesta rápida</p>
              <p>${d(g.answer)}</p>
            </div>
            ${body}

            <aside class="relprod rv" aria-label="Producto relacionado">
              <img src="${r(product.img)}" width="1244" height="2294" alt="" loading="lazy" decoding="async">
              <div class="relprod__text">
                <p class="relprod__k">Producto relacionado</p>
                <p class="relprod__name">${product.name}</p>
                <p class="relprod__line">${d('Aquí una línea factual sobre el producto.')} · Pagas al recibirlo</p>
              </div>
              ${pill(r(`productos/${product.slug}/`), 'Ver ficha', 'ph-arrow-right', 'pill--sm')}
            </aside>

            <section class="prose__sec rv" id="preguntas">
              <h2>Preguntas sobre esta guía</h2>
              ${acc(faq, `gf-${gi + 1}`, { openFirst: false })}
            </section>

            <section class="prose__sec rv" id="fuentes">
              <h2>Fuentes</h2>
              <ol class="refs">${refs.map((si, n) => `
                <li id="ref-${n + 1}">${d('Autores et al.')} <em>${d(STUDIES[si].title)}</em> ${d('Revista, año.')} <a href="${r(`evidencia/#estudio-${si + 1}`)}">Ver ficha del estudio</a></li>`).join('')}
              </ol>
              <p class="refs__note">Fuentes comprobadas el ${d('fecha')}. ¿Has visto un error? <a href="${r('contacto/')}">Escríbenos</a>.</p>
            </section>
          </article>
        </div>
      </section>

      <section class="panel" aria-labelledby="g-more">
        <div class="wrap">
          ${bhead({ kicker: 'Sigue leyendo', title: 'Guías <em>relacionadas</em>', id: 'g-more' })}
          <div class="ggrid">${related.map((x) => guideCard(r, x)).join('')}</div>
          <p class="center rv">${tlink(r('guias/'), 'Ver todas las guías')}</p>
        </div>
      </section>`,
  };
}

/* ---------- Perfiles ("Explorar protocolo clínico") ---------- */

function profilePage(pr, pi) {
  const area = pr.area || d('Aquí el área');
  const title = pr.title || d('Aquí el perfil al que va dirigido');
  const plain = pr.area || `Perfil ${pr.n}`;
  const others = PROFILES.filter((x) => x !== pr);
  const studies = [pi % 6, (pi + 3) % 6];
  return {
    path: `perfiles/${pr.slug}/`,
    title: pr.title ? `${plain}: ${pr.title.charAt(0).toLowerCase()}${pr.title.slice(1)}` : plain,
    desc: `Perfil ${pr.n} · ${plain}: para quién está pensado, qué dice la ficha oficial de los productos y qué conviene saber antes de empezar.`,
    bodyClass: 'is-profile',
    main: (r) => `
      <section class="panel prof" aria-labelledby="pr-title">
        <div class="wrap">
          ${crumbs(r, [{ label: 'A quién va dirigido', href: r('#perfiles') }, { label: `Perfil ${pr.n}` }])}
          <div class="prof__grid">
            <figure class="acard__media prof__media">
              <img src="${r(pr.img)}" width="${pr.w}" height="${pr.h}" alt="${esc(pr.alt)}" fetchpriority="high">
              <figcaption class="acard__fig">${pr.fig}</figcaption>
            </figure>
            <div class="prof__body">
              <div class="acard__top">
                <p class="acard__area">Perfil ${pr.n} · ${area}</p>
                <p class="acard__ref"><i class="ph-light ${pr.icon}" aria-hidden="true"></i>${d('Ref. XXX')}</p>
              </div>
              <h1 class="prof__title" id="pr-title">${title}</h1>
              <p class="prof__lede">${d('Aquí para quién está pensado este perfil y qué dice la ficha oficial del producto, sin prometer resultados.')}</p>
              <dl class="acard__stats">
                <div><dt>${d('Aquí qué mide')}</dt><dd>${d('XX %')}</dd></div>
                <div><dt>${d('Aquí qué mide')}</dt><dd>${d('XX %')}</dd></div>
                <div><dt>${d('Aquí qué mide')}</dt><dd>${d('XX')}</dd></div>
              </dl>
              <div class="prof__cta">
                ${pill(r('#comparar'), 'Descubrir mi formulación')}
                ${tlink(r('productos/'), 'Ver los 4 productos')}
              </div>
              <p class="note"><i class="ph-light ph-shield-check" aria-hidden="true"></i><span>${d('Aquí quién supervisa estos perfiles y con qué fuentes.')}</span></p>
            </div>
          </div>
        </div>
      </section>

      <section class="panel pinfo" aria-label="Detalle del perfil">
        <div class="wrap pinfo__grid">
          <aside class="pinfo__aside">${toc('En este perfil', [['para-quien', 'Para quién'], ['ficha', 'Qué dice la ficha'], ['antes', 'Antes de empezar'], ['estudios', 'Estudios']])}</aside>
          <div class="pinfo__main">
            <section class="block rv" id="para-quien" aria-labelledby="h-para-quien">
              <h2 class="block__title" id="h-para-quien">Para quién está pensado</h2>
              <p>${d('Aquí la descripción del perfil: situación, rutina y necesidades, sin nombrar enfermedades que la ficha no recoja.')}</p>
              <ul class="ticks">
                <li>${d('Aquí una situación típica de este perfil')}</li>
                <li>${d('Aquí otra situación')}</li>
                <li>${d('Aquí una tercera situación')}</li>
              </ul>
            </section>

            <section class="block rv" id="ficha" aria-labelledby="h-ficha">
              <h2 class="block__title" id="h-ficha">Qué dice la ficha oficial</h2>
              <p>${d('Aquí qué recoge la ficha oficial de cada producto para este perfil. Solo lo que figure en ella.')}</p>
              <div class="table-wrap">
                <table class="spec">
                  <caption class="sr-only">Productos y ficha oficial para este perfil</caption>
                  <thead><tr><th scope="col">Producto</th><th scope="col">Qué dice su ficha para este perfil</th></tr></thead>
                  <tbody>${PRODUCTS.map((p) => `<tr><th scope="row"><a href="${r(`productos/${p.slug}/`)}">${p.name}</a></th><td>${d('Aquí si lo recoge y en qué términos')}</td></tr>`).join('')}</tbody>
                </table>
              </div>
            </section>

            <section class="block rv" id="antes" aria-labelledby="h-antes">
              <h2 class="block__title" id="h-antes">Antes de empezar</h2>
              <p>${d('Aquí qué conviene saber antes de empezar y cuándo consultar a un profesional.')}</p>
              ${legalNote('Si tienes síntomas o dudas médicas, consulta a un profesional sanitario. Esta página no ofrece diagnósticos ni tratamientos.')}
              <div class="links">
                ${tlink(r('guias/quien-no-deberia-usarlo/'), 'Guía: quién no debería usarlo')}
                ${tlink(r('guias/efectos-secundarios/'), 'Guía: efectos secundarios e interacciones')}
              </div>
            </section>

            <section class="block block--bare rv" id="estudios" aria-labelledby="h-estudios">
              <h2 class="block__title" id="h-estudios">Estudios relacionados</h2>
              <div class="papers">${studies.map((i) => paperCard(r, STUDIES[i], i)).join('')}</div>
              ${tlink(r('evidencia/'), 'Ver todos los estudios')}
            </section>
          </div>
        </div>
      </section>

      <section class="panel" aria-labelledby="pr-more">
        <div class="wrap">
          ${bhead({ kicker: 'Perfiles', title: 'Otros <em>perfiles</em>', id: 'pr-more' })}
          <ul class="profs">${others.map((x) => `
            <li class="rv">
              <a class="profs__item" href="${r(`perfiles/${x.slug}/`)}">
                <span class="profs__pic"><img src="${r(x.img)}" width="${x.w}" height="${x.h}" alt="" loading="lazy" decoding="async"></span>
                <span class="profs__text"><span class="profs__k">Perfil ${x.n}</span><span class="profs__name">${x.area || d('Aquí el área')}</span></span>
                <i class="ph ph-arrow-up-right" aria-hidden="true"></i>
              </a>
            </li>`).join('')}
          </ul>
        </div>
      </section>`,
  };
}

/* ---------- Estudios ---------- */

function evidencePage() {
  const criteria = [
    ['ph-seal-check', 'Revisados por pares', d('Aquí qué revistas e índices se aceptan (PubMed / MEDLINE…).')],
    ['ph-clipboard-text', 'Ensayos registrados', d('Aquí el criterio: registro en ClinicalTrials.gov o en el registro europeo.')],
    ['ph-scales', 'Diseño y tamaño', d('Aquí qué diseños se priorizan y cómo se indica el tamaño de la muestra.')],
    ['ph-link-simple', 'Identificador comprobado', d('Aquí cómo se comprueba cada DOI o PMID y cada cuánto se revisa.')],
  ];
  const levels = [
    ['Revisión sistemática', 'Reúne y analiza todos los estudios publicados sobre una misma pregunta.'],
    ['Ensayo clínico aleatorizado', 'Compara grupos de personas asignadas al azar a un tratamiento o a un control.'],
    ['Estudio observacional', 'Observa a personas en su vida real sin asignarles un tratamiento: muestra asociaciones, no causas.'],
    ['Estudio preclínico', 'Hecho en células o en animales: orienta la investigación, pero no demuestra efectos en personas.'],
    ['Fuente oficial', 'Fichas técnicas, prospectos y documentos de agencias del medicamento.'],
  ];
  return {
    path: 'evidencia/',
    title: 'Estudios e información científica',
    desc: 'Catálogo de estudios, ensayos clínicos y fuentes oficiales que citan las guías, con su DOI, PMID o número de registro.',
    main: (r) => `
${phead(r, {
  trail: [{ label: 'Estudios' }],
  kicker: 'Evidencia y rigor clínico',
  title: 'Estudios e información <em>científica</em>',
  lede: d('Base documental de acceso abierto con publicaciones revisadas por pares, ensayos clínicos registrados y monografías sobre fitocannabinoides, sus receptores y el equilibrio del organismo.'),
  aside: `<ul class="evid__seals phead__seals" aria-label="Criterios de las fuentes">
    <li><i class="ph ph-seal-check" aria-hidden="true"></i>${d('Indexación PubMed / MEDLINE')}</li>
    <li><i class="ph ph-clipboard-text" aria-hidden="true"></i>${d('Registro ClinicalTrials.gov')}</li>
    <li><i class="ph ph-scales" aria-hidden="true"></i>${d('Ensayos doble ciego (ECA)')}</li>
    <li><i class="ph ph-link-simple" aria-hidden="true"></i>${d('DOI verificado en Crossref')}</li>
  </ul>`,
})}
      <section class="panel" aria-labelledby="ev-cat">
        <div class="wrap">
          <div class="evid__bar rv">
            <div>
              <p class="evid__kicker">Catálogo indexado</p>
              <h2 class="evid__sub" id="ev-cat">Monografías de referencia <em>clínica</em></h2>
            </div>
            <p class="evid__note">${d('Estudios con rigor metodológico aprobados por comités de ética independientes. Se revisan periódicamente en los indexadores biomédicos.')}</p>
          </div>
          ${filters('Filtrar por tema', STUDIES.map((s) => s.tag))}
          <div class="evid__grid" data-filter-list>${STUDIES.map((s, i) => paperCard(r, s, i).replace(
            /<a class="paper__link"[\s\S]*?<\/a>/,
            `<span class="paper__link is-off"><span>${d('Aquí el enlace a la fuente (PubMed, DOI o registro)')}</span><i class="ph ph-arrow-up-right" aria-hidden="true"></i></span>`,
          )).join('')}</div>
        </div>
      </section>

      <section class="panel" aria-labelledby="ev-how">
        <div class="wrap">
          ${bhead({ kicker: 'Método', title: 'Cómo elegimos <em>las fuentes</em>', id: 'ev-how', lede: d('Aquí una línea sobre quién selecciona y revisa los estudios.') })}
          <ul class="cgrid">${criteria.map(([icon, t, s]) => `
            <li class="crit rv"><span class="crit__icon" aria-hidden="true"><i class="ph-light ${icon}"></i></span><h3 class="crit__title">${t}</h3><p class="crit__text">${s}</p></li>`).join('')}
          </ul>
        </div>
      </section>

      <section class="panel" aria-labelledby="ev-levels">
        <div class="wrap duo duo--wide">
          <div class="rv">
            ${bhead({ kicker: 'Glosario', title: 'Tipos de <em>estudio</em>', id: 'ev-levels', lede: 'No todos los estudios pesan lo mismo. Así se lee cada tipo de fuente que citamos.' })}
          </div>
          <dl class="levels card rv">${levels.map(([t, s], i) => `
            <div><dt><span class="levels__n" aria-hidden="true">${i + 1}</span>${t}</dt><dd>${s}</dd></div>`).join('')}
          </dl>
        </div>
      </section>

      <section class="panel" aria-label="Notificar un efecto adverso">
        <div class="wrap">
          <div class="band rv">
            <div>
              <p class="band__k"><i class="ph-light ph-warning" aria-hidden="true"></i>Farmacovigilancia</p>
              <h2 class="band__title">¿Has notado un efecto <em>adverso</em>?</h2>
              <p class="band__text">Cualquier efecto adverso se puede notificar al sistema de farmacovigilancia de tu país. ${d('Aquí el enlace al formulario de notificación de cada país.')}</p>
            </div>
            ${pill(r('guias/efectos-secundarios/'), 'Leer la guía')}
          </div>
        </div>
      </section>`,
  };
}

/* ---------- Preguntas frecuentes ---------- */

function faqPage() {
  const total = FAQ_GROUPS.reduce((n, g) => n + g.items.length, 0);
  return {
    path: 'preguntas-frecuentes/',
    title: 'Preguntas frecuentes',
    desc: 'Respuestas sobre el pedido y el pago al recibir, los plazos y países de envío, las devoluciones y el uso del producto.',
    bodyClass: 'is-faq',
    main: (r) => `
${phead(r, {
  trail: [{ label: 'Preguntas frecuentes' }],
  kicker: 'FAQ',
  title: 'Preguntas <em>frecuentes</em>',
  lede: `${total} respuestas sobre el pedido, el envío, las devoluciones y el uso del producto. Si no encuentras la tuya, escríbenos.`,
  cls: 'phead--center',
})}
      <section class="panel faqp" aria-label="Preguntas">
        <div class="wrap faqp__grid">
          <aside class="faqp__aside">
            <nav class="toc" aria-label="Temas" data-toc>
              <p class="toc__title">Temas</p>
              <ol>${FAQ_GROUPS.map((g) => `<li><a href="#tema-${g.id}"><i class="ph-light ${g.icon}" aria-hidden="true"></i>${g.title}<span class="toc__count">${g.items.length}</span></a></li>`).join('')}</ol>
            </nav>
            <div class="card help">
              <p class="sum__title">¿No la encuentras?</p>
              <p class="help__text">Te respondemos en español y en inglés.</p>
              ${pill(r('contacto/'), 'Escríbenos', 'ph-chat-circle', 'pill--sm')}
            </div>
          </aside>

          <div class="faqp__main" data-faq-search-scope>
            <div class="search rv">
              <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
              <label class="sr-only" for="faq-search">Buscar una pregunta</label>
              <input id="faq-search" type="search" placeholder="Busca una pregunta: pago, aduana, receta…" autocomplete="off" data-faq-search>
              <p class="search__count" data-faq-count aria-live="polite"></p>
            </div>
            ${FAQ_GROUPS.map((g, gi) => `
            <section class="fgroup rv" id="tema-${g.id}" aria-labelledby="tema-${g.id}-t" data-faq-group>
              <h2 class="fgroup__title" id="tema-${g.id}-t"><span class="fgroup__icon" aria-hidden="true"><i class="ph-light ${g.icon}"></i></span>${g.title}</h2>
              ${acc(g.items.map((it) => ({ q: it.q, a: it.a(r), search: `${it.q} ${it.a(r).replace(/<[^>]+>/g, ' ')}` })), `fq-${g.id}`, { openFirst: gi === 0 })}
            </section>`).join('')}
            <div class="empty empty--inline" data-faq-none hidden>
              <span class="empty__icon" aria-hidden="true"><i class="ph-light ph-magnifying-glass"></i></span>
              <p class="empty__title">No hay ninguna pregunta con esas palabras</p>
              <p class="empty__text">Prueba con otra palabra o <a href="${r('contacto/')}">escríbenos</a>.</p>
            </div>
          </div>
        </div>
      </section>`,
  };
}

/* ---------- Envíos ---------- */

function shippingPage() {
  const eu = COUNTRIES.filter((c) => c[2] === 'ue');
  const out = COUNTRIES.filter((c) => c[2] === 'out');
  const rows = (list, customs) => list.map(([code, name]) => `
    <tr><th scope="row"><span class="cc">${code}</span>${name}</th><td>${SHIPPING.days}</td><td>${d('Aquí: sí / no')}</td><td>${customs}</td></tr>`).join('');
  const table = (caption, list, customs) => `
    <div class="table-wrap card rv">
      <table class="spec spec--countries">
        <caption>${caption}</caption>
        <thead><tr><th scope="col">País</th><th scope="col">Plazo estimado</th><th scope="col">Pago al recibir</th><th scope="col">Aduana</th></tr></thead>
        <tbody>${rows(list, customs)}</tbody>
      </table>
    </div>`;
  const where = [
    ['ph-house', 'Domicilio particular', 'Tu casa o la dirección que prefieras.'],
    ['ph-storefront', 'Punto de recogida', `Un punto seguro cerca de ti. ${d('Aquí si admite pago al recibir.')}`],
    ['ph-lock-key', 'Casillero automatizado', `Lo recoges cuando quieras con un código. ${d('Aquí si admite pago al recibir.')}`],
  ];
  return {
    path: 'envios/',
    title: 'Envíos y plazos de entrega',
    desc: `Entrega con seguimiento en ${SHIPPING.days} a toda la UE y a Reino Unido, Suiza, Noruega e Islandia. Envío gratis a partir de 150 €.`,
    main: (r) => `
${phead(r, {
  trail: [{ label: 'Envíos' }],
  kicker: 'Zonas de envío',
  title: 'Envíos y <em>plazos</em>',
  lede: `Entrega con seguimiento en ${SHIPPING.days} a cualquier destino, gratis a partir de ${money(SHIPPING.freeFrom)}.`,
  aside: `<dl class="stats">
    <div><dt>Plazo de entrega</dt><dd>3–7 <small>días laborables</small></dd></div>
    <div><dt>Envío gratis desde</dt><dd>${money(SHIPPING.freeFrom)}</dd></div>
    <div><dt>Sale desde</dt><dd>UE <small>almacén en la UE</small></dd></div>
  </dl>`,
})}
      <section class="panel" aria-labelledby="sh-where">
        <div class="wrap">
          ${bhead({ kicker: 'Entrega', title: 'Dónde lo <em>recibes</em>', id: 'sh-where', lede: 'Lo eliges al hacer el pedido.' })}
          <ul class="cgrid cgrid--3">${where.map(([icon, t, s]) => `
            <li class="crit rv"><span class="crit__icon" aria-hidden="true"><i class="ph-light ${icon}"></i></span><h3 class="crit__title">${t}</h3><p class="crit__text">${s}</p></li>`).join('')}
          </ul>
        </div>
      </section>

      <section class="panel" aria-labelledby="sh-pack">
        <div class="wrap feature">
          <figure class="feature__media rv"><img src="${r('assets/order-box.webp')}" width="718" height="720" alt="Caja de cartón cerrada, sin marcas" loading="lazy" decoding="async"></figure>
          <div class="feature__body rv">
            ${chip('Embalaje', true)}
            <h2 class="bhead__title" id="sh-pack">Envío <em>discreto</em></h2>
            <p class="feature__text">Embalaje exterior de cartón crudo neutro, sin distintivos, marcas ni alusiones al contenido.</p>
            <dl class="kv">
              <div><dt>Remitente</dt><dd>${d('Aquí qué nombre aparece como remitente')}</dd></div>
              <div><dt>Seguimiento</dt><dd>${d('Aquí cuándo y cómo llega el número de seguimiento')}</dd></div>
              <div><dt>Si no estás en casa</dt><dd>${d('Aquí cuántos intentos hace el transportista y cómo reprogramar')}</dd></div>
              <div><dt>Transportista</dt><dd>${d('Aquí el transportista de cada zona')}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section class="panel" aria-labelledby="sh-countries">
        <div class="wrap">
          ${bhead({ kicker: 'Países', title: 'Plazos por <em>país</em>', id: 'sh-countries', lede: 'Desde nuestro almacén en la UE, sin importación desde terceros países. Fuera de la UE el envío puede pasar aduana.' })}
          <div class="duo duo--top">
            ${table('Unión Europea', eu, 'No')}
            <div class="stack">
              ${table('Fuera de la UE', out, 'Puede aplicarse')}
              <div class="card costs rv">
                <h3 class="sum__title">Costes</h3>
                <dl class="kv">
                  <div><dt>Pedidos desde ${money(SHIPPING.freeFrom)}</dt><dd>Gratis</dd></div>
                  <div><dt>Pedidos de menos de ${money(SHIPPING.freeFrom)}</dt><dd>${d('Aquí el coste')}</dd></div>
                  <div><dt>Tasa por pagar al recibir</dt><dd>${d('Aquí si hay tasa o no')}</dd></div>
                  <div><dt>Impuestos fuera de la UE</dt><dd>${d('Aquí quién los paga')}</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel" aria-label="Siguiente paso">
        <div class="wrap duo">
          <div class="band rv">
            <div>
              <p class="band__k"><i class="ph-light ph-hand-coins" aria-hidden="true"></i>Pago</p>
              <h2 class="band__title">Pagas <em>al recibirlo</em></h2>
              <p class="band__text">No pagas nada por adelantado: pagas al transportista cuando el pedido llega a tu puerta.</p>
            </div>
            ${pill(r('productos/'), 'Ver los productos')}
          </div>
          <div class="band band--ink rv">
            <div>
              <p class="band__k"><i class="ph-light ph-arrow-u-up-left" aria-hidden="true"></i>Devoluciones</p>
              <h2 class="band__title">14 días para <em>desistir</em></h2>
              <p class="band__text">También si pagaste al recibir. Te contamos cómo hacerlo, paso a paso.</p>
            </div>
            ${pill(r('devoluciones/'), 'Cómo devolver', 'ph-arrow-right', 'pill--light')}
          </div>
        </div>
      </section>`,
  };
}

/* ---------- Devoluciones ---------- */

function returnsPage() {
  const steps = [
    ['ph-chat-circle', 'Avísanos', d('Aquí cómo comunicar que desistes: email, formulario o modelo descargable.')],
    ['ph-package', 'Prepara el paquete', d('Aquí cómo embalar la devolución y qué incluir.')],
    ['ph-truck', 'Envíalo', d('Aquí la dirección de devolución, el transportista y quién paga el envío.')],
    ['ph-hand-coins', 'Recibe el reembolso', d('Aquí el plazo y el método del reembolso si pagaste al recibir.')],
  ];
  return {
    path: 'devoluciones/',
    title: 'Devoluciones y desistimiento',
    desc: 'Tienes 14 días para desistir de una compra a distancia, también si pagaste al recibir. Cómo hacerlo, paso a paso, y sus excepciones.',
    main: (r) => `
${phead(r, {
  trail: [{ label: 'Devoluciones' }],
  kicker: 'Devoluciones',
  title: 'Devoluciones y <em>desistimiento</em>',
  lede: 'Tienes 14 días para desistir de una compra a distancia, también si pagaste al recibir.',
  aside: `<div class="bignum card"><p class="bignum__n">14</p><p class="bignum__t">días naturales desde que recibes el pedido para desistir, sin dar explicaciones.</p></div>`,
})}
      <section class="panel" aria-labelledby="rt-steps">
        <div class="wrap">
          ${bhead({ kicker: 'Paso a paso', title: 'Cómo <em>devolverlo</em>', id: 'rt-steps' })}
          <ol class="cgrid">${steps.map(([icon, t, s], i) => `
            <li class="crit rv"><span class="crit__icon" aria-hidden="true"><i class="ph-light ${icon}"></i></span><p class="crit__k">Paso ${i + 1}</p><h3 class="crit__title">${t}</h3><p class="crit__text">${s}</p></li>`).join('')}
          </ol>
        </div>
      </section>

      <section class="panel" aria-label="Detalles">
        <div class="wrap duo duo--top">
          <section class="block rv" aria-labelledby="rt-ex">
            <h2 class="block__title" id="rt-ex">Excepciones</h2>
            <p>${d('Aquí las excepciones: por ejemplo, productos precintados por motivos de salud o higiene que se hayan abierto después de la entrega.')}</p>
            <h3 class="block__sub">Si llega dañado o incompleto</h3>
            <p>${d('Aquí qué hacer: plazo para avisar, fotos que pedimos y cómo se repone.')}</p>
          </section>
          <section class="block rv" aria-labelledby="rt-form">
            <h2 class="block__title" id="rt-form">Modelo de desistimiento</h2>
            <p>Puedes usar el modelo de formulario o comunicarlo con cualquier declaración clara.</p>
            <p class="block__actions"><span class="ghost is-off" aria-disabled="true"><i class="ph ph-download-simple" aria-hidden="true"></i><span>${d('Aquí el modelo en PDF')}</span></span></p>
            ${tlink(r('terminos/'), 'Términos de venta')}
          </section>
        </div>
      </section>

      <section class="panel" aria-label="Ayuda">
        <div class="wrap">
          <div class="band rv">
            <div>
              <p class="band__k"><i class="ph-light ph-chat-circle" aria-hidden="true"></i>Ayuda</p>
              <h2 class="band__title">¿Quieres devolver <em>un pedido</em>?</h2>
              <p class="band__text">Escríbenos con tu número de pedido y te indicamos los pasos.</p>
            </div>
            ${pill(r('contacto/'), 'Escríbenos')}
          </div>
        </div>
      </section>`,
  };
}

/* ---------- Contacto ---------- */

function contactPage() {
  const channels = [
    ['ph-envelope-simple', 'Email', d('Aquí el email de atención')],
    ['ph-phone', 'Teléfono / WhatsApp', d('Aquí el teléfono')],
    ['ph-clock', 'Horario', d('Aquí el horario de atención')],
    ['ph-buildings', 'Dirección', d('Aquí la dirección de la empresa')],
  ];
  return {
    path: 'contacto/',
    title: 'Contacto',
    desc: 'Escríbenos sobre tu pedido, un producto, una guía o una corrección. Te respondemos en español y en inglés.',
    main: (r) => `
${phead(r, {
  trail: [{ label: 'Contacto' }],
  kicker: 'Contacto',
  title: 'Escríbenos, <em>te respondemos</em>',
  lede: 'Sobre tu pedido, un producto, una guía o una corrección. En español y en inglés.',
})}
      <section class="panel" aria-label="Formulario y canales">
        <div class="wrap contact">
          <form class="card contact__form" data-contact novalidate aria-labelledby="ct-title">
            <h2 class="sum__title" id="ct-title">Envíanos un mensaje</h2>
            <div class="co__row">
              <div class="field"><label for="ct-name">Nombre</label><input id="ct-name" name="name" autocomplete="name" required aria-describedby="ct-name-err"><p class="field__err" id="ct-name-err" hidden></p></div>
              <div class="field"><label for="ct-email">Email</label><input id="ct-email" name="email" type="email" autocomplete="email" required aria-describedby="ct-email-err"><p class="field__err" id="ct-email-err" hidden></p></div>
            </div>
            <div class="co__row">
              <div class="field"><label for="ct-order">Nº de pedido <small>(opcional)</small></label><input id="ct-order" name="order" placeholder="BR-XXXXXX" spellcheck="false"></div>
              <div class="field"><label for="ct-topic">Motivo</label>
                <select id="ct-topic" name="topic"><option>Mi pedido</option><option>Un producto</option><option>Una guía o un estudio</option><option>Una corrección</option><option>Devoluciones</option><option>Otro</option></select>
              </div>
            </div>
            <div class="field"><label for="ct-msg">Mensaje</label><textarea id="ct-msg" name="message" rows="6" required aria-describedby="ct-msg-err"></textarea><p class="field__err" id="ct-msg-err" hidden></p></div>
            <label class="check"><input type="checkbox" name="consent" required><span>${d('Aquí el texto de consentimiento')} <a href="${r('privacidad/')}">Política de privacidad</a></span></label>
            <p class="field__err" data-checks-err hidden>Marca la casilla para continuar.</p>
            <button class="pill" type="submit"><span>Enviar mensaje</span><span class="pill__icon" aria-hidden="true"><i class="ph ph-paper-plane-tilt"></i></span></button>
            <p class="co__msg" data-contact-msg role="status"></p>
          </form>

          <aside class="contact__aside">
            <ul class="card channels">${channels.map(([icon, t, s]) => `
              <li><span class="channels__icon" aria-hidden="true"><i class="ph-light ${icon}"></i></span><div><p class="channels__k">${t}</p><p class="channels__v">${s}</p></div></li>`).join('')}
            </ul>
            <div class="band band--ink band--sm">
              <div>
                <p class="band__k"><i class="ph-light ph-question" aria-hidden="true"></i>Respuesta inmediata</p>
                <p class="band__title">Quizá ya está en las <em>preguntas frecuentes</em></p>
              </div>
              ${pill(r('preguntas-frecuentes/'), 'Ver preguntas', 'ph-arrow-right', 'pill--light pill--sm')}
            </div>
          </aside>
        </div>
      </section>`,
  };
}

/* ---------- Legales ---------- */

function legalPage(L) {
  const list = L.parts.map((t, i) => [`l${i + 1}`, t]);
  return {
    path: `${L.slug}/`,
    title: L.plain,
    desc: L.desc,
    main: (r) => `
${phead(r, {
  trail: [{ label: L.plain }],
  kicker: 'Legal',
  title: L.title,
  lede: d('Aquí el texto legal redactado por tu asesor. Esta página solo marca los apartados.'),
})}
      <section class="panel" aria-label="${L.plain}">
        <div class="wrap pinfo__grid">
          <aside class="pinfo__aside">${toc('En esta página', list)}</aside>
          <div class="block legal">
            ${list.map(([id, t]) => `
            <section id="${id}" aria-labelledby="${id}-t">
              <h2 class="legal__h" id="${id}-t">${t}</h2>
              <p>${d('Aquí el texto de este apartado.')}</p>
              ${L.storage && id === 'l2' ? `
              <p>Este sitio no usa cookies de terceros ni de analítica. Usa el almacenamiento local del navegador para que funcione la tienda:</p>
              <div class="table-wrap">
                <table class="spec">
                  <caption class="sr-only">Almacenamiento que usa este sitio</caption>
                  <thead><tr><th scope="col">Nombre</th><th scope="col">Para qué sirve</th><th scope="col">Tipo</th><th scope="col">Duración</th></tr></thead>
                  <tbody>
                    <tr><th scope="row"><code>lab-cart</code></th><td>Guarda los productos de tu pedido</td><td>Técnico</td><td>Hasta que lo vacías o finalizas el pedido</td></tr>
                    <tr><th scope="row"><code>lab-orders</code></th><td>Guarda tus pedidos para que puedas consultarlos</td><td>Técnico</td><td>${d('Aquí cuánto tiempo se conservan')}</td></tr>
                  </tbody>
                </table>
              </div>` : ''}
            </section>`).join('')}
            <p class="legal__date">Última actualización: ${d('fecha')}</p>
          </div>
        </div>
      </section>`,
  };
}

export const infoPages = [
  guidesHub(),
  ...GUIDES.map(guidePage),
  ...PROFILES.map(profilePage),
  evidencePage(),
  faqPage(),
  shippingPage(),
  returnsPage(),
  contactPage(),
  ...LEGAL.map(legalPage),
];
