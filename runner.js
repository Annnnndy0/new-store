/* Persona corriendo dentro del escudo de púas (sustituye al cerebro).

   - Bucle de 2,5 s (60 fotogramas a 24 fps) recortado de referencias/avatar runnig.mp4, con el
     fondo eliminado y un desenfoque suave ya aplicado. El tramo se eligió para que el último
     fotograma enlace con el primero en pose y velocidad, así que el reinicio no se nota.
   - Formato: WebM VP9 con canal alfa (Chrome, Edge, Firefox). Safari y todos los navegadores de
     iOS (WebKit) no muestran el alfa del WebM y pintarían un fondo negro: ahí se cambia el vídeo
     por un WebP animado con transparencia.
   - Ahorro: el póster (primer fotograma, 10 KB) se ve al instante y el vídeo (43 KB) solo se
     descarga al reproducirse. Se detiene fuera de vista, con la pestaña oculta, con el botón de
     pausa de la órbita y con movimiento reducido (queda el póster). */
(() => {
  'use strict';

  const video = document.querySelector('[data-runner]');
  if (!video) return;

  const seal = video.closest('.seal') || video;
  const toggle = document.querySelector('.orbit-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const webkit = /Apple/.test(navigator.vendor || '');
  const alphaWebm = !webkit && video.canPlayType('video/webm; codecs="vp09.00.10.08"') !== '';

  let inView = false;
  const shouldPlay = () =>
    inView && !document.hidden && !reduceMotion.matches && toggle?.getAttribute('aria-pressed') !== 'true';

  let sync;

  if (alphaWebm) {
    sync = () => {
      if (shouldPlay()) {
        // Autoplay bloqueado (p. ej. ahorro de batería): se queda el póster.
        if (video.paused) video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    };
  } else {
    // WebKit: imagen animada en lugar del vídeo. Pausada = póster (el mismo primer fotograma).
    const poster = video.getAttribute('poster');
    const anim = video.dataset.anim;
    const img = new Image(video.width, video.height);
    img.className = video.className;
    img.alt = '';
    img.decoding = 'async';
    img.setAttribute('aria-hidden', 'true');
    img.src = poster;
    video.replaceWith(img);

    let animReady = null;
    sync = () => {
      if (!shouldPlay()) {
        if (img.getAttribute('src') !== poster) img.src = poster;
        return;
      }
      if (img.getAttribute('src') === anim) return;
      // Se descarga y decodifica aparte para cambiar sin parpadeo
      if (!animReady) {
        const pre = new Image();
        pre.src = anim;
        animReady = pre.decode().catch(() => {});
      }
      animReady.then(() => {
        if (shouldPlay()) img.src = anim;
      });
    };
  }

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(seal);

  document.addEventListener('visibilitychange', sync);
  reduceMotion.addEventListener('change', sync);
  // orbit.js actualiza aria-pressed en su propio clic, que se registra antes que este.
  if (toggle) toggle.addEventListener('click', sync);
})();
