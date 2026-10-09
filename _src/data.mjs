// Datos de las subpáginas. Lo que va con d('…') sale con subrayado discontinuo (.draft): es texto
// de muestra que hay que sustituir por el definitivo. Los precios y el envío también son de muestra
// (los mismos que el comparador del index): si cambias un precio aquí, cámbialo también en la tabla
// del index (index.html, sección "Compara los 4 productos").

export const d = (text) => `<span class="draft">${text}</span>`;

export const SITE = {
  brand: 'Brand',
  year: 2026,
  updated: '9 de octubre de 2026',
};

// Envío: los plazos y el umbral son los del index ("Enviamos a tu país"). El coste por debajo del
// umbral no está decidido: 4,90 € es un valor de muestra para que el carrito sume.
export const SHIPPING = {
  days: '3–7 días laborables',
  freeFrom: 150,
  cost: 4.9,
};

/* ---------- Productos ---------- */

export const PRODUCTS = [
  { id: 'p1', n: 1, slug: 'producto-1', name: 'Producto 1', price: 24.9, img: 'assets/product1.webp' },
  { id: 'p2', n: 2, slug: 'producto-2', name: 'Producto 2', price: 34.9, img: 'assets/product1.webp' },
  { id: 'p3', n: 3, slug: 'producto-3', name: 'Producto 3', price: 44.9, img: 'assets/product1.webp' },
  { id: 'p4', n: 4, slug: 'producto-4', name: 'Producto 4', price: 59.9, img: 'assets/product1.webp' },
];

/* ---------- Guías (las 6 tarjetas de "Todo lo que necesitas saber") ----------
   lede y answer son los mismos textos de las tarjetas del index. */

export const GUIDES = [
  {
    slug: 'que-es',
    tag: 'Fundamentos',
    min: 6,
    title: '¿Qué es [producto]?',
    img: 'assets/brain.webp', w: 640, h: 640, fit: 'contain',
    alt: 'Un cerebro formado por cientos de piezas',
    lede: 'Qué es [producto], qué contiene, cómo actúa en el cuerpo y cómo se clasifica en Europa.',
    answer: 'Aquí la respuesta directa, de 60 a 120 palabras y en HTML visible. Empieza con una definición de una sola frase que repita la pregunta: «[Producto] es…». Después explica qué contiene, cuál es su principio activo y en qué formato se presenta. Cuenta cómo actúa en el cuerpo con palabras sencillas, sin prometer curas ni resultados. Indica su clasificación en Europa (medicamento, complemento o producto sanitario) y si necesita receta. Usa la palabra clave principal una o dos veces, de forma natural, y mantén frases cortas: es el texto que Google puede mostrar como fragmento destacado. Cierra invitando a leer la guía completa, donde están las fuentes.',
    sections: [
      '¿Cómo se define [producto]?',
      '¿Qué contiene y cuál es su principio activo?',
      '¿Cómo actúa en el cuerpo?',
      '¿Cómo se clasifica en Europa y necesita receta?',
    ],
  },
  {
    slug: 'para-que-se-usa',
    tag: 'Usos',
    min: 7,
    title: '¿Para qué se usa [producto]?',
    img: 'assets/read-focus.webp', w: 1200, h: 900, focus: '62% 46%',
    alt: 'Un cerebro en movimiento que deja una estela al avanzar',
    lede: 'Los usos de [producto] respaldados por estudios, los que aún son preliminares y para quién está pensado.',
    answer: 'Aquí la respuesta directa, de 60 a 120 palabras y en HTML visible. Responde en la primera frase con los usos principales, aprobados o estudiados, en una lista breve dentro del texto. Separa con claridad lo que está respaldado por estudios de lo que todavía es preliminar, y deja las citas para la guía completa. Explica para qué persona o situación está pensado y en qué casos no es la opción adecuada. Evita prometer curas, plazos o resultados garantizados. Incluye de forma natural las búsquedas más frecuentes, como «[producto] para…», y termina recomendando consultar a un profesional de la salud antes de empezar.',
    sections: [
      '¿Qué usos recoge la ficha oficial?',
      '¿Qué usos respalda la evidencia?',
      '¿Qué usos son todavía preliminares?',
      '¿Para quién no es la opción adecuada?',
    ],
  },
  {
    slug: 'como-se-toma',
    tag: 'Uso y dosis',
    min: 6,
    title: '¿Cómo se toma [producto] y en qué dosis?',
    img: 'assets/read-rest.webp', w: 1200, h: 900, focus: '62% 40%',
    alt: 'Frasco gotero de vidrio ámbar flotando en un cielo suave',
    lede: 'La pauta habitual, cómo se ajusta la dosis, qué hacer si olvidas una toma y cuánto tarda en notarse.',
    answer: 'Aquí la respuesta directa, de 60 a 120 palabras y en HTML visible. Empieza con la pauta general tal como figura en el prospecto: cuántas unidades, cada cuánto tiempo y si se toma con o sin comida. Explica si la dosis cambia según la edad o el peso, qué hacer si se olvida una toma y cuál es la dosis máxima diaria. Aclara cuánto puede tardar en notarse el efecto y durante cuánto tiempo es razonable tomarlo. Recuerda que la dosis concreta la indica un médico o un farmacéutico, y remite al prospecto y a la guía completa para los detalles.',
    sections: [
      '¿Cuál es la pauta habitual según el prospecto?',
      '¿Cambia la dosis según la edad o el peso?',
      '¿Qué hago si olvido una toma?',
      '¿Cuánto tarda en notarse y cuánto tiempo se toma?',
    ],
  },
  {
    slug: 'efectos-secundarios',
    tag: 'Seguridad',
    min: 8,
    title: '¿Qué efectos secundarios e interacciones tiene?',
    img: 'assets/read-calm.webp', w: 1200, h: 900, focus: '42% 50%',
    alt: 'Membrana orgánica clara con un foco de color cálido',
    lede: 'Los efectos secundarios más frecuentes, las señales de alerta y las interacciones con otros medicamentos.',
    answer: 'Aquí la respuesta directa, de 60 a 120 palabras y en HTML visible. Abre con los efectos secundarios más frecuentes y su intensidad habitual, en lenguaje claro. Después indica los poco frecuentes pero importantes y qué señales obligan a dejar de tomarlo y a consultar. Enumera las interacciones conocidas con medicamentos, alcohol u otros suplementos, y explica por qué importan. Mantén un tono neutral y basado en datos, con las fuentes en la guía completa. Termina recordando que cualquier efecto adverso se puede notificar al sistema de farmacovigilancia de cada país y que, ante la duda, conviene preguntar al médico o al farmacéutico.',
    sections: [
      '¿Qué efectos secundarios son frecuentes?',
      '¿Qué señales obligan a dejar de tomarlo?',
      '¿Con qué medicamentos y sustancias interactúa?',
      '¿Cómo se notifica un efecto adverso?',
    ],
  },
  {
    slug: 'quien-no-deberia-usarlo',
    tag: 'Seguridad',
    min: 5,
    title: '¿Quién no debería usar [producto]?',
    img: 'assets/read-shield.webp', w: 1200, h: 900, focus: '50% 44%',
    alt: 'Un cerebro protegido dentro de un escudo de púas',
    lede: 'Contraindicaciones, embarazo y lactancia, y en qué casos conviene consultar antes de tomarlo.',
    answer: 'Aquí la respuesta directa, de 60 a 120 palabras y en HTML visible. Empieza con las contraindicaciones claras según la ficha oficial: alergia a algún componente, embarazo y lactancia, menores de cierta edad o enfermedades concretas. Después menciona quién debe consultar antes de tomarlo, como personas mayores, con enfermedades crónicas o que toman otros medicamentos. Explica en una frase el motivo de cada precaución, sin alarmar. Añade que esta información no sustituye una consulta médica y remite a la guía completa, donde cada caso se desarrolla con sus fuentes. Usa frases cortas para que se lea rápido.',
    sections: [
      '¿Cuáles son las contraindicaciones?',
      '¿Y en el embarazo, la lactancia o en menores?',
      '¿Quién debe consultar antes de tomarlo?',
    ],
  },
  {
    slug: 'mitos-y-verdades',
    tag: 'Mitos',
    min: 6,
    title: 'Mitos y verdades sobre [producto]',
    img: 'assets/read-myths.webp', w: 1200, h: 900, focus: '52% 40%',
    alt: 'Blíster de comprimidos sobre un fondo claro',
    lede: 'Los mitos más repetidos sobre [producto], contrastados uno a uno con fuentes fiables.',
    answer: 'Aquí la respuesta directa, de 60 a 120 palabras y en HTML visible. Recoge los tres o cuatro mitos más repetidos sobre [producto] y responde a cada uno con una frase clara: mito o verdad, y por qué. Elige los que la gente busca de verdad; puedes verlos en «Otras preguntas de los usuarios» de Google. Apoya cada respuesta en una fuente fiable, citada en la guía completa. Mantén un tono cercano y sin burlas, porque quien pregunta suele tener una duda legítima. Termina con una idea práctica: dónde comprobar la información oficial y cuándo conviene preguntar a un profesional antes de decidir.',
    myths: true,
    sections: [
      'Aquí el mito más repetido',
      'Aquí el segundo mito',
      'Aquí el tercer mito',
      '¿Cómo detectar información engañosa?',
    ],
  },
];

/* ---------- Perfiles ("A quién va dirigido") ----------
   Áreas, títulos e imágenes: los del carrusel del index. Los perfiles 4 a 6 siguen siendo de muestra. */

export const PROFILES = [
  {
    slug: 'neuro-regulacion', n: '01', area: 'Neuro-regulación', icon: 'ph-microscope',
    title: 'Estrés crónico, sobrecarga cognitiva y dispersión mental',
    img: 'assets/aud-focus.webp', w: 800, h: 800, fig: 'Fig. 01 · Soma',
    alt: 'Busto de escultura blanca con un anillo de luz alrededor de la frente, en un laboratorio',
  },
  {
    slug: 'cronobiologia-y-sueno', n: '02', area: 'Cronobiología y sueño', icon: 'ph-moon-stars',
    title: 'Insomnio de conciliación y fragmentación del sueño profundo',
    img: 'assets/aud-sleep.webp', w: 800, h: 800, fig: 'Fig. 02 · Hypnos',
    alt: 'Figura blanca flotando en postura de descanso, con puntos de luz a lo largo del cuerpo',
  },
  {
    slug: 'modulacion-inflamatoria', n: '03', area: 'Modulación inflamatoria', icon: 'ph-heartbeat',
    title: 'Dolor osteoarticular, rigidez matutina y tensión muscular',
    img: 'assets/aud-helix.webp', w: 800, h: 800, fig: 'Fig. 03 · Cinética',
    alt: 'Escultura blanca de una doble hélice entrelazada con nervaduras de hoja',
  },
  {
    slug: 'perfil-4', n: '04', area: null, icon: 'ph-shield-check',
    title: null,
    img: 'assets/read-shield.webp', w: 1200, h: 900, fig: 'Fig. 04 · Égida',
    alt: 'Un cerebro blanco protegido dentro de un escudo de púas',
  },
  {
    slug: 'perfil-5', n: '05', area: null, icon: 'ph-lightning',
    title: null,
    img: 'assets/read-focus.webp', w: 1200, h: 900, fig: 'Fig. 05 · Impulso',
    alt: 'Un cerebro blanco en movimiento que deja una estela al avanzar',
  },
  {
    slug: 'perfil-6', n: '06', area: null, icon: 'ph-brain',
    title: null,
    img: 'assets/aud-psique.webp', w: 800, h: 800, fig: 'Fig. 06 · Psique',
    alt: 'Escultura de un cerebro de porcelana blanca sobre fondo claro',
  },
];

/* ---------- Estudios (las 6 fichas de "Estudios e información científica") ----------
   Todo es de muestra: en Stitch venía inventado. Cada ficha debe sustituirse por un estudio real
   con su DOI o PMID comprobado. */

export const STUDIES = [
  {
    tag: 'Neurología y sueño', year: '2023',
    title: 'Interacción de formulaciones botánicas ricas en terpenos y receptores CB1/CB2 en la latencia del sueño profundo.',
    text: 'Autores e institución. Resumen de una o dos frases: diseño del estudio, número de participantes y qué se midió.',
    ids: [['DOI', '10.xxxx/xxxxx'], ['PMID', 'XXXXXXXX']], link: 'Ver estudio en PubMed',
  },
  {
    tag: 'Farmacocinética', year: '2023',
    title: 'Biodisponibilidad y farmacocinética de tinturas oleosas purificadas frente a extractos crudos.',
    text: 'Autores e institución. Resumen: qué se comparó (por ejemplo, absorción sublingual con aceite MCT) y el resultado principal con su cifra.',
    ids: [['DOI', '10.xxxx/xxxxx'], ['PMID', 'XXXXXXXX']], link: 'Ver ficha en la revista',
  },
  {
    tag: 'Antiinflamatorio', year: '2022',
    title: 'Efecto de cannabinoides no psicotrópicos sobre citoquinas proinflamatorias (IL-6, TNF-α).',
    text: 'Autores e institución. Resumen: tipo de estudio (en humanos, animales o in vitro), qué mecanismo se observó y en qué condiciones.',
    ids: [['DOI', '10.xxxx/xxxxx'], ['PMID', 'XXXXXXXX']], link: 'Consultar en NCBI',
  },
  {
    tag: 'Seguridad y metabolismo', year: '2023',
    title: 'Seguridad hepática e interacciones con las enzimas del citocromo P450 a dosis habituales.',
    text: 'Autores e institución. Resumen: duración del seguimiento, enzimas estudiadas (CYP3A4, CYP2C19) y qué interacciones conviene vigilar.',
    ids: [['DOI', '10.xxxx/xxxxx'], ['PMID', 'XXXXXXXX']], link: 'Ver en ScienceDirect',
  },
  {
    tag: 'Homeostasis celular', year: '2024',
    title: 'Tono endocannabinoide en situaciones de fatiga y estrés laboral mantenido.',
    text: 'Autores e institución. Resumen: qué se midió en sangre (anandamida, 2-AG) y qué relación se encontró con el estrés.',
    ids: [['DOI', '10.xxxx/xxxxx'], ['PMID', 'XXXXXXXX']], link: 'Leer el estudio abierto',
  },
  {
    tag: 'Ensayo clínico en curso', trial: true,
    title: 'Eficacia en personas con ansiedad e insomnio (fase III).',
    text: 'Diseño del ensayo, duración del seguimiento y qué se evalúa (por ejemplo, tiempo hasta dormirse y calidad del despertar).',
    ids: [['Registro', 'NCTXXXXXXXX'], ['Estado', 'Aquí el estado · fase']], link: 'Consultar el protocolo',
  },
];

/* ---------- Países de envío (zonas del index) ---------- */

export const COUNTRIES = [
  ['DE', 'Alemania', 'ue'], ['AT', 'Austria', 'ue'], ['BE', 'Bélgica', 'ue'], ['BG', 'Bulgaria', 'ue'],
  ['CY', 'Chipre', 'ue'], ['CZ', 'Chequia', 'ue'], ['HR', 'Croacia', 'ue'], ['DK', 'Dinamarca', 'ue'],
  ['SK', 'Eslovaquia', 'ue'], ['SI', 'Eslovenia', 'ue'], ['ES', 'España', 'ue'], ['EE', 'Estonia', 'ue'],
  ['FI', 'Finlandia', 'ue'], ['FR', 'Francia', 'ue'], ['GR', 'Grecia', 'ue'], ['HU', 'Hungría', 'ue'],
  ['IE', 'Irlanda', 'ue'], ['IT', 'Italia', 'ue'], ['LV', 'Letonia', 'ue'], ['LT', 'Lituania', 'ue'],
  ['LU', 'Luxemburgo', 'ue'], ['MT', 'Malta', 'ue'], ['NL', 'Países Bajos', 'ue'], ['PL', 'Polonia', 'ue'],
  ['PT', 'Portugal', 'ue'], ['RO', 'Rumanía', 'ue'], ['SE', 'Suecia', 'ue'],
  ['GB', 'Reino Unido', 'out'], ['CH', 'Suiza', 'out'], ['NO', 'Noruega', 'out'], ['IS', 'Islandia', 'out'],
];

/* ---------- Preguntas frecuentes (subpágina) ----------
   `a` recibe la función r() para enlazar con rutas relativas desde la página donde se pinte. Las
   8 del index están aquí con la misma respuesta. */

export const FAQ_GROUPS = [
  {
    id: 'pedido', title: 'Pedido y pago', icon: 'ph-hand-coins',
    items: [
      { q: '¿Cuándo pago mi pedido?', a: (r) => `<p>Cuando lo recibes: no pagas nada por adelantado.</p><p>${d('Aquí los métodos que acepta el transportista en la puerta (efectivo, tarjeta, móvil).')}</p><p><a href="${r('#pedido')}">Cómo funciona tu pedido, paso a paso</a></p>` },
      { q: '¿Necesito crear una cuenta para comprar?', a: (r) => `<p>No. Haces el pedido sin registrarte y luego consultas su estado con tu número de pedido y tu email.</p><p><a href="${r('cuenta/')}">Consultar mi pedido</a></p>` },
      { q: '¿Por qué me pedís el teléfono?', a: () => `<p>${d('Aquí para qué se usa el teléfono: confirmar el pedido antes de enviarlo y que el transportista pueda avisarte.')}</p>` },
      { q: '¿Puedo cambiar o cancelar mi pedido?', a: (r) => `<p>${d('Aquí hasta cuándo se puede cambiar o cancelar un pedido y cómo pedirlo.')}</p><p><a href="${r('contacto/')}">Escríbenos</a></p>` },
      { q: '¿Recibiré una factura?', a: () => `<p>${d('Aquí cómo y cuándo se envía la factura, y cómo pedirla a nombre de una empresa.')}</p>` },
    ],
  },
  {
    id: 'envio', title: 'Envío y entrega', icon: 'ph-truck',
    items: [
      { q: '¿Cuánto tarda la entrega?', a: () => `<p>Entre 3 y 7 días laborables, con seguimiento del envío.</p><p>${d('Aquí los plazos por país, si cambian, y cuándo recibes el número de seguimiento.')}</p>` },
      { q: '¿A qué países enviáis?', a: (r) => `<p>A toda la Unión Europea desde nuestro almacén en la UE, y a Reino Unido, Suiza, Noruega e Islandia.</p><p>Fuera de la UE el envío puede pasar aduana. <a href="${r('envios/')}">Ver envíos y plazos por país</a></p>` },
      { q: '¿Cuánto cuesta el envío?', a: () => `<p>Es gratis a partir de 150&nbsp;€.</p><p>${d('Aquí el coste del envío por debajo de esa cifra.')}</p>` },
      { q: '¿Cómo es el embalaje?', a: () => `<p>Embalaje exterior de cartón crudo neutro, sin distintivos, marcas ni alusiones al contenido.</p>` },
      { q: '¿Puedo recibirlo en un punto de recogida?', a: () => `<p>Al hacer el pedido eliges domicilio particular, punto de recogida o casillero automatizado.</p><p>${d('Aquí si el pago al recibir está disponible en puntos de recogida y casilleros.')}</p>` },
      { q: '¿Qué pasa si no estoy en casa cuando llega?', a: () => `<p>${d('Aquí cuántos intentos de entrega hace el transportista y cómo reprogramarla.')}</p>` },
      { q: '¿Cómo sigo mi envío?', a: (r) => `<p>${d('Aquí cuándo y cómo llega el número de seguimiento (email o SMS).')}</p><p><a href="${r('cuenta/')}">Consultar mi pedido</a></p>` },
    ],
  },
  {
    id: 'devoluciones', title: 'Devoluciones', icon: 'ph-arrow-u-up-left',
    items: [
      { q: '¿Puedo devolver un pedido?', a: (r) => `<p>Sí: tienes 14 días para desistir de una compra a distancia.</p><p>${d('Aquí cómo ejercerlo y las excepciones por motivos de salud o higiene.')}</p><p><a href="${r('devoluciones/')}">Devoluciones y desistimiento</a></p>` },
      { q: '¿Qué hago si el pedido llega dañado o incompleto?', a: (r) => `<p>${d('Aquí qué hacer: plazo para avisar, fotos que pedimos y cómo se repone.')}</p><p><a href="${r('contacto/')}">Escríbenos</a></p>` },
      { q: '¿Cuándo recibo el reembolso?', a: () => `<p>${d('Aquí el plazo y el método del reembolso si pagaste al recibir.')}</p>` },
    ],
  },
  {
    id: 'producto', title: 'Producto y uso', icon: 'ph-pill',
    items: [
      { q: '¿Cómo elijo entre los 4 productos?', a: (r) => `<p>Compáralos en una tabla y responde a tres preguntas prácticas en «Ayúdame a elegir».</p><p><a href="${r('#comparar')}">Comparar los 4 productos</a></p>` },
      { q: '¿Necesito receta?', a: () => `<p>${d('Aquí si requiere receta según la clasificación del producto y el país de entrega.')}</p>` },
      { q: '¿Puedo tomarlo con otros medicamentos?', a: (r) => `<p>Consulta antes a tu médico o farmacéutico.</p><p>${d('Aquí un resumen de las interacciones según la ficha oficial.')}</p><p><a href="${r('guias/efectos-secundarios/')}">Efectos secundarios e interacciones</a></p>` },
      { q: '¿Quién no debería usarlo?', a: (r) => `<p>${d('Aquí un resumen de las contraindicaciones de la ficha oficial.')}</p><p><a href="${r('guias/quien-no-deberia-usarlo/')}">¿Quién no debería usar [producto]?</a></p>` },
      { q: '¿Dónde veo la composición de cada producto?', a: (r) => `<p>En la ficha de cada producto, en «Composición» y en la ficha técnica.</p><p><a href="${r('productos/')}">Ver los productos</a></p>` },
      { q: '¿Dónde veo el análisis de mi lote?', a: () => `<p>${d('Aquí dónde está el número de lote en el envase y cómo consultar su análisis.')}</p>` },
    ],
  },
];

/* ---------- Páginas legales ---------- */

export const LEGAL = [
  {
    slug: 'aviso-legal', title: 'Aviso <em>legal</em>', plain: 'Aviso legal',
    desc: 'Datos del titular de la tienda, condiciones de uso del sitio, propiedad intelectual, responsabilidad y ley aplicable.',
    parts: ['Titular del sitio', 'Contacto', 'Datos registrales', 'Condiciones de uso', 'Propiedad intelectual', 'Responsabilidad', 'Ley aplicable'],
  },
  {
    slug: 'privacidad', title: 'Política de <em>privacidad</em>', plain: 'Política de privacidad',
    desc: 'Cómo tratamos tus datos: responsable, finalidades, base jurídica, destinatarios, plazos de conservación y tus derechos.',
    parts: ['Responsable del tratamiento', 'Datos que tratamos', 'Finalidades y base jurídica', 'Destinatarios', 'Transferencias internacionales', 'Plazos de conservación', 'Tus derechos', 'Reclamaciones'],
  },
  {
    slug: 'cookies', title: 'Política de <em>cookies</em>', plain: 'Política de cookies',
    desc: 'Qué cookies y almacenamiento local usa este sitio, para qué sirven y cómo gestionarlos.',
    parts: ['Qué son las cookies', 'Qué usa este sitio', 'Cómo gestionarlas'],
    storage: true,
  },
  {
    slug: 'terminos', title: 'Términos de <em>venta</em>', plain: 'Términos de venta',
    desc: 'Condiciones de compra: pedido, precios e IVA, pago al recibir, entrega, desistimiento, garantía y ley aplicable.',
    parts: ['Objeto', 'Pedidos', 'Precios e IVA', 'Pago al recibir', 'Entrega', 'Desistimiento', 'Garantía', 'Ley y jurisdicción'],
  },
];
