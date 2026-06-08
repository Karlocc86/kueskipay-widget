// KueskiPay – Detección de producto/precio en la página.
// Reintenta mientras el precio carga (async) y vuelve a detectar en navegación SPA.

const PRICE_SELECTORS = [
  '.a-price-whole',                   // Amazon
  '.andes-money-amount__fraction',    // Mercado Libre
  '[data-testid="price"]',            // Liverpool
  '.price-main',                      // Walmart
  '.price',                           // genérico
  '[class*="price"]',                 // cualquier clase con price
]

const NAME_SELECTORS = [
  '#productTitle',    // Amazon
  '.ui-pdp-title',    // Mercado Libre
  'h1',               // genérico
]

function leerProducto() {
  let precio = null
  for (const selector of PRICE_SELECTORS) {
    const el = document.querySelector(selector)
    const txt = el?.textContent?.trim()
    if (txt) {
      const limpio = txt.replace(/[^0-9.,]/g, '')
      if (limpio && /\d/.test(limpio)) { precio = limpio; break }
    }
  }

  let nombre = null
  for (const selector of NAME_SELECTORS) {
    const el = document.querySelector(selector)
    const txt = el?.textContent?.trim()
    if (txt) { nombre = txt.slice(0, 120); break }
  }

  return precio && nombre ? { nombre, precio } : null
}

let ultimoEnviado = null

function publicar(producto) {
  if (!producto) return
  const huella = `${producto.nombre}|${producto.precio}`
  if (huella === ultimoEnviado) return        // evita spam de mensajes idénticos
  ultimoEnviado = huella
  try {
    chrome.runtime.sendMessage({
      type: 'PRODUCT_DETECTED',
      data: {
        nombre: producto.nombre,
        precio: producto.precio,
        url: window.location.hostname.replace(/^www\./, ''),
        ts: Date.now(),
      },
    })
  } catch { /* contexto de extensión invalidado */ }
}

// El precio suele cargar de forma asíncrona: reintenta unas cuantas veces.
function detectarConReintentos(intentos = 6, intervalo = 600) {
  const producto = leerProducto()
  if (producto) { publicar(producto); return }
  if (intentos > 0) setTimeout(() => detectarConReintentos(intentos - 1, intervalo), intervalo)
}

function reiniciarDeteccion() {
  ultimoEnviado = null
  detectarConReintentos()
}

// ─── Arranque ───────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => detectarConReintentos())
} else {
  detectarConReintentos()
}

// ─── Re-detección en navegación SPA (Amazon, Mercado Libre, etc.) ────────────
let urlActual = window.location.href
const onPosibleCambioUrl = () => {
  if (window.location.href === urlActual) return
  urlActual = window.location.href
  reiniciarDeteccion()
}

const _push = history.pushState
history.pushState = function (...args) { _push.apply(this, args); onPosibleCambioUrl() }
const _replace = history.replaceState
history.replaceState = function (...args) { _replace.apply(this, args); onPosibleCambioUrl() }
window.addEventListener('popstate', onPosibleCambioUrl)
