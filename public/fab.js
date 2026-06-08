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
  const ACCENT       = '#7CF5B8';
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
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host { --kp-primary:${PRIMARY}; }

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

    .fab__badge {
      position: absolute;
      top: 0; right: 0;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: ${ACCENT};
      border: 2.5px solid #fff;
      transform: scale(0);
      transition: transform .3s cubic-bezier(.34,1.56,.64,1);
      box-shadow: 0 0 0 0 rgba(124,245,184,0.7);
    }
    .fab__badge--on { transform: scale(1); animation: kpBadgePulse 2.4s ease-out infinite; }

    /* ── Drawer ── */
    .drawer {
      position: fixed;
      width: ${DRAWER_W}px;
      max-width: calc(100vw - ${MARGIN * 2}px);
      display: flex;
      flex-direction: column;
      /* Off-white cálido con un sutil degradado vertical para dar atmósfera */
      background: linear-gradient(180deg, #ffffff 0%, #f6fbfa 100%);
      border-radius: 22px;
      box-shadow:
        0 32px 70px -12px rgba(6,42,35,0.34),
        0 12px 28px -8px rgba(6,42,35,0.18),
        0 0 0 1px rgba(13,138,122,0.07),
        inset 0 1px 0 rgba(255,255,255,0.9);
      pointer-events: none;
      opacity: 0;
      transform: scale(0.92) translateY(var(--kp-enter-ty, 12px));
      transform-origin: right bottom;
      transition: opacity .24s ease, transform .42s cubic-bezier(.2,1,.32,1);
      font-family: "SF Pro Display", "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, sans-serif;
      font-feature-settings: "ss01" 1, "cv01" 1;
      -webkit-font-smoothing: antialiased;
      color: #14202b;
      overflow: hidden;
    }
    .drawer--open { opacity: 1; transform: scale(1) translateY(0); pointer-events: all; }

    /* reveal escalonado del contenido */
    .kp-reveal { opacity: 0; }
    .drawer--open .kp-reveal {
      animation: kpRise .5s cubic-bezier(.2,1,.32,1) both;
      animation-delay: calc(var(--i, 0) * 62ms);
    }

    /* Header: vidrio teal + textura de puntos para profundidad */
    .drawer__header {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px 16px 14px;
      background:
        radial-gradient(rgba(13,138,122,0.10) 1px, transparent 1.4px) 0 0 / 11px 11px,
        linear-gradient(135deg, rgba(22,184,159,0.12), rgba(13,138,122,0.03));
    }
    .drawer__header::after {        /* línea de acento degradada bajo el header */
      content: ''; position: absolute; left: 16px; right: 16px; bottom: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(13,138,122,0.35), transparent);
    }
    .drawer__brand { display: flex; align-items: center; gap: 9px; }
    .drawer__brand-img { height: 23px; width: auto; object-fit: contain; }
    .drawer__live {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 9.5px; font-weight: 800; letter-spacing: .4px;
      text-transform: uppercase;
      color: ${PRIMARY_DARK};
      background: rgba(124,245,184,0.26);
      padding: 4px 9px; border-radius: 999px;
      box-shadow: inset 0 0 0 1px rgba(13,138,122,0.12);
    }
    .drawer__live-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: ${PRIMARY}; box-shadow: 0 0 0 0 rgba(13,138,122,.6);
      animation: kpBadgePulse 2s ease-out infinite;
    }
    .drawer__close {
      position: absolute; top: 11px; right: 11px;
      width: 26px; height: 26px;
      display: grid; place-items: center;
      background: rgba(20,32,43,0.05);
      border: none; cursor: pointer;
      color: #6b7785; font-size: 14px; line-height: 1;
      border-radius: 9px;
      transition: background .15s, color .15s, transform .25s cubic-bezier(.34,1.56,.64,1);
    }
    .drawer__close:hover { background: rgba(20,32,43,0.1); color: #14202b; transform: rotate(90deg); }

    .drawer__body {
      padding: 15px 16px;
      display: flex; flex-direction: column; gap: 12px;
      overflow-y: auto;
    }
    .drawer__body::-webkit-scrollbar { width: 6px; }
    .drawer__body::-webkit-scrollbar-thumb { background: rgba(13,138,122,.25); border-radius: 6px; }

    .drawer__status {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 12px; border-radius: 10px;
      font-size: 12px; font-weight: 600; line-height: 1.3;
    }
    .drawer__status-dot { width: 7px; height: 7px; border-radius: 50%; flex: 0 0 auto; }
    .drawer__status--green { background: #effdf5; color: #166534; border: 1px solid #c4f0d4; }
    .drawer__status--green .drawer__status-dot { background: #1fb968; }
    .drawer__status--red { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .drawer__status--red .drawer__status-dot { background: #ef4444; }

    /* ── Tarjeta de crédito (HERO) — credencial premium oscura ── */
    .drawer__card {
      position: relative;
      border-radius: 18px;
      padding: 16px 17px 17px;
      color: #eafff7;
      aspect-ratio: 1.586 / 1;            /* proporción de tarjeta real */
      display: flex; flex-direction: column;
      background:
        radial-gradient(140% 120% at 88% -10%, rgba(22,184,159,0.55) 0%, transparent 45%),
        radial-gradient(120% 130% at 0% 120%, rgba(124,245,184,0.18) 0%, transparent 50%),
        linear-gradient(150deg, #0c5446 0%, #073a30 52%, #05241d 100%);
      box-shadow:
        0 14px 34px -8px rgba(4,30,24,0.55),
        0 4px 10px rgba(4,30,24,0.35),
        inset 0 1px 0 rgba(255,255,255,0.16),
        inset 0 0 0 1px rgba(124,245,184,0.10);
      overflow: hidden;
      isolation: isolate;
    }
    /* Arcos concéntricos decorativos (motivo de marca) */
    .drawer__card::before {
      content: ''; position: absolute; right: -58px; bottom: -72px;
      width: 190px; height: 190px; border-radius: 50%;
      border: 1.5px solid rgba(124,245,184,0.14);
      box-shadow: 0 0 0 22px rgba(124,245,184,0.06);
      pointer-events: none; z-index: 0;
    }
    /* Destello holográfico que barre al abrir */
    .drawer__card-sheen {
      position: absolute; inset: 0; z-index: 1; pointer-events: none;
      background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 47%, rgba(255,255,255,0.05) 54%, transparent 70%);
      transform: translateX(-120%);
    }
    .drawer--open .drawer__card-sheen { animation: kpSheen 1.15s cubic-bezier(.2,.7,.3,1) .42s both; }

    .drawer__card-top {
      position: relative; z-index: 2;
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: auto;
    }
    /* Chip dorado estilo tarjeta */
    .drawer__chip {
      width: 30px; height: 23px; border-radius: 6px;
      background: linear-gradient(135deg, #f6e3a8 0%, #d9b46a 38%, #b8923f 70%, #e6cf95 100%);
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(120,80,20,0.4), 0 1px 2px rgba(0,0,0,0.25);
      position: relative; overflow: hidden;
    }
    .drawer__chip::before, .drawer__chip::after {
      content: ''; position: absolute; background: rgba(120,80,20,0.45);
    }
    .drawer__chip::before { left: 0; right: 0; top: 50%; height: 1px; }
    .drawer__chip::after  { top: 0; bottom: 0; left: 33%; width: 1px;
      box-shadow: 11px 0 0 rgba(120,80,20,0.45); }
    .drawer__card-mark {
      font-size: 11px; font-weight: 800; letter-spacing: 1.2px;
      text-transform: uppercase; color: rgba(234,255,247,0.55);
    }

    .drawer__card-lbl {
      position: relative; z-index: 2;
      font-size: 9.5px; font-weight: 800; letter-spacing: 1px;
      text-transform: uppercase; color: rgba(234,255,247,0.62);
      display: block; margin-bottom: 4px;
    }
    .drawer__card-figure {
      position: relative; z-index: 2;
      display: flex; align-items: baseline; gap: 7px;
    }
    .drawer__card-val {
      font-size: 30px; font-weight: 800; line-height: 1;
      letter-spacing: -1px; color: #fff;
      font-variant-numeric: tabular-nums;
      text-shadow: 0 1px 8px rgba(0,0,0,0.25);
    }
    .drawer__card-cur {
      font-size: 10px; font-weight: 800; letter-spacing: .5px;
      color: ${ACCENT}; padding: 2px 6px; border-radius: 6px;
      background: rgba(124,245,184,0.14);
      box-shadow: inset 0 0 0 1px rgba(124,245,184,0.22);
    }
    .drawer__card-sub {
      position: relative; z-index: 2;
      font-size: 12px; opacity: .82; font-weight: 600;
      display: block; margin-top: 8px; letter-spacing: .1px;
    }

    /* Producto detectado — barra de acento lateral */
    .drawer__product {
      position: relative;
      background: #ffffff; border: 1px solid #e6eef0;
      border-radius: 14px; padding: 11px 14px 11px 16px;
      box-shadow: 0 2px 8px rgba(8,60,50,0.05);
      overflow: hidden;
    }
    .drawer__product::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
      background: linear-gradient(${PRIMARY_LITE}, ${PRIMARY});
    }
    .drawer__product-tag {
      font-size: 9px; font-weight: 800; letter-spacing: .6px;
      text-transform: uppercase; color: ${PRIMARY};
      display: inline-flex; align-items: center; gap: 4px;
      margin-bottom: 5px;
    }
    .drawer__product-tag::before {
      content: ''; width: 5px; height: 5px; border-radius: 50%;
      background: ${PRIMARY}; box-shadow: 0 0 0 3px rgba(13,138,122,0.14);
    }
    .drawer__product-name {
      font-size: 12.5px; font-weight: 600; color: #2b3a47;
      display: block; overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap; margin-bottom: 7px;
    }
    .drawer__product-row { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
    .drawer__product-price {
      font-size: 18px; font-weight: 800; color: #14202b; letter-spacing: -.4px;
      font-variant-numeric: tabular-nums;
    }
    .drawer__product-quin {
      font-size: 10.5px; font-weight: 800; color: ${PRIMARY}; white-space: nowrap;
      background: rgba(13,138,122,.1); padding: 4px 9px; border-radius: 999px;
      box-shadow: inset 0 0 0 1px rgba(13,138,122,0.12);
    }

    .drawer__btn {
      position: relative;
      width: 100%; padding: 13px 0;
      border-radius: 13px; border: none; cursor: pointer;
      font-size: 13.5px; font-weight: 800; font-family: inherit; letter-spacing: .2px;
      transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease, background .15s ease;
      overflow: hidden;
    }
    .drawer__btn--primary {
      color: #fff;
      background: linear-gradient(135deg, ${PRIMARY_LITE} 0%, ${PRIMARY} 60%, ${PRIMARY_DARK} 100%);
      box-shadow: 0 8px 18px -4px rgba(13,138,122,0.5), inset 0 1px 0 rgba(255,255,255,0.25);
    }
    .drawer__btn--primary::after {     /* barrido de luz sutil al hover */
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.3) 50%, transparent 65%);
      transform: translateX(-120%); transition: transform .55s ease;
    }
    .drawer__btn--primary:hover { transform: translateY(-2px); box-shadow: 0 13px 26px -6px rgba(13,138,122,0.58), inset 0 1px 0 rgba(255,255,255,0.25); }
    .drawer__btn--primary:hover::after { transform: translateX(120%); }
    .drawer__btn--primary:active { transform: translateY(0) scale(.985); }
    .drawer__btn--outline {
      background: #fff; color: ${PRIMARY_DARK}; border: 1.5px solid rgba(13,138,122,.35);
      box-shadow: 0 2px 8px rgba(8,60,50,0.06);
    }
    .drawer__btn--outline:hover { background: #f0faf8; border-color: ${PRIMARY}; transform: translateY(-1px); }

    .drawer__footer { padding: 10px 16px 14px; border-top: 1px solid #f0f3f5; }
    .drawer__footer-btn {
      width: 100%; background: none; border: none; cursor: pointer;
      font-size: 12.5px; font-weight: 700; color: #8a96a3;
      font-family: inherit; padding: 7px 0; border-radius: 9px;
      transition: color .15s, background .15s;
    }
    .drawer__footer-btn:hover { color: ${PRIMARY}; background: #f4faf9; }

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
      from { opacity: 0; transform: translateY(9px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes kpSheen {
      0%   { transform: translateX(-120%); }
      100% { transform: translateX(120%); }
    }

    @media (prefers-reduced-motion: reduce) {
      .fab, .drawer, .fab__badge { animation: none !important; transition: opacity .15s ease !important; }
      .drawer { transform: none; }
      /* Sin animación de entrada, el contenido debe quedar visible (no en opacity:0) */
      .kp-reveal { opacity: 1 !important; animation: none !important; }
      .drawer__card-sheen { display: none !important; }
    }
  `;
  shadow.appendChild(style);

  // ─── Elementos ────────────────────────────────────────────────────────────────
  const fab = document.createElement('div');
  fab.className = 'fab fab--pulse';
  fab.setAttribute('role', 'button');
  fab.setAttribute('aria-label', 'KueskiPay');
  fab.setAttribute('aria-expanded', 'false');

  const fabImg = document.createElement('img');
  fabImg.className = 'fab__img';
  fabImg.alt = 'KueskiPay';
  const logoUrl = assetUrl('kueskilogo.png');   // '' si el contexto se invalidó
  if (logoUrl) fabImg.src = logoUrl;
  fab.appendChild(fabImg);

  const fabBadge = document.createElement('span');
  fabBadge.className = 'fab__badge';
  fab.appendChild(fabBadge);

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Panel de KueskiPay');

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

  function applyPos() {
    fab.style.bottom = fabPos.bottom + 'px';
    fab.style.right  = fabPos.right  + 'px';

    const vw = vpW();
    const vh = vpH();

    const fabLeft = vw - fabPos.right - FAB_SIZE;
    const fabTop  = vh - fabPos.bottom - FAB_SIZE;
    const fabCenterY = fabTop + FAB_SIZE / 2;

    const drawerW = Math.min(DRAWER_W, vw - MARGIN * 2);

    // Dirección vertical: si el FAB está en la mitad alta → abre hacia ABAJO.
    const openDown = fabCenterY < vh / 2;

    if (openDown) {
      // El drawer alinea su borde superior con el del FAB y crece hacia abajo.
      const top = Math.max(MARGIN, fabTop);
      drawer.style.top = top + 'px';
      drawer.style.bottom = 'auto';
      drawer.style.maxHeight = (vh - top - MARGIN) + 'px';
      drawer.style.setProperty('--kp-enter-ty', '-10px');
    } else {
      // El drawer alinea su borde inferior con el del FAB y crece hacia arriba.
      const bottom = Math.max(MARGIN, fabPos.bottom);
      drawer.style.bottom = bottom + 'px';
      drawer.style.top = 'auto';
      drawer.style.maxHeight = (vh - bottom - MARGIN) + 'px';
      drawer.style.setProperty('--kp-enter-ty', '10px');
    }

    // Dirección horizontal: se alinea al lado donde está pegado el FAB.
    const isLeftSide = fabLeft + FAB_SIZE / 2 < vw / 2;
    let left;
    let originX;
    if (isLeftSide) {
      left = fabLeft;
      originX = 'left';
    } else {
      left = fabLeft + FAB_SIZE - drawerW;
      originX = 'right';
    }
    // Clamp dentro del viewport.
    left = Math.max(MARGIN, Math.min(left, vw - drawerW - MARGIN));
    drawer.style.left = left + 'px';
    drawer.style.right = 'auto';
    drawer.style.width = drawerW + 'px';

    drawer.style.transformOrigin = `${originX} ${openDown ? 'top' : 'bottom'}`;
  }

  if (isContextValid()) {
    chrome.storage.local.get([STORAGE_POS], (res) => {
      if (res[STORAGE_POS]) fabPos = res[STORAGE_POS];
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

  // ─── Apertura / cierre del drawer ─────────────────────────────────────────────
  let isOpen = false;

  function openDrawer() {
    isOpen = true;
    fab.setAttribute('aria-expanded', 'true');
    fab.classList.remove('fab--pulse');
    // Espera a que el contenido esté construido para evitar un parpadeo vacío.
    renderDrawer(() => requestAnimationFrame(() => drawer.classList.add('drawer--open')));
  }

  function closeDrawer() {
    isOpen = false;
    fab.setAttribute('aria-expanded', 'false');
    fab.classList.add('fab--pulse');
    drawer.classList.remove('drawer--open');
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

  // ─── Badge de compatibilidad ──────────────────────────────────────────────────
  function syncBadge() {
    const compat = window.__kueski_force_compatible !== false;
    fabBadge.classList.toggle('fab__badge--on', compat);
  }

  syncBadge();
  window.addEventListener('kueski:storechange', syncBadge);

  // Repinta el drawer si llega un producto nuevo mientras está abierto.
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.productoDetectado && isOpen) renderDrawer();
    });
  } catch {}

  // ─── Render del contenido ─────────────────────────────────────────────────────
  function renderDrawer(done) {
    if (!isContextValid()) { host.remove(); return; }
    chrome.storage.local.get(['kpay_user', 'productoDetectado'], (res) => {
      const user     = res.kpay_user || null;
      const detectado = res.productoDetectado || null;
      const compat   = window.__kueski_force_compatible !== false;
      const tienda   = window.location.hostname.replace(/^www\./, '');
      const disp     = user?.credito_disponible ?? 0;
      const nombre   = user?.nombre ?? '';

      // El producto solo es válido si pertenece a ESTA tienda y es reciente.
      const FRESCO_MS = 60 * 60 * 1000;
      const producto = detectado && detectado.url === tienda &&
        (Date.now() - (detectado.ts || 0) < FRESCO_MS) ? detectado : null;

      drawer.innerHTML = '';
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
      const live = el('span', 'drawer__live');
      live.append(el('span', 'drawer__live-dot'), document.createTextNode('Disponible'));
      brand.append(bi, live);
      const closeBtn = el('button', 'drawer__close', '✕');
      closeBtn.setAttribute('aria-label', 'Cerrar');
      closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeDrawer(); });
      hdr.append(brand, closeBtn);
      drawer.appendChild(hdr);

      // ── Body ──
      const body = el('div', 'drawer__body');

      // Estado de compatibilidad
      const badge = el('div', compat ? 'drawer__status drawer__status--green' : 'drawer__status drawer__status--red');
      badge.append(el('span', 'drawer__status-dot'),
        document.createTextNode(compat ? `${tienda} · Compatible` : 'Esta tienda no es compatible'));
      body.appendChild(reveal(badge));

      // Tarjeta de crédito (HERO) — credencial premium
      const creditCard = el('div', 'drawer__card');
      creditCard.appendChild(el('span', 'drawer__card-sheen'));   // destello holográfico

      const cardTop = el('div', 'drawer__card-top');
      cardTop.append(el('span', 'drawer__chip'), el('span', 'drawer__card-mark', 'KueskiPay'));
      creditCard.appendChild(cardTop);

      creditCard.appendChild(el('span', 'drawer__card-lbl', 'Crédito disponible'));

      const figure = el('div', 'drawer__card-figure');
      if (user) {
        figure.append(
          el('span', 'drawer__card-val', `$${disp.toLocaleString('es-MX')}`),
          el('span', 'drawer__card-cur', 'MXN')
        );
      } else {
        figure.appendChild(el('span', 'drawer__card-val', 'Inicia sesión'));
      }
      creditCard.appendChild(figure);

      if (nombre) creditCard.appendChild(el('span', 'drawer__card-sub', `Hola, ${nombre.split(' ')[0]} 👋`));
      body.appendChild(reveal(creditCard));

      if (compat) {
        if (producto) {
          const raw = parseFloat(String(producto.precio).replace(/,/g, '')) || 0;
          const cuota = raw > 0 ? `desde $${Math.ceil((raw * 1.12) / 4).toLocaleString('es-MX')} / qna` : '4 quincenas';
          const pc = el('div', 'drawer__product');
          pc.appendChild(el('span', 'drawer__product-tag', 'Producto detectado'));
          pc.appendChild(el('span', 'drawer__product-name', producto.nombre));
          const pr = el('div', 'drawer__product-row');
          pr.append(
            el('span', 'drawer__product-price', `$${raw.toLocaleString('es-MX')}`),
            el('span', 'drawer__product-quin', cuota)
          );
          pc.appendChild(pr);
          body.appendChild(reveal(pc));
        }

        const calcBtn = el('button', 'drawer__btn drawer__btn--primary', 'Calcular financiamiento');
        calcBtn.addEventListener('click', () => openPopup('calculadora'));
        body.appendChild(reveal(calcBtn));
      } else {
        const tiendaBtn = el('button', 'drawer__btn drawer__btn--outline', 'Ver tiendas afiliadas');
        tiendaBtn.addEventListener('click', () => openPopup('buscar'));
        body.appendChild(reveal(tiendaBtn));
      }

      drawer.appendChild(body);

      // ── Footer ──
      const footer = el('div', 'drawer__footer');
      const openBtn = el('button', 'drawer__footer-btn', 'Abrir KueskiPay →');
      openBtn.addEventListener('click', () => openPopup('inicio'));
      footer.appendChild(reveal(openBtn));
      drawer.appendChild(footer);

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

  // ─── Helper ──────────────────────────────────────────────────────────────────
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

})();
