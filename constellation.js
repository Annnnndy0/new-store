/* Cerebro de partículas en la guía "¿Qué es…?" (sección Guías).
   Reinterpreta el hero de Dala (una constelación de triángulos diminutos que forman un
   cerebro) con la paleta de la página.

   - Los puntos vienen de brain-points.js: muestreados de assets/brain.webp, más densos en los
     pliegues y en el contorno para que se lean las circunvoluciones. Cada punto tiene
     profundidad (la silueta se abomba hacia los lados), así el cerebro es un volumen.
   - Entrada: al aparecer en pantalla, las piezas llegan desde la izquierda como una estela
     desenfocada, giran en remolino y se juntan hasta formar el cerebro nítido.
   - Reposo: el cerebro se balancea despacio en 3D y respira; cada pieza flota alrededor de su
     sitio, gira y titila. Alrededor flota un polvo de piezas sueltas.
   - Puntero: el cerebro se inclina hacia el cursor; las piezas cercanas se apartan y se dejan
     arrastrar por su movimiento, como en un fluido, y vuelven a su sitio con un muelle.
   - Colores, fondo y tamaños: variables --brain-* en styles.css (se leen al cargar y al
     redimensionar).
   - El lienzo se adapta a su caja: reads.js lo lleva dentro del fantasma cuando la tarjeta
     cambia de sitio, y aquí solo se redimensiona y se vuelve a centrar. */
(() => {
  'use strict';

  const canvas = document.querySelector('[data-constellation]');
  const DATA = window.BRAIN_POINTS;
  const ctx = canvas && DATA ? canvas.getContext('2d') : null;
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Forma
  const FOCAL = 5;                  // distancia de la cámara (en mitades del largo del cerebro)
  const REF_SCALE = 160;            // escala (px por mitad del largo) en la que las piezas miden --brain-particle
  const DUST_PER_PX = 1 / 2600;     // piezas sueltas por px² del cuadro
  const DUST_MIN = 24;
  const DUST_MAX = 140;

  // Reposo
  const SWAY_YAW = 0.3;             // balanceo lateral (rad)
  const SWAY_PITCH = 0.07;
  const SWAY_S = 16;                // segundos por balanceo
  const BREATH = 0.014;             // respiración del conjunto (fracción de la escala)
  const BREATH_S = 5.5;
  const WOBBLE = 0.011;             // cada pieza flota alrededor de su sitio (mitades del largo)
  const TWINKLE = 0.3;              // titileo (fracción de la opacidad)

  // Entrada
  const INTRO_DELAY = 0.25;         // s desde que la tarjeta aparece
  const INTRO_S = 1.7;              // vuelo de cada pieza
  const INTRO_STAGGER = 1;          // las de la derecha llegan antes; la estela se recoge al final
  const TRAIL = 2.2;                // largo de la estela de partida (mitades del largo)
  const INTRO_END = INTRO_DELAY + INTRO_STAGGER + INTRO_S;

  // Puntero
  const TILT_YAW = 0.4;             // inclinación hacia el cursor (rad)
  const TILT_PITCH = 0.22;
  const TILT_RATE = 2.4;            // rapidez con que la sigue (1/s)
  const REACH = 0.21;               // radio de influencia: fracción del lado menor del cuadro
  const PUSH = 2200;                // empuje en el centro del radio (px/s²); cada pieza cede distinto
  const STIR = 6;                   // arrastre: cuánto se contagia la velocidad del cursor (1/s)
  const SPRING = 32;                // vuelta a su sitio (1/s²)
  const DAMP = 6;                   // amortiguación (1/s)

  // Opacidad: las piezas se agrupan por color y nivel de opacidad para pintar pocas veces
  const LEVELS = 6;

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------- color ---------- */

  // Variables --brain-* de styles.css. Si falta alguna o no es válida, se usa el valor de aquí.
  const ROLES = ['ink', 'deep', 'mid', 'soft', 'stone', 'dust'];
  const [INK, DEEP, MID, SOFT, STONE, DUST] = ROLES.keys();
  const look = {
    colors: ['#0e1431', '#273169', '#4c5a9a', '#9ba3c8', '#6e6a69', '#9a9796'],
    size: 0.74,
    particle: 2.2,
    stroke: 1,
    opacity: 1,
  };

  function readNumber(css, name, min, max) {
    const n = parseFloat(css.getPropertyValue(`--brain-${name}`));
    if (Number.isFinite(n)) look[name] = clamp(n, min, max);
  }

  function readLook() {
    const css = getComputedStyle(canvas);
    ROLES.forEach((role, i) => {
      const value = css.getPropertyValue(`--brain-${role}`).trim();
      if (!value) return;
      // Un color no válido no cambia strokeStyle: se queda el anterior
      ctx.strokeStyle = look.colors[i];
      ctx.strokeStyle = value;
      look.colors[i] = ctx.strokeStyle;
    });
    readNumber(css, 'size', 0.2, 1);
    readNumber(css, 'particle', 0.5, 8);
    readNumber(css, 'stroke', 0.25, 4);
    readNumber(css, 'opacity', 0, 1);
  }

  /* ---------- piezas ---------- */

  const rand = seeded(20261006);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const choose = (...pairs) => {
    let r = rand();
    for (const [value, p] of pairs) {
      if ((r -= p) < 0) return value;
    }
    return pairs[pairs.length - 1][0];
  };

  const bytes = Uint8Array.from(atob(DATA.data), (c) => c.charCodeAt(0));
  const N = bytes.length >> 2;
  const unpack = (b) => ((b + rand() - 0.5) / 255) * 2 * DATA.limit - DATA.limit;

  // Cerebro: sitio (hx, hy, hz), color, tamaño, giro, fase de flote y punto de partida
  const hx = new Float32Array(N);
  const hy = new Float32Array(N);
  const hz = new Float32Array(N);
  const alpha = new Float32Array(N);
  const sx = new Float32Array(N);
  const sy = new Float32Array(N);
  const sz = new Float32Array(N);
  const swirl = new Float32Array(N);
  const delay = new Float32Array(N);

  // Polvo: posición en fracciones del cuadro, deriva y profundidad
  const du = new Float32Array(DUST_MAX);
  const dv = new Float32Array(DUST_MAX);
  const dvu = new Float32Array(DUST_MAX);
  const dvv = new Float32Array(DUST_MAX);
  const dd = new Float32Array(DUST_MAX);

  // Comunes (cerebro y después polvo): color, tamaño, ángulo, giro, fases y desvío del puntero
  const M = N + DUST_MAX;
  const color = new Uint8Array(M);
  const size = new Float32Array(M);
  const angle = new Float32Array(M);
  const spin = new Float32Array(M);
  const phase = new Float32Array(M);
  const freq = new Float32Array(M);
  const give = new Float32Array(M);
  const ox = new Float32Array(M);
  const oy = new Float32Array(M);
  const vx = new Float32Array(M);
  const vy = new Float32Array(M);

  // Resultado de cada fotograma: posición en pantalla, radio y grupo (color × opacidad)
  const px = new Float32Array(M);
  const py = new Float32Array(M);
  const pr = new Float32Array(M);
  const group = new Int16Array(M);
  const GROUPS = ROLES.length * LEVELS;
  const counts = new Int32Array(GROUPS + 1);
  const order = new Int32Array(M);

  for (let i = 0; i < N; i++) {
    hx[i] = unpack(bytes[i * 4]);
    hy[i] = unpack(bytes[i * 4 + 1]);
    hz[i] = unpack(bytes[i * 4 + 2]);
    const tone = bytes[i * 4 + 3] / 255;

    // Pliegues y contorno en el color principal; el relieve, en azules más claros; la cara de
    // detrás y el interior, en tonos suaves
    if (tone > 0.5) {
      color[i] = choose([INK, 0.8], [DEEP, 0.2]);
      alpha[i] = 1;
    } else if (tone > 0.18) {
      color[i] = choose([INK, 0.4], [DEEP, 0.42], [MID, 0.18]);
      alpha[i] = 0.95;
    } else if (hz[i] > 0.05) {
      color[i] = choose([DEEP, 0.3], [MID, 0.4], [SOFT, 0.15], [STONE, 0.15]);
      alpha[i] = 0.85;
    } else {
      color[i] = choose([MID, 0.25], [SOFT, 0.5], [STONE, 0.1], [DUST, 0.15]);
      alpha[i] = 0.8;
    }

    // Parte de una estela a la izquierda y llega girando; la derecha del cerebro llega antes
    sx[i] = -(0.35 + rand() * TRAIL);
    sy[i] = gauss() * 0.45;
    sz[i] = gauss() * 0.7;
    swirl[i] = (rand() - 0.5) * 1.6;
    delay[i] = INTRO_DELAY + (1 - (hx[i] + 1) / 2) * INTRO_STAGGER * 0.65 + rand() * INTRO_STAGGER * 0.35;
  }

  for (let j = 0; j < DUST_MAX; j++) {
    du[j] = rand();
    dv[j] = rand();
    const a = rand() * TAU;
    const speed = 0.004 + rand() * 0.01;
    dvu[j] = Math.cos(a) * speed;
    dvv[j] = Math.sin(a) * speed;
    dd[j] = rand() * 2 - 1;
    color[N + j] = choose([DUST, 0.45], [SOFT, 0.35], [MID, 0.2]);
  }

  for (let i = 0; i < M; i++) {
    size[i] = i < N ? 0.75 + rand() * 0.55 : 0.6 + rand() * 0.7;
    angle[i] = rand() * TAU;
    spin[i] = (rand() < 0.5 ? -1 : 1) * (0.15 + rand() * 0.9);
    phase[i] = rand() * TAU;
    freq[i] = 0.5 + rand() * 1.1;
    give[i] = 0.45 + rand() * 1.1;   // unas ceden más que otras: el hueco del cursor queda irregular
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
  let dustCount = 0;
  let time = 0;
  let intro = 0;
  let started = false;
  let visible = false;
  let raf = 0;
  let last = 0;
  const tilt = { yaw: 0, pitch: 0 };

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
        const q = (1 - d / R) * (1 - d / R) * give[i];
        ax += (dx / d) * q * PUSH + mvx * q * STIR;
        ay += (dy / d) * q * PUSH + mvy * q * STIR;
      }
    }
    vx[i] += ax * dt;
    vy[i] += ay * dt;
    ox[i] += vx[i] * dt;
    oy[i] += vy[i] * dt;
  }

  // Grupo de pintado: color × nivel de opacidad (-1 = no se pinta)
  const groupOf = (c, a) => (a < 0.03 ? -1 : c * LEVELS + Math.min(LEVELS - 1, Math.ceil(a * LEVELS) - 1));

  function render(dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!w || !h || !started) return;

    const still = reduceMotion.matches;
    if (still) {
      dt = 0;
      intro = INTRO_END;
    }
    time += dt;
    intro = Math.min(intro + dt, INTRO_END);

    // Cursor en coordenadas del lienzo (la caja puede estar escalada o en pleno viaje)
    let mx = 0;
    let my = 0;
    let mvx = 0;
    let mvy = 0;
    let inside = false;
    if (pointer.on && !still) {
      const r = canvas.getBoundingClientRect();
      if (r.width && r.height) {
        const kx = w / r.width;
        const ky = h / r.height;
        mx = (pointer.x - r.left) * kx;
        my = (pointer.y - r.top) * ky;
        mvx = pointer.vx * kx;
        mvy = pointer.vy * ky;
        inside = mx >= 0 && mx <= w && my >= 0 && my <= h;
      }
    }
    const decay = Math.exp(-dt * 6);
    pointer.vx *= decay;
    pointer.vy *= decay;
    const follow = 1 - Math.exp(-dt * TILT_RATE);
    tilt.yaw += ((inside ? (mx / w * 2 - 1) * TILT_YAW : 0) - tilt.yaw) * follow;
    tilt.pitch += ((inside ? -(my / h * 2 - 1) * TILT_PITCH : 0) - tilt.pitch) * follow;
    const R = inside ? REACH * Math.min(w, h) : 0;

    const yaw = SWAY_YAW * Math.sin((time * TAU) / SWAY_S) + tilt.yaw;
    const pitch = SWAY_PITCH * Math.sin((time * TAU) / (SWAY_S * 1.37) + 1) + tilt.pitch;
    const cyaw = Math.cos(yaw);
    const syaw = Math.sin(yaw);
    const cpitch = Math.cos(pitch);
    const spitch = Math.sin(pitch);
    const breath = 1 + (still ? 0 : BREATH * Math.sin((time * TAU) / BREATH_S));
    const S = Math.min(w / 2, h / (2 * DATA.aspect)) * look.size * breath;
    const cx = w / 2;
    const cy = h / 2;
    const unit = look.particle * clamp(S / REF_SCALE, 0.75, 1.3);
    const wob = still ? 0 : WOBBLE;
    const twinkle = still ? 0 : TWINKLE;
    const flying = intro < INTRO_END;

    counts.fill(0);

    // Cerebro
    for (let i = 0; i < N; i++) {
      let x = hx[i];
      let y = hy[i];
      let z = hz[i];
      let a = alpha[i];
      let grow = 1;

      if (flying) {
        const p = (intro - delay[i]) / INTRO_S;
        if (p <= 0) {
          group[i] = -1;
          continue;
        }
        if (p < 1) {
          const f = Math.pow(1 - p, 3);                    // lo que le queda de viaje
          const th = swirl[i] * f;
          const c = Math.cos(th);
          const s = Math.sin(th);
          x += (sx[i] * c - sy[i] * s) * f;
          y += (sx[i] * s + sy[i] * c) * f;
          z += sz[i] * f;
          a *= smooth(0, 0.35, p) * (1 - 0.55 * f);        // llega desenfocada: tenue y grande
          grow = 1 + 1.6 * f;
        }
      }

      const ph = phase[i];
      const fq = freq[i];
      x += wob * Math.sin(time * fq + ph);
      y += wob * Math.sin(time * fq * 1.3 + ph * 2.1);
      z += wob * Math.sin(time * fq * 0.8 + ph * 3.7);

      const x1 = x * cyaw + z * syaw;
      const z1 = z * cyaw - x * syaw;
      const y1 = y * cpitch - z1 * spitch;
      const z2 = y * spitch + z1 * cpitch;
      const k = FOCAL / (FOCAL - z2);
      const X = cx + x1 * S * k;
      const Y = cy + y1 * S * k;

      if (dt) push(i, X, Y, dt, mx, my, mvx, mvy, R);
      px[i] = X + ox[i];
      py[i] = Y + oy[i];
      pr[i] = unit * size[i] * k * grow;
      angle[i] += spin[i] * dt;

      a *= 0.2 + 0.8 * smooth(-0.55, 0.3, z2);             // la cara de detrás se apaga
      a *= 1 - twinkle * (0.5 + 0.5 * Math.sin(time * fq * 2.2 + ph * 1.7));
      const g = groupOf(color[i], a * look.opacity);
      group[i] = g;
      counts[g + 1]++;
    }

    // Polvo alrededor: deriva, se apaga junto a los bordes y aparece con la entrada
    const dustIn = smooth(INTRO_DELAY, INTRO_DELAY + 1.4, intro);
    for (let j = 0; j < DUST_MAX; j++) {
      const i = N + j;
      if (j >= dustCount) {
        group[i] = -1;
        continue;
      }
      du[j] = (du[j] + dvu[j] * dt + 1) % 1;
      dv[j] = (dv[j] + dvv[j] * dt + 1) % 1;
      const X = du[j] * w + yaw * dd[j] * w * 0.05;
      const Y = dv[j] * h - pitch * dd[j] * h * 0.05;
      if (dt) push(i, X, Y, dt, mx, my, mvx, mvy, R);
      px[i] = X + ox[i];
      py[i] = Y + oy[i];
      pr[i] = unit * size[i] * (1 + 0.25 * dd[j]);
      angle[i] += spin[i] * dt;

      const edge = Math.min(du[j], 1 - du[j], dv[j], 1 - dv[j]);
      let a = (0.35 + 0.25 * dd[j]) * smooth(0, 0.12, edge) * dustIn;
      a *= 1 - twinkle * (0.5 + 0.5 * Math.sin(time * freq[i] * 2.2 + phase[i]));
      const g = groupOf(color[i], a * look.opacity);
      group[i] = g;
      counts[g + 1]++;
    }

    // Orden por grupo (recuento): cada grupo se pinta con un solo trazo
    for (let g = 1; g <= GROUPS; g++) counts[g] += counts[g - 1];
    const ends = counts.slice();
    for (let i = 0; i < M; i++) {
      const g = group[i];
      if (g >= 0) order[--ends[g + 1]] = i;
    }

    ctx.lineWidth = look.stroke;
    ctx.lineJoin = 'miter';
    for (let g = 0; g < GROUPS; g++) {
      const from = counts[g];
      const to = counts[g + 1];
      if (from === to) continue;
      ctx.strokeStyle = look.colors[Math.floor(g / LEVELS)];
      ctx.globalAlpha = ((g % LEVELS) + 1) / LEVELS;
      ctx.beginPath();
      for (let n = from; n < to; n++) {
        const i = order[n];
        const X = px[i];
        const Y = py[i];
        const c = Math.cos(angle[i]) * pr[i];
        const s = Math.sin(angle[i]) * pr[i];
        // Triángulo equilátero hueco: vértices a 0°, 120° y 240° del ángulo de la pieza
        ctx.moveTo(X + c, Y + s);
        ctx.lineTo(X - 0.5 * c - 0.866 * s, Y + 0.866 * c - 0.5 * s);
        ctx.lineTo(X - 0.5 * c + 0.866 * s, Y - 0.866 * c - 0.5 * s);
        ctx.closePath();
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- tamaño y bucle ---------- */

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    dustCount = Math.round(clamp(w * h * DUST_PER_PX, DUST_MIN, DUST_MAX));
    readLook();
    // Redimensionar borra el lienzo: se repinta en el acto (también en pleno viaje del fantasma)
    render(0);
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    render(dt);
    if (visible && !reduceMotion.matches) raf = requestAnimationFrame(frame);
  }

  function play() {
    if (raf || reduceMotion.matches) {
      render(0);
      return;
    }
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  new ResizeObserver(resize).observe(canvas);

  // Movimiento reducido: el cerebro ya formado y quieto, sin entrada
  if (reduceMotion.matches) started = true;

  // Solo se anima en pantalla; la entrada empieza cuando se ve buena parte del cuadro
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      visible = e.isIntersecting;
      if (visible && e.intersectionRatio >= 0.3) started = true;
      if (visible) play();
    }, { threshold: [0, 0.3] }).observe(canvas);
  } else {
    started = visible = true;
    play();
  }

  // reads.js lo pide cuando la tarjeta del cerebro se despliega: las piezas vuelven a llegar
  canvas.addEventListener('constellation:replay', () => {
    if (reduceMotion.matches) return;
    intro = 0;
    started = true;
    play();
  });

  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) started = true;
    play();
  });
})();
