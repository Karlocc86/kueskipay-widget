// KueskiPay – Service worker.
// Centraliza el producto detectado, la apertura del popup y la verificación
// de tiendas afiliadas (el fetch vive aquí: no está sujeto al CSP de la página).

const SUPABASE_URL = 'https://nhpkrbgvdtjwvgrvjqyf.supabase.co'
// Anon key pública (la misma que viaja en el bundle del popup).
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocGtyYmd2ZHRqd3ZncnZqcXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MjYyNDYsImV4cCI6MjA5MzAwMjI0Nn0.Xj1AWTEEecry6dv8tV7ZiqwA43pwDPdOgbnZp9AlybI'

// Afiliadas garantizadas aunque la base de datos no responda.
const AFILIADAS_FALLBACK = ['amazon.com.mx', 'mercadolibre.com.mx', 'nike.com']

// Caché por hostname mientras viva el service worker.
const affiliationCache = new Map()

function esAfiliadaHardcodeada(hostname) {
  return AFILIADAS_FALLBACK.some((dominio) => hostname.includes(dominio))
}

async function checkAffiliation(hostname) {
  if (esAfiliadaHardcodeada(hostname)) return true
  if (affiliationCache.has(hostname)) return affiliationCache.get(hostname)

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/tiendas_afiliadas?select=url&url=ilike.*${encodeURIComponent(hostname)}*`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    )
    if (!res.ok) throw new Error(`Supabase ${res.status}`)
    const data = await res.json()
    const affiliated = Array.isArray(data) && data.length > 0
    affiliationCache.set(hostname, affiliated)
    return affiliated
  } catch {
    // Sin base de datos el comportamiento queda hardcodeado: solo la lista fija.
    return esAfiliadaHardcodeada(hostname)
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PRODUCT_DETECTED') {
    chrome.storage.local.set({ productoDetectado: message.data })
  }

  if (message.action === 'openPopup') {
    chrome.storage.local.set({ kpay_initial_tab: message.tab })
    chrome.action.openPopup()
  }

  if (message.type === 'CHECK_AFFILIATION') {
    checkAffiliation(message.hostname || '').then((affiliated) => sendResponse({ affiliated }))
    return true // respuesta asíncrona
  }
})
