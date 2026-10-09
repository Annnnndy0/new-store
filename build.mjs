// Genera las subpáginas de lab-lab a partir de _src/ y comprueba que no haya enlaces internos rotos.
//   node build.mjs
// No toca index.html ni adn/: esos se editan a mano.
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, footer, makeR } from './_src/layout.mjs';
import { shopPages } from './_src/pages-shop.mjs';
import { infoPages } from './_src/pages-info.mjs';
import { PRODUCTS, SHIPPING, COUNTRIES } from './_src/data.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const pages = [...shopPages, ...infoPages];

// Páginas
for (const p of pages) {
  const file = join(ROOT, p.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, page(p));
}

// Catálogo para el carrito (store.js): una sola fuente para precios y envío
const catalog = {
  products: Object.fromEntries(PRODUCTS.map((p) => [p.id, { name: p.name, n: p.n, price: p.price, img: p.img, url: `productos/${p.slug}/` }])),
  shipping: { cost: SHIPPING.cost, freeFrom: SHIPPING.freeFrom },
  outsideEU: COUNTRIES.filter((c) => c[2] === 'out').map((c) => c[0]),
  countries: Object.fromEntries(COUNTRIES.map((c) => [c[0], c[1]])),
};
writeFileSync(join(ROOT, 'catalog.js'),
  `/* Generado por build.mjs a partir de _src/data.mjs: no lo edites a mano. */\nwindow.CATALOG = ${JSON.stringify(catalog, null, 2)};\n`);

// Pie del index: se escribe entre sus dos marcas para que sea el mismo que el de las subpáginas
const indexFile = join(ROOT, 'index.html');
const indexHtml = readFileSync(indexFile, 'utf8');
const marks = /(<!-- pie:inicio -->)[\s\S]*?(\s*<!-- pie:fin -->)/;
if (marks.test(indexHtml)) {
  writeFileSync(indexFile, indexHtml.replace(marks, (_, a, b) => `${a}${footer(makeR(''))}${b}`));
} else {
  console.warn('index.html: no encuentro las marcas <!-- pie:inicio --> / <!-- pie:fin -->; el pie no se ha actualizado.');
}

// Enlaces internos rotos (en las páginas generadas y en el index)
const files = [join(ROOT, 'index.html'), ...pages.map((p) => join(ROOT, p.path, 'index.html'))];
const broken = [];
const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) ids.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
};
for (const file of files) {
  const html = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  for (const [, , url] of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(url)) continue;
    const [pathPart, hash] = url.split('#');
    const clean = pathPart.split('?')[0];
    let target = clean ? resolve(dirname(file), clean) : file;
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target)) { broken.push(`${relative(ROOT, file)} → ${url}`); continue; }
    if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) broken.push(`${relative(ROOT, file)} → ${url} (no existe #${hash})`);
  }
}

console.log(`${pages.length} páginas generadas + catalog.js`);
if (broken.length) {
  console.log(`\n${broken.length} enlaces rotos:`);
  for (const b of [...new Set(broken)]) console.log('  ' + b);
  process.exitCode = 1;
} else {
  console.log('Sin enlaces internos rotos.');
}
