# New store · sitio web (prototipo)

Sitio estático en español: el index (`index.html`, hecho a mano) y 31 subpáginas generadas a partir de `_src/`.

## Ver el sitio en local

```bash
python -m http.server 5183
```

Abre `http://localhost:5183/`. Todas las rutas son relativas, así que también funciona publicado en una subcarpeta (GitHub Pages).

## Regenerar las subpáginas

```bash
node build.mjs
```

Escribe las subpáginas, `catalog.js` (precios y envío para el carrito) y el pie de página del index (entre las marcas `<!-- pie:inicio -->` y `<!-- pie:fin -->`), y avisa si hay enlaces internos rotos. No toca el resto de `index.html` ni `adn/`.

| Qué | Dónde |
|---|---|
| Productos, precios, envío, guías, perfiles, estudios, países, preguntas frecuentes, legales | `_src/data.mjs` |
| `<head>`, barra superior, pie, tarjetas y piezas comunes | `_src/layout.mjs` |
| Catálogo, fichas de producto, carrito, checkout, confirmación, consultar pedido | `_src/pages-shop.mjs` |
| Guías, perfiles, estudios, FAQ, envíos, devoluciones, contacto, legales | `_src/pages-info.mjs` |
| Estilos de las subpáginas, del pie y del carrito | `site.css` (a mano) |
| Menú, acordeones, índice lateral, galería, filtros, buscador | `site.js` (a mano) |
| Carrito, checkout, consulta del pedido y formularios | `store.js` (a mano) |

Las páginas generadas (`productos/`, `guias/`, etc.) no se editan a mano: se sobrescriben con cada `node build.mjs`.

## Páginas

- **Tienda:** `productos/` y una ficha por producto (`productos/producto-1/` … `producto-4/`, misma plantilla: compra arriba e información detallada debajo), `carrito/`, `checkout/`, `pedido-confirmado/`, `cuenta/` (consultar el pedido: no hace falta cuenta).
- **Información:** `guias/` y las 6 guías de «Todo lo que necesitas saber», `perfiles/…` (los 6 «Explorar protocolo clínico»), `evidencia/`, `preguntas-frecuentes/`, `envios/`, `devoluciones/`, `contacto/`.
- **Legal:** `aviso-legal/`, `privacidad/`, `cookies/`, `terminos/`.

## Texto de muestra

Lo que va con subrayado discontinuo (clase `.draft`) es texto de muestra que hay que sustituir. Los precios (24,90 / 34,90 / 44,90 / 59,90 €), el coste de envío de 4,90 € y los estudios también son de muestra. Si cambias un precio en `_src/data.mjs`, cámbialo también en la tabla del comparador del index.

## Prototipo: qué NO hace todavía

- El carrito y los pedidos se guardan solo en el navegador (`localStorage`) y **no se envían a ningún servidor**. De cada pedido se guardan el email, el nombre, la ciudad, el país y los productos; nunca el teléfono ni la dirección.
- El formulario de contacto muestra un mensaje, pero no envía nada.
- «Ver recomendación» del comparador todavía no hace nada.

## Publicar cambios (GitHub Pages)

```bash
git add -A
git commit -m "Describe el cambio"
git push
```

GitHub Pages vuelve a publicar la rama `main` en uno o dos minutos.
