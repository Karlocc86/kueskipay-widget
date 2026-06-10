// KueskiPay – Floating Action Button (Content Script)
// Shadow DOM isolation · Drag to reposition · Persiste en chrome.storage.local
// El drawer se abre hacia abajo cuando el FAB está en la parte alta del lateral
// y hacia arriba cuando está abajo, emergiendo desde la esquina del propio FAB.

(function () {
  'use strict';

  if (document.getElementById('kpay-fab-root')) return;

  // ─── Context validity guard ──────────────────────────────────────────────────
  function isContextValid() {
    try { chrome.runtime.getURL(''); return true; } catch { return false; }
  }

  // Devuelve la URL de un recurso de la extensión sin romper el script si el
  // contexto se invalidó (p. ej. al recargar la extensión durante el desarrollo).
  function assetUrl(path) {
    try { return chrome.runtime.getURL(path); } catch { return ''; }
  }

  const PRIMARY      = '#0d8a7a';
  const PRIMARY_DARK = '#085041';
  const PRIMARY_LITE = '#16b89f';
  const STORAGE_POS  = 'kpay_fab_position';

  const FAB_SIZE = 56;
  const DRAWER_W = 300;
  const MARGIN   = 14; // margen mínimo contra los bordes del viewport

  // ─── Shadow host ────────────────────────────────────────────────────────────
  const host = document.createElement('div');
  host.id = 'kpay-fab-root';
  host.style.cssText = 'position:fixed;z-index:2147483647;top:0;left:0;width:0;height:0;pointer-events:none;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // ─── Styles (todo dentro del shadow) ─────────────────────────────────────────
  const fontUrl = assetUrl('jakarta.woff2');   // '' si el contexto se invalidó
  const style = document.createElement('style');
  style.textContent = `
    ${fontUrl ? `@font-face {
      font-family: 'Kueski Sans';
      src: url('${fontUrl}') format('woff2');
      font-weight: 200 800;
      font-display: swap;
    }` : ''}

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host {
      --kp-primary:${PRIMARY};
      --kp-ink:#0e1b16;          /* texto principal */
      --kp-ink-soft:#5b6b66;     /* texto secundario */
      --kp-ink-mute:#93a39d;     /* texto terciario */
      --kp-line:#e4ece9;         /* líneas/bordes */
      --kp-surface:#ffffff;      /* superficie panel */
      --kp-surface-2:#f4f8f6;    /* superficie suave */
      --kp-font:'Kueski Sans','SF Pro Display','Segoe UI Variable','Segoe UI',system-ui,-apple-system,sans-serif;
    }

    /* ── FAB ── */
    .fab {
      position: fixed;
      width: ${FAB_SIZE}px;
      height: ${FAB_SIZE}px;
      border-radius: 50%;
      background:
        radial-gradient(120% 120% at 30% 22%, ${PRIMARY_LITE} 0%, ${PRIMARY} 46%, ${PRIMARY_DARK} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0.92;
      pointer-events: all;
      user-select: none;
      touch-action: none;
      border: none;
      outline: none;
      box-shadow:
        0 6px 18px rgba(8,80,65,0.36),
        0 2px 6px rgba(8,80,65,0.28),
        inset 0 1px 0 rgba(255,255,255,0.28);
      transition: opacity .2s ease, box-shadow .25s ease, transform .18s cubic-bezier(.34,1.56,.64,1);
      animation: kpFabIn .56s cubic-bezier(.34,1.56,.64,1) backwards;
    }
    .fab::after {                 /* halo de respiración */
      content: '';
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      border: 2px solid ${PRIMARY};
      opacity: 0;
      pointer-events: none;
    }
    .fab--pulse::after { animation: kpHalo 2.6s ease-out infinite; }
    .fab:hover {
      opacity: 1;
      transform: translateY(-2px) scale(1.05);
      box-shadow:
        0 12px 28px rgba(8,80,65,0.46),
        0 4px 10px rgba(8,80,65,0.32),
        inset 0 1px 0 rgba(255,255,255,0.32);
    }
    .fab:active { transform: scale(0.92); }
    .fab--dragging { cursor: grabbing; opacity: 1; animation: none; }

    .fab__img {
      width: 40px;
      height: 40px;
      object-fit: contain;
      display: block;
      pointer-events: none;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.18));
    }

    /* Badge → check de compatibilidad (visible solo si la tienda es compatible) */
    .fab__badge {
      position: absolute;
      top: -2px; right: -2px;
      width: 19px; height: 19px;
      border-radius: 50%;
      background: #fff; color: ${PRIMARY_DARK};
      display: grid; place-items: center;
      transform: scale(0);
      transition: transform .3s cubic-bezier(.34,1.56,.64,1);
      box-shadow: 0 2px 6px rgba(6,42,35,0.28);
    }
    .fab__badge svg { width: 12px; height: 12px; display: block; }
    .fab__badge--on { transform: scale(1); }

    /* ── Estado: compatible vs no compatible ── */
    .fab--off { filter: grayscale(1) brightness(.97); opacity: .6; }
    .fab--off::after { animation: none !important; }   /* sin halo */
    .fab--off:hover { opacity: .82; }

    /* Foco de teclado visible (no en click de mouse) */
    .fab:focus-visible { outline: 3px solid rgba(13,138,122,.55); outline-offset: 3px; }

    /* ── Pestaña: replegado contra el borde anclado ── */
    .fab--peek.fab--dock-right { transform: translateX(20px); opacity: .55; }
    .fab--peek.fab--dock-left  { transform: translateX(-20px); opacity: .55; }
    .fab--peek::after { animation: none; }             /* sin halo replegado */
    /* (después de las reglas dock para ganar por orden de fuente) */
    .fab--peek:hover, .fab--peek:focus-visible {
      transform: translateY(-2px) scale(1.05); opacity: 1;
    }

    /* ── Globo lateral: etiqueta (hover) + nudge de producto unificados ── */
    .fab__bubble {
      position: absolute; top: 50%;
      --bx: 6px;
      transform: translateY(-50%) translateX(var(--bx));
      white-space: nowrap;
      font-family: var(--kp-font);
      font-size: 12px; font-weight: 700; letter-spacing: .1px;
      padding: 7px 11px; border-radius: 11px;
      background: var(--kp-surface); color: var(--kp-ink);
      box-shadow: 0 6px 20px rgba(6,42,35,.22), 0 0 0 1px rgba(14,27,22,.05);
      pointer-events: none; opacity: 0; z-index: 1;
      transition: opacity .2s ease, transform .25s cubic-bezier(.34,1.56,.64,1);
    }
    .fab__bubble::after {       /* caret hacia el FAB */
      content: ''; position: absolute; top: 50%;
      width: 9px; height: 9px; background: inherit;
      transform: translateY(-50%) rotate(45deg);
    }
    .fab--dock-right .fab__bubble { right: calc(100% + 12px); --bx: 6px; }
    .fab--dock-right .fab__bubble::after { right: -4px; }
    .fab--dock-left  .fab__bubble { left: calc(100% + 12px); --bx: -6px; }
    .fab--dock-left  .fab__bubble::after { left: -4px; }
    .fab__bubble--show { opacity: 1; transform: translateY(-50%) translateX(0); }
    .fab__bubble--nudge {
      background: linear-gradient(135deg, ${PRIMARY_LITE}, ${PRIMARY}); color: #fff;
      box-shadow: 0 8px 22px -4px rgba(13,138,122,.5);
    }

    /* ── Panel (claro minimalista) ── */
    .drawer {
      position: fixed;
      width: ${DRAWER_W}px;
      max-width: calc(100vw - ${MARGIN * 2}px);
      display: flex;
      flex-direction: column;
      background: var(--kp-surface);
      border-radius: 22px;
      box-shadow:
        0 28px 64px -14px rgba(6,42,35,0.28),
        0 10px 24px -10px rgba(6,42,35,0.14),
        0 0 0 1px rgba(14,27,22,0.05);
      pointer-events: none;
      opacity: 0;
      /* visibility saca el panel cerrado del orden de tabulación y del árbol de
         accesibilidad (opacity:0 solo lo oculta visualmente); el delay deja
         terminar la animación de salida antes de ocultarlo. */
      visibility: hidden;
      transform: scale(0.9) translateY(var(--kp-enter-ty, 8px));
      transform-origin: right bottom;   /* se sobrescribe en applyPos hacia el FAB */
      transition: opacity .22s ease, transform .4s cubic-bezier(.2,1,.3,1), visibility 0s linear .25s;
      font-family: var(--kp-font);
      font-feature-settings: "ss01" 1;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      color: var(--kp-ink);
      overflow: visible;                /* el beak vive fuera del borde */
    }
    .drawer--open {
      opacity: 1; transform: scale(1) translateY(0); pointer-events: all;
      visibility: visible;
      transition: opacity .22s ease, transform .4s cubic-bezier(.2,1,.3,1), visibility 0s;
    }

    /* Conector (beak) que ancla el panel al FAB */
    .drawer__beak {
      position: absolute; width: 0; height: 0; z-index: 2;
      left: 0; /* posición exacta la fija applyPos */
    }
    .drawer__beak--down {
      border-left: 9px solid transparent; border-right: 9px solid transparent;
      border-top: 10px solid var(--kp-surface);
      bottom: -9px;
      filter: drop-shadow(0 7px 5px rgba(6,42,35,0.10));
    }
    .drawer__beak--up {
      border-left: 9px solid transparent; border-right: 9px solid transparent;
      border-bottom: 10px solid var(--kp-surface);
      top: -9px;
      filter: drop-shadow(0 -5px 4px rgba(6,42,35,0.06));
    }

    /* clip interno para que el contenido respete el radio (overflow del panel es visible) */
    .drawer__clip {
      border-radius: 22px; overflow: hidden;
      display: flex; flex-direction: column;
      flex: 1 1 auto; min-height: 0;   /* permite que .drawer__body haga scroll */
    }

    /* reveal escalonado del contenido */
    .kp-reveal { opacity: 0; }
    .drawer--open .kp-reveal {
      animation: kpRise .46s cubic-bezier(.2,1,.3,1) both;
      animation-delay: calc(var(--i, 0) * 55ms);
    }

    /* SVG icons */
    .kp-ico { display: inline-flex; flex: 0 0 auto; }
    .kp-ico svg { display: block; }

    /* Header */
    .drawer__header {
      position: relative;
      display: flex; align-items: center; justify-content: space-between;
      padding: 15px 16px 13px;
    }
    .drawer__header::after {
      content: ''; position: absolute; left: 16px; right: 16px; bottom: 0; height: 1px;
      background: var(--kp-line);
    }
    .drawer__brand { display: flex; align-items: center; gap: 9px; }
    .drawer__brand-img { height: 22px; width: auto; object-fit: contain; }
    .drawer__live {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 9px; font-weight: 800; letter-spacing: .5px; text-transform: uppercase;
      color: ${PRIMARY_DARK};
      background: rgba(13,138,122,0.08);
      padding: 4px 9px; border-radius: 999px;
    }
    .drawer__live-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: ${PRIMARY}; box-shadow: 0 0 0 0 rgba(13,138,122,.6);
      animation: kpBadgePulse 2s ease-out infinite;
    }
    .drawer__close {
      width: 28px; height: 28px; display: grid; place-items: center;
      background: transparent; border: none; cursor: pointer;
      color: var(--kp-ink-mute); border-radius: 9px;
      transition: background .15s, color .15s, transform .25s cubic-bezier(.34,1.56,.64,1);
    }
    .drawer__close:hover { background: var(--kp-surface-2); color: var(--kp-ink); transform: rotate(90deg); }

    .drawer__body {
      padding: 14px 16px 4px;
      display: flex; flex-direction: column; gap: 13px;
      overflow-y: auto;
    }
    .drawer__body::-webkit-scrollbar { width: 6px; }
    .drawer__body::-webkit-scrollbar-thumb { background: rgba(13,138,122,.22); border-radius: 6px; }

    /* ── HERO de compatibilidad: responde "¿puedo pagar aquí?" ── */
    .drawer__hero {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 14px; border-radius: 16px;
      position: relative; overflow: hidden;
    }
    .drawer__hero-ico {
      width: 40px; height: 40px; border-radius: 12px;
      display: grid; place-items: center; flex: 0 0 auto;
    }
    .drawer__hero-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .drawer__hero-title {
      font-size: 14.5px; font-weight: 800; letter-spacing: -.2px; line-height: 1.15;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .drawer__hero-sub { font-size: 11.5px; font-weight: 500; line-height: 1.25; }

    .drawer__hero--ok {
      background: linear-gradient(135deg, rgba(22,184,159,0.12), rgba(13,138,122,0.05));
      box-shadow: inset 0 0 0 1px rgba(13,138,122,0.14);
    }
    .drawer__hero--ok .drawer__hero-ico {
      background: linear-gradient(135deg, ${PRIMARY_LITE}, ${PRIMARY});
      color: #fff; box-shadow: 0 6px 14px -4px rgba(13,138,122,0.5);
    }
    .drawer__hero--ok .drawer__hero-title { color: ${PRIMARY_DARK}; }
    .drawer__hero--ok .drawer__hero-sub { color: ${PRIMARY}; }

    .drawer__hero--no {
      background: var(--kp-surface-2);
      box-shadow: inset 0 0 0 1px var(--kp-line);
    }
    .drawer__hero--no .drawer__hero-ico { background: #eef2f1; color: #8a9b95; }
    .drawer__hero--no .drawer__hero-title { color: var(--kp-ink); }
    .drawer__hero--no .drawer__hero-sub { color: var(--kp-ink-soft); }

    /* ── Crédito disponible (claro) ── */
    .drawer__credit {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 4px 2px;
    }
    .drawer__credit-ico {
      width: 38px; height: 38px; border-radius: 11px; flex: 0 0 auto;
      display: grid; place-items: center;
      background: var(--kp-surface-2); color: ${PRIMARY};
      box-shadow: inset 0 0 0 1px var(--kp-line);
    }
    .drawer__credit-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .drawer__credit-lbl {
      font-size: 9.5px; font-weight: 800; letter-spacing: .8px; text-transform: uppercase;
      color: var(--kp-ink-mute);
    }
    .drawer__credit-figure { display: flex; align-items: baseline; gap: 6px; }
    .drawer__credit-val {
      font-size: 27px; font-weight: 800; line-height: 1; letter-spacing: -1px;
      color: var(--kp-ink); font-variant-numeric: tabular-nums;
    }
    .drawer__credit-cur { font-size: 11px; font-weight: 700; color: var(--kp-ink-soft); }
    .drawer__credit-name { font-size: 11.5px; font-weight: 600; color: var(--kp-ink-soft); margin-top: 1px; }

    .drawer__divider { height: 1px; background: var(--kp-line); margin: 1px 0; }

    /* ── Producto detectado ── */
    .drawer__product { padding: 2px; }
    .drawer__product-tag {
      font-size: 9px; font-weight: 800; letter-spacing: .7px; text-transform: uppercase;
      color: ${PRIMARY}; display: flex; align-items: center; gap: 5px; margin-bottom: 7px;
    }
    .drawer__product-name {
      font-size: 13px; font-weight: 700; color: var(--kp-ink); letter-spacing: -.1px;
      display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 8px;
    }
    .drawer__product-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .drawer__product-price {
      font-size: 18px; font-weight: 800; color: var(--kp-ink); letter-spacing: -.4px;
      font-variant-numeric: tabular-nums;
    }
    .drawer__product-quin {
      font-size: 11px; font-weight: 800; color: ${PRIMARY_DARK}; white-space: nowrap;
      background: rgba(13,138,122,.1); padding: 5px 10px; border-radius: 999px;
      display: inline-flex; align-items: center; gap: 5px;
    }

    /* ── Botones ── */
    .drawer__btn {
      position: relative;
      width: 100%; padding: 13px 0;
      border-radius: 13px; border: none; cursor: pointer;
      font-size: 13.5px; font-weight: 800; font-family: inherit; letter-spacing: .1px;
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease, background .15s ease;
      overflow: hidden;
    }
    .drawer__btn--primary {
      color: #fff;
      background: linear-gradient(135deg, ${PRIMARY_LITE} 0%, ${PRIMARY} 62%, ${PRIMARY_DARK} 100%);
      box-shadow: 0 8px 18px -5px rgba(13,138,122,0.5), inset 0 1px 0 rgba(255,255,255,0.22);
    }
    .drawer__btn--primary::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.28) 50%, transparent 65%);
      transform: translateX(-120%); transition: transform .55s ease;
    }
    .drawer__btn--primary:hover { transform: translateY(-2px); box-shadow: 0 13px 26px -7px rgba(13,138,122,0.58), inset 0 1px 0 rgba(255,255,255,0.22); }
    .drawer__btn--primary:hover::after { transform: translateX(120%); }
    .drawer__btn--primary:active { transform: translateY(0) scale(.985); }
    .drawer__btn--ghost {
      background: var(--kp-surface-2); color: ${PRIMARY_DARK};
      box-shadow: inset 0 0 0 1px var(--kp-line);
    }
    .drawer__btn--ghost:hover { background: #eef5f3; transform: translateY(-1px); }

    /* ── Footer ── */
    .drawer__footer { padding: 8px 16px 14px; }
    .drawer__footer-btn {
      width: 100%; background: none; border: none; cursor: pointer;
      font-size: 12px; font-weight: 700; color: var(--kp-ink-mute);
      font-family: inherit; padding: 8px 0; border-radius: 9px;
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      transition: color .15s, background .15s;
    }
    .drawer__footer-btn:hover { color: ${PRIMARY}; background: var(--kp-surface-2); }
    .drawer__footer-btn svg { transition: transform .2s ease; }
    .drawer__footer-btn:hover svg { transform: translateX(3px); }

    /* ── Keyframes ── */
    @keyframes kpFabIn {
      0%   { opacity: 0; transform: scale(0) rotate(-25deg); }
      70%  { opacity: 1; transform: scale(1.12) rotate(4deg); }
      100% { opacity: .92; transform: scale(1) rotate(0); }
    }
    @keyframes kpHalo {
      0%   { opacity: .5; transform: scale(1); }
      100% { opacity: 0;  transform: scale(1.6); }
    }
    @keyframes kpBadgePulse {
      0%   { box-shadow: 0 0 0 0 rgba(13,138,122,.55); }
      70%  { box-shadow: 0 0 0 7px rgba(13,138,122,0); }
      100% { box-shadow: 0 0 0 0 rgba(13,138,122,0); }
    }
    @keyframes kpRise {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .fab, .drawer, .fab__badge, .fab__bubble { animation: none !important; transition: opacity .15s ease !important; }
      .drawer { transform: none; }
      .kp-reveal { opacity: 1 !important; animation: none !important; }
    }
  `;
  shadow.appendChild(style);

  // ─── Elementos ────────────────────────────────────────────────────────────────
  const fab = document.createElement('div');
  fab.className = 'fab fab--pulse';
  fab.setAttribute('role', 'button');
  fab.setAttribute('aria-label', 'KueskiPay');
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('tabindex', '0');   // enfocable por teclado

  const fabImg = document.createElement('img');
  fabImg.className = 'fab__img';
  fabImg.alt = 'KueskiPay';
  const logoUrl = assetUrl('kueskilogo.png');   // '' si el contexto se invalidó
  if (logoUrl) fabImg.src = logoUrl;
  fab.appendChild(fabImg);

  // Badge con check (SVG inline; no usa icon() para evitar TDZ de ICONS en este punto).
  const fabBadge = document.createElement('span');
  fabBadge.className = 'fab__badge';
  fabBadge.setAttribute('aria-hidden', 'true');
  fabBadge.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  fab.appendChild(fabBadge);

  // Globo lateral: etiqueta al hover + nudge de producto (decorativo).
  const fabBubble = document.createElement('span');
  fabBubble.className = 'fab__bubble';
  fabBubble.setAttribute('aria-hidden', 'true');
  fab.appendChild(fabBubble);

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Panel de KueskiPay');

  // Estructura persistente: beak (conector) + clip (contenedor recortado al radio).
  // renderDrawer rellena `clip`, no `drawer`, para no borrar el beak.
  const beak = document.createElement('span');
  beak.className = 'drawer__beak drawer__beak--down';
  const clip = document.createElement('div');
  clip.className = 'drawer__clip';
  drawer.append(beak, clip);

  shadow.appendChild(fab);
  shadow.appendChild(drawer);

  // ─── Auto-cleanup ────────────────────────────────────────────────────────────
  try { chrome.runtime.onConnect.addListener(() => {}); } catch {}
  // 'unload' está bloqueado por Permissions-Policy en muchas páginas (ej. Google).
  // 'pagehide' es el reemplazo moderno y es compatible con bfcache.
  window.addEventListener('pagehide', () => host.remove());

  // ─── Posicionamiento ──────────────────────────────────────────────────────────
  // El FAB se ancla por bottom/right; el drawer se coloca con coordenadas
  // absolutas calculadas desde la geometría del FAB.
  let fabPos = { bottom: 24, right: 20 };

  // Ancho/alto del viewport SIN la barra de scroll. position:fixed se mide contra
  // este área, no contra window.innerWidth (que incluye el scrollbar ~17px).
  // Usar innerWidth hacía que el FAB se recortara al pegarse a la izquierda.
  function vpW() { return document.documentElement.clientWidth  || window.innerWidth; }
  function vpH() { return document.documentElement.clientHeight || window.innerHeight; }

  const GAP = 12;   // separación panel ↔ FAB: el FAB nunca queda cubierto

  function applyPos() {
    const vw = vpW();
    const vh = vpH();

    // La posición guardada pudo capturarse en una ventana más grande (o la
    // ventana se encogió): sin clamp el FAB puede quedar fuera del viewport.
    fabPos.right  = clamp(fabPos.right,  MARGIN, Math.max(MARGIN, vw - FAB_SIZE - MARGIN));
    fabPos.bottom = clamp(fabPos.bottom, MARGIN, Math.max(MARGIN, vh - FAB_SIZE - MARGIN));

    fab.style.bottom = fabPos.bottom + 'px';
    fab.style.right  = fabPos.right  + 'px';

    const fabLeft = vw - fabPos.right - FAB_SIZE;
    const fabTop  = vh - fabPos.bottom - FAB_SIZE;
    const fabCenterX = fabLeft + FAB_SIZE / 2;
    const fabCenterY = fabTop + FAB_SIZE / 2;

    const drawerW = Math.min(DRAWER_W, vw - MARGIN * 2);

    // Vertical: el panel se coloca arriba o abajo del FAB, dejándolo visible.
    const openDown = fabCenterY < vh / 2;
    if (openDown) {
      const top = fabTop + FAB_SIZE + GAP;          // panel debajo del FAB
      drawer.style.top = top + 'px';
      drawer.style.bottom = 'auto';
      drawer.style.maxHeight = (vh - top - MARGIN) + 'px';
      drawer.style.setProperty('--kp-enter-ty', '-8px');
    } else {
      const bottom = fabPos.bottom + FAB_SIZE + GAP; // panel encima del FAB
      drawer.style.bottom = bottom + 'px';
      drawer.style.top = 'auto';
      drawer.style.maxHeight = (vh - bottom - MARGIN) + 'px';
      drawer.style.setProperty('--kp-enter-ty', '8px');
    }

    // Horizontal: alinear el borde cercano al FAB, sin salir del viewport.
    const isLeftSide = fabCenterX < vw / 2;
    // Lado de anclaje del FAB → dirige el repliegue (peek) y el lado del bubble.
    fab.classList.toggle('fab--dock-left', isLeftSide);
    fab.classList.toggle('fab--dock-right', !isLeftSide);
    let left = isLeftSide ? fabLeft : (fabLeft + FAB_SIZE - drawerW);
    left = Math.max(MARGIN, Math.min(left, vw - drawerW - MARGIN));
    drawer.style.left = left + 'px';
    drawer.style.right = 'auto';
    drawer.style.width = drawerW + 'px';

    // El panel "nace" desde la esquina del FAB (transform-origin hacia él).
    drawer.style.transformOrigin = `${isLeftSide ? 'left' : 'right'} ${openDown ? 'top' : 'bottom'}`;

    // Beak: conector que apunta al centro del FAB desde el borde más cercano.
    const beakX = Math.max(20, Math.min(fabCenterX - left, drawerW - 20));
    beak.style.left = (beakX - 9) + 'px';
    beak.className = 'drawer__beak ' + (openDown ? 'drawer__beak--up' : 'drawer__beak--down');
  }

  if (isContextValid()) {
    chrome.storage.local.get([STORAGE_POS], (res) => {
      const p = res[STORAGE_POS];
      if (p && typeof p.right === 'number' && typeof p.bottom === 'number') fabPos = p;
      applyPos();
    });
  } else {
    applyPos();
  }

  window.addEventListener('resize', applyPos);

  // ─── Drag ───────────────────────────────────────────────────────────────────
  // Durante el arrastre el FAB persigue al cursor con LERP (trailing amigable).
  // Al soltar: el destino se calcula desde la posición REAL del cursor (no la
  // posición rezagada rPos) para que al soltar rápido siempre vaya al lado correcto.
  // La animación del snap usa un resorte amortiguado vía rAF puro.

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LERP_K = 0.20;   // trailing del drag (0=nunca alcanza, 1=instantáneo)

  let isDragging   = false;
  let dragMoved    = false;
  let drag0        = {};
  let rafId        = null;
  let lastCursorX  = 0;
  // rPos: posición visual rezagada. rTarget: donde está el cursor. rVel: velocidad del LERP.
  let rPos    = { right: 0, bottom: 0 };
  let rTarget = { right: 0, bottom: 0 };
  let rVel    = { right: 0, bottom: 0 };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Elonga el FAB en la dirección del movimiento (efecto chicle durante el drag).
  function applySquish(vr, vb) {
    if (reduceMotion) return;
    const speed = Math.hypot(vr, vb);
    if (speed < 0.5) { fab.style.transform = ''; fab.style.filter = ''; return; }
    const angle   = Math.atan2(-vb, -vr);
    const stretch = Math.min(0.28, speed * 0.012);
    const sx      = 1 + stretch;
    const sy      = 1 - stretch * 0.55;
    const deg     = angle * 180 / Math.PI;
    fab.style.transform = `scale(1.08) rotate(${deg}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)}) rotate(${(-deg).toFixed(2)}deg)`;
    const blur = Math.min(3.5, speed * 0.10);
    fab.style.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : '';
  }

  // LERP trailing solo durante el drag — el snap usa CSS transition (más simple y confiable).
  function animLoop() {
    if (!isDragging) return;
    const prevR = rPos.right, prevB = rPos.bottom;
    rPos.right  += (rTarget.right  - rPos.right)  * LERP_K;
    rPos.bottom += (rTarget.bottom - rPos.bottom) * LERP_K;
    rVel.right  = rPos.right  - prevR;
    rVel.bottom = rPos.bottom - prevB;
    fabPos.right  = rPos.right;
    fabPos.bottom = rPos.bottom;
    applyPos();
    applySquish(rVel.right, rVel.bottom);
    rafId = requestAnimationFrame(animLoop);
  }

  fab.addEventListener('pointerdown', (e) => {
    isDragging  = true;
    dragMoved   = false;
    lastCursorX = e.clientX;
    e.preventDefault();
    expandFab();        // arrastrar siempre expande el FAB
    hideBubble();
    cancelAnimationFrame(rafId);
    fab.style.transition = 'none';
    fab.classList.add('fab--dragging');
    drag0   = { x: e.clientX, y: e.clientY, r: fabPos.right, b: fabPos.bottom };
    rPos    = { right: fabPos.right, bottom: fabPos.bottom };
    rTarget = { right: fabPos.right, bottom: fabPos.bottom };
    rVel    = { right: 0, bottom: 0 };
    fab.setPointerCapture(e.pointerId);
    if (!reduceMotion) rafId = requestAnimationFrame(animLoop);
  });

  fab.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    if (!isContextValid()) { host.remove(); return; }
    lastCursorX = e.clientX;
    const dx = drag0.x - e.clientX;
    const dy = drag0.y - e.clientY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
    if (dragMoved && isOpen) closeDrawer();
    const nr = clamp(drag0.r + dx, MARGIN, vpW() - FAB_SIZE - MARGIN);
    const nb = clamp(drag0.b + dy, MARGIN, vpH() - FAB_SIZE - MARGIN);
    if (reduceMotion) {
      fabPos.right = nr; fabPos.bottom = nb; applyPos();
    } else {
      rTarget.right  = nr;
      rTarget.bottom = nb;
    }
  });

  fab.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;
    cancelAnimationFrame(rafId);
    fab.classList.remove('fab--dragging');
    fab.style.transform = '';
    fab.style.filter    = '';
    schedulePeek();     // reanuda el ciclo de repliegue (open/expand lo cancelan)
    if (!isContextValid()) { host.remove(); return; }

    if (!dragMoved) {
      fab.style.transition = '';
      toggleDrawer();
      return;
    }

    // Destino: lateral más cercano según la posición REAL del cursor.
    // vpW() excluye el scrollbar → el FAB queda con MARGIN real, sin recortarse.
    const targetR = lastCursorX < vpW() / 2
      ? vpW() - FAB_SIZE - MARGIN   // mitad izquierda → borde izquierdo
      : MARGIN;                     // mitad derecha  → borde derecho
    // fabPos.bottom es la posición vertical REAL (válida con o sin reduceMotion).
    const targetB = clamp(fabPos.bottom, MARGIN, vpH() - FAB_SIZE - MARGIN);

    fabPos.right  = targetR;
    fabPos.bottom = targetB;

    if (reduceMotion) {
      fab.style.transition = '';
      applyPos();
    } else {
      // Animación opcional hacia el borde (se omite con prefers-reduced-motion).
      fab.style.transition = 'right 0.4s cubic-bezier(0.34,1.56,0.64,1), bottom 0.4s cubic-bezier(0.34,1.56,0.64,1)';
      void fab.offsetWidth;
      applyPos();
      fab.addEventListener('transitionend', () => { fab.style.transition = ''; }, { once: true });
    }

    chrome.storage.local.set({ [STORAGE_POS]: { right: targetR, bottom: targetB } });
  });

  // El navegador puede cancelar el drag (scroll táctil, pérdida de puntero…):
  // sin esta limpieza isDragging queda en true, el rAF sigue corriendo y el FAB
  // se queda congelado con transition:none y la clase fab--dragging.
  fab.addEventListener('pointercancel', () => {
    if (!isDragging) return;
    isDragging = false;
    cancelAnimationFrame(rafId);
    fab.classList.remove('fab--dragging');
    fab.style.transform  = '';
    fab.style.filter     = '';
    fab.style.transition = '';
    schedulePeek();
  });

  // ─── Apertura / cierre del drawer ─────────────────────────────────────────────
  let isOpen = false;

  function openDrawer() {
    isOpen = true;
    fab.setAttribute('aria-expanded', 'true');
    fab.classList.remove('fab--pulse');
    expandFab();        // el FAB nunca queda replegado con el panel abierto
    hideBubble();
    // Espera a que el contenido esté construido para evitar un parpadeo vacío.
    // Se re-verifica isOpen: un segundo click pudo cerrar el drawer mientras
    // el render asíncrono seguía pendiente.
    renderDrawer(() => requestAnimationFrame(() => {
      if (isOpen) drawer.classList.add('drawer--open');
    }));
  }

  function closeDrawer() {
    isOpen = false;
    fab.setAttribute('aria-expanded', 'false');
    if (isCompat()) fab.classList.add('fab--pulse');
    drawer.classList.remove('drawer--open');
    schedulePeek();     // reanuda el repliegue tras cerrar
  }

  function toggleDrawer() {
    isOpen ? closeDrawer() : openDrawer();
  }

  // Click fuera del host cierra el drawer.
  document.addEventListener('click', (e) => {
    if (!isOpen) return;
    if (!e.composedPath().includes(host)) closeDrawer();
  }, true);

  // Escape cierra el drawer.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeDrawer();
  });

  // ─── Estado del FAB: compatibilidad, etiqueta, nudge y pestaña ─────────────────
  const FRESCO_MS = 60 * 60 * 1000;
  let currentNudge = null;     // texto del nudge si hay producto fresco, o null
  let nudgeHideTimer = null;
  let peekTimer = null;

  function isCompat() { return window.__kueski_force_compatible !== false; }

  function showBubble(text, isNudge) {
    fabBubble.textContent = text;
    fabBubble.classList.toggle('fab__bubble--nudge', !!isNudge);
    fabBubble.classList.add('fab__bubble--show');
  }
  function hideBubble() { fabBubble.classList.remove('fab__bubble--show'); }

  // Repliega/expande el FAB contra el borde tras inactividad.
  function expandFab() { clearTimeout(peekTimer); fab.classList.remove('fab--peek'); }
  function schedulePeek() {
    clearTimeout(peekTimer);
    peekTimer = setTimeout(() => {
      if (!isOpen && !isDragging) fab.classList.add('fab--peek');
    }, 3500);
  }

  // Lee el producto detectado y actualiza el nudge (misma frescura que renderDrawer).
  function updateNudge(autoReveal) {
    if (!isContextValid()) return;
    chrome.storage.local.get(['productoDetectado'], (res) => {
      const d = res.productoDetectado;
      const tienda = window.location.hostname.replace(/^www\./, '');
      const fresh = d && d.url === tienda && (Date.now() - (d.ts || 0) < FRESCO_MS) ? d : null;
      if (fresh && isCompat()) {
        const raw = parseFloat(String(fresh.precio).replace(/,/g, '')) || 0;
        currentNudge = raw > 0
          ? `desde $${Math.ceil((raw * 1.12) / 4).toLocaleString('es-MX')}/qna`
          : null;
      } else {
        currentNudge = null;
      }
      // Al detectarse un producto nuevo, asoma el nudge unos segundos.
      if (autoReveal && currentNudge && !isOpen && !isDragging) {
        expandFab();
        showBubble(currentNudge, true);
        clearTimeout(nudgeHideTimer);
        nudgeHideTimer = setTimeout(hideBubble, 4200);
      }
    });
  }

  function syncFab() {
    const compat = isCompat();
    fab.classList.toggle('fab--ready', compat);
    fab.classList.toggle('fab--off', !compat);
    fabBadge.classList.toggle('fab__badge--on', compat);
    if (!compat) fab.classList.remove('fab--pulse');
    else if (!isOpen) fab.classList.add('fab--pulse');
    fab.setAttribute('aria-label',
      compat ? 'KueskiPay · Disponible en esta tienda' : 'KueskiPay · Tienda no compatible');
    updateNudge(false);
  }

  syncFab();
  window.addEventListener('kueski:storechange', syncFab);

  // Hover / foco: muestra etiqueta o nudge, y expande el FAB.
  fab.addEventListener('pointerenter', () => {
    if (isDragging) return;
    expandFab();
    clearTimeout(nudgeHideTimer);
    if (currentNudge) showBubble(currentNudge, true);
    else showBubble(isCompat() ? 'Disponible aquí' : 'KueskiPay', false);
  });
  fab.addEventListener('pointerleave', () => {
    if (isDragging) return;
    hideBubble();
    schedulePeek();
  });
  fab.addEventListener('focus', () => { expandFab(); });
  fab.addEventListener('blur', () => { hideBubble(); schedulePeek(); });

  // Teclado: Enter/Espacio abre o cierra el panel.
  fab.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDrawer(); }
  });

  // Arranca el ciclo de repliegue.
  schedulePeek();

  // Repinta el drawer y refresca el nudge si llega un producto nuevo.
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.productoDetectado) {
        if (isOpen) renderDrawer();
        updateNudge(true);
      }
    });
  } catch {}

  // ─── Render del contenido ─────────────────────────────────────────────────────
  function renderDrawer(done) {
    if (!isContextValid()) { host.remove(); return; }
    chrome.storage.local.get(['kpay_user', 'productoDetectado'], (res) => {
      const user      = res.kpay_user || null;
      const detectado = res.productoDetectado || null;
      const compat    = window.__kueski_force_compatible !== false;
      const tienda    = window.location.hostname.replace(/^www\./, '');
      const disp      = user?.credito_disponible ?? 0;
      const nombre    = user?.nombre ?? '';

      // El producto solo es válido si pertenece a ESTA tienda y es reciente.
      const FRESCO_MS = 60 * 60 * 1000;
      const producto = detectado && detectado.url === tienda &&
        (Date.now() - (detectado.ts || 0) < FRESCO_MS) ? detectado : null;

      clip.innerHTML = '';
      let revealIndex = 0;
      const reveal = (node) => {
        node.classList.add('kp-reveal');
        node.style.setProperty('--i', revealIndex++);
        return node;
      };

      // ── Header ──
      const hdr = el('div', 'drawer__header');
      const brand = el('div', 'drawer__brand');
      const bi = el('img', 'drawer__brand-img');
      bi.src = assetUrl('kueskipay.png');
      bi.alt = 'KueskiPay';
      brand.appendChild(bi);
      if (compat) {
        const live = el('span', 'drawer__live');
        live.append(el('span', 'drawer__live-dot'), document.createTextNode('Disponible'));
        brand.appendChild(live);
      }
      const closeBtn = el('button', 'drawer__close');
      closeBtn.setAttribute('aria-label', 'Cerrar');
      closeBtn.appendChild(icon('x', 18));
      closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeDrawer(); });
      hdr.append(brand, closeBtn);
      clip.appendChild(hdr);

      // ── Body ──
      const body = el('div', 'drawer__body');

      // HERO: ¿puedo pagar aquí? — la pregunta más importante, respondida al instante.
      const hero = el('div', 'drawer__hero ' + (compat ? 'drawer__hero--ok' : 'drawer__hero--no'));
      const heroIco = el('div', 'drawer__hero-ico');
      heroIco.appendChild(icon(compat ? 'check' : 'store', 22));
      const heroTxt = el('div', 'drawer__hero-txt');
      heroTxt.append(
        el('span', 'drawer__hero-title', compat ? 'Puedes pagar a quincenas' : 'Tienda no compatible'),
        el('span', 'drawer__hero-sub', compat ? `Disponible en ${tienda}` : `${tienda} aún no acepta KueskiPay`)
      );
      hero.append(heroIco, heroTxt);
      body.appendChild(reveal(hero));

      body.appendChild(reveal(el('div', 'drawer__divider')));

      // Crédito disponible
      const credit = el('div', 'drawer__credit');
      const creditIco = el('div', 'drawer__credit-ico');
      creditIco.appendChild(icon('wallet', 20));
      const creditMain = el('div', 'drawer__credit-main');
      creditMain.appendChild(el('span', 'drawer__credit-lbl', 'Crédito disponible'));
      const figure = el('div', 'drawer__credit-figure');
      if (user) {
        figure.append(
          el('span', 'drawer__credit-val', `$${disp.toLocaleString('es-MX')}`),
          el('span', 'drawer__credit-cur', 'MXN')
        );
      } else {
        figure.appendChild(el('span', 'drawer__credit-val', 'Inicia sesión'));
      }
      creditMain.appendChild(figure);
      if (nombre) creditMain.appendChild(el('span', 'drawer__credit-name', `Hola, ${nombre.split(' ')[0]}`));
      credit.append(creditIco, creditMain);
      body.appendChild(reveal(credit));

      // Producto detectado (solo si la tienda es compatible)
      if (compat && producto) {
        const raw = parseFloat(String(producto.precio).replace(/,/g, '')) || 0;
        const cuota = raw > 0
          ? `desde $${Math.ceil((raw * 1.12) / 4).toLocaleString('es-MX')}/qna`
          : '4 quincenas';
        body.appendChild(reveal(el('div', 'drawer__divider')));
        const pc = el('div', 'drawer__product');
        const tag = el('span', 'drawer__product-tag');
        tag.append(icon('tag', 12), document.createTextNode('Producto detectado'));
        pc.appendChild(tag);
        pc.appendChild(el('span', 'drawer__product-name', producto.nombre));
        const pr = el('div', 'drawer__product-row');
        pr.append(
          el('span', 'drawer__product-price', `$${raw.toLocaleString('es-MX')}`),
          el('span', 'drawer__product-quin', cuota)
        );
        pc.appendChild(pr);
        body.appendChild(reveal(pc));
      }

      // CTA principal según el estado.
      let btn;
      if (!user) {
        btn = el('button', 'drawer__btn drawer__btn--primary');
        btn.append(document.createTextNode('Iniciar sesión'), icon('arrow', 18));
        btn.addEventListener('click', () => openPopup('inicio'));
      } else if (compat) {
        btn = el('button', 'drawer__btn drawer__btn--primary');
        btn.append(icon('bolt', 17), document.createTextNode('Calcular pago a quincenas'));
        btn.addEventListener('click', () => openPopup('calculadora'));
      } else {
        btn = el('button', 'drawer__btn drawer__btn--ghost');
        btn.append(icon('store', 17), document.createTextNode('Ver tiendas disponibles'));
        btn.addEventListener('click', () => openPopup('buscar'));
      }
      body.appendChild(reveal(btn));

      clip.appendChild(body);

      // ── Footer ──
      const footer = el('div', 'drawer__footer');
      const openBtn = el('button', 'drawer__footer-btn');
      openBtn.append(document.createTextNode('Abrir KueskiPay'), icon('arrow', 16));
      openBtn.addEventListener('click', () => openPopup('inicio'));
      footer.appendChild(reveal(openBtn));
      clip.appendChild(footer);

      applyPos();
      if (typeof done === 'function') done();
    });
  }

  function openPopup(tab) {
    if (!isContextValid()) { host.remove(); return; }
    chrome.storage.local.set({ kpay_initial_tab: tab });
    chrome.runtime.sendMessage({ action: 'openPopup', tab });
    closeDrawer();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Iconos SVG line-art (sin emojis). currentColor hereda del contenedor.
  const ICONS = {
    check:  '<path d="M20 6 9 17l-5-5"/>',
    store:  '<path d="M4 4h16l1.2 5.4a3 3 0 0 1-5.9.6 3 3 0 0 1-6 0 3 3 0 0 1-5.9-.6z"/><path d="M5 11v9h14v-9"/><path d="M9.5 20v-5h5v5"/>',
    wallet: '<path d="M19 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1"/><path d="M21 11h-6a2 2 0 0 0 0 4h6z"/>',
    tag:    '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    arrow:  '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    bolt:   '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    x:      '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  };
  function icon(name, size) {
    const s = size || 20;
    const span = el('span', 'kp-ico');
    span.innerHTML =
      `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
      `stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
    return span;
  }

})();
