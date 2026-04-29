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
  '.ui-pdp-title',   // Mercado Libre
  'h1',              // genérico
]

function detectProduct() {
  let precioProducto = null
  for (const selector of PRICE_SELECTORS) {
    const el = document.querySelector(selector)
    if (el && el.textContent.trim()) {
      precioProducto = el.textContent.trim().replace(/[^0-9.,]/g, '')
      if (precioProducto) break
    }
  }

  let nombreProducto = null
  for (const selector of NAME_SELECTORS) {
    const el = document.querySelector(selector)
    if (el && el.textContent.trim()) {
      nombreProducto = el.textContent.trim().slice(0, 120)
      break
    }
  }

  if (precioProducto && nombreProducto) {
    chrome.runtime.sendMessage({
      type: 'PRODUCT_DETECTED',
      data: {
        nombre: nombreProducto,
        precio: precioProducto,
        url: window.location.hostname,
      },
    })
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectProduct)
} else {
  detectProduct()
}
