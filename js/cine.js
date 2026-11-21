/* Cine 1BIO1 · El precio de una mentira
   Reproductor de la sala, programa de escenas, guion interactivo y detalles de la fachada.
   Sin dependencias. Los datos vienen de js/datos.js (window.FUNCION). */
(() => {
  'use strict';

  const D = window.FUNCION || { capitulos: [], cues: [], duracion: 480 };
  const html = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const consultaMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducido = () => consultaMovimiento.matches;
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const debounce = (fn, ms) => { let t = 0; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  const dos = (n) => String(n).padStart(2, '0');
  const fmt = (seg) => {
    const s = Math.max(0, Math.floor(seg || 0));
    return `${Math.floor(s / 60)}:${dos(s % 60)}`;
  };
  const fmtLargo = (seg) => {
    const s = Math.max(0, Math.floor(seg || 0));
    const m = Math.floor(s / 60), r = s % 60;
    return `${m} ${m === 1 ? 'minuto' : 'minutos'} ${r} ${r === 1 ? 'segundo' : 'segundos'}`;
  };
  const unir = (xs) => (xs.length < 2 ? (xs[0] || '') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);
  const el = (tag, clase, texto) => {
    const n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  };
  // Pseudoazar con semilla: las letras de la marquesina quedan igual en cada visita.
  const azar = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

  const capitulos = D.capitulos || [];
  const capituloEn = (t) => {
    for (let i = capitulos.length - 1; i >= 0; i--) if (t >= capitulos[i].inicio) return capitulos[i];
    return capitulos[0];
  };

  /* =====================================================================
     1. FACHADA
     ===================================================================== */
  // Guirnalda de focos medida en píxeles: en escritorio termina amarrada al menú,
  // en celular cuelga debajo de él. Así nunca se enciman.
  function crearGuirnalda(rehacer = false) {
    const caja = $('#guirnalda');
    const fachada = $('.fachada');
    const menu = $('.menu');
    if (!caja || !fachada) return;
    const rf = fachada.getBoundingClientRect();
    const rm = menu ? menu.getBoundingClientRect() : null;
    const ancho = Math.round(rf.width);
    if (!ancho) return;
    const apilado = !rm || rm.width > ancho * 0.6;
    const arriba = apilado && rm ? Math.round(rm.bottom - rf.top + 2) : 0;
    const finX = apilado ? ancho + 30 : Math.round(rm.left - rf.left - 2);
    const finY = apilado ? 6 : Math.round(rm.top - rf.top + rm.height / 2);
    const alto = 130;
    caja.style.top = `${arriba}px`;
    caja.style.height = `${alto}px`;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', String(ancho));
    svg.setAttribute('height', String(alto));
    svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
    const inicioX = -30;
    const tramos = Math.max(1, Math.round((finX - inicioX) / 390));
    const largo = (finX - inicioX) / tramos;
    let i = 0;
    for (let t = 0; t < tramos; t++) {
      const a = [inicioX + t * largo, t === 0 ? 2 : 10];
      const b = [a[0] + largo, t === tramos - 1 ? finY : 10];
      const c = [(a[0] + b[0]) / 2, 150];
      const cable = document.createElementNS(ns, 'path');
      cable.setAttribute('d', `M${a[0].toFixed(1)} ${a[1]} Q${c[0].toFixed(1)} ${c[1]} ${b[0].toFixed(1)} ${b[1]}`);
      cable.setAttribute('class', 'cable');
      svg.appendChild(cable);
      const n = Math.max(3, Math.round(largo / 50));
      for (let k = 1; k < n; k++) {
        const u = k / n;
        const x = (1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u ** 2 * b[0];
        const y = (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u ** 2 * b[1];
        if (x < -10 || x > ancho + 10) continue;
        const g = document.createElementNS(ns, 'g');
        g.setAttribute('class', 'foco-g');
        g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        g.style.setProperty('--d', rehacer ? '-3s' : `${(0.15 + i * 0.04).toFixed(2)}s`);
        const rosa = i % 4 === 2 ? ' bombilla--rosa' : '';
        g.innerHTML = `<circle class="halo" r="15" cy="12"/><rect class="casquillo" x="-3" y="0" width="6" height="5" rx="1"/><ellipse class="bombilla${rosa}" cy="12" rx="5" ry="6.5"/>`;
        svg.appendChild(g);
        i++;
      }
    }
    caja.replaceChildren(svg);
  }

  function partirTablero() {
    const h1 = $('#tablero');
    if (!h1) return;
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    let n = 0;
    $$('.tablero__fila', h1).forEach((fila) => {
      const texto = fila.textContent.trim();
      fila.textContent = '';
      fila.setAttribute('aria-hidden', 'true');
      texto.split(/\s+/).forEach((palabra, j) => {
        if (j > 0) fila.appendChild(document.createTextNode(' '));
        const caja = el('span');
        caja.style.display = 'inline-block';
        for (const ch of palabra) {
          const s = el('span', 'letra', ch);
          s.style.setProperty('--r', `${((azar(n) - 0.5) * 2.6).toFixed(2)}deg`);
          s.style.setProperty('--y', `${((azar(n + 50) - 0.5) * 0.05).toFixed(3)}em`);
          s.style.setProperty('--d', `${(n * 0.035).toFixed(3)}s`);
          caja.appendChild(s);
          n++;
        }
        fila.appendChild(caja);
      });
    });
    h1.classList.add('partido');
  }

  function crearFocos(rehacer = false) {
    const caja = $('#focos');
    if (!caja) return;
    const r = caja.getBoundingClientRect();
    if (!r.width) return;
    const paso = r.width < 500 ? 22 : 27;
    const nx = Math.max(6, Math.round(r.width / paso));
    const ny = Math.max(3, Math.round(r.height / paso));
    const puntos = [];
    for (let i = 0; i < nx; i++) puntos.push([(i / nx) * 100, 0]);
    for (let i = 0; i < ny; i++) puntos.push([100, (i / ny) * 100]);
    for (let i = 0; i < nx; i++) puntos.push([100 - (i / nx) * 100, 100]);
    for (let i = 0; i < ny; i++) puntos.push([0, 100 - (i / ny) * 100]);
    const frag = document.createDocumentFragment();
    puntos.forEach(([x, y], i) => {
      const f = el('span', 'foco');
      f.style.left = `${x}%`;
      f.style.top = `${y}%`;
      f.style.setProperty('--d', rehacer ? '-9s' : `${(i * 0.012).toFixed(3)}s`);
      f.style.setProperty('--fase', `${(i % 3) * 0.5}s`);
      if (rehacer) f.style.setProperty('--inicio', '0s');
      frag.appendChild(f);
    });
    caja.replaceChildren(frag);
  }

  /* =====================================================================
     2. SALA
     ===================================================================== */
  const sala = $('#sala');
  const escenario = $('#escenario');
  const pantalla = $('#pantalla');
  const marco = $('.pantalla__marco');
  const video = $('#pelicula');
  const fuente = $('#pelicula-src');
  const portada = $('#portada');
  const fin = $('#fin');
  const controles = $('#controles');
  const btnPlay = $('#btn-play');
  const btnMudo = $('#btn-mudo');
  const btnLuces = $('#btn-luces');
  const btnPantalla = $('#btn-pantalla');
  const volumen = $('#volumen');
  const posicion = $('#posicion');
  const linea = $('#linea');
  const globo = $('#globo');
  const avance = $('#avance');
  const cargado = $('#cargado');
  const carril = $('#carril');
  const marcas = $('#marcas');
  const tActual = $('#tiempo-actual');
  const tTotal = $('#tiempo-total');
  const capActual = $('#capitulo-actual');
  const cuenta = $('#cuenta');
  const cargando = $('#cargando');
  const aviso = $('#aviso');
  const pildora = $('#en-funcion');
  const pildoraTiempo = $('#en-funcion-tiempo');
  const pildoraPausa = $('#en-funcion-pausa');

  let estado = 'cerrado'; // cerrado | abriendo | funcion | fin
  let duracion = D.duracion || 480;
  let lucesManual = false;
  let salaVisible = false;
  let arrastrando = false;
  let desbloqueado = false;
  let sinVideo = false;
  const cuadros = {};
  const frases = [];
  let fraseActual = -1;
  let ultimoCap = null;

  const enPantallaCompleta = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

  function medirTelon() {
    if (!escenario || enPantallaCompleta()) return;
    const re = escenario.getBoundingClientRect();
    const rp = pantalla.getBoundingClientRect();
    const mitad = re.width / 2;
    if (!mitad) return;
    const borde = Math.max(10, rp.left - re.left - 3);
    escenario.style.setProperty('--abierto', Math.min(0.5, borde / mitad).toFixed(4));
  }

  function dibujarMarcas() {
    marcas.replaceChildren(...capitulos.slice(1).map((c) => {
      const s = el('span');
      s.style.left = `${(c.inicio / duracion) * 100}%`;
      return s;
    }));
  }

  // Safari y iOS solo dejan reproducir con sonido si play() ocurre dentro del toque.
  // Este truco "desbloquea" el video en ese momento para poder empezar después de la cuenta regresiva.
  function desbloquear() {
    if (desbloqueado || !video || !video.paused) return;
    desbloqueado = true;
    try {
      const p = video.play();
      video.pause();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) { /* sin efecto */ }
  }

  function apagarLuces(si) {
    html.classList.toggle('luces-apagadas', si);
    btnLuces.setAttribute('aria-pressed', String(!si));
  }

  async function iniciarFuncion({ desde = 0, conCuenta = true } = {}) {
    if (estado === 'abriendo') return;
    desbloquear();
    const veniaDeAdentro = sala.contains(document.activeElement);
    estado = 'abriendo';
    fin.hidden = true;
    portada.hidden = false;
    portada.classList.add('oculta');
    controles.hidden = false;
    ocultarAviso();
    if (!lucesManual) apagarLuces(true);
    medirTelon();
    escenario.classList.add('abierto');
    try { video.currentTime = desde; } catch (e) { /* aún sin metadatos */ }
    actualizarTiempo(desde);
    await esperar(reducido() ? 0 : 1100);
    portada.hidden = true;
    if (conCuenta && !reducido()) await cuentaRegresiva();
    estado = 'funcion';
    if (veniaDeAdentro) btnPlay.focus({ preventScroll: true });
    if (sinVideo) { mostrarErrorVideo(); return; }
    reproducir();
  }

  function reproducir() {
    ocultarAviso();
    const p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        if (!err) return;
        if (err.name === 'NotAllowedError') {
          mostrarAviso('El navegador pidió un toque más para empezar.', { texto: 'Reproducir', fn: reproducir });
        } else if (err.name === 'NotSupportedError') {
          mostrarErrorVideo();
        }
      });
    }
  }

  function alternar() {
    if (estado === 'cerrado' || estado === 'fin') {
      iniciarFuncion({ desde: 0, conCuenta: estado === 'cerrado' });
      return;
    }
    if (estado !== 'funcion') return;
    if (video.paused) reproducir(); else video.pause();
  }

  async function terminarFuncion() {
    estado = 'fin';
    sala.classList.remove('reproduciendo');
    detenerAmbiente();
    actualizarPildora();
    const veniaDeAdentro = sala.contains(document.activeElement);
    if (enPantallaCompleta()) {
      try { await (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* nada */ }
    }
    controles.hidden = true;
    escenario.classList.remove('abierto');
    lucesManual = false;
    apagarLuces(false);
    await esperar(reducido() ? 0 : 1500);
    if (estado !== 'fin') return;
    fin.hidden = false;
    if (veniaDeAdentro) $('#otra-vez').focus({ preventScroll: true });
  }

  function irA(t) {
    desbloquear();
    const alto = sala.offsetHeight >= window.innerHeight * 0.9;
    sala.scrollIntoView({ behavior: reducido() ? 'auto' : 'smooth', block: alto ? 'start' : 'center' });
    if (estado === 'cerrado' || estado === 'fin') {
      iniciarFuncion({ desde: t, conCuenta: false });
      return;
    }
    try { video.currentTime = t; } catch (e) { /* nada */ }
    actualizarTiempo(t);
    if (estado === 'funcion' && video.paused) reproducir();
  }

  /* ---------- Cuenta regresiva de película ---------- */
  function cuentaRegresiva() {
    return new Promise((resolve) => {
      const ctx = cuenta.getContext('2d');
      if (!ctx) { resolve(); return; }
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = marco.getBoundingClientRect();
      cuenta.width = Math.max(1, Math.round(r.width * dpr));
      cuenta.height = Math.max(1, Math.round(r.height * dpr));
      cuenta.hidden = false;
      requestAnimationFrame(() => cuenta.classList.add('visible'));
      const inicio = performance.now();
      const total = 3000;
      const paso = (ahora) => {
        const t = ahora - inicio;
        if (t >= total) {
          cuenta.classList.remove('visible');
          setTimeout(() => { cuenta.hidden = true; }, 280);
          resolve();
          return;
        }
        dibujarLider(ctx, cuenta.width, cuenta.height, 3 - Math.floor(t / 1000), (t % 1000) / 1000, dpr);
        requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
  }

  function dibujarLider(ctx, w, h, n, f, dpr) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.34;
    ctx.fillStyle = '#cdbfa4';
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, Math.hypot(w, h), -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#9b8c72';
    ctx.fill();
    ctx.strokeStyle = '#2b2226';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.stroke();
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#231a1e';
    ctx.font = `800 ${Math.round(R * 1.15)}px Archivo, "Arial Narrow", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), cx, cy + R * 0.06);
    ctx.fillStyle = 'rgba(35, 26, 30, 0.55)';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, (Math.random() * 1.6 + 0.4) * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    if (Math.random() < 0.35) ctx.fillRect(Math.random() * w, 0, dpr, h);
    const v = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, Math.hypot(w, h) / 2);
    v.addColorStop(0, 'rgba(20, 12, 16, 0)');
    v.addColorStop(1, 'rgba(20, 12, 16, 0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }

  /* ---------- Tiempo, capítulos y guion ---------- */
  function actualizarTiempo(t) {
    const p = duracion ? Math.min(1, Math.max(0, t / duracion)) : 0;
    avance.style.transform = `scaleX(${p})`;
    carril.style.transform = `translateX(${p * 100}%)`;
    if (!arrastrando) posicion.value = String(t);
    tActual.textContent = fmt(t);
    const cap = capituloEn(t);
    posicion.setAttribute('aria-valuetext', `${fmtLargo(t)} de ${fmtLargo(duracion)}${cap ? `. ${cap.titulo}` : ''}`);
    if (cap && cap !== ultimoCap) {
      ultimoCap = cap;
      capActual.replaceChildren(el('strong', null, `${dos(cap.n)} · ${cap.titulo}`), document.createTextNode(` · ${unir(cap.narran)}`));
      Object.entries(cuadros).forEach(([k, a]) => a.setAttribute('aria-current', String(Number(k) === cap.n)));
      // Lleva la tira del programa a la escena en pantalla, si nadie la está usando.
      const cinta = $('#cinta');
      const actual = cuadros[cap.n];
      if (cinta && actual && !cinta.matches(':hover, :focus-within')) {
        const izquierda = actual.parentElement.offsetLeft - parseFloat(getComputedStyle(cinta).paddingLeft || '0');
        cinta.scrollTo({ left: Math.max(0, izquierda), behavior: reducido() ? 'auto' : 'smooth' });
      }
    }
    marcarFrase(t);
    if (!pildora.hidden) pildoraTiempo.textContent = fmt(t);
  }

  function marcarFrase(t) {
    const cues = D.cues || [];
    let idx = -1;
    for (let i = 0; i < cues.length; i++) {
      if (t >= cues[i][0] && t < cues[i][1]) { idx = i; break; }
      if (cues[i][0] > t) break;
    }
    if (idx === fraseActual) return;
    if (frases[fraseActual]) frases[fraseActual].classList.remove('actual');
    if (frases[idx]) frases[idx].classList.add('actual');
    fraseActual = idx;
  }

  function actualizarCargado() {
    try {
      const b = video.buffered;
      if (!b.length || !duracion) return;
      cargado.style.transform = `scaleX(${Math.min(1, b.end(b.length - 1) / duracion)})`;
    } catch (e) { /* nada */ }
  }

  function iconoPlay(reproduciendo) {
    btnPlay.querySelector('use').setAttribute('href', reproduciendo ? '#i-pausa' : '#i-play');
    btnPlay.setAttribute('aria-label', reproduciendo ? 'Pausar' : 'Reproducir');
    btnPlay.title = reproduciendo ? 'Pausar (K)' : 'Reproducir (K)';
  }

  function actualizarVolumen() {
    const mudo = video.muted || video.volume === 0;
    btnMudo.setAttribute('aria-pressed', String(mudo));
    btnMudo.setAttribute('aria-label', mudo ? 'Activar sonido' : 'Silenciar');
    btnMudo.querySelector('use').setAttribute('href', mudo ? '#i-mudo' : '#i-volumen');
    volumen.value = String(mudo ? 0 : video.volume);
    volumen.style.setProperty('--vol', `${mudo ? 0 : video.volume * 100}%`);
  }

  function alternarPantalla() {
    if (enPantallaCompleta()) {
      const salir = document.exitFullscreen || document.webkitExitFullscreen;
      if (salir) salir.call(document);
      return;
    }
    if (pantalla.requestFullscreen) pantalla.requestFullscreen().catch(() => {});
    else if (pantalla.webkitRequestFullscreen) pantalla.webkitRequestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  }

  function iconoPantalla() {
    const en = enPantallaCompleta();
    btnPantalla.querySelector('use').setAttribute('href', en ? '#i-salir' : '#i-pantalla');
    btnPantalla.setAttribute('aria-label', en ? 'Salir de pantalla completa' : 'Pantalla completa');
    actualizarPildora();
    if (!en) requestAnimationFrame(medirTelon);
  }

  /* ---------- Ocultar controles mientras se ve la película ---------- */
  let temporizador = 0;
  function programarInactividad() {
    clearTimeout(temporizador);
    pantalla.classList.remove('inactiva');
    if (estado !== 'funcion' || video.paused) return;
    temporizador = setTimeout(() => {
      if (!video.paused && !controles.matches(':focus-within')) pantalla.classList.add('inactiva');
    }, 2600);
  }

  /* ---------- Resplandor ambiental: el color de la película ilumina la sala ---------- */
  const ambIzq = $('#amb-izq');
  const ambDer = $('#amb-der');
  let ambienteId = 0;
  let lienzo = null;
  let ctxAmb = null;
  let ambienteRoto = false;

  function promedio(d, x0, x1) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = 0; y < 18; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * 32 + x) * 4;
        r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
      }
    }
    r /= n; g /= n; b /= n;
    const gris = (r + g + b) / 3;
    const k = Math.min(2.4, 190 / (Math.max(r, g, b) || 1));
    const realzar = (c) => Math.round(Math.min(255, Math.max(0, (c + (c - gris) * 0.7) * k)));
    return `rgb(${realzar(r)} ${realzar(g)} ${realzar(b)} / 0.55)`;
  }

  function iniciarAmbiente() {
    if (ambienteRoto || ambienteId) return;
    if (!lienzo) {
      lienzo = document.createElement('canvas');
      lienzo.width = 32; lienzo.height = 18;
      ctxAmb = lienzo.getContext('2d', { willReadFrequently: true });
    }
    const tick = () => {
      ambienteId = 0;
      if (video.paused || video.ended || !ctxAmb) return;
      try {
        ctxAmb.drawImage(video, 0, 0, 32, 18);
        const d = ctxAmb.getImageData(0, 0, 32, 18).data;
        ambIzq.style.backgroundColor = promedio(d, 0, 11);
        ambDer.style.backgroundColor = promedio(d, 21, 32);
      } catch (e) {
        ambienteRoto = true; // p. ej. al abrir el archivo directo (file://)
        return;
      }
      ambienteId = setTimeout(tick, 320);
    };
    tick();
  }
  function detenerAmbiente() { clearTimeout(ambienteId); ambienteId = 0; }

  /* ---------- Avisos ---------- */
  function mostrarAviso(texto, accion) {
    aviso.replaceChildren(document.createTextNode(texto));
    if (accion) {
      const b = el('button', 'boton-funcion boton-funcion--chico', accion.texto);
      b.type = 'button';
      b.addEventListener('click', () => { ocultarAviso(); accion.fn(); });
      aviso.append(b);
    }
    aviso.hidden = false;
  }
  function ocultarAviso() { aviso.hidden = true; }

  function mostrarErrorVideo() {
    sinVideo = true;
    cargando.hidden = true;
    const ruta = 'video/el-precio-de-una-mentira.mp4';
    mostrarAviso(`No encontramos la película (${ruta}). Revisa que el archivo esté subido junto a esta página.`);
    const nota = $('.portada__nota');
    if (nota) nota.textContent = 'Falta el archivo de video en el repositorio.';
  }

  /* ---------- Píldora "En función" cuando sales de la sala ---------- */
  function actualizarPildora() {
    const mostrar = estado === 'funcion' && !salaVisible && !enPantallaCompleta();
    pildora.hidden = !mostrar;
    if (mostrar) {
      pildoraTiempo.textContent = fmt(video.currentTime);
      pildoraPausa.textContent = video.paused ? 'Seguir' : 'Pausar';
    }
  }

  function prepararSala() {
    if (!video || !sala) return;
    video.removeAttribute('controls');
    tTotal.textContent = fmt(duracion);
    posicion.max = String(duracion);
    posicion.step = '1';
    dibujarMarcas();
    medirTelon();
    actualizarVolumen();

    $('#comenzar').addEventListener('click', () => iniciarFuncion({ desde: 0, conCuenta: true }));
    $('#otra-vez').addEventListener('click', () => iniciarFuncion({ desde: 0, conCuenta: true }));
    btnPlay.addEventListener('click', alternar);
    marco.addEventListener('click', () => { if (estado === 'funcion') alternar(); });
    marco.addEventListener('dblclick', () => { if (estado === 'funcion') alternarPantalla(); });
    btnPantalla.addEventListener('click', alternarPantalla);
    btnMudo.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) video.volume = 0.7;
    });
    volumen.addEventListener('input', () => {
      video.volume = Number(volumen.value);
      video.muted = Number(volumen.value) === 0;
    });
    btnLuces.addEventListener('click', () => {
      lucesManual = true;
      apagarLuces(!html.classList.contains('luces-apagadas'));
    });

    // Línea de tiempo
    posicion.addEventListener('input', () => {
      arrastrando = true;
      const t = Number(posicion.value);
      actualizarTiempo(t);
      try { video.currentTime = t; } catch (e) { /* nada */ }
    });
    posicion.addEventListener('change', () => { arrastrando = false; });
    posicion.addEventListener('pointerup', () => { arrastrando = false; });
    posicion.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const d = e.key === 'ArrowLeft' ? -5 : 5;
        const t = Math.min(duracion, Math.max(0, video.currentTime + d));
        video.currentTime = t;
        actualizarTiempo(t);
      }
    });
    linea.addEventListener('pointermove', (e) => {
      const r = linea.getBoundingClientRect();
      const x = Math.min(Math.max(0, e.clientX - r.left), r.width);
      const t = (x / r.width) * duracion;
      const cap = capituloEn(t);
      globo.replaceChildren(el('b', null, cap ? cap.titulo : ''), document.createTextNode(` · ${fmt(t)}`));
      globo.hidden = false;
      const mitad = globo.offsetWidth / 2;
      globo.style.left = `${Math.min(Math.max(x, mitad), r.width - mitad)}px`;
    });
    linea.addEventListener('pointerleave', () => { globo.hidden = true; });

    // Eventos del video
    video.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        duracion = video.duration;
        posicion.max = String(duracion);
        tTotal.textContent = fmt(duracion);
        dibujarMarcas();
      }
    });
    video.addEventListener('play', () => {
      if (estado !== 'funcion') return;
      sala.classList.add('reproduciendo');
      iconoPlay(true);
      programarInactividad();
      iniciarAmbiente();
      actualizarPildora();
    });
    video.addEventListener('pause', () => {
      sala.classList.remove('reproduciendo');
      iconoPlay(false);
      clearTimeout(temporizador);
      pantalla.classList.remove('inactiva');
      detenerAmbiente();
      actualizarPildora();
    });
    video.addEventListener('timeupdate', () => { if (!arrastrando && estado !== 'cerrado') actualizarTiempo(video.currentTime); });
    video.addEventListener('progress', actualizarCargado);
    video.addEventListener('waiting', () => { if (estado === 'funcion') cargando.hidden = false; });
    ['playing', 'canplay', 'seeked', 'pause'].forEach((ev) => video.addEventListener(ev, () => { cargando.hidden = true; }));
    video.addEventListener('ended', terminarFuncion);
    video.addEventListener('volumechange', actualizarVolumen);
    if (fuente) fuente.addEventListener('error', mostrarErrorVideo);
    video.addEventListener('error', () => { if (video.error) mostrarErrorVideo(); });

    pantalla.addEventListener('pointermove', programarInactividad);
    pantalla.addEventListener('focusin', programarInactividad);
    pantalla.addEventListener('pointerleave', () => {
      if (estado === 'funcion' && !video.paused && !controles.matches(':focus-within')) pantalla.classList.add('inactiva');
    });

    document.addEventListener('fullscreenchange', iconoPantalla);
    document.addEventListener('webkitfullscreenchange', iconoPantalla);

    pildoraPausa.addEventListener('click', () => { if (video.paused) reproducir(); else video.pause(); actualizarPildora(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        salaVisible = e.intersectionRatio > 0.3;
        actualizarPildora();
      }, { threshold: [0, 0.3, 0.6] }).observe(sala);
    }

    // Atajos de teclado (cuando la sala está a la vista o en pantalla completa)
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!salaVisible && !enPantallaCompleta()) return;
      const objetivo = e.target instanceof Element ? e.target : document.body;
      const enCampo = objetivo.closest('textarea, select, [contenteditable="true"], input:not(#posicion)');
      if (enCampo) return;
      const enBoton = objetivo.closest('button, a, summary');
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if ((k === ' ' && !enBoton) || k === 'k') { e.preventDefault(); alternar(); }
      else if (k === 'f' && estado !== 'cerrado') { e.preventDefault(); alternarPantalla(); }
      else if (k === 'm') { video.muted = !video.muted; }
      else if (k === 'l') { lucesManual = true; apagarLuces(!html.classList.contains('luces-apagadas')); }
      else if ((k === 'ArrowLeft' || k === 'ArrowRight') && estado === 'funcion' && objetivo !== posicion) {
        e.preventDefault();
        const t = Math.min(duracion, Math.max(0, video.currentTime + (k === 'ArrowLeft' ? -5 : 5)));
        video.currentTime = t;
        actualizarTiempo(t);
        programarInactividad();
      }
    });

    // Boleto: se corta el talón y empieza la función
    const cortar = $('#cortar');
    const boleto = $('#boleto');
    if (cortar && boleto) {
      cortar.addEventListener('click', async (e) => {
        e.preventDefault();
        desbloquear();
        boleto.classList.add('cortado');
        await esperar(reducido() ? 0 : 520);
        sala.scrollIntoView({ behavior: reducido() ? 'auto' : 'smooth', block: 'start' });
        await esperar(reducido() ? 0 : 750);
        if (estado === 'cerrado' || estado === 'fin') iniciarFuncion({ desde: 0, conCuenta: true });
        setTimeout(() => boleto.classList.remove('cortado'), 6000);
      });
    }

    // Cualquier enlace con data-t salta a ese momento de la película
    document.addEventListener('click', (e) => {
      const a = e.target instanceof Element ? e.target.closest('[data-t]') : null;
      if (!a) return;
      e.preventDefault();
      irA(Number(a.dataset.t) || 0);
    });
  }

  /* =====================================================================
     3. PROGRAMA DE MANO Y GUION
     ===================================================================== */
  function crearCinta() {
    const ol = $('#cinta');
    if (!ol) return;
    capitulos.forEach((cap) => {
      const li = el('li');
      const a = el('a', 'cuadro');
      a.href = '#sala';
      a.dataset.t = String(cap.inicio);
      const foto = el('div', 'fotograma');
      const ventana = el('div', 'fotograma__ventana');
      const img = el('img');
      img.src = cap.img;
      img.alt = '';
      img.width = 640;
      img.height = 360;
      img.loading = 'lazy';
      img.decoding = 'async';
      ventana.append(img, el('span', 'fotograma__num', dos(cap.n)), el('span', 'fotograma__ahora', 'En pantalla'));
      foto.append(ventana);
      const pie = el('div', 'pie-fotograma');
      pie.append(
        el('p', 'pie-fotograma__titulo', cap.titulo),
        el('p', 'pie-fotograma__meta', `${fmt(cap.inicio)} · ${unir(cap.narran)}`),
        el('p', 'pie-fotograma__resumen', cap.resumen),
      );
      a.append(foto, pie);
      li.append(a);
      ol.append(li);
      cuadros[cap.n] = a;
    });

    const atras = $('#cinta-atras');
    const adelante = $('#cinta-adelante');
    const desplazar = (dir) => ol.scrollBy({ left: dir * ol.clientWidth * 0.8, behavior: reducido() ? 'auto' : 'smooth' });
    const flechas = () => {
      atras.disabled = ol.scrollLeft < 8;
      adelante.disabled = ol.scrollLeft + ol.clientWidth > ol.scrollWidth - 8;
    };
    atras.addEventListener('click', () => desplazar(-1));
    adelante.addEventListener('click', () => desplazar(1));
    ol.addEventListener('scroll', flechas, { passive: true });
    window.addEventListener('resize', debounce(flechas, 150));
    flechas();
  }

  function crearGuion() {
    const cont = $('#guion-texto');
    if (!cont) return;
    const cues = D.cues || [];
    const frag = document.createDocumentFragment();
    capitulos.forEach((cap) => {
      const det = el('details', 'escena-guion');
      const sum = el('summary');
      const cab = el('span');
      cab.append(el('span', 'escena-guion__titulo', cap.titulo), el('span', 'escena-guion__meta', `${fmt(cap.inicio)} · ${unir(cap.narran)}`));
      sum.append(el('span', 'escena-guion__num', dos(cap.n)), cab);
      det.append(sum);
      const cuerpo = el('div', 'escena-guion__cuerpo');
      let parrafo = null;
      let quien = null;
      cues.forEach(([ini, , texto, narra], i) => {
        if (ini < cap.inicio || ini >= cap.fin) return;
        if (!parrafo || narra !== quien) {
          quien = narra;
          parrafo = el('p', 'parlamento');
          parrafo.append(el('span', 'parlamento__quien', narra));
          cuerpo.append(parrafo);
        }
        const a = el('a', 'frase', texto);
        a.href = '#sala';
        a.dataset.t = String(ini);
        a.title = `Ver en ${fmt(ini)}`;
        frases[i] = a;
        parrafo.append(a, ' ');
      });
      det.append(cuerpo);
      frag.append(det);
    });
    cont.replaceChildren(frag);

    const btn = $('#guion-todo');
    if (btn) {
      btn.addEventListener('click', () => {
        const abrir = btn.getAttribute('aria-expanded') !== 'true';
        $$('.escena-guion', cont).forEach((d) => { d.open = abrir; });
        btn.setAttribute('aria-expanded', String(abrir));
        btn.textContent = abrir ? 'Cerrar todas las escenas' : 'Abrir todas las escenas';
      });
    }
  }

  function revelar() {
    const elementos = $$('.aparecer');
    if (!('IntersectionObserver' in window) || reducido()) {
      elementos.forEach((e) => e.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    elementos.forEach((e) => io.observe(e));
  }

  /* =====================================================================
     ARRANQUE
     ===================================================================== */
  function iniciar() {
    partirTablero();
    crearCinta();
    crearGuion();
    prepararSala();
    revelar();
    const conFuentes = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, esperar(900)]) : esperar(300);
    // La guirnalda y los focos se miden cuando ya cargaron las fuentes (cambian el ancho del menú y la marquesina).
    conFuentes.then(() => { crearFocos(false); crearGuirnalda(false); medirTelon(); });
    let anchoPrevio = window.innerWidth;
    window.addEventListener('resize', debounce(() => {
      // En celular la barra del navegador cambia el alto al hacer scroll: solo rehacer si cambia el ancho.
      if (window.innerWidth === anchoPrevio) { medirTelon(); return; }
      anchoPrevio = window.innerWidth;
      crearFocos(true);
      crearGuirnalda(true);
      medirTelon();
    }, 180));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
