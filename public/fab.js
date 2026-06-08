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
    .fab--dragging { cursor: grabbing; transform: scale(1.08); opacity: 1; animation: none; }

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
      background: #ffffff;
      border-radius: 20px;
      box-shadow:
        0 24px 60px rgba(8,40,34,0.22),
        0 8px 20px rgba(8,40,34,0.12),
        0 0 0 1px rgba(13,138,122,0.06);
      pointer-events: none;
      opacity: 0;
      transform: scale(0.94) translateY(var(--kp-enter-ty, 10px));
      transform-origin: right bottom;
      transition: opacity .2s ease, transform .3s cubic-bezier(.22,1,.36,1);
      font-family: "SF Pro Display", "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #14202b;
      overflow: hidden;
    }
    .drawer--open { opacity: 1; transform: scale(1) translateY(0); pointer-events: all; }

    /* reveal escalonado del contenido */
    .kp-reveal { opacity: 0; }
    .drawer--open .kp-reveal {
      animation: kpRise .46s cubic-bezier(.22,1,.36,1) both;
      animation-delay: calc(var(--i, 0) * 55ms);
    }

    /* Header con vidrio teal */
    .drawer__header {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 13px;
      background:
        linear-gradient(135deg, rgba(22,184,159,0.10), rgba(13,138,122,0.04));
      border-bottom: 1px solid rgba(13,138,122,0.10);
    }
    .drawer__brand { display: flex; align-items: center; gap: 8px; }
    .drawer__brand-img { height: 24px; width: auto; object-fit: contain; }
    .drawer__live {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 10px; font-weight: 700; letter-spacing: .3px;
      color: ${PRIMARY_DARK};
      background: rgba(124,245,184,0.22);
      padding: 3px 8px; border-radius: 999px;
    }
    .drawer__live-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: ${PRIMARY}; box-shadow: 0 0 0 0 rgba(13,138,122,.6);
      animation: kpBadgePulse 2s ease-out infinite;
    }
    .drawer__close {
      position: absolute; top: 10px; right: 10px;
      width: 26px; height: 26px;
      display: grid; place-items: center;
      background: rgba(20,32,43,0.04);
      border: none; cursor: pointer;
      color: #6b7785; font-size: 15px; line-height: 1;
      border-radius: 8px;
      transition: background .15s, color .15s, transform .15s;
    }
    .drawer__close:hover { background: rgba(20,32,43,0.09); color: #14202b; transform: rotate(90deg); }

    .drawer__body {
      padding: 14px 16px;
      display: flex; flex-direction: column; gap: 11px;
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

    /* Tarjeta de crédito (hero) */
    .drawer__card {
      position: relative;
      border-radius: 16px;
      padding: 15px 16px 16px;
      color: #fff;
      background:
        radial-gradient(120% 140% at 85% 0%, ${PRIMARY_LITE} 0%, ${PRIMARY} 48%, ${PRIMARY_DARK} 100%);
      box-shadow: 0 8px 22px rgba(8,80,65,0.28), inset 0 1px 0 rgba(255,255,255,0.18);
      overflow: hidden;
    }
    .drawer__card::before {       /* brillo decorativo */
      content: ''; position: absolute; top: -40%; right: -10%;
      width: 130px; height: 130px; border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,.28), transparent 70%);
      pointer-events: none;
    }
    .drawer__card-lbl {
      font-size: 10px; font-weight: 700; letter-spacing: .7px;
      text-transform: uppercase; opacity: .82;
      display: block; margin-bottom: 5px;
    }
    .drawer__card-val { font-size: 26px; font-weight: 800; line-height: 1; display: block; letter-spacing: -.5px; }
    .drawer__card-sub { font-size: 12px; opacity: .9; font-weight: 500; display: block; margin-top: 6px; }

    /* Producto detectado */
    .drawer__product {
      background: #f7f9fb; border: 1px solid #e7edf2;
      border-radius: 14px; padding: 11px 14px;
    }
    .drawer__product-tag {
      font-size: 9.5px; font-weight: 700; letter-spacing: .5px;
      text-transform: uppercase; color: ${PRIMARY};
      display: block; margin-bottom: 4px;
    }
    .drawer__product-name {
      font-size: 12.5px; font-weight: 600; color: #2b3a47;
      display: block; overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap; margin-bottom: 6px;
    }
    .drawer__product-row { display: flex; align-items: baseline; justify-content: space-between; }
    .drawer__product-price { font-size: 17px; font-weight: 800; color: #14202b; letter-spacing: -.3px; }
    .drawer__product-quin {
      font-size: 11px; font-weight: 700; color: ${PRIMARY};
      background: rgba(13,138,122,.10); padding: 3px 8px; border-radius: 999px;
    }

    .drawer__btn {
      width: 100%; padding: 12px 0;
      border-radius: 12px; border: none; cursor: pointer;
      font-size: 13.5px; font-weight: 700; font-family: inherit;
      transition: transform .15s ease, box-shadow .2s ease, background .15s ease;
    }
    .drawer__btn--primary {
      color: #fff;
      background: linear-gradient(135deg, ${PRIMARY_LITE}, ${PRIMARY});
      box-shadow: 0 6px 16px rgba(13,138,122,0.34);
    }
    .drawer__btn--primary:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(13,138,122,0.42); }
    .drawer__btn--primary:active { transform: translateY(0) scale(.99); }
    .drawer__btn--outline {
      background: #fff; color: ${PRIMARY}; border: 1.5px solid rgba(13,138,122,.4);
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

    @media (prefers-reduced-motion: reduce) {
      .fab, .drawer, .kp-reveal, .fab__badge { animation: none !important; transition: opacity .15s ease !important; }
      .drawer { transform: none; }
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
  fabImg.src = chrome.runtime.getURL('kueskilogo.png');
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
  window.addEventListener('unload', () => host.remove());

  // ─── Posicionamiento ──────────────────────────────────────────────────────────
  // El FAB se ancla por bottom/right; el drawer se coloca con coordenadas
  // absolutas calculadas desde la geometría del FAB.
  let fabPos = { bottom: 24, right: 20 };

  function applyPos() {
    fab.style.bottom = fabPos.bottom + 'px';
    fab.style.right  = fabPos.right  + 'px';

    const vw = window.innerWidth;
    const vh = window.innerHeight;

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
  let isDragging  = false;
  let dragMoved   = false;
  let drag0       = {};
  let snapTimeout = null;

  fab.addEventListener('pointerdown', (e) => {
    isDragging = true;
    dragMoved  = false;
    e.preventDefault();
    if (snapTimeout) { clearTimeout(snapTimeout); snapTimeout = null; }
    fab.style.transition = '';
    fab.classList.add('fab--dragging');
    drag0 = { x: e.clientX, y: e.clientY, r: fabPos.right, b: fabPos.bottom };
    fab.setPointerCapture(e.pointerId);
  });

  fab.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    if (!isContextValid()) { host.remove(); return; }
    const dx = drag0.x - e.clientX;
    const dy = drag0.y - e.clientY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
    fabPos.right  = Math.max(4, Math.min(window.innerWidth  - FAB_SIZE - 4, drag0.r + dx));
    fabPos.bottom = Math.max(4, Math.min(window.innerHeight - FAB_SIZE - 4, drag0.b + dy));
    if (dragMoved && isOpen) closeDrawer();
    applyPos();
  });

  fab.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;
    fab.classList.remove('fab--dragging');
    if (!isContextValid()) { host.remove(); return; }
    if (dragMoved) {
      // Imán al borde horizontal más cercano.
      const fabCenterX = window.innerWidth - fabPos.right - FAB_SIZE / 2;
      if (fabCenterX < window.innerWidth / 2) {
        fabPos.right = window.innerWidth - FAB_SIZE - MARGIN; // pega a la izquierda
      } else {
        fabPos.right = MARGIN;                                // pega a la derecha
      }
      fab.style.transition = 'transform .18s cubic-bezier(.34,1.56,.64,1), right .32s cubic-bezier(.22,1,.36,1), box-shadow .25s ease';
      applyPos();
      snapTimeout = setTimeout(() => { fab.style.transition = ''; snapTimeout = null; }, 340);
      chrome.storage.local.set({ [STORAGE_POS]: fabPos });
    } else {
      toggleDrawer();
    }
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
      bi.src = isContextValid() ? chrome.runtime.getURL('kueskipay.png') : '';
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

      // Tarjeta de crédito (hero)
      const creditCard = el('div', 'drawer__card');
      creditCard.append(
        el('span', 'drawer__card-lbl', 'Crédito disponible'),
        el('span', 'drawer__card-val', user ? `$${disp.toLocaleString('es-MX')} MXN` : 'Inicia sesión')
      );
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
