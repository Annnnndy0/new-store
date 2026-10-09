/* Órbita de palabras alrededor del cerebro y su escudo de púas.
   Reinterpreta el hero de cosmos.so (mosaico de imágenes girando alrededor del texto
   central) usando texto. Las palabras se leen de <ul id="orbit-words"> en index.html.

   - Cada palabra recorre una órbita elíptica fija alrededor del sello (rotación rígida).
   - Tamaño y tono crecen hacia fuera: cerca del sello = lejos (pequeño, gris piedra),
     en la periferia = cerca (grande, tinta), como la profundidad del hero de Cosmos.
   - El plano de la órbita se inclina en 3D (precesión lenta + puntero).
   - Un paso de separación por posiciones garantiza que ninguna palabra toque a otra,
     ni al sello, ni al logo.
   - Se muestran, en el orden de la lista, todas las palabras que caben sin saturar; el resto
     espera en reserva y entra por relevo (una palabra se disuelve y otra ocupa su hueco).
   - Junto al escudo las palabras se desenfocan (shield.js simula y dibuja el escudo).
   - Cada pocos segundos una palabra al azar toma impulso y se lanza en línea recta hacia el
     cerebro; las púas la frenan como un trampolín (contacto contra la superficie deformada),
     se hunden y la despiden. La palabra se queda donde el escudo la lanzó y sigue orbitando
     desde ahí. */
(() => {
  'use strict';

  const panel = document.querySelector('[data-orbit]');
  if (!panel) return;

  const canvas = panel.querySelector('.orbit');
  const seal = panel.querySelector('.seal');
  const toggle = panel.querySelector('.orbit-toggle');
  const head = panel.querySelector('.cosmos__head');
  const avoid = [head, toggle].filter(Boolean);
  const ctx = canvas.getContext('2d');
  const shield = window.Shield ? window.Shield.create(seal) : null;
  const WORDS = [...document.querySelectorAll('#orbit-words li')]
    .map((li) => li.textContent.trim())
    .filter(Boolean);
  if (!ctx || !WORDS.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const FONT_FAMILY = '"Geist", ui-sans-serif, system-ui, sans-serif';
  const WEIGHT = 350;               // peso "susurro" de Cosmos
  const REVOLUTION_S = 38;          // segundos por vuelta completa
  const HOVER_SPEED = 0.28;         // velocidad relativa con el puntero encima (para leer)
  const GAP_X = 28;                 // aire horizontal mínimo entre palabras (px)
  const GAP_Y = 16;                 // aire vertical mínimo entre palabras (px)
  const ORBIT_IN = 0.97;            // radio de la órbita más interna (fracción del radio del sello)
  const SEAL_GRAZE = 0.96;          // las palabras no tocan las púas en reposo (fracción del radio)
  const DENSITY = 0.44;             // fracción del anillo que pueden ocupar las palabras (sin saturar)
  const MIN_CLEAR = 0.85;           // holgura mínima para aceptar una palabra más
  const BLUR_MAX = 4;               // desenfoque junto al escudo (px)
  const BLUR_REACH = 0.12;          // alcance del desenfoque desde el borde del escudo (fracción del panel)
  const SWAP_EVERY_S = 2.6;         // relevo de palabras en reserva (0 = desactivado)
  const SWAP_OUT_S = 0.7;
  const SWAP_IN_S = 1.1;
  const SWAP_BLUR = 7;              // desenfoque extra mientras una palabra se disuelve (px)
  const SWAP_FIT = 1.06;            // una palabra entra si no es más ancha que el hueco (+6 %)
  const OFFSCREEN = 10000;          // respaldo de desenfoque con sombra (navegadores sin ctx.filter)
  const ATTACK_MIN_S = 5;           // cada cuánto una palabra intenta llegar al cerebro
  const ATTACK_MAX_S = 9;
  const ATTACK_AIM_S = 0.35;        // toma impulso (retrocede y se enfoca) antes de lanzarse
  const ATTACK_SPEED = 420;         // velocidad máxima de la embestida (px/s)
  const ATTACK_ACCEL = 1400;        // aceleración en línea recta (px/s²)
  const CONTACT_K = 520;            // rigidez de las púas al contacto (1/s²): frena en ~18 px
  const CONTACT_C = 12;             // amortiguación del contacto (rebote con pérdida)
  const EDGE = 16;                  // margen con el borde del panel (px)
  const TILT_AUTO = (5 * Math.PI) / 180;
  const TILT_POINTER = (7 * Math.PI) / 180;
  const SIZE_NEAR_SEAL = 0.78;      // escala junto al sello (lejos)
  const SIZE_AT_EDGE = 1.5;         // escala en la periferia (cerca)
  const MIN_PX = 12;                // cuerpo mínimo legible
  const STONE = [110, 106, 105];
  const INK = [13, 13, 13];

  /* ---------- utilidades ---------- */

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const hash = (s) => {
    let h = 2166136261;
    for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
    return h >>> 0;
  };
  const seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const fontAt = (px) => `${WEIGHT} ${px}px ${FONT_FAMILY}`;
  // Tracking negativo de Cosmos según tamaño: -0.011em (16-18), -0.02em (24-26), -0.035em (33+)
  const tracking = (px) => (px <= 18 ? -0.011 : px <= 28 ? -0.02 : -0.035) * px;
  const hasSpacing = 'letterSpacing' in ctx;
  const textWidth = (wd, px) => (wd.w100 * px) / 100 + (hasSpacing ? tracking(px) * wd.chars : 0);
  const hasCanvasFilter = (() => {
    if (!('filter' in ctx)) return false;
    ctx.filter = 'blur(1px)';
    const ok = ctx.filter === 'blur(1px)';
    ctx.filter = 'none';
    return ok;
  })();

  /* ---------- estado ---------- */

  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0;
  let Rs = 0, B = 16, P = 1, AY = 1;
  let rIn = 1, rOuter = 2;
  let sMin = 1, sMax = 1;
  let blurReach = 100;
  let obstacles = [];
  let words = [];       // huecos en órbita
  let reserve = [];     // palabras que esperan turno
  let slotOrder = [];
  let swapIdx = 0, swapClock = 0;
  let attackClock = ATTACK_MIN_S + 1;

  let spin = 0, clock = 0, last = 0;
  let raf = 0, running = false, inView = true, ready = false, paused = false;
  let speed = 1;
  let tiltA = 0, tiltB = 0;
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, inside: false };
  let hovered = null;

  /* ---------- medida y colocación ---------- */

  function measure() {
    ctx.save();
    ctx.font = fontAt(100);
    if (hasSpacing) ctx.letterSpacing = '0px';
    const list = WORDS.map((text) => ({
      text,
      w100: ctx.measureText(text).width,
      chars: [...text].length,
    }));
    ctx.restore();
    return list;
  }

  // Profundidad: junto al sello las palabras están "lejos" (pequeñas); en la periferia,
  // "cerca" (grandes), como las teselas del hero de Cosmos.
  const sizeScale = (r) => lerp(SIZE_NEAR_SEAL, SIZE_AT_EDGE, clamp((r - rIn) / (rOuter - rIn), 0, 1));

  // Coloca, en el orden de la lista, todas las palabras que caben sin saturar el anillo.
  function place(measured) {
    const xMax = Math.min(cx, W - cx) - EDGE;
    const yMax = Math.min(cy, H - cy) - EDGE;
    const budget = Math.PI * AY * (rOuter * rOuter - rIn * rIn) * DENSITY;
    const pxMid = B * sizeScale((rIn + rOuter) / 2);
    const sOut = sizeScale(rOuter);
    const rand = seeded(hash(WORDS.join('|')));
    const placed = [];
    const rest = [];
    let used = 0;

    for (const wd of measured) {
      const foot = (textWidth(wd, pxMid) + GAP_X) * (pxMid + GAP_Y);
      if (used + foot > budget) {
        rest.push(wd);
        continue;
      }

      const rMax = Math.max(
        rIn,
        Math.min(xMax - textWidth(wd, B * sOut) / 2, (yMax - (B * sOut) / 2) / AY),
      );
      const rMin = Math.min(rMax, rIn + textWidth(wd, B * sizeScale(rIn)) * 0.34);

      let best = null;
      let bestScore = -Infinity;
      for (let k = 0; k < 160; k++) {
        const r = Math.sqrt(lerp(rMin * rMin, rMax * rMax, rand()));
        const theta = rand() * Math.PI * 2;
        const px = B * sizeScale(r);
        const x = r * Math.cos(theta);
        const y = r * AY * Math.sin(theta);
        const c = 0.5 * Math.hypot(textWidth(wd, px) + GAP_X, px + GAP_Y);

        // Mejor candidato (ruido azul): maximiza la holgura frente a todas las ya colocadas.
        let score = Infinity;
        for (const o of placed) score = Math.min(score, Math.hypot(x - o.x, y - o.y) / (c + o.c));
        if (score > bestScore) {
          bestScore = score;
          best = { x, y, r, theta, c };
        }
      }

      if (placed.length && bestScore < MIN_CLEAR) {
        rest.push(wd);
        continue;
      }
      placed.push(best);
      used += foot;
      wd.home = best;
    }

    const kept = measured.filter((wd) => wd.home);
    const radii = kept.map((wd) => wd.home.r);
    sMin = sizeScale(Math.min(...radii));
    sMax = sizeScale(Math.max(...radii));

    // Orden angular para la entrada en barrido.
    const byAngle = kept
      .map((wd, i) => ({ i, a: (wd.home.theta + Math.PI * 2.5) % (Math.PI * 2) }))
      .sort((a, b) => a.a - b.a);

    const prev = new Map(words.map((w) => [w.text, w]));
    words = kept.map((wd, i) => {
      const old = prev.get(wd.text);
      return {
        text: wd.text,
        w100: wd.w100,
        chars: wd.chars,
        capW100: wd.w100,   // ancho del hueco: el relevo nunca mete una palabra más ancha
        r: wd.home.r,
        theta: wd.home.theta,
        s: sizeScale(wd.home.r),
        sTarget: sizeScale(wd.home.r),   // al cambiar de órbita el tamaño se adapta poco a poco
        delay: 0.35 + (byAngle.findIndex((o) => o.i === i) / kept.length) * 1.1,
        intro: old ? old.intro : 0,
        fade: 1,
        attack: null,       // embestida en curso: { phase, t, vx, vy }
        boost: 0,           // 0..1: enfoque visual mientras embiste
        phase: 'idle',
        next: null,
        x: 0, y: 0, tx: 0, ty: 0, z: 0, size: 0, w: 0, h: 0,
      };
    });

    reserve = rest.map(({ text, w100, chars }) => ({ text, w100, chars }));
    slotOrder = words.map((_, i) => i);
    for (let i = slotOrder.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [slotOrder[i], slotOrder[j]] = [slotOrder[j], slotOrder[i]];
    }
    swapIdx = 0;
    swapClock = 0;
  }

  /* ---------- embestidas ---------- */

  // La palabra adopta como órbita el punto donde ha quedado (inversa de la proyección, sin la
  // pequeña inclinación 3D; el asentamiento posterior absorbe la diferencia).
  function rehome(w) {
    const rx = w.x - cx;
    const ry = (w.y - cy) / AY;
    const sOut = sizeScale(rOuter);
    const xMax = Math.min(cx, W - cx) - EDGE;
    const yMax = Math.min(cy, H - cy) - EDGE;
    const rMax = Math.max(rIn, Math.min(xMax - textWidth(w, B * sOut) / 2, (yMax - (B * sOut) / 2) / AY));
    const rMin = Math.min(rMax, rIn + textWidth(w, B * sizeScale(rIn)) * 0.34);
    w.r = clamp(Math.hypot(rx, ry), rMin, rMax);
    w.theta = Math.atan2(ry, rx) - spin;
    w.sTarget = sizeScale(w.r);
  }

  function launchAttack() {
    const pool = words.filter((w) => !w.attack && w.phase === 'idle' && w.intro >= 1 && w !== hovered);
    if (!pool.length) return;
    const w = pool[Math.floor(Math.random() * pool.length)];
    w.attack = { phase: 'aim', t: 0, vx: 0, vy: 0 };
  }

  function updateAttacks(dt) {
    attackClock -= dt;
    if (attackClock <= 0) {
      attackClock = ATTACK_MIN_S + Math.random() * (ATTACK_MAX_S - ATTACK_MIN_S);
      if (!words.some((w) => w.attack)) launchAttack();
    }

    for (const w of words) {
      w.boost += ((w.attack && w.attack.phase !== 'settle' ? 1 : 0) - w.boost) * (1 - Math.exp(-dt * 6));
      const a = w.attack;
      if (!a) continue;
      a.t += dt;

      // Dirección radial (desde el cerebro hacia la palabra)
      let nx = w.x - cx;
      let ny = w.y - cy;
      const dist = Math.hypot(nx, ny) || 1;
      nx /= dist;
      ny /= dist;
      const vr = a.vx * nx + a.vy * ny;

      // Punto de la palabra más cercano al cerebro y cuánto se ha hundido en las púas
      const qx = clamp(cx, w.x - w.w / 2, w.x + w.w / 2) - cx;
      const qy = clamp(cy, w.y - w.h / 2, w.y + w.h / 2) - cy;
      const near = Math.hypot(qx, qy);
      const hitAngle = Math.atan2(qy, qx);
      const surface = shield ? shield.surfaceAt(hitAngle) : Rs;
      const pen = surface - near;

      if (a.phase === 'aim') {
        // Toma impulso: retrocede un poco mientras se enfoca
        a.vx = nx * 30;
        a.vy = ny * 30;
        if (a.t > ATTACK_AIM_S) {
          a.phase = 'in';
          a.t = 0;
          a.vx = 0;
          a.vy = 0;
        }
      } else if (a.phase === 'in') {
        // Embiste en línea recta hacia el cerebro
        a.vx -= nx * ATTACK_ACCEL * dt;
        a.vy -= ny * ATTACK_ACCEL * dt;
        const sp = Math.hypot(a.vx, a.vy);
        if (sp > ATTACK_SPEED) {
          a.vx *= ATTACK_SPEED / sp;
          a.vy *= ATTACK_SPEED / sp;
        }
        if (pen > 0) {
          a.phase = 'hit';
          a.t = 0;
          if (shield) shield.impulse(hitAngle, -vr);
        }
      }

      if (a.phase === 'hit') {
        // Las púas la frenan y la devuelven: muelle contra la superficie deformada + pérdida
        if (pen > 0) {
          const acc = CONTACT_K * pen - CONTACT_C * vr;
          a.vx += nx * acc * dt;
          a.vy += ny * acc * dt;
        } else if (vr > 0) {
          a.phase = 'out';
          a.t = 0;
        }
        // Garantía: nunca cruza el escudo hacia el cerebro
        const guard = shield ? shield.innerRadius + 6 : Rs * 0.8;
        if (near < guard && vr < 0) {
          a.vx -= 2 * vr * nx;
          a.vy -= 2 * vr * ny;
        }
        if (a.t > 1.5) {
          a.phase = 'out';
          a.t = 0;
        }
      } else if (a.phase === 'out') {
        // Sale despedida y se frena donde el escudo la lanzó
        const k = Math.exp(-dt * 2.4);
        a.vx *= k;
        a.vy *= k;
        if (a.t > 0.9 || Math.hypot(a.vx, a.vy) < 35) {
          rehome(w);
          a.phase = 'settle';
          a.t = 0;
        }
      }

      if (a.phase === 'settle') {
        // Se engancha a su nueva órbita sin saltos (el punto de destino ya está a su lado)
        const k = 1 - Math.exp(-dt * 5);
        w.x += (w.tx - w.x) * k;
        w.y += (w.ty - w.y) * k;
        if (Math.hypot(w.tx - w.x, w.ty - w.y) < 1 || a.t > 1.2) w.attack = null;
      } else {
        w.x = clamp(w.x + a.vx * dt, w.w / 2 + EDGE, W - w.w / 2 - EDGE);
        w.y = clamp(w.y + a.vy * dt, w.h / 2 + EDGE, H - w.h / 2 - EDGE);
      }
    }
  }

  /* ---------- relevo de palabras ---------- */

  function trySwap() {
    if (!reserve.length || words.some((w) => w.phase !== 'idle')) return;
    for (let k = 0; k < slotOrder.length; k++) {
      const slot = words[slotOrder[swapIdx++ % slotOrder.length]];
      if (slot.attack) continue;
      const j = reserve.findIndex((wd) => wd.w100 <= slot.capW100 * SWAP_FIT);
      if (j === -1) continue;
      slot.next = reserve.splice(j, 1)[0];
      slot.phase = 'out';
      return;
    }
  }

  function exchange(w) {
    reserve.push({ text: w.text, w100: w.w100, chars: w.chars });
    w.text = w.next.text;
    w.w100 = w.next.w100;
    w.chars = w.next.chars;
    w.next = null;
  }

  function advanceSwaps(dt) {
    for (const w of words) {
      if (w.phase === 'out') {
        w.fade = Math.max(0, w.fade - dt / SWAP_OUT_S);
        if (w.fade === 0) {
          exchange(w);
          w.phase = 'in';
        }
      } else if (w.phase === 'in') {
        w.fade = Math.min(1, w.fade + dt / SWAP_IN_S);
        if (w.fade === 1) w.phase = 'idle';
      }
    }
  }

  function finishSwaps() {
    for (const w of words) {
      if (w.phase === 'out') exchange(w);
      w.phase = 'idle';
      w.fade = 1;
    }
  }

  function layout() {
    const rect = panel.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;

    W = rect.width;
    H = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    // El sello (y con él la órbita) se centra en el espacio libre bajo el encabezado
    const top0 = head ? head.offsetTop + head.offsetHeight : 0;
    seal.style.top = `${(top0 + H) / 2}px`;
    // Centro de la órbita = centro del sello (left/top del sello, ya centrado con translate)
    cx = seal.offsetLeft;
    cy = seal.offsetTop;

    const D = Math.min(W, H);
    Rs = seal.offsetWidth / 2;
    AY = clamp((H - top0) / W, 1, 1.9);    // en vertical (móvil) la órbita se estira para usar el alto
    P = D * 2.4;
    B = clamp(D * 0.033, 15, 26);
    rIn = Rs * ORBIT_IN;
    rOuter = Math.max(rIn + 1, Math.min(Math.min(cx, W - cx) - EDGE, (Math.min(cy, H - cy) - EDGE) / AY));
    // Con poco espacio (anillo estrecho) el desenfoque alcanza menos, para que no se emborronen todas
    blurReach = Math.min(D * BLUR_REACH, Math.max(24, (rOuter - Rs) * 0.5));
    if (shield) shield.resize({ size: seal.offsetWidth, dpr });

    // Posición sin transformaciones (el encabezado entra con una animación que lo desplaza).
    // Si un obstáculo está pegado a un borde del panel se prolonga hasta fuera: así una palabra
    // nunca queda atrapada entre él y el borde, siempre sale hacia el espacio libre.
    obstacles = avoid.map((el) => {
      const pad = el.matches('.cosmos__head') ? 26 : 14;
      const o = {
        x0: el.offsetLeft - pad,
        y0: el.offsetTop - pad,
        x1: el.offsetLeft + el.offsetWidth + pad,
        y1: el.offsetTop + el.offsetHeight + pad,
      };
      const near = 64;
      if (o.x0 < near) o.x0 = -W;
      if (o.y0 < near) o.y0 = -H;
      if (o.x1 > W - near) o.x1 = W * 2;
      if (o.y1 > H - near) o.y1 = H * 2;
      return o;
    });

    place(measure());
    project(1, true);
    solve(80);
    return true;
  }

  /* ---------- simulación ---------- */

  function project(dt, snap = false) {
    const ca = Math.cos(tiltA), sa = Math.sin(tiltA);
    const cb = Math.cos(tiltB), sb = Math.sin(tiltB);
    const follow = snap ? 1 : 1 - Math.exp(-dt * 7);

    const grow = snap ? 1 : 1 - Math.exp(-dt * 2.5);
    for (const w of words) {
      w.s += (w.sTarget - w.s) * grow;
      const th = w.theta + spin;
      const x = w.r * Math.cos(th);
      const y = w.r * AY * Math.sin(th);
      // Mismo orden que CSS "rotateX(a) rotateY(b)": primero Y, luego X.
      const x1 = x * cb;
      const z1 = -x * sb;
      const y2 = y * ca - z1 * sa;
      const z2 = y * sa + z1 * ca;
      const k = P / (P - z2);

      w.tx = cx + x1 * k;
      w.ty = cy + y2 * k;
      w.z = z2;
      w.size = Math.max(MIN_PX, B * w.s * k);
      w.w = textWidth(w, w.size);
      w.h = w.size;

      if (w.attack) continue;   // la embestida mueve la palabra por su cuenta
      w.x += (w.tx - w.x) * follow;
      w.y += (w.ty - w.y) * follow;
    }
  }

  function solve(iterations) {
    const n = words.length;
    const sealR = Rs * SEAL_GRAZE;

    for (let it = 0; it < iterations; it++) {
      // Palabra contra palabra: separa por el eje de menor penetración.
      for (let i = 0; i < n; i++) {
        const a = words[i];
        if (a.attack) continue;
        for (let j = i + 1; j < n; j++) {
          const b = words[j];
          if (b.attack) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const ox = (a.w + b.w) / 2 + GAP_X - Math.abs(dx);
          if (ox <= 0) continue;
          const oy = (a.h + b.h) / 2 + GAP_Y - Math.abs(dy);
          if (oy <= 0) continue;
          if (oy <= ox) {
            const dir = Math.abs(dy) > 0.5 ? Math.sign(dy) : Math.sign(b.ty - a.ty) || 1;
            a.y -= (dir * oy) / 2;
            b.y += (dir * oy) / 2;
          } else {
            const dir = Math.abs(dx) > 0.5 ? Math.sign(dx) : Math.sign(b.tx - a.tx) || 1;
            a.x -= (dir * ox) / 2;
            b.x += (dir * ox) / 2;
          }
        }
      }

      for (const w of words) {
        if (w.attack) continue;
        const hx = w.w / 2;
        const hy = w.h / 2;

        // Sello: la caja de la palabra no entra en el círculo.
        const nx = clamp(cx, w.x - hx, w.x + hx) - cx;
        const ny = clamp(cy, w.y - hy, w.y + hy) - cy;
        const d = Math.hypot(nx, ny);
        if (d < sealR) {
          let ux = w.x - cx;
          let uy = w.y - cy;
          const ul = Math.hypot(ux, uy) || 1;
          ux /= ul;
          uy /= ul;
          w.x += ux * (sealR - d);
          w.y += uy * (sealR - d);
        }

        // Bloque de logo + encabezado y botón de pausa: sale por el lado de menor penetración.
        for (const o of obstacles) {
          const right = o.x1 - (w.x - hx);
          const left = w.x + hx - o.x0;
          const down = o.y1 - (w.y - hy);
          const up = w.y + hy - o.y0;
          if (right <= 0 || left <= 0 || down <= 0 || up <= 0) continue;
          const m = Math.min(right, left, down, up);
          if (m === right) w.x += right;
          else if (m === left) w.x -= left;
          else if (m === down) w.y += down;
          else w.y -= up;
        }

        // Bordes del panel.
        w.x = clamp(w.x, hx + EDGE, W - hx - EDGE);
        w.y = clamp(w.y, hy + EDGE, H - hy - EDGE);
      }
    }
  }

  /* ---------- dibujo ---------- */

  function hitTest() {
    if (!pointer.inside) return null;
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      if (Math.abs(pointer.x - w.x) <= w.w / 2 + 6 && Math.abs(pointer.y - w.y) <= w.h / 2 + 4) return w;
    }
    return null;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    hovered = hitTest();
    const order = words.slice().sort((a, b) => a.z - b.z); // de atrás hacia delante

    for (const w of order) {
      if (w.intro <= 0.001) continue;
      // Profundidad: 0 = junto al sello (lejos), 1 = periferia (cerca).
      const depth = smooth(sMin * 0.98, sMax * 1.02, w.size / B);
      const lit = w === hovered ? 1 : lerp(0.18 + depth * 0.82, 1, w.boost);
      const r = Math.round(lerp(STONE[0], INK[0], lit));
      const g = Math.round(lerp(STONE[1], INK[1], lit));
      const b = Math.round(lerp(STONE[2], INK[2], lit));
      const size = Math.round(w.size * (1 + 0.06 * w.boost) * 4) / 4;

      // Desenfoque junto al escudo (barrera) y mientras la palabra se releva.
      const nx = clamp(cx, w.x - w.w / 2, w.x + w.w / 2) - cx;
      const ny = clamp(cy, w.y - w.h / 2, w.y + w.h / 2) - cy;
      const edge = Math.hypot(nx, ny) - Rs;
      let blur = BLUR_MAX * (1 - smooth(-6, blurReach, edge)) + (1 - w.fade) * SWAP_BLUR;
      if (w === hovered) blur = 0;
      blur *= 1 - w.boost;
      blur = Math.round(blur * 4) / 4;

      const soften = 1 - 0.3 * clamp(blur / BLUR_MAX, 0, 1);
      const alpha = w.intro * w.fade * (w === hovered ? 1 : lerp((0.84 + depth * 0.16) * soften, 1, w.boost));
      if (alpha <= 0.003) continue;

      ctx.font = fontAt(size);
      if (hasSpacing) ctx.letterSpacing = `${tracking(size).toFixed(2)}px`;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      const y = w.y + (1 - w.intro) * 10;

      if (blur < 0.25) {
        ctx.fillText(w.text, w.x, y);
      } else if (hasCanvasFilter) {
        ctx.filter = `blur(${blur}px)`;
        ctx.fillText(w.text, w.x, y);
        ctx.filter = 'none';
      } else {
        // Respaldo: se dibuja fuera de la vista y solo su sombra desenfocada cae en su sitio.
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = blur * 2 * dpr;
        ctx.shadowOffsetX = OFFSCREEN * dpr;
        ctx.fillText(w.text, w.x - OFFSCREEN, y);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
      }
    }
  }

  /* ---------- bucle ---------- */

  function tick(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    clock += dt;

    const still = reduceMotion.matches;
    speed = lerp(speed, pointer.inside ? HOVER_SPEED : 1, 1 - Math.exp(-dt * 3));
    if (!still) spin += dt * speed * ((Math.PI * 2) / REVOLUTION_S);

    let a = 0;
    let b = 0;
    if (!still) {
      a = TILT_AUTO * Math.sin((clock * Math.PI * 2) / 29);
      b = TILT_AUTO * Math.cos((clock * Math.PI * 2) / 23);
      if (pointer.inside) {
        a -= pointer.ny * TILT_POINTER;
        b += pointer.nx * TILT_POINTER;
      }
    }
    const ease = 1 - Math.exp(-dt * 3.5);
    tiltA = lerp(tiltA, a, ease);
    tiltB = lerp(tiltB, b, ease);

    if (!still && SWAP_EVERY_S > 0 && clock > 4 && !pointer.inside) {
      swapClock += dt;
      if (swapClock >= SWAP_EVERY_S) {
        swapClock = 0;
        trySwap();
      }
    }
    advanceSwaps(dt);

    for (const w of words) {
      w.intro = still ? 1 : smooth(0, 1, (clock - w.delay) / 0.9);
    }

    project(dt);
    if (!still) updateAttacks(dt);
    solve(3);
    draw();
    if (shield) {
      shield.step(dt);
      shield.render();
    }

    if (running) raf = requestAnimationFrame(tick);
  }

  function start() {
    if (toggle) toggle.hidden = reduceMotion.matches;
    if (running || paused || !ready || !inView || document.hidden) return;
    if (reduceMotion.matches) {
      renderStill();
      return;
    }
    running = true;
    last = 0;
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // Movimiento reducido: composición fija, sin giro ni inclinación.
  function renderStill() {
    tiltA = 0;
    tiltB = 0;
    finishSwaps();
    for (const w of words) {
      w.intro = 1;
      w.attack = null;
      w.boost = 0;
    }
    if (shield) shield.settle();
    project(1, true);
    solve(80);
    paint();
  }

  // Dibujo sin avanzar la simulación (pausa, movimiento reducido)
  function paint() {
    draw();
    if (shield) shield.render();
  }

  /* ---------- eventos ---------- */

  function onPointer(e) {
    const rect = panel.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.nx = clamp((pointer.x - W / 2) / (W / 2), -1, 1);
    pointer.ny = clamp((pointer.y - H / 2) / (H / 2), -1, 1);
    pointer.inside = e.pointerType !== 'touch';
    if (!running && ready) paint();
  }

  panel.addEventListener('pointermove', onPointer);
  panel.addEventListener('pointerenter', onPointer);
  panel.addEventListener('pointerleave', () => {
    pointer.inside = false;
    if (!running && ready) paint();
  });

  // Pausa manual (contenido en movimiento continuo debe poder detenerse).
  if (toggle) {
    toggle.addEventListener('click', () => {
      paused = !paused;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Reanudar órbita' : 'Pausar órbita');
      toggle.querySelector('i').className = `ph ${paused ? 'ph-play' : 'ph-pause'}`;
      if (paused) {
        stop();
        finishSwaps();
        for (const w of words) w.intro = 1;
        if (shield) shield.settle();
        paint();
      } else {
        start();
      }
    });
  }

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  reduceMotion.addEventListener('change', () => {
    stop();
    start();
  });

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    inView ? start() : stop();
  }).observe(panel);

  new ResizeObserver(() => {
    if (!ready) return;
    layout();
    if (!running) renderStill();
  }).observe(panel);

  /* ---------- arranque ---------- */

  const fontsReady =
    document.fonts && document.fonts.load
      ? Promise.race([
          // Geist (palabras) y Questrial (encabezado, que las palabras esquivan según su tamaño)
          Promise.all([
            document.fonts.load(fontAt(20), WORDS.join('')),
            document.fonts.load('400 20px Questrial'),
          ]),
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]).catch(() => {})
      : Promise.resolve();

  fontsReady.then(() => {
    if (!layout()) return;
    ready = true;
    start();
  });
})();
