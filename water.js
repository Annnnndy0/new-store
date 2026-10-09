/* Anillo de agua "Dios" alrededor del cerebro.

   Física (1D sobre el anillo cerrado, N nodos, condiciones periódicas):
   - Eje: cada nodo puede separarse radialmente del círculo de reposo. Ecuación de onda con
     tensión superficial + muelle de forma que se endurece + viscosidad: el anillo se dobla y
     vibra como agua cohesionada, sin quiebros.
   - Espesor: aguas someras en forma de flujo (conserva la masa exactamente). Al apretar un
     punto, el agua se aparta hacia los lados, se acumula y vuelve en ondas. Los flujos están
     limitados para que el espesor nunca baje de H_MIN: el agua no se rompe ni salpica.
   - El cursor y las palabras cercanas empujan, aprietan y arrastran el agua con su velocidad.
   - La inscripción "DIOS" va suspendida en el agua: se curva con el anillo, se estira y se
     aprieta con el espesor, y la corriente la desplaza un poco antes de volver a su sitio.
   - El fluido se mueve solo: varios modos del anillo (contorno y espesor) tienen amplitudes
     que derivan al azar (procesos de Ornstein-Uhlenbeck) y giran despacio, así que se forman
     abultamientos que viajan, se juntan y se deshacen sin repetirse nunca.
   - La sección no es un tubo redondo: es un hilo de agua apoyado (más plano por arriba), con
     ondulaciones capilares en la superficie que cambian con el tiempo.
   - impulse(): un choque (palabra que intenta llegar al cerebro) hunde el agua y la aparta a
     los lados. surfaceAt() da el borde exterior real en un ángulo, para que la palabra rebote
     contra el agua deformada.

   Render: WebGL2. Tubo de sección circular cuya altura da la normal; con ella se refracta lo
   que hay detrás (el lienzo de palabras), se añaden las letras, reflejo Fresnel, brillos,
   luz transmitida y una sombra con cáustica en el suelo. Sin WebGL2 se dibuja en 2D, sin
   refracción, con la misma física. */
(() => {
  'use strict';

  const N = 192;
  const R_FRAC = 0.44;                      // radio del eje, en fracción del tamaño del sello
  const W_FRAC = 0.064;                     // medio grosor del tubo
  const START = -Math.PI / 2;               // nodo 0 arriba; los ángulos crecen en sentido horario

  // Física
  const TENSION = 210 * 210;                // (px/s)²: velocidad de las ondas del eje
  const SPRING = 55;                        // vuelta a la forma de reposo
  const DAMP = 2.2;
  const GRAV = 140 * 140;                   // (px/s)²: velocidad de las ondas de espesor
  const FLOW_DAMP = 1.5;
  const DIFFUSE = 30;                       // suaviza el espesor (tensión superficial)
  const VISC = 70;                          // viscosidad (px²/s): frena solo las ondas más cortas
  const H_MIN = 0.42;                       // el agua nunca se adelgaza más: no se rompe
  const H_MAX = 2.3;
  const PUSH = 4600;                        // empuje radial máximo (px/s²)
  const SQUEEZE = 0.42 * GRAV;              // presión que aparta el agua
  const DRAG = 0.2;                         // arrastre por la velocidad de cursor/palabras
  const V_MAX = 700;                        // velocidad máxima que se transmite al agua (px/s)
  const REACH_POINTER = 40;                 // alcance del cursor desde la superficie (px)
  const REACH_WORD = 16;                    // alcance de una palabra
  const WORD_FORCE = 0.1;                   // las palabras rozan: abolladura suave (~8 px)
  const ATTACK_FORCE = 0.65;                // una palabra que embiste empuja de verdad
  const IMPACT_KICK = 0.4;                  // fracción de la velocidad del choque que recibe el agua
  // Movimiento propio del fluido (modos m del anillo con amplitud aleatoria que deriva)
  const FLOW_MODES = [2, 3, 4, 5, 6, 7];
  const FLOW_TAU = 2.6;                     // memoria de cada modo (s): cuanto más, más lento cambia
  const FLOW_BEND = 240;                    // fuerza sobre el contorno (px/s²) por modo
  const FLOW_SWELL = 0.09 * GRAV;           // presión sobre el espesor por modo (abultamientos)
  const FLOW_SPIN = 0.9;                    // giro de los abultamientos (rad/s, dividido por m)

  // Inscripción
  const LABEL = 'DIOS';
  const LABEL_FONT = '"Geist", ui-sans-serif, system-ui, sans-serif';
  const LABEL_TRACK = 0.34;                 // espaciado entre letras (em)
  const LABEL_CAP = 0.5;                    // altura de mayúscula, en fracción del diámetro del tubo
  const LABEL_DRIFT = 0.55;                 // cuánto arrastra la corriente a las letras
  const LABEL_RETURN = 1.3;                 // rapidez con la que vuelven a su sitio (1/s)

  const LINEN = [247 / 255, 245 / 255, 243 / 255];

  const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uBg;
uniform sampler2D uArc;
uniform sampler2D uLabel;
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uC;
uniform float uR0;
uniform float uW0;
uniform float uStart;
uniform float uN;
uniform float uLabelW;
uniform float uLabelC;
uniform vec3 uLinen;
uniform float uOpaque;
uniform float uTime;
out vec4 outColor;

const float TAU = 6.2831853;
const float FLAT = 0.62;   // altura del hilo de agua respecto a su medio ancho (no es un tubo)

// Ruido de valor 3D (ondulaciones de la superficie)
float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), f.x),
                 mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x),
                 mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}

vec2 arcAt(float a) {
  float x = mod(a - uStart, TAU) / TAU * uN;
  float i0 = floor(x);
  float f = x - i0;
  vec2 v0 = texelFetch(uArc, ivec2(int(mod(i0, uN)), 0), 0).rg;
  vec2 v1 = texelFetch(uArc, ivec2(int(mod(i0 + 1.0, uN)), 0), 0).rg;
  return mix(v0, v1, f);
}

// sd: distancia firmada a la superficie (px); h: altura del agua; rc/w: eje y medio ancho
void field(vec2 p, out float sd, out float h, out float rc, out float w) {
  vec2 rel = p - uC;
  float r = length(rel);
  vec2 dh = arcAt(atan(rel.y, rel.x));
  rc = uR0 + dh.x;
  w = uW0 * dh.y;
  float dd = abs(r - rc);
  sd = dd - w;
  h = dd < w ? FLAT * sqrt(w * w - dd * dd) : 0.0;
}

// Altura con ondulaciones capilares (solo para la normal): la superficie nunca está lisa
float heightAt(vec2 p) {
  float sd; float h; float rc; float w;
  field(p, sd, h, rc, w);
  if (h <= 0.0) return 0.0;
  vec2 rel = p - uC;
  float a = atan(rel.y, rel.x);
  float ys = (length(rel) - rc) / max(w, 1.0);
  float k = uR0 / 15.0;
  float rip = noise3(vec3(cos(a) * k, sin(a) * k, ys * 1.8 + uTime * 0.9))
            + 0.5 * noise3(vec3(cos(a) * k * 2.1 + 5.0, sin(a) * k * 2.1, ys * 3.0 - uTime * 1.4));
  return h + (rip - 0.75) * w * 0.05 * (1.0 - ys * ys);
}

vec3 bgAt(vec2 p) {
  vec4 t = texture(uBg, p * uDpr / uRes);
  return mix(uLinen, t.rgb, t.a);
}

// Sombra del agua sobre el suelo y la línea de luz que el tubo concentra dentro de ella
float shadowAt(vec2 p, out float caustic) {
  float sd; float h; float rc; float w;
  field(p - vec2(uW0 * 0.25, uW0 * 0.75), sd, h, rc, w);
  caustic = exp(-pow((sd + uW0 * 0.42) / (uW0 * 0.26), 2.0));
  return 1.0 - smoothstep(-uW0 * 0.7, uW0 * 1.5, sd);
}

// Tinta de la inscripción en un punto del tubo (coordenadas que siguen al eje deformado)
float inkAt(vec2 q, float rc, float w) {
  vec2 rel = q - uC;
  float da = mod(atan(rel.y, rel.x) - uLabelC + 3.1415927, TAU) - 3.1415927;
  float xs = da * rc;
  float ys = (length(rel) - rc) / max(w, 1.0);
  vec2 uv = vec2(xs / uLabelW + 0.5, 0.5 - ys * 0.5);
  if (uv.x <= 0.0 || uv.x >= 1.0 || uv.y <= 0.0 || uv.y >= 1.0) return 0.0;
  return texture(uLabel, uv).a;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;

  float sd; float h; float rc; float w;
  field(p, sd, h, rc, w);

  float caus;
  float sh = shadowAt(p, caus);
  float shadowA = sh * 0.13;
  float causA = caus * sh * 0.6;
  vec4 ground = vec4(vec3(causA), clamp(shadowA + causA, 0.0, 1.0));


  float cover = clamp(0.5 - sd * uDpr, 0.0, 1.0);
  if (cover <= 0.0) {
    outColor = ground;
    return;
  }

  // Normal del tubo por diferencias centrales de la altura
  float e = 0.75;
  float hx = heightAt(p + vec2(e, 0.0)) - heightAt(p - vec2(e, 0.0));
  float hy = heightAt(p + vec2(0.0, e)) - heightAt(p - vec2(0.0, e));
  vec3 n = normalize(vec3(-hx / (2.0 * e), -hy / (2.0 * e), 1.0));
  float edge = 1.0 - n.z;

  // Refracción: en el canto la lente toma el fondo de fuera y lo comprime hacia dentro
  vec2 sp = p + n.xy * uW0 * 0.95 * pow(edge, 0.8);
  vec3 refr = bgAt(sp);
  float c2;
  float sh2 = shadowAt(sp, c2);
  refr *= 1.0 - sh2 * 0.12;
  refr += c2 * sh2 * 0.18;
  refr *= mix(vec3(0.99, 0.995, 1.0), vec3(0.925, 0.962, 0.985), clamp(h / (uW0 * FLAT), 0.0, 1.0));

  // Inscripción suspendida en el agua: se ve un poco desplazada por la superficie curva
  float ink = inkAt(p - n.xy * uW0 * 0.16, rc, w);
  refr = mix(refr, vec3(0.05, 0.06, 0.07), ink * 0.9);

  // Luz
  vec3 L = normalize(vec3(-0.45, -0.75, 0.85));
  vec3 Hv = normalize(L + vec3(0.0, 0.0, 1.0));
  float nh = max(dot(n, Hv), 0.0);
  float spec = pow(nh, 220.0) * 1.2 + pow(nh, 40.0) * 0.12;
  float fres = 0.02 + 0.98 * pow(edge, 5.0);
  vec3 env = mix(vec3(0.96, 0.98, 1.0), vec3(0.7, 0.74, 0.78), clamp(0.5 + 0.5 * n.y, 0.0, 1.0));
  vec3 col = mix(refr, env, fres * 0.4);
  // Volumen: el lado opuesto a la luz, un poco más denso
  col *= 1.0 - 0.07 * smoothstep(0.2, 0.9, edge) * clamp(dot(n.xy, normalize(-L.xy)) * 0.5 + 0.5, 0.0, 1.0);

  // Luz transmitida: se concentra en el lado opuesto a la fuente
  vec2 nd = n.xy / max(length(n.xy), 1e-4);
  float glow = pow(clamp(dot(nd, -normalize(L.xy)), 0.0, 1.0), 4.0) * smoothstep(0.55, 0.95, edge) * 0.22;
  col += glow;

  // Filo de refracción oscuro justo en el canto (define la forma)
  col *= 1.0 - 0.3 * smoothstep(0.93, 1.0, edge);
  col += spec;
  col = mix(col, mix(vec3(0.97), vec3(0.05), ink * 0.9), uOpaque * 0.85);
  col = min(col, vec3(1.0));

  outColor = vec4(col * cover, cover) + ground * (1.0 - cover);
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || 'shader');
    }
    return s;
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const prevOf = (i) => (i === 0 ? N - 1 : i - 1);
  const nextOf = (i) => (i === N - 1 ? 0 : i + 1);

  function create(canvas) {
    if (!canvas) return null;

    // ---------- estado físico ----------
    const d = new Float32Array(N);          // desplazamiento radial del eje (px)
    const vd = new Float32Array(N);
    const h = new Float32Array(N).fill(1);  // espesor relativo
    const hn = new Float32Array(N);
    const u = new Float32Array(N);          // flujo en la cara entre i e i+1
    const flux = new Float32Array(N);
    const force = new Float32Array(N);
    const press = new Float32Array(N);
    const cosT = new Float32Array(N);
    const sinT = new Float32Array(N);
    const data = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const t = START + (Math.PI * 2 * i) / N;
      cosT[i] = Math.cos(t);
      sinT[i] = Math.sin(t);
    }

    let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R0 = 1, W0 = 1, ds = 1;
    let labelW = 1, labelShift = 0, labelVel = 0;
    let labelCanvas = null;

    const opaque = window.matchMedia('(prefers-reduced-transparency: reduce)');
    const lastPos = new WeakMap();
    let ptrPrev = null;
    let time = 0;
    // Amplitudes (re, im) de cada modo del flujo: contorno y espesor
    const bendA = FLOW_MODES.map(() => [0, 0]);
    const swellA = FLOW_MODES.map(() => [0, 0]);
    const gauss = () => {
      let u1 = 0;
      while (!u1) u1 = Math.random();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * Math.random());
    };

    // ---------- contexto ----------
    let gl = null;
    let ctx2d = null;
    let loc = {};
    let bgTex, arcTex, labelTex;

    try {
      gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
      if (gl) {
        const prog = gl.createProgram();
        gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const aPos = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        for (const name of ['uBg', 'uArc', 'uLabel', 'uRes', 'uDpr', 'uC', 'uR0', 'uW0', 'uStart', 'uN', 'uLabelW', 'uLabelC', 'uLinen', 'uOpaque', 'uTime']) {
          loc[name] = gl.getUniformLocation(prog, name);
        }

        const makeTex = (unit, filter) => {
          const t = gl.createTexture();
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          return t;
        };
        bgTex = makeTex(0, gl.LINEAR);
        arcTex = makeTex(1, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, N, 1, 0, gl.RG, gl.FLOAT, data);
        labelTex = makeTex(2, gl.LINEAR);

        gl.uniform1i(loc.uBg, 0);
        gl.uniform1i(loc.uArc, 1);
        gl.uniform1i(loc.uLabel, 2);
        gl.uniform1f(loc.uN, N);
        gl.uniform1f(loc.uStart, START);
        gl.uniform3f(loc.uLinen, LINEN[0], LINEN[1], LINEN[2]);
      }
    } catch (err) {
      gl = null;
    }
    if (!gl) ctx2d = canvas.getContext('2d');

    // ---------- inscripción ----------
    // Se dibuja una vez en un lienzo del tamaño de la sección del tubo; el shader la envuelve
    // alrededor del eje deformado.
    function buildLabel() {
      const px = (W0 * 2 * LABEL_CAP) / 0.7;            // cuerpo para esa altura de mayúscula
      const scale = Math.min(4, dpr * 2);
      const c = labelCanvas || document.createElement('canvas');
      const g = c.getContext('2d');
      g.font = `500 ${px}px ${LABEL_FONT}`;
      if ('letterSpacing' in g) g.letterSpacing = `${(px * LABEL_TRACK).toFixed(2)}px`;
      const m = g.measureText(LABEL);
      const trail = 'letterSpacing' in g ? px * LABEL_TRACK : 0;   // espacio tras la última letra
      labelW = m.width - trail + px * 0.6;
      c.width = Math.ceil(labelW * scale);
      c.height = Math.ceil(W0 * 2 * scale);
      g.setTransform(scale, 0, 0, scale, 0, 0);
      g.clearRect(0, 0, labelW, W0 * 2);
      g.font = `500 ${px}px ${LABEL_FONT}`;
      if ('letterSpacing' in g) g.letterSpacing = `${(px * LABEL_TRACK).toFixed(2)}px`;
      g.fillStyle = '#000';
      g.textBaseline = 'alphabetic';
      const asc = m.actualBoundingBoxAscent || px * 0.7;
      const desc = m.actualBoundingBoxDescent || 0;
      g.fillText(LABEL, px * 0.3, W0 + (asc - desc) / 2);
      labelCanvas = c;

      if (gl) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, labelTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      }
    }

    // ---------- geometría ----------
    function resize(opts) {
      W = opts.W;
      H = opts.H;
      dpr = opts.dpr;
      cx = opts.cx;
      cy = opts.cy;
      R0 = opts.size * R_FRAC;
      W0 = opts.size * W_FRAC;
      ds = (R0 * Math.PI * 2) / N;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      buildLabel();
    }

    // ---------- interacción ----------
    // Un "sondeo" (cursor o caja de palabra) empuja, aprieta y arrastra los nodos cercanos.
    function probe(i, qx, qy, vx, vy, reach, strength) {
      const rc = R0 + d[i];
      const nx = cx + rc * cosT[i];
      const ny = cy + rc * sinT[i];
      const dist = Math.hypot(qx - nx, qy - ny) - W0 * h[i];
      if (dist > reach) return;
      const pen = clamp(1 - dist / reach, 0, 1);
      const p2 = pen * pen * strength;
      // ¿el sondeo está fuera (+) o dentro (-) del eje? Suavizado para que no salte.
      const side = Math.tanh(((qx - cx) * cosT[i] + (qy - cy) * sinT[i] - rc) / 12);
      force[i] -= side * PUSH * p2;
      press[i] += SQUEEZE * p2;
      // Arrastre: el agua tiende a moverse con quien la toca
      const k = Math.min(1, pen * DRAG * strength);
      const vr = clamp(vx * cosT[i] + vy * sinT[i], -V_MAX, V_MAX);
      const vt = clamp(-vx * sinT[i] + vy * cosT[i], -V_MAX, V_MAX) * 0.35; // el agua resbala
      vd[i] += (vr - vd[i]) * k;
      const pi = prevOf(i);
      u[pi] += (vt - u[pi]) * k * 0.4;
      u[i] += (vt - u[i]) * k * 0.4;
    }

    function step(dt, pointer, words) {
      if (!W) return;
      dt = Math.min(dt, 1 / 20);
      time += dt;
      force.fill(0);
      press.fill(0);

      // Movimiento propio del fluido. Cada modo m tiene una amplitud compleja que deriva al azar
      // (Ornstein-Uhlenbeck, varianza 1) y gira despacio: el contorno se curva y el espesor forma
      // abultamientos que viajan. Son fuerzas reales, se mezclan con el cursor y las palabras.
      const decay = Math.exp(-dt / FLOW_TAU);
      const noise = Math.sqrt(1 - decay * decay);
      FLOW_MODES.forEach((m, k) => {
        for (const A of [bendA[k], swellA[k]]) {
          A[0] = A[0] * decay + noise * gauss();
          A[1] = A[1] * decay + noise * gauss();
        }
        // Los abultamientos de espesor giran (unos modos en un sentido, otros en el contrario)
        const rot = ((k % 2 ? 1 : -1) * FLOW_SPIN * dt) / m;
        const c = Math.cos(rot);
        const sn = Math.sin(rot);
        const S = swellA[k];
        const re = S[0] * c - S[1] * sn;
        S[1] = S[0] * sn + S[1] * c;
        S[0] = re;
      });
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        let f = 0;
        let pr = 0;
        FLOW_MODES.forEach((m, k) => {
          const cm = Math.cos(m * a);
          const sm = Math.sin(m * a);
          f += (bendA[k][0] * cm + bendA[k][1] * sm) / Math.sqrt(m);
          pr += (swellA[k][0] * cm + swellA[k][1] * sm) / Math.sqrt(m);
        });
        force[i] += f * FLOW_BEND;
        press[i] += pr * FLOW_SWELL;
      }

      // Cursor
      if (pointer && pointer.active) {
        let vx = 0;
        let vy = 0;
        if (ptrPrev) {
          vx = (pointer.x - ptrPrev.x) / dt;
          vy = (pointer.y - ptrPrev.y) / dt;
        }
        ptrPrev = { x: pointer.x, y: pointer.y };
        const pr = Math.hypot(pointer.x - cx, pointer.y - cy);
        if (Math.abs(pr - R0) < W0 * 2 + REACH_POINTER + 30) {
          for (let i = 0; i < N; i++) probe(i, pointer.x, pointer.y, vx, vy, REACH_POINTER, 1);
        }
      } else {
        ptrPrev = null;
      }

      // Palabras que pasan cerca
      for (const w of words) {
        const prev = lastPos.get(w);
        const vx = prev ? (w.x - prev.x) / dt : 0;
        const vy = prev ? (w.y - prev.y) / dt : 0;
        lastPos.set(w, { x: w.x, y: w.y });
        const vis = (w.intro ?? 1) * (w.fade ?? 1);
        if (vis < 0.3) continue;
        const hx = w.w / 2;
        const hy = w.h / 2;
        const far = Math.hypot(w.x - cx, w.y - cy) - Math.hypot(hx, hy);
        if (far > R0 + W0 * 2 + REACH_WORD) continue;
        for (let i = 0; i < N; i++) {
          const rc = R0 + d[i];
          const nx = cx + rc * cosT[i];
          const ny = cy + rc * sinT[i];
          const qx = clamp(nx, w.x - hx, w.x + hx);
          const qy = clamp(ny, w.y - hy, w.y + hy);
          probe(i, qx, qy, vx, vy, REACH_WORD, (w.attack ? ATTACK_FORCE : WORD_FORCE) * vis);
        }
      }

      // Integración con subpasos estables (CFL)
      const maxStep = (0.45 * ds) / 230;
      const sub = Math.max(1, Math.ceil(dt / maxStep));
      const h_dt = dt / sub;
      const ds2 = ds * ds;
      const dSoft = R0 * 0.16;            // a partir de aquí el muelle se endurece (sin topes duros)
      const room = ds / (2 * h_dt);

      for (let k = 0; k < sub; k++) {
        // Eje: onda con tensión superficial y viscosidad (Kelvin-Voigt), anillo cerrado
        for (let i = 0; i < N; i++) {
          const l = prevOf(i);
          const r = nextOf(i);
          const lapD = (d[l] - 2 * d[i] + d[r]) / ds2;
          const lapV = (vd[l] - 2 * vd[i] + vd[r]) / ds2;
          const q = d[i] / dSoft;
          const acc = TENSION * lapD + VISC * lapV - SPRING * d[i] * (1 + q * q * q * q) - DAMP * vd[i] + force[i];
          vd[i] += acc * h_dt;
        }
        for (let i = 0; i < N; i++) d[i] += vd[i] * h_dt;

        // Espesor: aguas someras en forma de flujo (masa exacta)
        for (let j = 0; j < N; j++) {
          const jn = nextOf(j);
          const gradH = (h[jn] - h[j]) / ds;
          const gradP = (press[jn] - press[j]) / ds;
          const lapU = (u[prevOf(j)] - 2 * u[j] + u[jn]) / ds2;
          u[j] += (-GRAV * gradH - gradP + VISC * lapU - FLOW_DAMP * u[j]) * h_dt;
        }
        // Flujos limitados: ningún nodo cede más agua de la que tiene por encima de H_MIN
        // ni recibe más de la que cabe bajo H_MAX. Así no hace falta recortar.
        for (let j = 0; j < N; j++) {
          const jn = nextOf(j);
          let q = 0.5 * (h[j] + h[jn]) * u[j];
          if (q > 0) q = Math.min(q, (h[j] - H_MIN) * room, (H_MAX - h[jn]) * room);
          else q = Math.max(q, -(h[jn] - H_MIN) * room, -(H_MAX - h[j]) * room);
          flux[j] = q;
        }
        for (let i = 0; i < N; i++) {
          const l = prevOf(i);
          const r = nextOf(i);
          hn[i] = h[i] - ((flux[i] - flux[l]) / ds) * h_dt + (DIFFUSE * (h[l] - 2 * h[i] + h[r]) * h_dt) / ds2;
        }
        h.set(hn);
      }

      // La corriente bajo la inscripción la arrastra un poco; luego vuelve a su sitio
      const span = Math.ceil((labelW / ds) / 2);
      let flow = 0;
      for (let j = -span; j <= span; j++) flow += u[(j + N) % N];
      flow /= span * 2 + 1;
      labelVel += (flow * LABEL_DRIFT - labelVel) * (1 - Math.exp(-dt * 4));
      labelShift += labelVel * dt;
      labelShift -= labelShift * (1 - Math.exp(-dt * LABEL_RETURN));
      labelShift = clamp(labelShift, -R0 * 0.6, R0 * 0.6);
    }

    // ---------- choques ----------
    // Una palabra que embiste hunde el agua (velocidad radial hacia dentro) y la aparta a los
    // lados; el resto lo hace la física (ondas que recorren el anillo).
    function impulse(angle, speed) {
      const sp = clamp(speed, 0, V_MAX);
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      const sigma = W0 * 1.4;
      for (let i = 0; i < N; i++) {
        const x = Math.atan2(sinT[i] * ca - cosT[i] * sa, cosT[i] * ca + sinT[i] * sa) * R0;
        const g = Math.exp(-(x * x) / (2 * sigma * sigma));
        vd[i] -= g * sp * IMPACT_KICK;
        u[i] += Math.sign(x) * g * sp * 0.25;
      }
    }

    // Radio del borde exterior del agua en un ángulo (con la deformación actual)
    function surfaceAt(angle) {
      let a = (angle - START) / (Math.PI * 2);
      a -= Math.floor(a);
      const x = a * N;
      const i0 = Math.floor(x) % N;
      const i1 = (i0 + 1) % N;
      const f = x - Math.floor(x);
      return R0 + d[i0] + (d[i1] - d[i0]) * f + W0 * (h[i0] + (h[i1] - h[i0]) * f);
    }

    // ---------- dibujo ----------
    function render(bgCanvas) {
      if (!W) return;
      if (gl) renderGL(bgCanvas);
      else if (ctx2d) render2D();
    }

    function renderGL(bgCanvas) {
      const cw = canvas.width;
      const ch = canvas.height;
      gl.viewport(0, 0, cw, ch);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Solo se sombrea la zona del anillo (más su sombra)
      const m = R0 + W0 * 3.5 + 30;
      const x0 = Math.max(0, Math.floor((cx - m) * dpr));
      const y0 = Math.max(0, Math.floor((cy - m) * dpr));
      const x1 = Math.min(cw, Math.ceil((cx + m) * dpr));
      const y1 = Math.min(ch, Math.ceil((cy + m + W0) * dpr));
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x0, ch - y1, x1 - x0, y1 - y0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bgTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgCanvas);

      for (let i = 0; i < N; i++) {
        data[i * 2] = d[i];
        data[i * 2 + 1] = h[i];
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, arcTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, 1, gl.RG, gl.FLOAT, data);

      gl.uniform2f(loc.uRes, cw, ch);
      gl.uniform1f(loc.uDpr, dpr);
      gl.uniform2f(loc.uC, cx, cy);
      gl.uniform1f(loc.uR0, R0);
      gl.uniform1f(loc.uW0, W0);
      gl.uniform1f(loc.uLabelW, labelW);
      gl.uniform1f(loc.uLabelC, START + labelShift / R0);
      gl.uniform1f(loc.uOpaque, opaque.matches ? 1 : 0);
      gl.uniform1f(loc.uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // Respaldo sin WebGL2: misma forma, física e inscripción, sin refracción.
    function render2D() {
      const c = ctx2d;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      c.beginPath();
      for (let i = 0; i <= N; i++) {
        const k = i % N;
        const r = R0 + d[k] + W0 * h[k];
        c.lineTo(cx + r * cosT[k], cy + r * sinT[k]);
      }
      c.closePath();
      for (let i = N; i >= 0; i--) {
        const k = i % N;
        const r = R0 + d[k] - W0 * h[k];
        c.lineTo(cx + r * cosT[k], cy + r * sinT[k]);
      }
      c.closePath();
      c.fillStyle = opaque.matches ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.42)';
      c.fill('evenodd');
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(13,13,13,0.18)';
      c.stroke();

      // Inscripción: letra a letra sobre el arco superior
      c.save();
      c.font = `500 ${(W0 * 2 * LABEL_CAP) / 0.7}px ${LABEL_FONT}`;
      c.fillStyle = '#0d0d0d';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const letters = [...LABEL];
      const step = labelW / letters.length / R0;
      letters.forEach((ch, k) => {
        const a = START + labelShift / R0 + (k - (letters.length - 1) / 2) * step;
        c.save();
        c.translate(cx + R0 * Math.cos(a), cy + R0 * Math.sin(a));
        c.rotate(a + Math.PI / 2);
        c.fillText(ch, 0, 0);
        c.restore();
      });
      c.restore();
    }

    return { resize, step, render, impulse, surfaceAt, get innerRadius() { return R0 - W0; } };
  }

  window.WaterArc = { create };
})();
