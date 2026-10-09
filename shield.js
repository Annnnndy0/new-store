/* Escudo de púas alrededor del cerebro (estilo de referencias/escudo.gif).

   Lo que muestra la referencia y cómo se reproduce:
   - Una esfera cubierta por miles de púas cónicas muy juntas (malla de Fibonacci: casi
     hexagonal), de metal grafito con reflejos fríos de estudio.
   - La superficie no para de deformarse: lóbulos que crecen, se hunden y derivan (±4 % del
     radio, ciclo de ~2 s como el GIF). Las púas siguen la normal deformada, así que en los
     pliegues se inclinan y atrapan la luz.
   - Brillo de borde: de frente las púas se ven como puntos oscuros y en la silueta forman un
     fleco denso y claro. Aquí la cara frontal es un velo casi transparente para que el
     cerebro se vea dentro.
   - Ataques (orbit.js): impulse() hunde la zona golpeada (muelle amortiguado), retrae las
     púas, lanza una onda que recorre la esfera erizándolas a su paso y hace retroceder un
     poco toda la esfera. surfaceAt() da el radio real de las puntas en un ángulo, con la
     misma fórmula que el shader, para que la palabra rebote contra la superficie deformada.

   Colores y opacidad: variables --shield-* en styles.css (se leen al cargar y al redimensionar).

   Render: WebGL2, conos instanciados. Dos lienzos dentro del sello: el de atrás (mitad
   trasera de la esfera) queda bajo el cerebro y el de delante, encima. Las púas se pintan
   de atrás hacia delante. Sin WebGL2 se dibuja en 2D un anillo de púas con la misma forma. */
(() => {
  'use strict';

  const R_FRAC = 0.38;                      // radio de la esfera, en fracción del tamaño del sello
  const LEN_FRAC = 0.105;                   // largo de las púas, en fracción del radio
  const SPACING_MIN = 5.5;                  // separación entre púas (px)
  const SPACING_MAX = 8.5;
  const BASE_FILL = 0.5;                    // radio de la base del cono, en fracción de la separación
  const SEGMENTS = 8;                       // caras de cada cono
  const VEIL = 0.11;                        // opacidad de las púas de frente si falta --shield-veil

  // Deformación: suma de ondas planas sobre la esfera que derivan y laten
  const WAVES = 8;
  const DEFORM_RMS = 0.04;                  // fracción del radio
  const MORPH_PERIOD = 2.04;                // ciclo del GIF (s)

  // Choques
  const MAX_HITS = 4;
  const V_MAX = 700;
  const HIT_FULL = 450;                     // velocidad de choque que da la onda completa (px/s)
  const DENT_KICK = 0.3;                    // fracción de la velocidad que hunde la superficie
  const DENT_FREQ = 1.7;                    // Hz
  const DENT_ZETA = 0.3;
  const DENT_SIGMA = 0.26;                  // ancho de la abolladura (rad)
  const RETRACT = 0.6;                      // cuánto se recogen las púas en la abolladura
  const RIPPLE_AMP = 0.03;                  // fracción del radio
  const RIPPLE_SPEED = 2.2;                 // radios por segundo
  const RIPPLE_LAMBDA = 0.6;                // longitud de onda, en radios
  const RIPPLE_TAU = 0.85;                  // s
  const BRISTLE = 0.45;                     // las púas crecen al paso de la onda
  const RECOIL_KICK = 0.06;
  const RECOIL_FREQ = 1.2;
  const RECOIL_ZETA = 0.3;

  // Entrada: las púas brotan de arriba abajo
  const GROW_S = 0.9;
  const INTRO_DONE = 3;

  const f = (v) => v.toFixed(5);

  const SURFACE_GLSL = `
const float TAU = 6.2831853;
uniform vec4 uWaveA[${WAVES}];   // dirección xyz, frecuencia
uniform vec4 uWaveB[${WAVES}];   // amplitud, deriva, latido, fase
uniform vec4 uHitA[${MAX_HITS}]; // dirección xyz (vista), hundimiento (px)
uniform vec4 uHitB[${MAX_HITS}]; // edad (s), fuerza 0..1
uniform float uTime;
uniform float uR0;

float shape(vec3 n) {
  float s = 0.0;
  for (int k = 0; k < ${WAVES}; k++) {
    vec4 A = uWaveA[k];
    vec4 B = uWaveB[k];
    s += B.x * sin(A.w * dot(n, A.xyz) + B.y * uTime + B.w)
             * (0.55 + 0.45 * sin(B.z * uTime + 2.3 * B.w + 1.0));
  }
  return s;
}

// x: radio de la base (px); y: factor de largo de las púas
vec2 surface(vec3 n) {
  float r = uR0 * (1.0 + shape(n));
  float k = 1.0;
  for (int i = 0; i < ${MAX_HITS}; i++) {
    vec4 A = uHitA[i];
    vec4 B = uHitB[i];
    if (B.y <= 0.0) continue;
    float x = acos(clamp(dot(n, A.xyz), -1.0, 1.0)) * uR0;
    float sig = ${f(DENT_SIGMA)} * uR0;
    float g = exp(-x * x / (2.0 * sig * sig));
    r -= A.w * g;
    k *= 1.0 - ${f(RETRACT)} * g * clamp(A.w / (0.1 * uR0), -0.6, 1.0);
    float q = (x - ${f(RIPPLE_SPEED)} * uR0 * B.x) / (${f(RIPPLE_LAMBDA)} * uR0);
    float rip = B.y * exp(-B.x / ${f(RIPPLE_TAU)}) * exp(-q * q * 2.5) * cos(TAU * q);
    r += rip * ${f(RIPPLE_AMP)} * uR0;
    k *= 1.0 + ${f(BRISTLE)} * rip;
  }
  return vec2(r, k);
}`;

  const VERT = `#version 300 es
precision highp float;
in vec3 aGeom;      // xy: dirección radial del vértice en el cono; z: 0 base, 1 punta
in vec4 aInst;      // xyz: dirección en la esfera; w: azar 0..1
uniform vec2 uRes;  // tamaño del lienzo (px CSS); el centro es el origen
uniform float uLen;
uniform float uBase;
uniform float uIntro;
uniform vec2 uShift;
uniform float uVeil;
out vec3 vN;
out float vH;
out float vA;
${SURFACE_GLSL}

void main() {
  vec3 n = aInst.xyz;
  vec2 s0 = surface(n);

  // Normal de la superficie deformada por diferencias finitas
  vec3 up = abs(n.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(up, n));
  vec3 t2 = cross(n, t1);
  const float E = 0.02;
  vec3 n1 = normalize(n + E * t1);
  vec3 n2 = normalize(n + E * t2);
  vec3 p0 = n * s0.x;
  vec3 N = normalize(cross(n1 * surface(n1).x - p0, n2 * surface(n2).x - p0));

  // Cono a lo largo de la normal
  vec3 b1 = normalize(cross(abs(N.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0), N));
  vec3 b2 = cross(N, b1);
  float delay = 0.1 + (0.5 - 0.5 * n.y) * 0.5 + aInst.w * 0.25;
  float grow = smoothstep(0.0, 1.0, (uIntro - delay) / ${f(GROW_S)});
  float len = uLen * (0.85 + 0.3 * aInst.w) * s0.y * grow;
  float base = uBase * mix(0.35, 1.0, grow);
  vec3 radial = b1 * aGeom.x + b2 * aGeom.y;
  vec3 pos = p0 + radial * base * (1.0 - aGeom.z) + N * len * aGeom.z;
  pos.xy += uShift;

  vN = normalize(radial * max(len, 0.001) + N * base);
  vH = aGeom.z;
  // Velo: de frente casi transparente, en la silueta opaco; la mitad trasera se apaga hacia el fondo
  float fz = N.z;
  float a = fz >= 0.0 ? mix(1.0, uVeil, smoothstep(0.15, 0.75, fz)) : 1.0 - smoothstep(0.02, 0.3, -fz);
  vA = a * smoothstep(0.0, 0.3, grow);

  gl_Position = vec4(pos.xy / (uRes * 0.5), 0.0, 1.0);
}`;

  const FRAG = `#version 300 es
precision highp float;
in vec3 vN;
in float vH;
in float vA;
// Colores y opacidad: variables --shield-* de styles.css
uniform vec3 uMetal;
uniform vec3 uShadow;
uniform vec3 uLight;
uniform float uExposure;
uniform float uOpacity;
out vec4 outColor;

float lobe(vec3 r, vec3 d, float sharp) { return pow(max(dot(r, normalize(d)), 0.0), sharp); }

// Estudio oscuro: aro de luz junto a la cámara (aclara el fleco de la silueta y deja oscuras
// las púas que miran de frente), luz de borde alrededor, ventana fría arriba y dos tiras duras.
// Donde no llega ninguna luz queda el color de sombra (uShadow).
vec3 env(vec3 r) {
  vec3 c = vec3(0.80, 0.84, 0.88) * pow(max(r.z, 0.0), 3.0);
  c += vec3(0.18, 0.20, 0.22) * pow(1.0 - abs(r.z), 3.0);
  c += vec3(0.55, 0.62, 0.72) * lobe(r, vec3(-0.25, 0.85, 0.3), 12.0);
  c += vec3(1.20) * lobe(r, vec3(-0.6, -0.75, 0.15), 40.0);
  c += vec3(0.90, 0.93, 0.96) * lobe(r, vec3(0.95, -0.2, 0.1), 30.0);
  return c;
}

void main() {
  vec3 N = normalize(vN);
  vec3 R = reflect(vec3(0.0, 0.0, -1.0), N);
  float nv = clamp(N.z, 0.0, 1.0);
  vec3 F0 = uMetal;
  vec3 F = F0 + (vec3(0.85) - F0) * pow(1.0 - nv, 5.0) * 0.5;
  vec3 lit = env(R) * uLight * uExposure * F;
  lit *= mix(0.45, 1.0, smoothstep(0.0, 0.75, vH));      // oclusión en la base, entre púas
  lit = min(lit, vec3(1.0));
  // La luz se suma sobre el color de sombra (trama): sin luz queda la sombra, con luz el reflejo
  vec3 col = uShadow + lit - uShadow * lit;
  // Los reflejos fuertes se ven también a través del velo
  float lum = dot(lit, vec3(0.299, 0.587, 0.114));
  float a = clamp(max(vA, smoothstep(0.4, 0.8, lum) * 0.7), 0.0, 1.0) * uOpacity;
  outColor = vec4(col * a, a);
}`;

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

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  }

  // Un cono: por cada cara, punta + dos vértices de la base (sentido antihorario visto desde fuera)
  function coneGeometry() {
    const out = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const a0 = (i / SEGMENTS) * Math.PI * 2;
      const a1 = ((i + 1) / SEGMENTS) * Math.PI * 2;
      const am = (a0 + a1) / 2;
      out.push(Math.cos(am), Math.sin(am), 1);
      out.push(Math.cos(a0), Math.sin(a0), 0);
      out.push(Math.cos(a1), Math.sin(a1), 0);
    }
    return new Float32Array(out);
  }

  // Un lienzo WebGL2 que pinta una mitad de la esfera
  function makeLayer(canvas) {
    if (!canvas) return null;
    try {
      const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: true });
      if (!gl) return null;
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);

      const loc = {};
      for (const name of ['uRes', 'uLen', 'uBase', 'uIntro', 'uShift', 'uVeil', 'uMetal', 'uShadow', 'uLight', 'uExposure', 'uOpacity',
        'uWaveA', 'uWaveB', 'uHitA', 'uHitB', 'uTime', 'uR0']) {
        loc[name] = gl.getUniformLocation(prog, name);
      }

      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const geom = coneGeometry();
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, geom, gl.STATIC_DRAW);
      const aGeom = gl.getAttribLocation(prog, 'aGeom');
      gl.enableVertexAttribArray(aGeom);
      gl.vertexAttribPointer(aGeom, 3, gl.FLOAT, false, 0, 0);

      const instBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
      const aInst = gl.getAttribLocation(prog, 'aInst');
      gl.enableVertexAttribArray(aInst);
      gl.vertexAttribPointer(aInst, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(aInst, 1);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.CULL_FACE);
      gl.disable(gl.DEPTH_TEST);

      return { canvas, gl, loc, vao, instBuf, count: 0, verts: geom.length / 3 };
    } catch (err) {
      return null;
    }
  }

  function create(seal) {
    const backCanvas = seal && seal.querySelector('.shield--back');
    const frontCanvas = seal && seal.querySelector('.shield--front');
    if (!backCanvas) return null;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // ---------- color ----------
    // Variables --shield-* de styles.css. Si falta alguna o no es válida, se usa el valor de aquí.
    const look = {
      metal: [0.6, 0.65, 0.68],
      shadow: [0.02, 0.024, 0.027],
      light: [1, 1, 1],
      exposure: 1,
      veil: VEIL,
      opacity: 1,
    };
    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });

    // Cualquier color CSS (#hex, rgb(), hsl(), nombre…): se pinta un píxel y se lee
    function readColor(css, name) {
      const value = css.getPropertyValue(`--shield-${name}`).trim();
      if (!value || !probe) return;
      probe.fillStyle = '#010203';
      probe.fillStyle = value;
      if (probe.fillStyle === '#010203' && value.toLowerCase() !== '#010203') return;   // no válido
      probe.clearRect(0, 0, 1, 1);
      probe.fillRect(0, 0, 1, 1);
      const px = probe.getImageData(0, 0, 1, 1).data;
      look[name] = [px[0] / 255, px[1] / 255, px[2] / 255];
    }

    // Número (1, 0.4, 40 %…), limitado al rango
    function readNumber(css, name, min, max) {
      const value = css.getPropertyValue(`--shield-${name}`).trim();
      let n = parseFloat(value);
      if (!Number.isFinite(n)) return;
      if (value.endsWith('%')) n /= 100;
      look[name] = clamp(n, min, max);
    }

    function readLook() {
      const css = getComputedStyle(seal);
      for (const name of ['metal', 'shadow', 'light']) readColor(css, name);
      readNumber(css, 'exposure', 0, 4);
      readNumber(css, 'veil', 0, 1);
      readNumber(css, 'opacity', 0, 1);
    }

    // ---------- forma ----------
    // Ondas fijas (misma semilla siempre): dirección, frecuencia (lóbulos), deriva y latido
    const rand = seeded(20251005);
    const waveA = new Float32Array(WAVES * 4);
    const waveB = new Float32Array(WAVES * 4);
    let energy = 0;
    for (let k = 0; k < WAVES; k++) {
      const z = rand() * 2 - 1;
      const phi = rand() * Math.PI * 2;
      const rr = Math.sqrt(1 - z * z);
      const freq = 3 + rand() * 5;
      const amp = Math.pow(freq, -0.6);
      waveA.set([rr * Math.cos(phi), rr * Math.sin(phi), z, freq], k * 4);
      waveB.set([
        amp,
        (rand() < 0.5 ? -1 : 1) * (0.3 + rand() * 0.35),
        ((Math.PI * 2) / MORPH_PERIOD) * (0.7 + rand() * 0.6),
        rand() * Math.PI * 2,
      ], k * 4);
      energy += amp * amp;
    }
    // Media de sin² · (0.55 + 0.45 sin)² = 0.5 · 0.40375
    const norm = DEFORM_RMS / Math.sqrt(energy * 0.5 * 0.40375);
    for (let k = 0; k < WAVES; k++) waveB[k * 4] *= norm;

    let time = 0;
    let intro = 0;
    let R0 = 1, L = 1, base = 1, spacing = 6, size = 0, dpr = 1;
    const hits = [];
    const shift = { x: 0, y: 0, vx: 0, vy: 0 };
    const hitA = new Float32Array(MAX_HITS * 4);
    const hitB = new Float32Array(MAX_HITS * 4);

    function shape(nx, ny, nz) {
      let s = 0;
      for (let k = 0; k < WAVES; k++) {
        const A = k * 4;
        const d = nx * waveA[A] + ny * waveA[A + 1] + nz * waveA[A + 2];
        s += waveB[A] * Math.sin(waveA[A + 3] * d + waveB[A + 1] * time + waveB[A + 3])
                      * (0.55 + 0.45 * Math.sin(waveB[A + 2] * time + 2.3 * waveB[A + 3] + 1));
      }
      return s;
    }

    // Igual que surface() en el shader: [radio de la base, factor de largo]
    function surface(nx, ny, nz) {
      let r = R0 * (1 + shape(nx, ny, nz));
      let k = 1;
      for (const h of hits) {
        const x = Math.acos(clamp(nx * h.x + ny * h.y + nz * h.z, -1, 1)) * R0;
        const sig = DENT_SIGMA * R0;
        const g = Math.exp(-(x * x) / (2 * sig * sig));
        r -= h.depth * g;
        k *= 1 - RETRACT * g * clamp(h.depth / (0.1 * R0), -0.6, 1);
        const q = (x - RIPPLE_SPEED * R0 * h.age) / (RIPPLE_LAMBDA * R0);
        const rip = h.strength * Math.exp(-h.age / RIPPLE_TAU) * Math.exp(-q * q * 2.5) * Math.cos(Math.PI * 2 * q);
        r += rip * RIPPLE_AMP * R0;
        k *= 1 + BRISTLE * rip;
      }
      return [r, k];
    }

    // ---------- lienzos ----------
    const back = makeLayer(backCanvas);
    const front = back ? makeLayer(frontCanvas) : null;
    const layers = back && front ? [back, front] : null;
    const ctx2d = layers ? null : backCanvas.getContext('2d');

    // Malla de Fibonacci: cada mitad ordenada de atrás hacia delante
    function buildInstances() {
      const n = Math.round(clamp((4 * Math.PI * R0 * R0) / (0.866 * spacing * spacing), 800, 9000));
      if (!layers || (layers[0].n === n)) return;
      const golden = Math.PI * (3 - Math.sqrt(5));
      const pts = [];
      const jitter = seeded(n);
      for (let i = 0; i < n; i++) {
        const y = 1 - (2 * (i + 0.5)) / n;
        const r = Math.sqrt(1 - y * y);
        const t = i * golden;
        pts.push([r * Math.cos(t), y, r * Math.sin(t), jitter()]);
      }
      pts.sort((a, b) => a[2] - b[2]);
      const split = pts.findIndex((p) => p[2] >= 0);
      [pts.slice(0, split), pts.slice(split)].forEach((half, li) => {
        const layer = layers[li];
        const data = new Float32Array(half.length * 4);
        half.forEach((p, i) => data.set(p, i * 4));
        layer.gl.bindBuffer(layer.gl.ARRAY_BUFFER, layer.instBuf);
        layer.gl.bufferData(layer.gl.ARRAY_BUFFER, data, layer.gl.STATIC_DRAW);
        layer.count = half.length;
        layer.n = n;
      });
    }

    // ---------- geometría ----------
    function resize(opts) {
      size = opts.size;
      dpr = opts.dpr;
      R0 = size * R_FRAC;
      L = R0 * LEN_FRAC;
      spacing = clamp(R0 * 0.052, SPACING_MIN, SPACING_MAX);
      base = spacing * BASE_FILL;
      readLook();
      for (const c of [backCanvas, frontCanvas]) {
        if (!c) continue;
        c.width = Math.round(c.clientWidth * dpr);
        c.height = Math.round(c.clientHeight * dpr);
      }
      buildInstances();
    }

    // ---------- simulación ----------
    function step(dt) {
      dt = Math.min(dt, 1 / 20);
      time += dt;
      intro = Math.min(intro + dt, INTRO_DONE);

      const wd = Math.PI * 2 * DENT_FREQ;
      for (const h of hits) {
        h.vel += (-wd * wd * h.depth - 2 * DENT_ZETA * wd * h.vel) * dt;
        h.depth += h.vel * dt;
        h.age += dt;
      }
      for (let i = hits.length - 1; i >= 0; i--) {
        if (hits[i].age > 3.5) hits.splice(i, 1);
      }

      const wr = Math.PI * 2 * RECOIL_FREQ;
      shift.vx += (-wr * wr * shift.x - 2 * RECOIL_ZETA * wr * shift.vx) * dt;
      shift.vy += (-wr * wr * shift.y - 2 * RECOIL_ZETA * wr * shift.vy) * dt;
      shift.x += shift.vx * dt;
      shift.y += shift.vy * dt;
    }

    // Movimiento reducido o pausa: forma completa y quieta
    function settle() {
      intro = INTRO_DONE;
      hits.length = 0;
      shift.x = shift.y = shift.vx = shift.vy = 0;
    }

    // ---------- choques ----------
    // angle: ángulo en pantalla (y hacia abajo), como en orbit.js
    function impulse(angle, speed) {
      const sp = clamp(speed, 0, V_MAX);
      const x = Math.cos(angle);
      const y = -Math.sin(angle);
      hits.push({ x, y, z: 0, depth: 0, vel: sp * DENT_KICK, age: 0, strength: clamp(sp / HIT_FULL, 0, 1) });
      if (hits.length > MAX_HITS) hits.shift();
      shift.vx -= x * sp * RECOIL_KICK;
      shift.vy -= y * sp * RECOIL_KICK;
    }

    // Radio de las puntas en un ángulo de pantalla (con la deformación actual)
    function surfaceAt(angle) {
      const nx = Math.cos(angle);
      const ny = -Math.sin(angle);
      const [r, k] = surface(nx, ny, 0);
      const delay = 0.1 + (0.5 - 0.5 * ny) * 0.5 + 0.125;
      const grow = smooth(0, 1, (intro - delay) / GROW_S);
      return r + L * k * grow + shift.x * nx + shift.y * ny;
    }

    // ---------- dibujo ----------
    function render() {
      if (!size) return;
      if (reduceMotion.matches) settle();
      if (layers) renderGL();
      else if (ctx2d) render2D();
    }

    function renderGL() {
      hitA.fill(0);
      hitB.fill(0);
      hits.forEach((h, i) => {
        hitA.set([h.x, h.y, h.z, h.depth], i * 4);
        hitB.set([h.age, h.strength, 0, 0], i * 4);
      });
      for (const layer of layers) {
        const { gl, loc, canvas } = layer;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (!layer.count) continue;
        gl.bindVertexArray(layer.vao);
        gl.uniform2f(loc.uRes, canvas.width / dpr, canvas.height / dpr);
        gl.uniform1f(loc.uR0, R0);
        gl.uniform1f(loc.uLen, L);
        gl.uniform1f(loc.uBase, base);
        gl.uniform1f(loc.uIntro, intro);
        gl.uniform1f(loc.uTime, time);
        gl.uniform1f(loc.uVeil, look.veil);
        gl.uniform3fv(loc.uMetal, look.metal);
        gl.uniform3fv(loc.uShadow, look.shadow);
        gl.uniform3fv(loc.uLight, look.light);
        gl.uniform1f(loc.uExposure, look.exposure);
        gl.uniform1f(loc.uOpacity, look.opacity);
        gl.uniform2f(loc.uShift, shift.x, shift.y);
        gl.uniform4fv(loc.uWaveA, waveA);
        gl.uniform4fv(loc.uWaveB, waveB);
        gl.uniform4fv(loc.uHitA, hitA);
        gl.uniform4fv(loc.uHitB, hitB);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, layer.verts, layer.count);
      }
    }

    // Respaldo sin WebGL2: la silueta de púas alrededor del cerebro, con la misma forma
    function render2D() {
      const c = ctx2d;
      const w = backCanvas.width / dpr;
      const h = backCanvas.height / dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      c.translate(w / 2, h / 2);
      const m = Math.round((Math.PI * 2 * R0) / spacing);
      const half = Math.PI / m;
      c.beginPath();
      for (let i = 0; i < m; i++) {
        const a = (i / m) * Math.PI * 2;
        const tip = surfaceAt(a);
        const r0 = surface(Math.cos(a - half), -Math.sin(a - half), 0)[0] - L * 0.6;
        const r1 = surface(Math.cos(a + half), -Math.sin(a + half), 0)[0] - L * 0.6;
        c.moveTo(r0 * Math.cos(a - half), r0 * Math.sin(a - half));
        c.lineTo(tip * Math.cos(a), tip * Math.sin(a));
        c.lineTo(r1 * Math.cos(a + half), r1 * Math.sin(a + half));
      }
      // El mismo metal con poca luz, sobre el color de sombra (como en el shader)
      const [cr, cg, cb] = look.metal.map((v, i) => {
        const lit = Math.min(1, v * look.light[i] * look.exposure * 0.25);
        return Math.round((look.shadow[i] + lit - look.shadow[i] * lit) * 255);
      });
      c.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${(0.9 * look.opacity).toFixed(3)})`;
      c.fill();
    }

    return {
      resize,
      step,
      settle,
      render,
      impulse,
      surfaceAt,
      get innerRadius() { return R0 * 0.9; },
    };
  }

  window.Shield = { create };
})();
