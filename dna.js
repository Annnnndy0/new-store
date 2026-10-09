/* ADN de puntos (se prueba en adn/ antes de llevarlo a la página principal).
   Misma técnica que el cerebro de constellation.js —una nube 3D proyectada en un lienzo 2D y
   pintada por grupos de color y opacidad— pero con puntos y en tres actos ligados al scroll:

   1. ADN: una doble hélice en diagonal que gira sobre su propio eje. Dos hebras de cuentas
      apiñadas y, entre ellas, los peldaños de bases. Al aparecer, los puntos llegan desde el
      fondo y se enroscan hasta formarla (primero el extremo cercano).
   2. Fondo: al bajar, la hélice crece y se deshace desde el centro; sus puntos se reparten por
      toda la pantalla con profundidad (los cercanos, grandes y tenues; los lejanos, pequeños y
      lentos) y quedan como fondo de lo que haya en [data-dna-field].
   3. Planeta: cuando [data-dna-globe] sube hacia el centro, los mismos puntos se reagrupan en la
      Tierra: continentes densos (earth-land.js) y un océano ralo, girando sobre su eje inclinado.
   Al subir, todo se deshace en orden inverso.

   - Puntero: aparta los puntos cercanos y arrastra los que roza (vuelven a su sitio con un
     muelle); la hélice y el planeta se inclinan un poco hacia él.
   - Marcado:
       [data-dna]         contenedor
       [data-dna-canvas]  el lienzo; va pegado a la pantalla (sticky) por detrás del contenido
       [data-dna-helix]   caja donde vive la hélice (opcional: sin ella, solo fondo y planeta)
       [data-dna-field]   tramo en el que los puntos son el fondo
       [data-dna-globe]   caja donde se forma el planeta
   - Colores, transparencias y parámetros: variables --dna-* en styles.css (se leen al cargar y al
     redimensionar). Si se cambian en vivo, lanzar 'dna:refresh' sobre el lienzo; 'dna:replay'
     repite la entrada. El contenedor emite 'dna:state' con el progreso de cada acto. */
(() => {
  'use strict';

  const root = document.querySelector('[data-dna]');
  const canvas = root && root.querySelector('[data-dna-canvas]');
  const ctx = canvas ? canvas.getContext('2d') : null;
  if (!ctx) return;

  const helixBox = root.querySelector('[data-dna-helix]');
  const fieldBox = root.querySelector('[data-dna-field]');
  const globeBox = root.querySelector('[data-dna-globe]');
  const LAND = window.EARTH_LAND;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Hélice (unidades: el radio de la hélice mide 1)
  const PITCH = 3.4;                // largo de una vuelta: como el ADN real (3,4 nm por vuelta, 2 nm de ancho)
  const GROOVE = 0.8 * Math.PI;     // separación entre hebras: deja un surco mayor y otro menor
  const PAIRS_PER_TURN = 10;        // peldaños (pares de bases) por vuelta
  const STRAND_DOTS = 140;          // puntos por unidad de recorrido de cada hebra (con --dna-density 1)
  const BEAD_DOTS = 14;             // puntos por cuenta (de media)
  const PAIR_DOTS = 52;             // puntos por peldaño
  const DUST_SHARE = 0.08;          // puntos sueltos alrededor (fracción del total)
  const FOCAL = 9;                  // distancia de la cámara a la hélice
  const REF_SCALE = 150;            // px por unidad en los que el punto mide --dna-dot
  const TAPER = 0.08;               // los extremos se desvanecen en este tramo del largo
  const GROW = 0.4;                 // la hélice crece esto mientras se dispersa
  const WOBBLE = 0.012;             // cada punto flota alrededor de su sitio
  const LIGHT = [-0.42, -0.62, 0.66];  // luz desde arriba a la izquierda (x derecha, y abajo, z hacia ti)
  const SHADE = 0.5;                // el lado iluminado de cada cuenta se aclara (punteado)
  const TWINKLE = 0.18;

  // Entrada
  const INTRO_DELAY = 0.2;          // s desde que la hélice aparece en pantalla
  const INTRO_S = 2.6;

  // Scroll (fracciones del alto de la pantalla)
  const SCATTER_FROM = 0.95;        // la dispersión empieza cuando el tramo de fondo asoma aquí
  const SCATTER_TO = 0.15;          // y termina cuando su borde superior llega aquí
  const GATHER_FROM = 1.3;          // el planeta empieza a juntarse con el centro de su caja aquí
  const SPAN = 0.55;                // cada punto hace su viaje en este tramo del progreso
  const CURL = 0.7;                 // curva del viaje (los puntos no van en línea recta)
  const HOLD = 0.6;                 // mientras se dispersa, la hélice se queda hacia el centro de la pantalla

  // Suavizado: el dibujo no copia el scroll en cada fotograma, lo persigue. Primero un scroll
  // "virtual" que va detrás del real (posiciones y paralaje del fondo); después, el progreso de
  // cada acto lo persigue a su vez. Si se baja de golpe, la animación pasa con calma por los
  // estados intermedios en vez de saltar. Cada persecución tiene dos tramos (ver glide): una guía
  // con tope de velocidad y un muelle que la sigue y redondea los arranques y las frenadas.
  // --dna-smooth divide las rapideces y los topes: 2 = el doble de calma.
  const SCROLL_RATE = 4;            // rapidez con que el scroll virtual alcanza al real (1/s)
  const SCROLL_MAX = 1.8;           // como mucho, pantallas por segundo
  const ACT_RATE = 2.4;             // rapidez con que cada acto alcanza su progreso (1/s)
  const ACT_MAX = 0.6;              // como mucho, actos por segundo: un acto entero dura ≥ 1,7 s
  const SOFTEN = 1.8;               // el muelle va así de rápido respecto a su guía

  // Fondo
  const BAND = 1.3;                 // alto de la banda que se repite al hacer scroll
  const DRIFT = 10;                 // deriva (px)

  // Planeta
  const AXIS_TILT = (23.4 * Math.PI) / 180;
  const VIEW_PITCH = 0.3;           // se ve un poco desde arriba (rad)
  const START_LON = -0.3;           // empieza mirando a Europa y África (rad)
  const LAND_SHARE = 0.64;          // fracción de puntos en tierra firme
  const GLOBE_FOCAL = 5;

  // Puntero
  const TILT_YAW = 0.2;
  const TILT_PITCH = 0.12;
  const TILT_RATE = 2.4;
  const REACH = 0.13;               // radio de influencia: fracción del lado menor
  const PUSH = 2400;
  const STIR = 6;
  const SPRING = 30;
  const DAMP = 6;

  // Opacidad: los puntos se agrupan por nivel de opacidad y color para pintar pocas veces
  const LEVELS = 8;

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const stag = (p, s) => clamp((p - s * (1 - SPAN)) / SPAN, 0, 1);
  const seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------- aspecto ---------- */

  // Variables --dna-* de styles.css. Si falta alguna o no es válida, se usa el valor de aquí.
  const ROLES = ['strand-a', 'strand-b', 'base-a', 'base-b', 'dust', 'land', 'ocean'];
  const [SA, SB, BA, BB, DU, LA, OC] = ROLES.keys();
  const ROLE_ALPHA = [1, 0.95, 0.9, 0.9, 1, 1, 1];
  const look = {
    colors: ['#0e1431', '#273169', '#4c5a9a', '#737fb5', '#9a9796', '#0e1431', '#9ba3c8'],
    opacity: 1,
    fieldOpacity: 0.45,
    depthFade: 0.55,
    dot: 1.6,
    size: 1,
    tilt: -26,
    yaw: 24,
    turns: 3,
    thickness: 0.38,
    speed: 0.08,
    density: 1,
    fieldDensity: 0.35,
    globeSize: 0.78,
    globeSpeed: 0.025,
    push: 1,
    smooth: 1,
  };
  const NUMBERS = [
    ['opacity', 'opacity', 0, 1],
    ['fieldOpacity', 'field-opacity', 0, 1],
    ['depthFade', 'depth-fade', 0, 1],
    ['dot', 'dot', 0.3, 6],
    ['size', 'size', 0.2, 2],
    ['tilt', 'tilt', -90, 90],
    ['yaw', 'yaw', -70, 70],
    ['turns', 'turns', 1, 8],
    ['thickness', 'thickness', 0.05, 0.8],
    ['speed', 'speed', 0, 1],
    ['density', 'density', 0.2, 2.5],
    ['fieldDensity', 'field-density', 0, 1],
    ['globeSize', 'globe-size', 0.2, 1.2],
    ['globeSpeed', 'globe-speed', 0, 0.5],
    ['push', 'push', 0, 3],
    ['smooth', 'smooth', 0.2, 4],
  ];

  let compact = false;              // pantallas estrechas: menos puntos
  const shapeKey = () => [look.turns, look.thickness, look.density, compact].join('|');

  // Devuelve true si cambió algo que obliga a rehacer los puntos
  function readLook() {
    const before = shapeKey();
    const css = getComputedStyle(canvas);
    ROLES.forEach((role, i) => {
      const value = css.getPropertyValue(`--dna-${role}`).trim();
      if (!value) return;
      // Un color no válido no cambia fillStyle: se queda el anterior
      ctx.fillStyle = look.colors[i];
      ctx.fillStyle = value;
      look.colors[i] = ctx.fillStyle;
    });
    for (const [key, name, min, max] of NUMBERS) {
      const n = parseFloat(css.getPropertyValue(`--dna-${name}`));
      if (Number.isFinite(n)) look[key] = clamp(n, min, max);
    }
    return shapeKey() !== before;
  }

  /* ---------- puntos ---------- */

  let N = 0;
  // Hélice: sitio (hx, hy, hz; x a lo largo del eje), hacia dónde mira (nx, ny, nz), posición a
  // lo largo (hu) y papel
  let hx, hy, hz, nx, ny, nz, hu, hrole;
  // Fondo: posición en fracciones de la pantalla (fu, fv), profundidad (fd) y si se ve (rank)
  let fu, fv, fd, rank;
  // Planeta: punto de la esfera (gx, gy, gz) y si es tierra u océano
  let gx, gy, gz, grole;
  // Comunes: tamaño, fases, retardos de cada acto, curva del viaje y desvío del puntero
  let sz, phase, freq, sScatter, sIntro, sGather, curl, give, ox, oy, vx, vy;
  // Resultado de cada fotograma
  let px, py, pr, group, order;
  const GROUPS = ROLES.length * LEVELS;
  const counts = new Int32Array(GROUPS + 1);

  function isLand(lat, lon) {
    if (!LAND) return false;
    const row = Math.min(LAND.height - 1, Math.floor(((Math.PI / 2 - lat) / Math.PI) * LAND.height));
    const col = ((Math.floor(((lon + Math.PI) / TAU) * LAND.width) % LAND.width) + LAND.width) % LAND.width;
    const i = row * LAND.width + col;
    return (landBits[i >> 3] >> (i & 7)) & 1;
  }
  const landBits = LAND ? Uint8Array.from(atob(LAND.data), (c) => c.charCodeAt(0)) : null;

  function build() {
    const rand = seeded(20261008);
    const dens = look.density * (compact ? 0.6 : 1);
    const turns = look.turns;
    const T = look.thickness;
    const Lh = turns * PITCH;
    const tmp = [];                 // x, y, z, u, papel, hacia dónde mira (x, y, z)
    const F = 8;
    // Cada punto mira hacia fuera de su cuenta y, un poco, de su hebra: así se sombrea
    const put = (x, y, z, u, role, ax, ay, az) => {
      const n = Math.hypot(ax, ay, az) || 1;
      tmp.push(x, y, z, u, role, ax / n, ay / n, az / n);
    };

    // Hebras: cuentas apiñadas a lo largo de cada hélice; cada cuenta es una bolita de puntos,
    // más densa en su superficie, y se aparta un poco del centro de la hebra: el tubo queda grumoso
    const route = turns * Math.hypot(PITCH, TAU);
    const beads = Math.max(12, Math.round((route * STRAND_DOTS * dens) / BEAD_DOTS));
    for (let s = 0; s < 2; s++) {
      for (let b = 0; b < beads; b++) {
        const u = (b + rand()) / beads;
        const th = TAU * turns * u + s * GROOVE;
        const cx = -Lh / 2 + u * Lh;
        const off = T * 0.55 * Math.sqrt(rand());
        const oa = rand() * TAU;
        const ob = Math.acos(rand() * 2 - 1);
        const cy = Math.cos(th) + off * Math.sin(ob) * Math.cos(oa);
        const cz = Math.sin(th) + off * Math.sin(ob) * Math.sin(oa);
        const cxx = cx + off * Math.cos(ob) * 0.6;
        const rb = T * (0.38 + 0.32 * rand());
        const dots = Math.round(BEAD_DOTS * (0.6 + rand() * 0.8));
        for (let k = 0; k < dots; k++) {
          const a = rand() * TAU;
          const c = rand() * 2 - 1;
          const q = Math.sqrt(1 - c * c);
          const r = rb * (0.62 + 0.38 * Math.sqrt(rand()));
          const dx = r * c;
          const dy = r * q * Math.cos(a);
          const dz = r * q * Math.sin(a);
          const x = cxx + dx;
          const y = cy + dy;
          const z = cz + dz;
          put(x, y, z, u, s ? SB : SA,
            dx / rb + (x - cx) * 0.6, dy / rb + (y - Math.cos(th)) * 0.6, dz / rb + (z - Math.sin(th)) * 0.6);
        }
      }
    }

    // Peldaños: de una hebra a la otra, perpendiculares al eje; cada mitad es una base
    const pairs = Math.max(4, Math.round(turns * PAIRS_PER_TURN));
    const perPair = Math.max(6, Math.round(PAIR_DOTS * dens));
    for (let p = 0; p < pairs; p++) {
      const u = (p + 0.5) / pairs;
      const th = TAU * turns * u;
      const x = -Lh / 2 + u * Lh;
      const ay = Math.cos(th);
      const az = Math.sin(th);
      const by = Math.cos(th + GROOVE);
      const bz = Math.sin(th + GROOVE);
      for (let k = 0; k < perPair; k++) {
        let t = 0.14 + 0.72 * rand();
        if (Math.abs(t - 0.5) < 0.025) t += t < 0.5 ? -0.025 : 0.025;   // junta entre las dos bases
        const r = T * 0.46 * (0.35 + 0.65 * Math.sqrt(rand()));
        const a = rand() * TAU;
        const dx = Math.cos(a) * 0.8;
        const dy = Math.sin(a) * 0.7;
        const dz = Math.sin(a + 1.3) * 0.7;
        put(x + r * dx, ay + (by - ay) * t + r * dy, az + (bz - az) * t + r * dz, u, t < 0.5 ? BA : BB, dx, dy, dz);
      }
    }

    // Polvo: puntos sueltos alrededor; en la hélice ya están en su sitio del fondo
    const shaped = tmp.length / F;
    const dust = Math.round((shaped * DUST_SHARE) / (1 - DUST_SHARE));
    for (let k = 0; k < dust; k++) tmp.push(0, 0, 0, rand(), DU, 0, 0, 1);

    N = tmp.length / F;
    hx = new Float32Array(N); hy = new Float32Array(N); hz = new Float32Array(N);
    nx = new Float32Array(N); ny = new Float32Array(N); nz = new Float32Array(N);
    hu = new Float32Array(N); hrole = new Uint8Array(N);
    fu = new Float32Array(N); fv = new Float32Array(N); fd = new Float32Array(N); rank = new Float32Array(N);
    gx = new Float32Array(N); gy = new Float32Array(N); gz = new Float32Array(N); grole = new Uint8Array(N);
    sz = new Float32Array(N); phase = new Float32Array(N); freq = new Float32Array(N);
    sScatter = new Float32Array(N); sIntro = new Float32Array(N); sGather = new Float32Array(N);
    curl = new Float32Array(N); give = new Float32Array(N);
    ox = new Float32Array(N); oy = new Float32Array(N); vx = new Float32Array(N); vy = new Float32Array(N);
    px = new Float32Array(N); py = new Float32Array(N); pr = new Float32Array(N);
    group = new Int16Array(N); order = new Int32Array(N);

    for (let i = 0; i < N; i++) {
      hx[i] = tmp[i * F];
      hy[i] = tmp[i * F + 1];
      hz[i] = tmp[i * F + 2];
      const u = (hu[i] = tmp[i * F + 3]);
      hrole[i] = tmp[i * F + 4];
      nx[i] = tmp[i * F + 5];
      ny[i] = tmp[i * F + 6];
      nz[i] = tmp[i * F + 7];

      fu[i] = rand();
      fv[i] = rand();
      fd[i] = Math.pow(rand(), 1.8);              // casi todos lejos; unos pocos muy cerca
      rank[i] = rand();

      sz[i] = 0.7 + rand() * 0.6;
      phase[i] = rand() * TAU;
      freq[i] = 0.5 + rand() * 1.1;
      // Se deshace desde el centro de la hélice; se forma desde el extremo cercano
      sScatter[i] = 0.55 * Math.abs(2 * u - 1) + 0.45 * rand();
      sIntro[i] = 0.6 * (1 - u) + 0.4 * rand();
      sGather[i] = rand();
      curl[i] = (rand() - 0.5) * CURL;
      give[i] = 0.45 + rand() * 1.1;              // unos ceden más que otros: el hueco del cursor queda irregular
    }

    buildGlobe(rand);
  }

  // Planeta: una retícula de Fibonacci (puntos repartidos por igual en la esfera), con más puntos
  // en tierra que en el océano, y un poco de temblor para que no parezca una trama
  function buildGlobe(rand) {
    const wantLand = LAND ? Math.round(N * LAND_SHARE) : 0;
    const M = LAND ? Math.ceil((wantLand / 0.33) * 1.04) : N;
    const GA = Math.PI * (3 - Math.sqrt(5));
    const jitter = Math.sqrt((4 * Math.PI) / M) * 0.28;
    const land = [];
    const sea = [];
    for (let k = 0; k < M; k++) {
      const y = 1 - (2 * (k + 0.5)) / M;
      const q = Math.sqrt(1 - y * y);
      const th = k * GA;
      const x = Math.cos(th) * q;
      const z = Math.sin(th) * q;
      (isLand(Math.asin(y), Math.atan2(x, z)) ? land : sea).push(k);
    }
    const pick = (list, n) => {
      if (n >= list.length) return list.slice();
      const out = [];
      const step = list.length / n;
      for (let i = 0; i < n; i++) out.push(list[Math.floor(i * step)]);
      return out;
    };
    const chosenLand = pick(land, wantLand);
    const chosenSea = pick(sea, N - chosenLand.length);
    const chosen = chosenLand.map((k) => [k, LA]).concat(chosenSea.map((k) => [k, OC]));
    // Cada punto del ADN va a un sitio al azar del planeta
    for (let i = chosen.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
    }
    for (let i = 0; i < N; i++) {
      const [k, role] = chosen[i % chosen.length];
      const y = 1 - (2 * (k + 0.5)) / M;
      const q = Math.sqrt(1 - y * y);
      const th = k * GA;
      let x = Math.cos(th) * q + (rand() - 0.5) * jitter;
      let yy = y + (rand() - 0.5) * jitter;
      let z = Math.sin(th) * q + (rand() - 0.5) * jitter;
      const n = Math.hypot(x, yy, z);
      gx[i] = x / n;
      gy[i] = yy / n;
      gz[i] = z / n;
      grole[i] = role;
    }
  }

  /* ---------- puntero ---------- */

  // Posición y velocidad en coordenadas de la ventana; cada fotograma se pasan al lienzo
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, t: 0, on: false };

  window.addEventListener('pointermove', (e) => {
    const now = performance.now();
    const gap = now - pointer.t;
    if (pointer.on && gap < 120) {
      const dt = Math.max(gap, 8) / 1000;
      pointer.vx += ((e.clientX - pointer.x) / dt - pointer.vx) * 0.5;
      pointer.vy += ((e.clientY - pointer.y) / dt - pointer.vy) * 0.5;
    } else {
      pointer.vx = pointer.vy = 0;
    }
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.t = now;
    pointer.on = true;
  }, { passive: true });

  const release = () => { pointer.on = false; };
  document.documentElement.addEventListener('pointerleave', release);
  window.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') release(); });
  window.addEventListener('pointercancel', release);
  window.addEventListener('blur', release);

  /* ---------- simulación y dibujo ---------- */

  let w = 0;
  let h = 0;
  let dpr = 1;
  let time = 0;
  let spin = 0;
  let globeSpin = START_LON;
  let introT = 0;
  let started = false;
  let visible = false;
  let raf = 0;
  let last = 0;
  const tilt = { yaw: 0, pitch: 0 };
  const state = { scatter: -1, gather: -1, intro: -1 };
  // Scroll virtual y progreso de cada acto; primed = false los iguala a los reales en el siguiente
  // fotograma, sin animar (al cargar o al volver a estar en pantalla)
  const glider = () => ({ guide: 0, x: 0, v: 0 });
  const lagged = { y: glider(), scatter: glider(), gather: glider() };
  let primed = false;

  // Persecución sin tirones: la guía se acerca al objetivo (exponencial, como mucho max por segundo)
  // y un muelle críticamente amortiguado sigue a la guía. Así ni la posición, ni la velocidad, ni la
  // aceleración cambian de golpe, aunque el objetivo salte
  function glide(g, target, rate, max, dt) {
    if (!dt) return g.x;
    let step = (target - g.guide) * (1 - Math.exp(-rate * dt));
    const lim = max * dt;
    if (step > lim) step = lim;
    else if (step < -lim) step = -lim;
    g.guide += step;
    const k = rate * SOFTEN;
    const x0 = g.x - g.guide;
    const j = (g.v + k * x0) * dt;
    const e = Math.exp(-k * dt);
    g.x = g.guide + (x0 + j) * e;
    g.v = (g.v - k * j) * e;
    return g.x;
  }

  function settle(g, value) {
    g.guide = g.x = value;
    g.v = 0;
  }

  // Física del desvío: muelle hacia su sitio + empuje y arrastre del cursor
  function push(i, X, Y, dt, mx, my, mvx, mvy, R) {
    let ax = -SPRING * ox[i] - DAMP * vx[i];
    let ay = -SPRING * oy[i] - DAMP * vy[i];
    if (R) {
      const dx = X + ox[i] - mx;
      const dy = Y + oy[i] - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) + 0.01;
        const q = (1 - d / R) * (1 - d / R) * give[i] * look.push;
        ax += (dx / d) * q * PUSH + mvx * q * STIR;
        ay += (dy / d) * q * PUSH + mvy * q * STIR;
      }
    }
    vx[i] += ax * dt;
    vy[i] += ay * dt;
    ox[i] += vx[i] * dt;
    oy[i] += vy[i] * dt;
  }

  // Grupo de pintado: nivel de opacidad × color (-1 = no se pinta). Por niveles primero: los
  // puntos más opacos (los de delante) se pintan los últimos
  const groupOf = (c, a) => (a < 0.025 ? -1 : Math.min(LEVELS - 1, Math.ceil(a * LEVELS) - 1) * ROLES.length + c);

  function render(dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!w || !h || !N) return;

    const still = reduceMotion.matches;
    if (still) dt = 0;
    time += dt;
    spin += dt * look.speed * TAU;
    globeSpin += dt * look.globeSpeed * TAU;
    if (started) introT += dt;
    const intro = still ? 0 : 1 - clamp((introT - INTRO_DELAY) / INTRO_S, 0, 1);

    // Cajas en coordenadas del lienzo (normalmente el lienzo ocupa la pantalla entera)
    const cr = canvas.getBoundingClientRect();
    const kx = cr.width ? w / cr.width : 1;
    const ky = cr.height ? h / cr.height : 1;
    const vh = window.innerHeight || h;

    // Scroll virtual: las cajas se miden como si la página estuviera donde va el dibujo
    const pageY = window.scrollY;
    if (!primed || still) settle(lagged.y, pageY);
    const lag = pageY - glide(lagged.y, pageY, SCROLL_RATE / look.smooth, (SCROLL_MAX * vh) / look.smooth, dt);
    // lag: lo que el dibujo va por detrás de la página (px)

    // Acto 2: la dispersión sigue al tramo de fondo
    let scatterTo = 0;
    let travel = 0;
    if (fieldBox) {
      const top = fieldBox.getBoundingClientRect().top + lag;
      scatterTo = clamp((vh * SCATTER_FROM - top) / (vh * (SCATTER_FROM - SCATTER_TO)), 0, 1);
      travel = vh - top;
    } else if (helixBox) {
      const r = helixBox.getBoundingClientRect();
      scatterTo = clamp(-(r.top + lag) / (r.height * 0.8), 0, 1);
      travel = -(r.top + lag);
    }
    if (!helixBox) scatterTo = 1;   // sin hélice: los puntos empiezan ya como fondo

    // Acto 3: el planeta se junta en el centro de la pantalla hasta que su caja llega allí; desde
    // entonces sube con ella
    let gatherTo = 0;
    let gcx = w / 2;
    let gcy = h / 2;
    let gR = Math.min(w, h) * 0.35;
    if (globeBox) {
      const r = globeBox.getBoundingClientRect();
      const mid = r.top + lag + r.height / 2;
      gatherTo = clamp((vh * GATHER_FROM - mid) / (vh * (GATHER_FROM - 0.5)), 0, 1);
      gcx = (r.left + r.width / 2 - cr.left) * kx;
      gcy = (Math.min(mid, vh / 2) - cr.top) * ky;
      gR = look.globeSize * Math.min(r.width, r.height) * 0.5 * kx;
    }

    // Cada acto persigue su progreso con calma
    if (!primed || still) {
      settle(lagged.scatter, scatterTo);
      settle(lagged.gather, gatherTo);
    }
    const scatter = clamp(glide(lagged.scatter, scatterTo, ACT_RATE / look.smooth, ACT_MAX / look.smooth, dt), 0, 1);
    const gather = clamp(glide(lagged.gather, gatherTo, ACT_RATE / look.smooth, ACT_MAX / look.smooth, dt), 0, 1);
    primed = true;

    // Hélice: ocupa la diagonal de su caja; al dispersarse crece y se queda hacia el centro
    let hb = { x: 0, y: 0, w, h };
    if (helixBox) {
      const r = helixBox.getBoundingClientRect();
      hb = { x: (r.left - cr.left) * kx, y: (r.top + lag - cr.top) * ky, w: r.width * kx, h: r.height * ky };
    }
    const Lh = look.turns * PITCH;
    const scatterE = ease(scatter);
    const S = ((look.size * Math.hypot(hb.w, hb.h)) / Lh) * (1 + GROW * scatterE);
    const hcx = hb.x + hb.w / 2;
    const hcy = hb.y + hb.h / 2 + (h / 2 - (hb.y + hb.h / 2)) * HOLD * scatterE;
    let tiltDeg = look.tilt;
    // En vertical, la diagonal se empina para que la hélice quepa
    if (hb.h > hb.w * 1.05) tiltDeg = (tiltDeg < 0 ? -1 : 1) * Math.max(Math.abs(tiltDeg), 58);

    // Cursor en coordenadas del lienzo
    let mx = 0;
    let my = 0;
    let mvx = 0;
    let mvy = 0;
    let inside = false;
    if (pointer.on && !still) {
      mx = (pointer.x - cr.left) * kx;
      my = (pointer.y - cr.top) * ky;
      mvx = pointer.vx * kx;
      mvy = pointer.vy * ky;
      inside = mx >= 0 && mx <= w && my >= 0 && my <= h;
    }
    const decay = Math.exp(-dt * 6);
    pointer.vx *= decay;
    pointer.vy *= decay;
    const follow = 1 - Math.exp(-dt * TILT_RATE);
    tilt.yaw += ((inside ? (mx / w) * 2 - 1 : 0) * TILT_YAW - tilt.yaw) * follow;
    tilt.pitch += ((inside ? (my / h) * 2 - 1 : 0) * TILT_PITCH - tilt.pitch) * follow;
    const R = inside && look.push > 0 ? REACH * Math.min(w, h) : 0;

    // Giros de la hélice: sobre su eje (spin), perspectiva (yaw), diagonal (tilt) y cursor (pitch)
    const cs = Math.cos(spin);
    const ss = Math.sin(spin);
    const yaw = (look.yaw * Math.PI) / 180 + tilt.yaw;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const th = (tiltDeg * Math.PI) / 180;
    const ct = Math.cos(th);
    const st = Math.sin(th);
    const cp = Math.cos(tilt.pitch);
    const sp = Math.sin(tilt.pitch);
    const T = look.thickness;
    const unitH = look.dot * clamp(S / REF_SCALE, 0.7, 1.5);

    // Giros del planeta: sobre su eje, visto desde arriba e inclinado
    const cl = Math.cos(globeSpin + tilt.yaw);
    const sl = Math.sin(globeSpin + tilt.yaw);
    const cb = Math.cos(VIEW_PITCH + tilt.pitch);
    const sb = Math.sin(VIEW_PITCH + tilt.pitch);
    const cg = Math.cos(AXIS_TILT);
    const sg = Math.sin(AXIS_TILT);
    const unitG = look.dot * clamp(gR / 220, 0.7, 1.4);

    // Fondo
    const band = h * BAND;
    const edge = (band - h) / 2;
    const unitF = look.dot * clamp(Math.min(w, h) / 700, 0.75, 1.3);

    const wob = still ? 0 : WOBBLE;
    const twinkle = still ? 0 : TWINKLE;

    counts.fill(0);

    for (let i = 0; i < N; i++) {
      const role = hrole[i];
      const dust = role === DU;
      const ea = dust ? 1 : Math.max(ease(stag(scatter, sScatter[i])), ease(stag(intro, sIntro[i])));
      const eb = gather > 0 ? ease(stag(gather, sGather[i])) : 0;
      const ph = phase[i];
      const fq = freq[i];

      let X = 0;
      let Y = 0;
      let r = 0;
      let a = 0;

      if (eb < 1) {
        // Sitio en el fondo
        let fX = 0;
        let fY = 0;
        let fR = 0;
        let fA = 0;
        if (ea > 0) {
          const d = fd[i];
          let y = (fv[i] * band - travel * (0.06 + 0.4 * d)) % band;
          if (y < 0) y += band;
          y -= edge;
          let x = fu[i] * w;
          if (!still) {
            x += Math.sin(time * 0.25 * fq + ph) * DRIFT * (0.4 + d);
            y += Math.cos(time * 0.2 * fq + ph * 1.3) * DRIFT * 0.8 * (0.4 + d);
          }
          fX = x;
          fY = y;
          fR = unitF * sz[i] * (0.45 + 0.75 * d + 1.4 * Math.pow(d, 7));
          // Los cercanos, grandes y más suaves; los lejanos se apagan; nada asoma de golpe por los bordes
          const base = (0.3 + 0.7 * d) * (1 - 0.55 * Math.pow(d, 5)) * smooth(-edge, 0, y) * smooth(h + edge, h, y);
          const field = rank[i] < look.fieldDensity ? look.fieldOpacity : 0;
          fA = dust ? base * (0.45 + (field - 0.45) * scatterE) : base * field;
        }

        // Sitio en la hélice
        let hX = 0;
        let hY = 0;
        let hR = 0;
        let hA = 0;
        if (ea < 1) {
          const x = hx[i] + wob * Math.sin(time * fq + ph);
          const y = hy[i] + wob * Math.sin(time * fq * 1.3 + ph * 2.1);
          const z = hz[i] + wob * Math.sin(time * fq * 0.8 + ph * 3.7);
          const y1 = y * cs - z * ss;
          const z1 = y * ss + z * cs;
          const x2 = x * cy + z1 * sy;
          const z2 = z1 * cy - x * sy;
          const X1 = x2 * ct - y1 * st;
          const Y1 = x2 * st + y1 * ct;
          const Y2 = Y1 * cp - z2 * sp;
          const Z = Y1 * sp + z2 * cp;
          const k = FOCAL / (FOCAL - Z);
          hX = hcx + X1 * S * k;
          hY = hcy + Y2 * S * k;
          // Hacia dónde mira el punto, con los mismos giros: sombreado y cara oculta de cada cuenta
          const n1y = ny[i] * cs - nz[i] * ss;
          const n1z = ny[i] * ss + nz[i] * cs;
          const n2x = nx[i] * cy + n1z * sy;
          const n2z = n1z * cy - nx[i] * sy;
          const nY1 = n2x * st + n1y * ct;
          const nX = n2x * ct - n1y * st;
          const nY = nY1 * cp - n2z * sp;
          const nZ = nY1 * sp + n2z * cp;
          const lit = Math.max(0, LIGHT[0] * nX + LIGHT[1] * nY + LIGHT[2] * nZ);
          const facing = 0.62 + 0.38 * smooth(-0.7, 0.2, nZ);
          const front = (clamp(z1 / (1 + T), -1, 1) + 1) / 2;   // 0 = detrás del eje, 1 = delante
          const u = hu[i];
          hR = unitH * sz[i] * k * (0.78 + 0.22 * front) * (1 - 0.25 * lit) * (role >= BA ? 0.85 : 1);
          hA = ROLE_ALPHA[role] * (1 - look.depthFade * (1 - front)) * (1 - SHADE * lit) * facing *
            smooth(0, TAPER, u) * smooth(1, 1 - TAPER, u);
        }

        if (dust || ea >= 1) {
          X = fX; Y = fY; r = fR; a = fA;
        } else if (ea <= 0) {
          X = hX; Y = hY; r = hR; a = hA;
        } else {
          const dx = fX - hX;
          const dy = fY - hY;
          const bend = curl[i] * Math.sin(Math.PI * ea);
          X = hX + dx * ea - dy * bend;
          Y = hY + dy * ea + dx * bend;
          r = hR + (fR - hR) * ea;
          a = hA + (fA - hA) * ea;
        }
      }

      if (eb > 0) {
        // Sitio en el planeta
        const x = gx[i];
        const y = gy[i];
        const z = gz[i];
        const x1 = x * cl + z * sl;
        const z1 = z * cl - x * sl;
        const y2 = y * cb - z1 * sb;
        const z2 = y * sb + z1 * cb;
        const X1 = x1 * cg - y2 * sg;
        const Y1 = x1 * sg + y2 * cg;
        const k = GLOBE_FOCAL / (GLOBE_FOCAL - z2);
        const gX = gcx + X1 * gR * k;
        const gY = gcy - Y1 * gR * k;
        const front = smooth(-0.15, 0.25, z2);
        const limb = 0.6 + 0.4 * smooth(0, 0.55, z2);   // en el borde se apiñan: se aclaran
        const land = grole[i] === LA;
        const gRad = unitG * sz[i] * k * (land ? 1 : 0.8) * (0.75 + 0.25 * front);
        const gA = (land ? 0.1 + 0.9 * front : 0.06 + 0.5 * front) * limb;
        if (eb >= 1) {
          X = gX; Y = gY; r = gRad; a = gA;
        } else {
          const dx = gX - X;
          const dy = gY - Y;
          const bend = curl[i] * Math.sin(Math.PI * eb);
          X += dx * eb - dy * bend;
          Y += dy * eb + dx * bend;
          r += (gRad - r) * eb;
          a += (gA - a) * eb;
        }
      }

      a *= look.opacity * (1 - twinkle * (0.5 + 0.5 * Math.sin(time * fq * 2.2 + ph * 1.7)));
      const g = groupOf(eb > 0.5 ? grole[i] : role, a);
      group[i] = g;
      if (g < 0) continue;
      if (dt) push(i, X, Y, dt, mx, my, mvx, mvy, R);
      px[i] = X + ox[i];
      py[i] = Y + oy[i];
      pr[i] = Math.max(0.35, r);
      counts[g + 1]++;
    }

    // Orden por grupo (recuento): cada grupo se pinta de una vez
    for (let g = 1; g <= GROUPS; g++) counts[g] += counts[g - 1];
    const ends = counts.slice();
    for (let i = 0; i < N; i++) {
      const g = group[i];
      if (g >= 0) order[--ends[g + 1]] = i;
    }

    for (let g = 0; g < GROUPS; g++) {
      const from = counts[g];
      const to = counts[g + 1];
      if (from === to) continue;
      ctx.fillStyle = look.colors[g % ROLES.length];
      ctx.globalAlpha = (Math.floor(g / ROLES.length) + 1) / LEVELS;
      ctx.beginPath();
      for (let n = from; n < to; n++) {
        const i = order[n];
        ctx.moveTo(px[i] + pr[i], py[i]);
        ctx.arc(px[i], py[i], pr[i], 0, TAU);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Progreso de cada acto (para quien lo quiera escuchar, p. ej. la subpágina de prueba)
    if (
      Math.abs(scatter - state.scatter) > 0.002 ||
      Math.abs(gather - state.gather) > 0.002 ||
      Math.abs(intro - state.intro) > 0.01
    ) {
      state.scatter = scatter;
      state.gather = gather;
      state.intro = intro;
      root.dispatchEvent(new CustomEvent('dna:state', { detail: { scatter, gather, intro } }));
    }
  }

  /* ---------- tamaño y bucle ---------- */

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    compact = w < 700;
    if (readLook() || !N) build();
    render(0);
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    render(dt);
    if (visible && !document.hidden && !reduceMotion.matches) raf = requestAnimationFrame(frame);
  }

  function play() {
    if (raf) return;
    if (reduceMotion.matches) {
      render(0);
      return;
    }
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  readLook();
  new ResizeObserver(resize).observe(canvas);

  // Movimiento reducido: la hélice ya formada y quieta; los actos siguen al scroll
  if (reduceMotion.matches) started = true;
  window.addEventListener('scroll', () => { if (reduceMotion.matches) render(0); }, { passive: true });

  // Solo se anima en pantalla; la entrada empieza cuando se ve buena parte de la hélice
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (!visible) primed = false;   // al volver, sin animar lo que pasó mientras no se veía
      if (visible) play();
    }).observe(root);
    new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      if (e.isIntersecting && e.intersectionRatio >= 0.3) started = true;
    }, { threshold: [0, 0.3] }).observe(helixBox || root);
  } else {
    started = visible = true;
    play();
  }

  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) play(); });

  canvas.addEventListener('dna:refresh', () => {
    if (readLook()) build();
    render(0);
  });

  canvas.addEventListener('dna:replay', () => {
    if (reduceMotion.matches) return;
    introT = 0;
    started = true;
    play();
  });

  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) started = true;
    play();
  });
})();
