# Auditoría completa de new-store (Cannabis Lab / "Brand")

Fecha: 9 de octubre de 2026 · Alcance: `index.html` + 31 subpáginas generadas + `adn/` (33 HTML), `_src/`, `site.css`, `styles.css`, 15 scripts, renderizado en escritorio (1440) y móvil (390).
Objetivo que me diste: buena posición en Google, que el cliente se sienta confiado y seguro, que piense lo mínimo, y un **look de laboratorio** sólido, limpio y simple.

Cómo leerlo: primero el **Veredicto** y los **8 bloqueantes**. Después, cada área con sus hallazgos y qué hacer. Al final, un plan por fases y plantillas de código para que lo implementes tú.

Prioridades: **BLOQUEANTE** (no publicar sin esto) · **ALTO** · **MEDIO** · **BAJO**.

---

## 1. Veredicto

El sitio es un **prototipo muy bien construido por dentro y todavía equivocado por fuera**.

- **Por dentro** (código, estructura, accesibilidad básica, sistema de generación `_src/`): sobresaliente para un prototipo. 0 enlaces rotos, una sola fuente de datos, HTML semántico, `prefers-reduced-motion` respetado, formularios bien etiquetados, páginas transaccionales con `noindex`.
- **Por fuera** (lo que ven el cliente y Google): hoy **no responde ni una de las cinco preguntas** que un visitante nuevo se hace en 5 segundos: *¿qué venden?, ¿quién está detrás?, ¿puedo fiarme?, ¿cuánto cuesta?, ¿qué hago ahora?* La portada ni siquiera dice que vendes aceites de CBD (esa palabra solo aparece en la meta description).
- **El diseño no parece un laboratorio.** Parece una marca boutique de bienestar/tecnología: crema cálido, radios enormes, cursiva serif de acento, objetos 3D flotantes, un cerebro de partículas, esculturas de mármol, palabras en órbita. Es bonito, pero comunica "estética", y tu objetivo es comunicar "rigor".
- **Riesgo mayor que cualquier tema de diseño o SEO:** el texto de la portada y la arquitectura de "perfiles" hacen **promesas de salud** (dolor, inflamación, insomnio) sobre un producto de CBD. En la UE eso es un problema legal, de reputación y de posicionamiento a la vez (ver 2.1).

### Notas orientativas (mi criterio, no una métrica oficial)

| Área | Hoy | Comentario |
|---|---|---|
| Calidad de ejecución (código, responsive, a11y básica) | 8/10 | Lo mejor del proyecto |
| Base técnica SEO (HTML, enlaces, slugs, noindex) | 6/10 | Buena base, falta casi todo lo "de cara a Google" |
| Metadatos y datos estructurados | 2/10 | 0/33 con canonical y Open Graph; home con title "X" |
| Contenido y E-E-A-T (autoría, fuentes, empresa) | 1/10 | Vacío por diseño: 1.146 bloques de muestra |
| Claridad del mensaje / "pensar lo mínimo" | 4/10 | Bonito pero abstracto; el comparador llega antes que el producto |
| Confianza visible | 3/10 | Sin empresa, sin análisis de lote, sin reseñas, sin fotos reales |
| Look de laboratorio | 4/10 | Premium-boutique, no clínico |
| Rendimiento | 6/10 | Hero de 433 KB mostrado a 275×507 px; recursos de terceros bloqueantes (sin medida de laboratorio, ver 9) |
| Riesgo regulatorio del texto | Alto | Sin evaluar por mí como abogado; ver 2.1 |

---

## 2. Los 8 bloqueantes antes de publicar

### 2.1 BLOQUEANTE: decide la categoría legal del producto y deja que mande sobre todo el texto

Lo que verifiqué hoy (fuentes al final): a octubre de 2026 el CBD **para ingerir** (aceites, gominolas, complementos) **no está autorizado como nuevo alimento en la UE**. AESAN sigue tratándolo como novel food y publicó el 12 de febrero de 2026 que la mayoría de incertidumbres de seguridad persisten. En septiembre de 2026 EFSA emitió su **primer dictamen positivo**, pero para un complemento concreto, con un tope de hasta 2 mg/día, y la Comisión y los Estados miembros aún no lo han convertido en autorización. El uso **tópico** (cosmética) sí se comercializa. Además, las alegaciones de salud sobre alimentos requieren autorización previa (Reglamento 1924/2006; esto último es conocimiento general mío, no lo verifiqué en esta sesión).

Qué significa para tu sitio, tal como está escrito hoy:

| Dónde | Texto actual | Problema |
|---|---|---|
| Hero (`index.html:1328`, y el HTML inicial `index.html:291`) | "valorado por su ayuda frente al dolor, la inflamación y el insomnio" | Alegación terapéutica explícita |
| Hero, producto 3 | "busca un alivio más intenso" | Alegación de eficacia |
| Hero, botón | "Duración del efecto" | Presupone efecto |
| Home | Chip "Indicaciones terapéuticas" | Lenguaje de medicamento |
| Home / nav | "Protocolo de adquisición clínica", "Explorar protocolo clínico", "seguridad médica" | Lenguaje clínico para un producto de consumo |
| Perfiles | "Insomnio de conciliación…", "Dolor osteoarticular, rigidez matutina…", "Estrés crónico…" | Páginas organizadas por **enfermedad/síntoma** |
| Ficha técnica / FAQ | "Nº de registro", "prospecto", "ficha oficial", "¿Necesito receta?", "dosis" | Implican registro como medicamento/complemento que quizá no tienes |

**Qué hacer (en este orden):**
1. Define, con un asesor regulatorio, **qué es legalmente cada producto** (cosmético tópico, complemento con ingrediente autorizado, medicamento registrado, otro). No es opinión mía: de eso depende qué puedes decir, vender y enviar.
2. Redacta una **lista corta de lo que SÍ puedes afirmar** (composición, concentración, origen, método de extracción, análisis por lote) y úsala como única fuente de verdad del copy. Todo lo demás son hechos medibles, no beneficios.
3. Reescribe la arquitectura por **tema/educación**, no por síntoma (ver 4.2).
4. El tono "protocolo clínico" choca además con "Envío discreto, sin alusiones al contenido": juntos suenan a producto que hay que esconder. La privacidad del embalaje es un servicio legítimo, pero no debe ser un pilar de la portada ni del menú (ver 5.4).

> No soy abogado y la categoría de tus productos no está en el repo (solo "Aceites de CBD" en la meta description). Trátalo como una **puerta de decisión**, no como un veredicto jurídico.

### 2.2 BLOQUEANTE: la portada no dice qué vendes

- `<title>` = **"X"** (1 carácter). `index.html:6`.
- Meta description = "Cannabis Lab. Aceites de CBD." (29 caracteres).
- `<h1>` = "Producto 1" (cambia con JS al pulsar la flecha) y **va después de un `<h2>`** ("El escudo que necesitas…") en el orden del documento.
- El primer pantallazo en móvil (390×844) es un eslogan abstracto y un corredor dentro de un anillo de púas. **No se ve producto, precio ni botón** hasta el segundo pantallazo.
- En escritorio la barra de navegación está "aparcada": **no se ven Tienda / Aprende / Ayuda** hasta pasar el hero. Un visitante nuevo no tiene menú.

Resultado del test de 5 segundos (te propongo hacerlo con 5 personas reales): hoy fallaría *qué es*, *quién lo vende* y *por qué confiar*.

### 2.3 BLOQUEANTE: casi nada de lo que Google necesita para entender y mostrar tus páginas

Medido sobre las 33 páginas:

| Elemento | Estado |
|---|---|
| `<link rel="canonical">` | **0/33** |
| Open Graph / Twitter cards | **0/33** |
| `hreflang` | **0/33** (ver 2.7) |
| Datos estructurados | Solo `Product` (4 fichas) y `Article` (6 guías), ambos casi vacíos. Home: ninguno |
| `robots.txt`, `sitemap.xml`, `404.html` | **No existen** |
| Títulos con `[producto]` literal | 6 páginas |
| Títulos de perfil de 82 a 90 caracteres | 3 (Google corta en ~60) |
| Descripción del home | 29 caracteres (ideal 120 a 155) |
| Páginas indexables que son puro texto de muestra | `perfiles/perfil-4`, `5`, `6` + 6 guías + 4 fichas |

Detalle y plantillas en la sección 4.

### 2.4 BLOQUEANTE: el texto de muestra es indexable (y es feo para Google)

- El **56 %** del texto visible del home y entre el **40 y el 53 %** de fichas y guías son bloques `.draft` (1.146 en total).
- Muchas "respuestas rápidas" contienen **instrucciones para ti**, no contenido: "Usa la palabra clave principal una o dos veces… es el texto que Google puede mostrar como fragmento destacado". Si se publicara así, Google indexaría esas instrucciones.
- Las 6 fichas de **estudios** son inventadas (README: "en Stitch venía inventado") con DOI `10.xxxx/xxxxx`. Publicar estudios inventados en un tema de salud es el peor error posible de confianza (y puede ser publicidad engañosa).
- El prototipo ya está **accesible públicamente** en GitHub Pages (el fetch devolvió el contenido con los marcadores). Si Google lo indexa, tendrás duplicados y un `X` como resultado de marca antes de lanzar.

**Qué hacer:**
- Añade `<meta name="robots" content="noindex">` a **todas** las páginas hasta el lanzamiento (o protege el sitio). Quítalo en bloque el día del lanzamiento.
- Añade una **guardia en `build.mjs`** que falle si una página indexable aún contiene `class="draft"` o `[producto]` (código en 8.4).
- Borra o saca del sitio `adn/` (es una página de pruebas), `perfiles/perfil-4/5/6` y las 6 fichas de estudio falsas hasta tener estudios reales.

### 2.5 BLOQUEANTE: no hay "quién está detrás"

Para un tema de salud (Google lo clasifica como YMYL, "Your Money or Your Life") la empresa y las personas **son** la confianza.

- Falta una página **Sobre nosotros / Nuestro laboratorio** (no existe).
- Falta una **política editorial** (cómo se escribe y se revisa) y **páginas de autor/revisor** con credenciales.
- El pie tiene "Aquí la razón social, el NIF y la dirección". En España la identificación del titular en la web es una obligación legal (LSSI, art. 10; dato mío de conocimiento general, confírmalo con tu asesor), además de un factor de confianza.
- `contacto/` tiene email, teléfono, horario y dirección sin rellenar.
- No hay un solo dato verificable de laboratorio: sin certificado de análisis (COA) por lote, sin acreditación, sin fabricante, sin lote consultable.

### 2.6 BLOQUEANTE (decisión de negocio): solo "pago al recibir"

- Es una buena promesa de confianza ("hoy no pagas nada") y el sitio la comunica con claridad. Pero es **el único método**.
- Muchos procesadores de pago restringen el CBD, y es probable que ese sea el motivo del contra-reembolso. No lo verifiqué para tus procesadores concretos. Si es así, dilo con naturalidad ("pagas cuando lo tienes en la mano") y estudia procesadores que sí lo admitan, porque el contra-reembolso baja la conversión y sube los rechazos en destino.
- El envío gratis es **desde 150 €** y los productos cuestan 24,90 a 59,90 €. Casi todos los pedidos pagarán el envío (importe aún sin definir). Esto desanima. El estándar de mercado suele ser un umbral de 50 a 80 € (juicio mío, no verificado aquí).

### 2.7 BLOQUEANTE (decisión): ¿a qué mercado vendes?

- El sitio está solo en **español** pero envía a **31 países** (Alemania, Polonia, Chequia, Países Bajos…). Un alemán no comprará en una web en español, y Google no mostrará esta web a alemanes.
- Para posicionar, elige **un mercado principal** (lo natural: España) y di claramente "Enviamos desde [ciudad/país]". Si más adelante añades idiomas, entonces sí `hreflang` y un dominio/subcarpeta por idioma.
- "Cannabis Lab" como nombre diluye el SEO ("cannabis lab" también busca laboratorios de análisis) y ata la marca a una palabra que plataformas y procesadores suelen restringir. Hoy conviven **4 nombres**: "Brand" (título y pie), "Cannabis Lab" (meta y `aria-label` del hero), "Laboratorio" (`adn/`) y "New store" (repo). Decide el nombre antes de tocar nada más: afecta al logo, al dominio y a todos los `<title>`.

### 2.8 BLOQUEANTE (contenido): las imágenes no representan el producto

- El producto de la portada es un **blíster de pastillas "PRODUCTO DE PRUEBA"**; lo que vendes son aceites. Los 4 productos usan la misma foto.
- Las imágenes de "A quién va dirigido" son esculturas de mármol generadas (un busto con halo, una figura flotante, un cerebro de porcelana). Son decorativas y comunican **galería de arte**, no laboratorio.
- No hay una sola foto real: ni del frasco, ni de la etiqueta, ni del laboratorio, ni del equipo, ni de un COA.

---

## 3. Lo que está muy bien (consérvalo)

- **Arquitectura de contenido en `_src/`:** una sola fuente de verdad para precios, envíos, guías y FAQ; `build.mjs` regenera todo y comprueba enlaces (0 rotos en mi comprobación independiente de las 33 páginas).
- **Rutas relativas**: el sitio funciona en subcarpeta y en raíz.
- **Páginas de compra/consulta con `noindex`** (carrito, checkout, confirmado, cuenta). Correcto.
- **HTML semántico y accesibilidad base:** enlace "Saltar al contenido", `aria-label` en botones de icono, tablas con `scope`, `fieldset/legend`, `focus-visible`, `prefers-reduced-motion` también en JS, botón de pausa de la órbita, `text-wrap`, `scroll-margin`, cero `transition: all`, imágenes con ancho y alto (cero CLS medido en mi sesión), `Intl.NumberFormat` para el euro.
- **Plantilla de ficha de producto:** descripción, composición, modo de uso, advertencias, conservación, ficha técnica, estudios y preguntas. Es la estructura correcta para un producto regulado. Solo falta llenarla con datos reales.
- **Bloque "Respuesta rápida"** al inicio de cada guía + índice lateral + migas + "Escrito por / Revisión médica / Actualizada": diseñado a propósito para fragmentos destacados y E-E-A-T.
- **Páginas de envíos y devoluciones** claras, compra sin cuenta y consulta de pedido sin registro.
- **Copy honesto en lo transaccional:** "Hoy no pagas nada", "14 días para desistir", precios con IVA incluido.
- **Escape de datos de usuario** al pintar pedidos desde `localStorage` (`esc()` en `store.js`).

---

## 4. Posicionamiento en Google (SEO)

### 4.1 Cómo funciona esto en tu nicho (lo que aprendí y verifiqué)

- Salud es **YMYL**: Google evalúa con más rigor quién escribe, con qué credenciales, con qué fuentes y cuándo se actualizó. Los *Search Quality Rater Guidelines* (edición de septiembre de 2025 según una guía secundaria; no pude leer el documento oficial) piden contenido médico escrito o revisado por personas con experiencia o acreditación, y revisado y actualizado con regularidad. Los evaluadores no fijan el ranking, pero sirven para calibrar los algoritmos.
- **Los resultados enriquecidos de FAQ ya no existen:** en 2023 se limitaron a sitios oficiales y de salud, y según Search Engine Journal Google los está retirando por completo (previsto junio de 2026; no hallé la fecha exacta de finalización). Mantén las FAQ en el HTML porque ayudan a la persona, pero **no esperes estrellas ni desplegables en Google** por añadir `FAQPage`.
- Para fichas de producto sigue vigente el marcado `Product` con `offers`, y Google documenta `hasMerchantReturnPolicy` y `shippingDetails` para mostrar devoluciones y envío junto al resultado.
- Combinación realista para este nicho: **contenido educativo sin promesas** (qué es el CBD, qué dice la ley en España, cómo leer un análisis de laboratorio, cómo elegir concentración, qué es el THC y por qué importa) que construye autoridad temática sin exponerte legalmente, y fichas de producto muy transparentes.

### 4.2 Estructura de sitio recomendada (por intención de búsqueda, no por síntoma)

| Intención | URL sugerida | Contenido |
|---|---|---|
| Marca / inicio | `/` | Qué vendes, prueba, 4 productos, calidad, guías, FAQ |
| Comprar | `/aceites-cbd/` + `/aceites-cbd/<nombre-descriptivo>/` | Categoría + 4 fichas con slug que describa (concentración o formato), no `producto-1` |
| Confiar | `/calidad/` y `/calidad/analisis-de-lote/` | Certificados por lote, acreditación, proceso. **Tu mejor activo "de laboratorio"** |
| Aprender | `/guias/…` (conserva las 6, reescritas sin promesas) | Fundamentos, legalidad, cómo elegir, cómo leer un COA, seguridad, mitos |
| Quién somos | `/sobre-nosotros/`, `/equipo/<persona>/`, `/politica-editorial/` | Empresa, personas con credenciales, cómo se revisa |
| Ayuda | `/envios/`, `/devoluciones/`, `/preguntas-frecuentes/`, `/contacto/` | Ya existen |
| Legal | `/aviso-legal/`, `/privacidad/`, `/cookies/`, `/terminos/` | Ya existen |

Quitar o fusionar: `/perfiles/*` (6 páginas; 3 vacías; organizadas por síntoma), `/adn/` (pruebas) y `/evidencia/` hasta que tenga estudios reales (puede vivir dentro de `/guias/`).

### 4.3 Títulos y descripciones (plantilla)

Formato de título (máx. ~60 caracteres): **Concepto principal + diferenciador · Marca**.

| Página | Hoy | Dirección (ejemplo de estructura, no texto final) |
|---|---|---|
| Home | `X` | `Aceites de CBD con análisis por lote · <Marca>` |
| Categoría | `Nuestros 4 productos · Brand` | `Aceite de CBD: gama, concentración y precios · <Marca>` |
| Ficha | `Producto 1 · Brand` | `Aceite de CBD <X> % (<N> ml) · <Marca>` |
| Guía | `¿Qué es [producto]? · Brand` | `¿Qué es el CBD y qué dice la ley en España? · <Marca>` |
| Perfil | `Cronobiología y sueño: insomnio de conciliación y fragmentación del sueño profundo · Brand` (90 car.) | Eliminar la página o reescribir sin síntoma |

Meta descriptions de 120 a 155 caracteres con un dato verificable y una acción. Las 4 fichas comparten la misma descripción salvo el nombre: cada una debe ser única. Bug a corregir en `_src/pages-info.mjs`: en perfiles sin título la descripción sale "Perfil 04 · Perfil 04: …".

### 4.4 Plantilla de `<head>` por página (añade en `_src/layout.mjs`)

```html
<title>…</title>
<meta name="description" content="…">
<link rel="canonical" href="https://TU-DOMINIO/ruta/">
<meta property="og:type" content="website"> <!-- article en guías; product en fichas -->
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="<Marca>">
<meta property="og:title" content="…">
<meta property="og:description" content="…">
<meta property="og:url" content="https://TU-DOMINIO/ruta/">
<meta property="og:image" content="https://TU-DOMINIO/assets/og/<pagina>.jpg"> <!-- 1200×630 -->
<meta name="twitter:card" content="summary_large_image">
```

Las URL canónicas y OG deben ser **absolutas**. Hoy el sitio está en una subcarpeta de GitHub Pages (`/new-store/`): para posicionar necesitas dominio propio en la raíz. `SITE` en `data.mjs` puede llevar `origin` y `layout.mjs` calcular la canónica desde `path`.

### 4.5 Datos estructurados que sí merece la pena

- **Todas las páginas:** `Organization` (nombre, URL, logo, `sameAs`, `contactPoint`, `hasMerchantReturnPolicy`) y `WebSite`. Migas con `BreadcrumbList` (ya tienes migas visibles).
- **Ficha de producto** (hoy solo `name`, `sku`, `offers.price`): completa con `image`, `description`, `brand`, `gtin`/`mpn` si existen, y en `offers`: `url`, `priceValidUntil`, `itemCondition`, `shippingDetails`, y devoluciones. **`aggregateRating` solo con reseñas reales**; nunca inventes.
- **Guías** (hoy solo `headline` e `inLanguage`): añade `author` (Person con `jobTitle` y `sameAs`), `reviewedBy`, `datePublished`, `dateModified`, `image`, `publisher`. Para salud puedes usar `MedicalWebPage` si procede, pero valídalo con tu asesor.
- Valida cada plantilla con el Rich Results Test y el validador de Schema.org antes de publicar.

### 4.6 Rastreo e indexación

- Crea `robots.txt` (permitir todo menos `/carrito/`, `/checkout/`, `/cuenta/`, `/pedido-confirmado/`, y enlaza el sitemap) y `sitemap.xml` generado por `build.mjs` (solo páginas indexables, con `lastmod`). Plantillas en 8.3.
- Crea `404.html` con tu marca: GitHub Pages lo sirve solo si existe, y es un punto de recuperación de visitas.
- Alta en **Google Search Console** (verificación DNS) y envío del sitemap.

### 4.7 Encabezados y contenido

- **Un solo `<h1>` estático** por página con el concepto principal. Hoy el del home lo cambia JavaScript (al pulsar la flecha el `<h1>` pasa de "Producto 1" a "Producto 2"…). Haz que el `<h1>` sea la propuesta de valor y que el nombre del producto vaya en `<h2>`/`<p>`.
- Debe ser el **primer encabezado** del documento. Hoy un `<h2>` lo precede.
- Las 4 fichas son la misma plantilla con la misma foto: Google las verá como contenido casi duplicado hasta que cada una tenga composición, concentración, fotos y preguntas propias.
- Imágenes: nombres de archivo descriptivos (`aceite-cbd-10-frasco-30ml.webp`, no `product1.webp`) y `alt` que describa lo que se ve, no poesía ("Un cerebro formado por cientos de piezas").
- Enlazado interno: el menú te da 31 enlaces entrantes a cada página importante (bien), pero los enlaces **contextuales** (dentro del texto de las guías hacia productos y viceversa) son los que pesan para temática. Hoy la guía→producto se asigna por módulo (`gi % PRODUCTS.length`): es arbitrario. Hazlo manual y con sentido.

### 4.8 Rendimiento y Core Web Vitals

Mediciones (carga local, sin red real; mi panel no reportó LCP/FCP, así que **no tengo LCP de laboratorio**: ver 9):

| Medida | Valor |
|---|---|
| Imagen del hero `assets/product1.webp` | 433 KB, **1244×2294 px**, mostrada a **275×507** (4,5× más grande de lo necesario) |
| CSS propio | 184 KB sin minificar ni comprimir en mi servidor local (`styles.css` 83 KB + `site.css` 100 KB). GitHub Pages lo sirve comprimido, así que el peso real será bastante menor; minificar sigue valiendo la pena |
| JS | ~170 KB repartidos en 14 archivos + un bloque inline |
| CSS de terceros bloqueante | Google Fonts + 2 hojas de iconos de unpkg en cada página |
| Elementos pesados en la portada | 4 `<canvas>` + 1 vídeo + 3D que sigue al puntero |
| Altura total del home | 9.158 px en escritorio y **15.483 px en móvil** |

Acciones: servir el hero a ~600×1100 (≈90 a 120 KB) en WebP/AVIF con `srcset`; autoalojar fuentes e iconos (ver 6.1); minificar CSS/JS; no cargar `canvas`/vídeo decorativo en móvil. Mide con **PageSpeed Insights** sobre la URL desplegada, no en local.

---

## 5. Confianza y conversión ("que piensen lo mínimo")

### 5.1 Estructura de la portada que propongo (un mensaje por sección)

Hoy: hero abstracto → comparador (antes de saber qué es) → "Cómo funciona tu pedido" → zonas de envío → 6 guías → 6 perfiles (3 vacíos) → 6 estudios (inventados) → FAQ.

Recomendado, con la regla de "una idea, una sección":

1. **Hero:** qué es, para quién, un solo botón ("Ver los aceites") y 3 pruebas en una línea (análisis por lote · enviado desde `<país>` · 14 días para devolver). **Producto y precio visibles sin hacer scroll en móvil.**
2. **Barra de pruebas:** acreditación/certificados con logos reales, valoración real, "Pagas al recibirlo".
3. **Los 4 aceites** con la diferencia en una frase cada uno (concentración, tamaño, precio por ml) y un botón. Sin carrusel con flecha: el cliente debe poder compararlos de un vistazo.
4. **"Cómo elegir"** en 3 preguntas **que funcionen** (hoy "Ver recomendación" no hace nada) o simplemente la tabla comparativa.
5. **Calidad:** el "buscador de lote" (introduce tu número de lote y ve su análisis). Es la pieza más "de laboratorio" que puedes tener.
6. **Guías:** 3 (no 6) con respuesta directa.
7. **Quiénes somos:** equipo y laboratorio con fotos reales.
8. **Reseñas** (solo reales) y **FAQ** corta.

Test de 5 segundos: que 5 personas, tras 5 segundos, escriban qué venden, a quién y si se fiarían. Es la mejor prueba del "pensar lo mínimo".

### 5.2 Menos lenguaje de especialista, más de calle

Para que cualquier persona lo entienda, sustituye:

| Hoy | Mejor |
|---|---|
| "Protocolo de adquisición clínica" | "Cómo comprar, paso a paso" |
| "Neuro-regulación", "Cronobiología", "Modulación inflamatoria", "Homeostasis celular" | Eliminar o convertir en guías informativas sin síntoma |
| "Monografías de referencia clínica" / "información científica estandarizada" | "Estudios que citamos" |
| "Formulación adecuada", "Descubrir mi formulación" | "Elige tu aceite" |
| "Fitocannabinoides, tinturas oleosas, CYP3A4…" (en la copy de estudios) | Explicado en la guía, no en la tarjeta |

Y baja la **carga de decisiones**: hoy en la portada hay 3 menús desplegables, 4 productos, un carrusel de productos, un comparador, un cuestionario, 6 guías, 6 perfiles y 45 palabras orbitando. Cada elemento extra es una decisión.

### 5.3 Controles que no hacen nada (erosionan la confianza)

- Botones de la portada **"Origen: cáñamo"** y **"Duración del efecto"**: sin ningún manejador (`index.html:262,271`); solo funciona la lupa. Además "Duración del efecto" es otra alegación.
- "Ver recomendación" del cuestionario (`index.html:451`).
- La flecha del hero ("Siguiente producto") no tiene etiqueta visible y fuerza un recorrido secuencial.
- Fichas de producto: 3 de 4 miniaturas son huecos ("Aquí la foto de la etiqueta"…).

### 5.4 Mensajes de tranquilidad

- **Conserva:** "Pagas al recibirlo", "14 días para desistir", "Con seguimiento", "Precios con IVA".
- **Rebaja:** "Envío discreto… sin alusiones al contenido". Repetido en menú, pie, ficha, FAQ y confirmación, junto al lenguaje "clínico", genera la sospecha contraria. Reformúlalo como **"Embalaje neutro para tu privacidad"** y déjalo en la página de envíos y el checkout, no en la portada.
- **Añade, porque faltan:** teléfono/WhatsApp visible, dirección real, horario, sello de pago seguro (cuando tengas tarjeta), fecha de última revisión en las guías, nombre y foto de quien revisa, certificado de análisis descargable en cada ficha, y reseñas reales con fuente.

### 5.5 Checkout y ficha de producto

- **Bien:** compra sin cuenta, dos casillas legales, resumen lateral, barra de progreso hacia el envío gratis, `autocomplete` correcto.
- **Ficha en móvil:** la foto ocupa la primera pantalla y el precio y el botón quedan abajo. Reduce la altura de la galería para ver **precio + "Añadir"** sin hacer scroll. La barra de compra fija ya existe; haz que aparezca antes.
- **Teléfono obligatorio** sin explicar por qué (la explicación es texto de muestra): escribe el motivo real.
- Muestra el **precio por unidad de medida** (€/ml o €/día), que es lo que mira quien compara aceites.

---

## 6. Diseño: del "boutique tecnológico" al "laboratorio"

Aquí he cruzado el sitio con las skills que instalaste: `design-taste-frontend`, `redesign-existing-projects`, `minimalist-ui`, `brand`, `ui-ux-pro-max` y `web-design-guidelines`.

**Lectura de diseño (formato de `design-taste-frontend`):** *tienda y sitio educativo para clientes de un producto de salud regulado, con lenguaje clínico-minimalista, hacia Swiss/Utilitarian con una sola acentuación.* Para un brief "trust-first/regulado" la skill indica **variación 3-4, movimiento 2-3, densidad 4-5**. Mi lectura del sitio actual es **variación ~8, movimiento ~8, densidad ~3**: está calibrado para una marca creativa, no para una de confianza. Esa desalineación explica casi todo lo siguiente.

Nota honesta sobre `ui-ux-pro-max`: su primer `--design-system` devolvió un estilo "Vibrant & Block-based" con verde y naranja, que no encaja contigo, así que lo descarté y repetí por dominios (producto, color, tipografía, estilo, landing). Para "Pharmacy/Drug store" recomienda *Flat Design + Accessible & Ethical*, *Minimalism & Swiss*, patrón *Conversion-Optimized + Trust* y la secuencia **Hero (credibilidad) → Pruebas (certificados, cifras) → Solución → CTA**. Es coherente con lo que propongo.

### 6.1 Diagnóstico: qué choca con el look de laboratorio

| # | Hallazgo | Evidencia en el código | Por qué desentona |
|---|---|---|---|
| 1 | **Radios enormes y píldoras en todo** | `--r-panel: clamp(18px, 1.6vw, 28px)`; `border-radius: 999px` en botones, chips, miniaturas | Suave y de consumo. Lo clínico usa 4 a 8 px |
| 2 | **Paleta crema cálida** (`--linen #f7f5f3`, grises cálidos) + **ninguna acentuación** | `--linen`, `--stone #6e6a69`; botón negro | Es la paleta "artesanal/boutique" que `design-taste-frontend` marca como tell de IA. El laboratorio es neutro frío + 1 acento. Hoy solo hay negro y un azul noche escondido dentro de los canvas |
| 3 | **Cursiva serif de acento** en casi cada H2 (Instrument Serif: "Compara los 4 *productos*") | `font-family` de `em` en `site.css`/`styles.css` | `design-taste-frontend` desaconseja Instrument Serif y mezclar familias para énfasis. Es la marca visual más "editorial" y menos "rigurosa" |
| 4 | **Movimiento decorativo** | `orbit.js` (45 palabras), `shield.js`, `runner.js` (vídeo), `constellation.js` (cerebro de partículas), `order.js` (3D con puntero), `dna.js` | Movimiento sin función. La skill pide que cada animación comunique algo; para un brief de confianza, casi ninguna lo hace |
| 5 | **Imágenes de arte generado** | `aud-*.webp` (esculturas), `brain.webp` | Galería, no laboratorio |
| 6 | **Pies de foto decorativos "Fig. 01 · Soma", "Fig. 01 · Envase"** | `PROFILES[].fig`, `pdp__fig` | La skill los clasifica como decoración. Úsalos solo sobre imágenes con datos reales |
| 7 | **Un "chip" encima de cada sección** | Las 6 secciones del home abren con un chip (Comparar, Protocolo…, Guías, Indicaciones…, Evidencia…, FAQ); 12 `.chip` en total contando las etiquetas de las guías | Regla: máx. 1 eyebrow cada 3 secciones. Da ritmo de plantilla |
| 8 | **Cabeceras partidas** (titular a la izquierda, párrafo flotando a la derecha) | `order__head`, `evid__bar` | La skill las prohíbe como patrón por defecto |
| 9 | **Tarjetas con sombra por todas partes y borde irisado en la FAQ** | `--shadow-card`, `--iris` (degradado rosa/lila/azul/verde/naranja) | Superficies planas con borde fino son más "papel de laboratorio" y más fiables |
| 10 | **Dos pesos de iconos** | se cargan `phosphor regular` y `light`; hay mezcla de `ph` y `ph-light` | Grosor inconsistente. Usa un solo peso |
| 11 | **Marco negro envolvente** y pie negro | `--frame: #0d0d0d` | Aspecto de "app", no de informe |
| 12 | **Placeholder de farmacia** (blíster) | `assets/product1.webp` | Contradice el producto (aceites) |
| 13 | **Negro puro `#000`** en texto y botones | `--ink: #000000` | La skill pide negro suave |
| 14 | **Indicador de scroll** | `.scroll-cue` | La skill lo prohíbe: es un tell |

### 6.2 Qué **sí** es "laboratorio" y debes ampliar

Tablas de datos (`.spec`, `.kv`, `.compare__table`), listas de definición, etiquetas pequeñas en versalitas, fichas con DOI/PMID, numeración tabular, bordes finos. Esa es tu base: **más rigor y menos adorno**.

### 6.3 Dirección propuesta (puedes cambiarla; es un punto de partida)

**Principios**
1. **Evidencia a la vista**: cada afirmación va junto a su dato (concentración, lote, análisis, fecha).
2. **Plano y preciso**: superficies planas, bordes de 1 px, radios 4 a 8 px, sin degradados.
3. **Un acento**: usado solo en enlaces, foco, sellos de calidad y botón principal.
4. **Una familia tipográfica + mono para metadatos**: Geist (ya la tienes) + Geist Mono para lotes, cifras y etiquetas. Elimina la cursiva serif. (Alternativa de `ui-ux-pro-max`, "Medical Clean": Figtree + Noto Sans.)
5. **Fotografía real y consistente**: producto sobre fondo neutro con la etiqueta legible, manos con guantes, material de laboratorio, el equipo; luz fría y uniforme.
6. **Movimiento solo funcional**: transiciones de estado y un único elemento animado si hay un motivo (por ejemplo, el medidor de lote).

**Tokens de partida** (contrastes calculados por mí, WCAG):

```css
:root {
  /* Neutros fríos */
  --bg: #ffffff;
  --surface: #f4f6f7;
  --hairline: #dfe3e7;        /* solo decorativo (1,29:1 sobre blanco): NO para inputs */
  --control-border: #8b949c;  /* bordes de inputs/botones: 3,08:1 sobre blanco */
  --text: #14181c;            /* 17,8:1 sobre blanco · 16,5:1 sobre --surface */
  --text-muted: #55606a;      /* 6,4:1 sobre blanco · 5,9:1 sobre --surface */

  /* Un acento clínico (elige UNO) */
  --accent: #0b6b73;          /* teal profundo: 6,2:1 sobre blanco */
  /* --accent: #1d4ed8;          cobalto: 6,7:1 sobre blanco */

  /* Estados */
  --ok: #166534;              /* 7,1:1 */
  --warn: #92400e;            /* 7,1:1 */
  --danger: #b3261e;          /* 6,5:1 (ya lo tienes) */

  /* Forma */
  --r-sm: 4px; --r-md: 8px;   /* nada de pastillas en contenedores/botones */
}
```

Tipografía: cuerpo **16 a 17 px**, líneas de 60 a 70 caracteres, etiquetas mínimas de 12 a 13 px en mono, números con `font-variant-numeric: tabular-nums` (ya lo haces en algunos sitios).

### 6.4 Legibilidad, contraste y tamaño

- **En la portada a 1440 px, el 71 % del texto está por debajo de 16 px y el 26 % por debajo de 14 px** (el cuerpo habitual es de 15 px; las etiquetas, de 11 a 13 px). En móvil, sobre la ficha de producto, medí 90 % y 23 %. Para "que cualquier persona lo entienda" y que lea alguien de 50 años, sube el cuerpo a 16 a 17 px y ningún texto funcional por debajo de 12 px.
- **`--pebble #9a9796` no pasa WCAG AA** (2,67 a 2,90:1). Se usa en marcadores de posición de formularios, separadores de migas, números de niveles y en estados vacíos. Cámbialo por `--text-muted`. `--stone #6e6a69` sí pasa (4,7 a 5,4:1).
- Mi barrido automático del DOM (aproximado) no encontró otros textos bajo 4,5:1 en la ficha móvil; repítelo con una herramienta de accesibilidad (axe/WAVE) sobre el resultado final.
- **Objetivos táctiles:** en móvil medí 48 enlaces/botones del home con menos de 40 px de alto o ancho (incluye enlaces de texto en línea, que no siempre es un fallo). Prioriza los botones de acción y llévalos a 44×44 px.

### 6.5 Accesibilidad: fortalezas y fallos

Fortalezas en la sección 3. Fallos: contraste de `--pebble`; botones sin acción; `<h2>` antes del `<h1>`; el `<h1>` cambia por JS; el carrusel de perfiles anuncia "diapositiva 1 de 6" aunque 3 estén vacías; sin `color-scheme` (el sitio es solo claro: no es crítico para el lanzamiento; la skill lo recomienda, yo lo pondría en BAJO).

### 6.6 Privacidad y RGPD en el propio diseño

Todas las páginas cargan **Google Fonts** y **2 hojas de iconos de unpkg**. Eso envía la IP del visitante a terceros sin consentimiento. Tu página de cookies dice "no usa cookies de terceros ni de analítica": literalmente es cierto (esos servicios no colocan cookies), pero ni ella ni la política de privacidad mencionan que se cargan recursos de terceros que reciben la IP, y el lector entiende que no hay terceros. En 2022 el Landgericht München I condenó a un sitio por esto con 100 € de indemnización (sentencia de primera instancia, no vinculante; no leí el fallo, solo prensa y comentarios jurídicos). Riesgo bajo en importe, pero real en reclamaciones masivas, y más con envíos a Alemania. Solución sencilla: **autoalojar** Geist/Questrial y reemplazar el icon-font por un **sprite SVG** con los 67 iconos usados (hoy cargas la fuente completa en dos pesos). Además la skill indica "nunca enlaces Google Fonts por `<link>` en producción".

---

## 7. Contenido que debes tener antes de abrir (y cómo escribirlo)

| Pieza | Qué debe contener | Nota |
|---|---|---|
| Ficha de producto | Composición con mg exactos, % CBD y **% THC**, origen, extracción, tamaño, lote, caducidad, instrucciones de uso del envase, advertencias reales, enlace al COA | Datos medibles. Nada de beneficios |
| Certificados de análisis (COA) | PDF por lote de laboratorio **independiente y acreditado**, con buscador por nº de lote | Es la prueba reina. Si aún no los tienes, consíguelos antes de publicar |
| Sobre nosotros | Quién, dónde, desde cuándo, fotos reales, dirección, CIF | Aquí gana la confianza |
| Equipo y revisores | Nombre, foto, cargo, nº de colegiado si procede, enlace a perfil profesional | Necesario para YMYL |
| Política editorial | Cómo se escribe, se revisa, se actualiza, cómo se corrige un error | 1 página corta |
| Guías (6) | Respuesta directa de 60 a 120 palabras, fuentes numeradas, fecha de revisión, autor y revisor | Sin promesas; si citas un estudio, cita exactamente lo que concluye |
| Estudios | Solo reales, con DOI/PMID comprobado y enlace | Cero invenciones |
| Envíos / devoluciones | Plazos reales por país, transportista, coste bajo el umbral, excepciones por salud/higiene | Rellena los `d(...)` |
| Legales | Redactadas por tu asesor | LSSI, RGPD, condiciones de venta, desistimiento |

Regla general de redacción: **frases cortas, sustantivos concretos, un dato por frase, voz activa**, sin metáforas y sin jerga. Cada afirmación debe poder defenderse con un documento.

---

## 8. Plan por fases y plantillas

### 8.1 Plan priorizado

**Fase 0 · Decisiones (1 a 3 días, sin código)**
1. Categoría legal de cada producto y lista de afirmaciones permitidas (asesor).
2. Mercado principal, nombre de marca definitivo y dominio.
3. Métodos de pago posibles.
4. Quién escribe y quién revisa; qué laboratorio emite los análisis; ¿tienes COAs?

**Fase 1 · Proteger el lanzamiento (medio día)**
- `noindex` global hasta el día del lanzamiento y guardia de borradores en `build.mjs`.
- Retirar `adn/`, `perfiles/perfil-4/5/6` y estudios falsos de la build pública.
- Corregir el `<title>` del home y los 6 `[producto]`.

**Fase 2 · SEO base (1 a 2 días)**
- Canonical absoluta, OG/Twitter, `robots.txt`, `sitemap.xml`, `404.html`, Search Console.
- JSON-LD: Organization, WebSite, BreadcrumbList, Product completo, Article con autor.
- `<h1>` estático y primero en cada página; slugs descriptivos de producto.

**Fase 3 · Mensaje y confianza (2 a 4 días)**
- Nueva portada (5.1), página Calidad con buscador de lote, Sobre nosotros, política editorial.
- Reescritura del copy sin promesas; sustituir jerga.
- Fotografía real de producto, equipo y laboratorio.

**Fase 4 · Look de laboratorio (3 a 5 días)**
- Tokens (6.3), radios, un acento, Geist + Geist Mono, quitar serif de acento, quitar chips, aplanar sombras, un peso de icono.
- Retirar canvas/vídeo/3D decorativos de la portada; dejar como máximo un elemento animado con función.
- Subir tamaños de texto y arreglar contraste.

**Fase 5 · Rendimiento y privacidad (1 a 2 días)**
- Autoalojar fuentes e iconos (sprite SVG); hero responsivo; minificar.
- Actualizar la política de cookies para que diga lo que realmente pasa.

**Fase 6 · Medir (continuo)**
- PageSpeed Insights (móvil) en home, categoría y una ficha; Rich Results Test; Search Console (cobertura, enlaces); axe/WAVE; test de 5 segundos con 5 personas; después del lanzamiento, consultas reales y páginas con impresiones sin clics.

### 8.2 Guardia de borradores para `build.mjs`

Añade al final de `build.mjs`, antes de imprimir el resumen. Falla la compilación si una página indexable conserva marcadores:

```js
// Bloquea el despliegue si queda texto de muestra en páginas indexables
const leftovers = [];
for (const p of pages) {
  const html = readFileSync(join(ROOT, p.path, 'index.html'), 'utf8');
  if (/name="robots" content="noindex"/.test(html)) continue;
  const drafts = (html.match(/class="draft"/g) || []).length;
  const placeholders = (html.match(/\[producto\]/gi) || []).length;
  if (drafts || placeholders) leftovers.push(`${p.path} → ${drafts} borradores, ${placeholders} [producto]`);
}
if (leftovers.length && !process.env.ALLOW_DRAFTS) {
  console.log(`\n${leftovers.length} páginas indexables con texto de muestra:`);
  leftovers.forEach((l) => console.log('  ' + l));
  process.exitCode = 1;
}
```

Para trabajar, ejecuta `ALLOW_DRAFTS=1 node build.mjs`. En Windows PowerShell: `$env:ALLOW_DRAFTS=1; node build.mjs`.

### 8.3 `robots.txt` y `sitemap.xml` (esqueletos)

```
# robots.txt
User-agent: *
Disallow: /carrito/
Disallow: /checkout/
Disallow: /cuenta/
Disallow: /pedido-confirmado/
Sitemap: https://TU-DOMINIO/sitemap.xml
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://TU-DOMINIO/</loc><lastmod>AAAA-MM-DD</lastmod></url>
  <!-- una <url> por página indexable; genéralo en build.mjs -->
</urlset>
```

### 8.4 JSON-LD (plantillas con huecos; rellena solo con datos reales)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "<nombre completo>",
  "description": "<1 a 2 frases factuales>",
  "image": ["https://TU-DOMINIO/assets/<foto-real>.jpg"],
  "sku": "<sku>",
  "brand": { "@type": "Brand", "name": "<Marca>" },
  "offers": {
    "@type": "Offer",
    "url": "https://TU-DOMINIO/<ruta>/",
    "price": "<precio>", "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "shippingDetails": { "@type": "OfferShippingDetails",
      "shippingRate": { "@type": "MonetaryAmount", "value": "<coste>", "currency": "EUR" },
      "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "ES" },
      "deliveryTime": { "@type": "ShippingDeliveryTime",
        "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
        "transitTime":  { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 7, "unitCode": "DAY" } } },
    "hasMerchantReturnPolicy": { "@type": "MerchantReturnPolicy", "applicableCountry": "ES",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 14, "returnMethod": "https://schema.org/ReturnByMail" }
  }
}
</script>
```

(No añadas `aggregateRating` sin reseñas reales y verificables.)

---

## 9. Qué NO pude comprobar y límites de esta auditoría

- **No tengo LCP, INP ni puntuación Lighthouse de laboratorio.** El panel del navegador no reportó eventos de pintura y no instalé Lighthouse para no descargar software sin tu permiso. CLS medido: 0 y sin tareas largas en mi sesión local. Valida con PageSpeed Insights en la URL real.
- **No sé si Google ya indexó el prototipo de GitHub Pages**; el fetch devolvió el contenido pero no su `<head>`. Compruébalo en Search Console o con `site:`.
- **No soy abogado.** Lo regulatorio (CBD, alegaciones, LSSI, RGPD, consumo) es una guía de riesgos con fuentes, no asesoramiento. Las partes marcadas "conocimiento general" no las verifiqué en esta sesión.
- Las fuentes sobre el estado del CBD en España/UE son prensa y notas oficiales (AESAN) consultadas hoy; varias son comerciales. Para decisiones de venta, confirma con AESAN y tu asesor.
- Los umbrales de envío gratis y los benchmarks de conversión que menciono son juicio mío, no datos de tu mercado.
- No probé el flujo real de pago (es un prototipo en `localStorage`) ni formularios con servidor.
- Las notas del cuadro de la sección 1 son subjetivas.

## 10. Fuentes

- AESAN, "Actualización sobre la seguridad del cannabidiol (CBD) como nuevo alimento" (2026): https://www.aesan.gob.es/AECOSAN/web/noticias_y_actualizaciones/noticias/2026/seguridad_cannabidiol.htm
- OCU, gominolas con CBD ante AESAN (febrero de 2026): https://www.ocu.org/organizacion/prensa/notas-de-prensa/2026/gominolascbd160226
- FoodNavigator, "EFSA gives positive opinion on CBD" (21-sep-2026): https://www.foodnavigator.com/Article/2026/09/21/efsa-gives-positive-opinion-on-cbd/
- NutraIngredients, "Important turning point for CBD as EFSA publishes first positive safety opinion": https://www.nutraingredients.com/Article/2026/09/21/important-turning-point-for-cbd-as-efsa-publishes-first-positive-safety-opinion/
- Search Engine Journal, retirada de los resultados enriquecidos de FAQ: https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/
- Google Search Central, datos estructurados de política de devoluciones: https://developers.google.com/search/docs/appearance/structured-data/return-policy
- Google Search Central, política de envíos (ShippingService): https://developers.google.com/search/docs/appearance/structured-data/shipping-policy
- Sobre YMYL/E-E-A-T (guía secundaria, no el documento oficial): https://theguidex.com/insights/google-quality-rater-guidelines
- Sobre Google Fonts y RGPD (LG München I, 3 O 17493/20): https://wptavern.com/german-court-fines-website-owner-for-violating-the-gdpr-by-using-google-hosted-fonts y https://decoded.legal/blog/2022/02/google-fonts-an-ip-address-and-the-gdpr-must-i-now-self-host-all-my-web-page-resources
- Reglas de interfaz web usadas: https://github.com/vercel-labs/web-interface-guidelines
- Skills del proyecto aplicadas: `web-design-guidelines`, `redesign-existing-projects`, `design-taste-frontend`, `minimalist-ui`, `brand`, `ui-ux-pro-max`.

## Anexo A. Datos por página (resumen)

- 33 HTML; 23.634 palabras visibles; 1.146 bloques `.draft`.
- Home: 2.614 palabras, 56 % de muestra, title 1 car., description 29 car.
- Fichas (4): ~1.130 palabras, ~40 % de muestra, title 18 car., descripción de 159 car. casi idéntica.
- Guías (6): ~850 a 890 palabras, 49 a 53 % de muestra, 6 con `[producto]` en el título o la descripción.
- Perfiles (6): ~630 palabras, ~35 % de muestra; 3 con título genérico "Perfil 0X".
- Evidencia: 858 palabras, 48 % de muestra, estudios inventados.
- Legales (4): ~350 palabras, ~17 % de muestra: en realidad solo marcan apartados.
- Enlaces: 0 rotos. Referencias externas: `fonts.googleapis.com` (66), `fonts.gstatic.com` (33), `unpkg.com` (65).
