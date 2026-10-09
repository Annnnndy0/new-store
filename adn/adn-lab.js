/* Herramientas de la subpágina de prueba del ADN (no van a la página principal):
   - Panel de ajustes: cada control cambia una variable --dna-* de styles.css en vivo y avisa a
     dna.js ('dna:refresh'). Los cambios se recuerdan en este navegador; "Copiar CSS" copia el
     bloque de variables para pegarlo en styles.css.
   - Indicador de actos: marca en cuál estás (ADN, fondo o planeta) y el progreso del scroll. */
(() => {
  'use strict';

  const root = document.documentElement;
  const stage = document.querySelector('[data-dna]');
  const canvas = document.querySelector('[data-dna-canvas]');
  const panel = document.getElementById('dna-panel');
  const toggle = document.querySelector('.dna-toggle');
  const list = panel && panel.querySelector('[data-controls]');
  if (!stage || !canvas || !panel || !toggle || !list) return;

  const STORE = 'dna-lab:v1';

  const GROUPS = [
    {
      title: 'Colores',
      open: true,
      items: [
        { name: 'strand-a', label: 'Hebra 1', type: 'color' },
        { name: 'strand-b', label: 'Hebra 2', type: 'color' },
        { name: 'base-a', label: 'Bases · mitad 1', type: 'color' },
        { name: 'base-b', label: 'Bases · mitad 2', type: 'color' },
        { name: 'dust', label: 'Puntos sueltos', type: 'color' },
        { name: 'land', label: 'Continentes', type: 'color' },
        { name: 'ocean', label: 'Océano', type: 'color' },
        { name: 'bg', label: 'Fondo', type: 'color' },
      ],
    },
    {
      title: 'Transparencia',
      open: true,
      items: [
        { name: 'opacity', label: 'Opacidad general', min: 0, max: 1, step: 0.01 },
        { name: 'field-opacity', label: 'Opacidad como fondo', min: 0, max: 1, step: 0.01 },
        { name: 'depth-fade', label: 'Desvanecer la cara de detrás', min: 0, max: 1, step: 0.01 },
      ],
    },
    {
      title: 'Forma del ADN',
      items: [
        { name: 'dot', label: 'Tamaño de punto', min: 0.5, max: 4, step: 0.1, unit: 'px' },
        { name: 'size', label: 'Largo', min: 0.4, max: 1.6, step: 0.01 },
        { name: 'turns', label: 'Vueltas', min: 1.5, max: 6, step: 0.5 },
        { name: 'thickness', label: 'Grosor de las hebras', min: 0.1, max: 0.6, step: 0.01 },
        { name: 'density', label: 'Cantidad de puntos', min: 0.3, max: 2, step: 0.05 },
        { name: 'tilt', label: 'Inclinación', min: -80, max: 80, step: 1, unit: 'deg' },
        { name: 'yaw', label: 'Perspectiva', min: -60, max: 60, step: 1, unit: 'deg' },
      ],
    },
    {
      title: 'Movimiento',
      items: [
        { name: 'speed', label: 'Giro sobre su eje (vueltas/s)', min: 0, max: 0.5, step: 0.005 },
        { name: 'push', label: 'Reacción al cursor', min: 0, max: 2.5, step: 0.05 },
        { name: 'smooth', label: 'Calma de las transiciones', min: 0.3, max: 3, step: 0.05 },
      ],
    },
    {
      title: 'Fondo y planeta',
      items: [
        { name: 'field-density', label: 'Puntos que quedan de fondo', min: 0, max: 1, step: 0.01 },
        { name: 'globe-size', label: 'Tamaño del planeta', min: 0.3, max: 1.1, step: 0.01 },
        { name: 'globe-speed', label: 'Giro del planeta (vueltas/s)', min: 0, max: 0.2, step: 0.005 },
      ],
    },
  ];
  const ITEMS = GROUPS.flatMap((g) => g.items);

  /* ---------- valores ---------- */

  const probe = document.createElement('canvas').getContext('2d');
  const toHex = (value) => {
    probe.fillStyle = '#000000';
    probe.fillStyle = value;
    const c = probe.fillStyle;
    if (c[0] === '#') return c;
    const m = c.match(/[\d.]+/g) || [0, 0, 0];
    return '#' + m.slice(0, 3).map((n) => Math.round(+n).toString(16).padStart(2, '0')).join('');
  };

  const decimals = (step) => (String(step).split('.')[1] || '').length;
  const cssValue = (item, v) => (item.type === 'color' ? v : `${v}${item.unit || ''}`);
  const label = (item, v) => {
    if (item.unit === 'deg') return `${v}°`;
    if (item.unit === 'px') return `${(+v).toFixed(1)} px`;
    return (+v).toFixed(decimals(item.step));
  };

  // Valor actual de la variable (lo que diga styles.css o lo cambiado en el panel)
  function current(item) {
    const raw = getComputedStyle(root).getPropertyValue(`--dna-${item.name}`).trim();
    if (item.type === 'color') return toHex(raw || '#000');
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : item.min;
  }

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORE) || '{}') || {};
  } catch (e) {
    saved = {};
  }
  const save = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(saved));
    } catch (e) { /* sin almacenamiento: los cambios duran hasta recargar */ }
  };

  const refresh = () => canvas.dispatchEvent(new CustomEvent('dna:refresh'));

  function apply(item, v) {
    root.style.setProperty(`--dna-${item.name}`, cssValue(item, v));
  }

  // Lo guardado se aplica antes de pintar nada
  ITEMS.forEach((item) => {
    if (saved[item.name] !== undefined) apply(item, saved[item.name]);
  });
  refresh();

  /* ---------- controles ---------- */

  const inputs = new Map();

  function fill(input) {
    const p = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty('--fill', `${p}%`);
  }

  GROUPS.forEach((group) => {
    const details = document.createElement('details');
    details.className = 'dna-group';
    details.open = !!group.open;
    const summary = document.createElement('summary');
    summary.textContent = group.title;
    const box = document.createElement('div');
    box.className = 'dna-group__items';
    details.append(summary, box);

    group.items.forEach((item) => {
      const id = `dna-${item.name}`;
      const row = document.createElement('div');
      row.className = `dna-row dna-row--${item.type === 'color' ? 'color' : 'range'}`;
      const name = document.createElement('label');
      name.className = 'dna-row__label';
      name.htmlFor = id;
      name.textContent = item.label;
      const value = document.createElement('span');
      value.className = 'dna-row__value';
      const input = document.createElement('input');
      input.id = id;

      if (item.type === 'color') {
        input.type = 'color';
        const pick = document.createElement('span');
        pick.className = 'dna-row__pick';
        pick.append(value, input);
        row.append(name, pick);
      } else {
        input.type = 'range';
        input.min = item.min;
        input.max = item.max;
        input.step = item.step;
        row.append(name, value, input);
      }

      input.addEventListener('input', () => {
        const v = item.type === 'color' ? input.value : +input.value;
        value.textContent = item.type === 'color' ? v : label(item, v);
        if (item.type !== 'color') fill(input);
        apply(item, v);
        saved[item.name] = v;
        save();
        refresh();
      });

      inputs.set(item.name, { item, input, value });
      box.append(row);
    });

    list.append(details);
  });

  function sync() {
    inputs.forEach(({ item, input, value }) => {
      const v = current(item);
      input.value = v;
      value.textContent = item.type === 'color' ? v : label(item, v);
      if (item.type !== 'color') fill(input);
    });
  }
  sync();

  /* ---------- botones ---------- */

  const open = (yes) => {
    panel.hidden = !yes;
    toggle.setAttribute('aria-expanded', String(yes));
    if (yes) sync();
  };
  toggle.addEventListener('click', () => open(panel.hidden));
  panel.querySelector('.dna-panel__close').addEventListener('click', () => {
    open(false);
    toggle.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      open(false);
      toggle.focus();
    }
  });

  const copyBtn = panel.querySelector('[data-copy]');
  copyBtn.addEventListener('click', async () => {
    const lines = ITEMS.map((item) => `  --dna-${item.name}: ${cssValue(item, current(item))};`);
    const text = lines.join('\n');
    const text0 = copyBtn.querySelector('span').textContent;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (e) {
      // Sin portapapeles: se deja el texto seleccionado en un cuadro para copiarlo a mano
      const area = document.createElement('textarea');
      area.value = text;
      area.style.cssText = 'position:fixed;inset:auto 0 0 auto;opacity:0';
      document.body.append(area);
      area.select();
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      area.remove();
    }
    copyBtn.querySelector('span').textContent = ok ? 'Copiado' : 'No se pudo copiar';
    setTimeout(() => { copyBtn.querySelector('span').textContent = text0; }, 1600);
  });

  panel.querySelector('[data-reset]').addEventListener('click', () => {
    ITEMS.forEach((item) => root.style.removeProperty(`--dna-${item.name}`));
    saved = {};
    save();
    sync();
    refresh();
  });

  panel.querySelector('[data-replay]').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    canvas.dispatchEvent(new CustomEvent('dna:replay'));
  });

  /* ---------- actos ---------- */

  const steps = [...document.querySelectorAll('.dna-hud__step')];
  const bar = document.querySelector('.dna-hud__bar span');
  stage.addEventListener('dna:state', (e) => {
    const { scatter, gather } = e.detail;
    const step = gather >= 0.5 ? 2 : scatter >= 0.5 ? 1 : 0;
    steps.forEach((el, i) => {
      el.classList.toggle('is-active', i === step);
      if (i === step) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    if (bar) bar.style.setProperty('--p', ((scatter + gather) / 2).toFixed(3));
  });
})();
