// KueskiPay – Floating Action Button (Content Script)
// Shadow DOM isolation · Drag to reposition · Persists in chrome.storage.local

(function () {
  'use strict';

  if (document.getElementById('kpay-fab-root')) return;

  // ─── Context validity guard ──────────────────────────────────────────────────
  function isContextValid() {
    try { chrome.runtime.getURL(''); return true; } catch(e) { return false; }
  }

  const PRIMARY      = '#0d8a7a';
  const PRIMARY_DARK = '#085041';
  const STORAGE_POS  = 'kpay_fab_position';

  // ─── Shadow host ────────────────────────────────────────────────────────────
  const host = document.createElement('div');
  host.id = 'kpay-fab-root';
  host.style.cssText = 'position:fixed;z-index:2147483647;top:0;left:0;width:0;height:0;pointer-events:none;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // ─── Styles (all scoped inside shadow) ──────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── FAB ── */
    .fab {
      position: fixed;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: ${PRIMARY};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0.75;
      transition: opacity 0.2s, box-shadow 0.2s, transform 0.15s;
      pointer-events: all;
      user-select: none;
      touch-action: none;
      border: none;
      outline: none;
      box-shadow: 0 3px 12px rgba(13,138,122,0.35);
    }
    .fab:hover {
      opacity: 1;
      box-shadow: 0 5px 20px rgba(13,138,122,0.5);
    }
    .fab:active { transform: scale(0.93); }

    .fab__img {
      height: 18px;
      width: auto;
      object-fit: contain;
      filter: brightness(0) invert(1);
      display: block;
      pointer-events: none;
    }

    .fab__badge {
      position: absolute;
      top: -1px;
      right: -1px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #00C46A;
      border: 2.5px solid #fff;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .fab__badge--on { opacity: 1; }

    /* ── Drawer ── */
    .drawer {
      position: fixed;
      width: 280px;
      background: #fff;
      border-radius: 16px;
      box-shadow:
        0 8px 32px rgba(0,0,0,0.16),
        0 2px 8px rgba(0,0,0,0.08);
      pointer-events: none;
      opacity: 0;
      transform: scale(0.92) translateY(10px);
      transition: opacity 0.25s ease, transform 0.25s ease;
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      color: #1a1a2e;
      overflow: hidden;
    }
    .drawer--open {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: all;
    }

    .drawer__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 16px 11px;
      border-bottom: 1px solid #f0f0f0;
    }

    .drawer__brand {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .drawer__brand-img {
      height: 18px;
      width: auto;
      object-fit: contain;
    }
    .drawer__brand-text {
      font-size: 14px;
      font-weight: 700;
      color: ${PRIMARY};
      letter-spacing: -0.2px;
    }

    .drawer__close {
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      font-size: 16px;
      line-height: 1;
      padding: 3px 7px;
      border-radius: 7px;
      font-family: inherit;
      transition: background 0.15s, color 0.15s;
    }
    .drawer__close:hover { background: #f3f4f6; color: #374151; }

    .drawer__body {
      padding: 13px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .drawer__status {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 7px 12px;
      border-radius: 9px;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.3;
    }
    .drawer__status--green { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .drawer__status--red   { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

    .drawer__card {
      background: #f0faf8;
      border: 1px solid #c8e8e3;
      border-radius: 12px;
      padding: 11px 14px;
    }
    .drawer__card-lbl {
      font-size: 9.5px;
      font-weight: 700;
      color: ${PRIMARY_DARK};
      text-transform: uppercase;
      letter-spacing: 0.6px;
      display: block;
      margin-bottom: 3px;
    }
    .drawer__card-val {
      font-size: 19px;
      font-weight: 800;
      color: #1a1a2e;
      line-height: 1;
      display: block;
    }
    .drawer__card-sub {
      font-size: 11px;
      color: ${PRIMARY};
      font-weight: 500;
      display: block;
      margin-top: 3px;
    }

    .drawer__product {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 10px 14px;
    }
    .drawer__product-name {
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 5px;
    }
    .drawer__product-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }
    .drawer__product-price {
      font-size: 16px;
      font-weight: 700;
      color: ${PRIMARY};
    }
    .drawer__product-quin {
      font-size: 11px;
      color: #6b7280;
    }

    .drawer__btn {
      width: 100%;
      padding: 10px 0;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      transition: background 0.15s, color 0.15s;
    }
    .drawer__btn--primary { background: ${PRIMARY}; color: #fff; }
    .drawer__btn--primary:hover { background: #0a7068; }
    .drawer__btn--outline { background: transparent; color: ${PRIMARY}; border: 1.5px solid ${PRIMARY}; }
    .drawer__btn--outline:hover { background: #f0faf8; }

    .drawer__footer {
      padding: 9px 16px 13px;
      border-top: 1px solid #f0f0f0;
    }
    .drawer__footer-btn {
      width: 100%;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 600;
      color: #9ca3af;
      font-family: inherit;
      text-align: center;
      padding: 6px 0;
      border-radius: 8px;
      transition: color 0.15s, background 0.15s;
    }
    .drawer__footer-btn:hover { color: #374151; background: #f9fafb; }
  `;
  shadow.appendChild(style);

  // ─── Elements ────────────────────────────────────────────────────────────────
  const fab = document.createElement('div');
  fab.className = 'fab';
  fab.setAttribute('role', 'button');
  fab.setAttribute('aria-label', 'KueskiPay');

  const fabImg = document.createElement('img');
  fabImg.className = 'fab__img';
  fabImg.alt = 'KueskiPay';
  fabImg.src = chrome.runtime.getURL('kueskilogo.png');
  fabImg.style.width  = '38px';
  fabImg.style.height = '38px';
  fabImg.style.objectFit = 'contain';
  fabImg.style.filter = 'none';
  fab.appendChild(fabImg);

  const fabBadge = document.createElement('span');
  fabBadge.className = 'fab__badge';
  fab.appendChild(fabBadge);

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.setAttribute('aria-modal', 'true');

  shadow.appendChild(fab);
  shadow.appendChild(drawer);

  // ─── Auto-cleanup ────────────────────────────────────────────────────────────
  try { chrome.runtime.onConnect.addListener(() => {}); } catch(e) {}
  window.addEventListener('unload', () => host.remove());

  // ─── Position ────────────────────────────────────────────────────────────────
  let fabPos = { bottom: 20, right: 20 };

  function applyPos() {
    fab.style.bottom = fabPos.bottom + 'px';
    fab.style.right  = fabPos.right  + 'px';

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let dBottom = fabPos.bottom + 52 + 10;
    const maxBottom = vh - 30;
    dBottom = Math.min(dBottom, maxBottom);
    drawer.style.bottom = dBottom + 'px';

    // Drawer opens toward center: align with FAB edge on whichever side it's snapped
    const isRight = fabPos.right <= vw / 2;
    if (isRight) {
      drawer.style.right = fabPos.right + 'px';
      drawer.style.left  = 'auto';
    } else {
      drawer.style.left  = (vw - fabPos.right - 52) + 'px';
      drawer.style.right = 'auto';
    }
  }

  if (isContextValid()) {
    chrome.storage.local.get([STORAGE_POS], (res) => {
      if (res[STORAGE_POS]) fabPos = res[STORAGE_POS];
      applyPos();
    });
  } else {
    applyPos();
  }

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
    drag0 = { x: e.clientX, y: e.clientY, r: fabPos.right, b: fabPos.bottom };
    fab.setPointerCapture(e.pointerId);
  });

  fab.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    if (!isContextValid()) { host.remove(); return; }
    const dx = drag0.x - e.clientX;
    const dy = drag0.y - e.clientY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
    fabPos.right  = Math.max(4, Math.min(window.innerWidth  - 56, drag0.r + dx));
    fabPos.bottom = Math.max(4, Math.min(window.innerHeight - 56, drag0.b + dy));
    applyPos();
  });

  fab.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;
    if (!isContextValid()) { host.remove(); return; }
    if (dragMoved) {
      // Magnetic snap to nearest horizontal edge
      const fabCenterX = window.innerWidth - fabPos.right - 26;
      if (fabCenterX < window.innerWidth / 2) {
        fabPos.right = window.innerWidth - 52 - 16; // snap left
      } else {
        fabPos.right = 16; // snap right
      }
      fab.style.transition = 'opacity 0.2s, box-shadow 0.2s, transform 0.15s, right 0.3s ease';
      applyPos();
      snapTimeout = setTimeout(() => {
        fab.style.transition = '';
        snapTimeout = null;
      }, 320);
      chrome.storage.local.set({ [STORAGE_POS]: fabPos });
    } else {
      toggleDrawer();
    }
  });

  // ─── Drawer open/close ───────────────────────────────────────────────────────
  let isOpen = false;

  function openDrawer() {
    isOpen = true;
    renderDrawer();
    requestAnimationFrame(() => drawer.classList.add('drawer--open'));
  }

  function closeDrawer() {
    isOpen = false;
    drawer.classList.remove('drawer--open');
  }

  function toggleDrawer() {
    isOpen ? closeDrawer() : openDrawer();
  }

  // Click outside shadow host closes drawer
  document.addEventListener('click', (e) => {
    if (!isOpen) return;
    if (!e.composedPath().includes(host)) closeDrawer();
  }, true);

  // ─── Compatibility badge sync ────────────────────────────────────────────────
  function syncBadge() {
    const compat = window.__kueski_force_compatible !== false;
    fabBadge.classList.toggle('fab__badge--on', compat);
  }

  syncBadge();
  window.addEventListener('kueski:storechange', syncBadge);

  // ─── Render drawer content ───────────────────────────────────────────────────
  function renderDrawer() {
    if (!isContextValid()) { host.remove(); return; }
    chrome.storage.local.get(['kpay_user', 'productoDetectado'], (res) => {
      const user     = res.kpay_user     || null;
      const producto = res.productoDetectado || null;
      const compat   = window.__kueski_force_compatible !== false;
      const tienda   = window.location.hostname.replace(/^www\./, '');
      const disp     = user?.credito_disponible ?? 0;
      const nombre   = user?.nombre ?? '';

      drawer.innerHTML = '';

      // Header
      const hdr = el('div', 'drawer__header');
      const brand = el('div', 'drawer__brand');
      const bi = el('img', 'drawer__brand-img');
      bi.src = isContextValid() ? chrome.runtime.getURL('kueskipay.png') : '';
      bi.style.height = '26px';
      bi.style.width  = 'auto';
      brand.append(bi);
      const closeBtn = el('button', 'drawer__close', '✕');
      closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeDrawer(); });
      hdr.append(brand, closeBtn);
      drawer.appendChild(hdr);

      // Body
      const body = el('div', 'drawer__body');

      // Status badge
      const badge = el('div', compat ? 'drawer__status drawer__status--green' : 'drawer__status drawer__status--red');
      badge.textContent = compat ? `✅ ${tienda} · Compatible` : '❌ Esta tienda no es compatible';
      body.appendChild(badge);

      // Credit available card
      const creditCard = el('div', 'drawer__card');
      const lbl = el('span', 'drawer__card-lbl', 'Crédito disponible');
      const val = el('span', 'drawer__card-val', user
        ? `$${disp.toLocaleString('es-MX')} MXN`
        : 'Inicia sesión');
      creditCard.append(lbl, val);
      if (nombre) {
        const sub = el('span', 'drawer__card-sub', `Hola, ${nombre.split(' ')[0]}`);
        creditCard.appendChild(sub);
      }
      body.appendChild(creditCard);

      if (compat) {
        // Product card (if detected)
        if (producto) {
          const raw = parseFloat(String(producto.precio).replace(/,/g, '')) || 0;
          const cuota = raw > 0 ? `desde $${Math.ceil((raw * 1.12) / 4).toLocaleString('es-MX')} / qna` : '';
          const pc = el('div', 'drawer__product');
          const pn = el('span', 'drawer__product-name', producto.nombre);
          const pr = el('div', 'drawer__product-row');
          const pp = el('span', 'drawer__product-price', `$${raw.toLocaleString('es-MX')}`);
          const pq = el('span', 'drawer__product-quin', cuota || '4 quincenas');
          pr.append(pp, pq);
          pc.append(pn, pr);
          body.appendChild(pc);
        }

        // CTA
        const calcBtn = el('button', 'drawer__btn drawer__btn--primary', 'Calcular financiamiento');
        calcBtn.addEventListener('click', () => {
          if (!isContextValid()) { host.remove(); return; }
          chrome.storage.local.set({ kpay_initial_tab: 'calculadora' });
          chrome.runtime.sendMessage({ action: 'openPopup', tab: 'calculadora' });
          closeDrawer();
        });
        body.appendChild(calcBtn);
      } else {
        const tiendaBtn = el('button', 'drawer__btn drawer__btn--outline', 'Ver tiendas afiliadas');
        tiendaBtn.addEventListener('click', () => {
          if (!isContextValid()) { host.remove(); return; }
          chrome.storage.local.set({ kpay_initial_tab: 'buscar' });
          chrome.runtime.sendMessage({ action: 'openPopup', tab: 'buscar' });
          closeDrawer();
        });
        body.appendChild(tiendaBtn);
      }

      drawer.appendChild(body);

      // Footer
      const footer = el('div', 'drawer__footer');
      const openBtn = el('button', 'drawer__footer-btn', 'Abrir KueskiPay →');
      openBtn.addEventListener('click', () => {
        if (!isContextValid()) { host.remove(); return; }
        chrome.storage.local.set({ kpay_initial_tab: 'inicio' });
        chrome.runtime.sendMessage({ action: 'openPopup', tab: 'inicio' });
        closeDrawer();
      });
      footer.appendChild(openBtn);
      drawer.appendChild(footer);

      applyPos();
    });
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────
  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

})();
