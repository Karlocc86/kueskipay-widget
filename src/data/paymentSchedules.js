// Agendas de pago demo por usuario (correo → calendario).
// Los offsets son relativos a HOY para que la demo siempre tenga datos vivos:
// negativos = pasado (vencido si no está pagado), 0-5 = próximo, >5 = programado.

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mk(offsetDays, monto, tienda, concepto, cuota, totalCuotas, statusOverride) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  const status = statusOverride ?? (offsetDays < 0 ? 'vencido' : offsetDays <= 5 ? 'proximo' : 'pendiente')
  return {
    id: `${tienda}-${cuota}-${offsetDays}`,
    date: d,
    key: dateKey(d),
    monto,
    tienda,
    concepto,
    cuota,
    totalCuotas,
    status,
  }
}

// Karlo (score 850, historial excelente): al corriente, con un pago ya
// liquidado y compras programadas hacia el mes siguiente.
const KARLO = () => [
  mk(-6,  899,  'Liverpool',     'Smartwatch Garmin Venu 3',      1, 4, 'pagado'),
  mk(2,   1450, 'Amazon',        'MacBook Air M3 (enganche)',     2, 8),
  mk(4,   520,  'Walmart',       'Pantalla LG 50" UHD',           3, 4),
  mk(12,  899,  'Liverpool',     'Smartwatch Garmin Venu 3',      2, 4),
  mk(19,  1450, 'Amazon',        'MacBook Air M3',                3, 8),
  mk(33,  520,  'Walmart',       'Pantalla LG 50" UHD',           4, 4),
  mk(40,  899,  'Liverpool',     'Smartwatch Garmin Venu 3',      3, 4),
]

// Camila (score 420, historial malo): atrasos acumulados — uno de hace más de
// un mes (enciende el indicador rojo del botón ‹) y compras aún por vencer.
const CAMILA = () => [
  mk(-40, 780,  'Mercado Libre', 'Bocina JBL PartyBox',           1, 4),
  mk(-12, 1150, 'Amazon',        'Consola PS5 Slim (mensualidad)', 2, 6),
  mk(-3,  430,  'Walmart',       'Despensa quincenal',            1, 2),
  mk(4,   780,  'Mercado Libre', 'Bocina JBL PartyBox',           2, 4),
  mk(18,  1150, 'Amazon',        'Consola PS5 Slim',              3, 6),
]

// Resto de usuarios: agenda genérica (la demo original).
const DEFAULT = () => [
  mk(-2, 540,  'Walmart',        'Smart TV Samsung 55"',          2, 2),
  mk(3,  1200, 'Amazon',         'Audífonos Sony WH-1000XM5',     2, 4),
  mk(9,  649,  'Mercado Libre',  'Tenis Nike Air Max',            1, 2),
  mk(16, 999,  'Liverpool',      'iPhone 15 128GB',               3, 6),
  mk(24, 1200, 'Amazon',         'Audífonos Sony WH-1000XM5',     3, 4),
  mk(31, 649,  'Mercado Libre',  'Tenis Nike Air Max',            2, 2),
]

const SCHEDULES = {
  'karlo@gmail.com': KARLO,
  'camila@gmail.com': CAMILA,
}

export function buildPaymentSchedule(correo) {
  const build = SCHEDULES[(correo || '').toLowerCase()] || DEFAULT
  return build().sort((a, b) => a.date - b.date)
}

// ─── Derivados ────────────────────────────────────────────────────────────────
// El calendario es la fuente única de pagos: notificaciones, adeudo mostrado y
// próximo pago en la UI se calculan desde aquí.

function hoy() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// Próximo a atender: el vencido más antiguo primero; si no hay, el más cercano
// por venir. Asume `pagos` ordenado por fecha (como regresa buildPaymentSchedule).
export function proximoPago(pagos, today = hoy()) {
  return pagos.find(p => p.status === 'vencido')
    || pagos.find(p => p.status !== 'pagado' && p.date >= today)
    || null
}

// Suma de cuotas aún no pagadas: el "en uso / adeudo" que muestran los tabs.
export function adeudoPendiente(pagos) {
  return pagos.filter(p => p.status !== 'pagado').reduce((s, p) => s + p.monto, 0)
}

// Último pago liquidado (alimenta la notificación de "Pago registrado").
export function ultimoPagado(pagos) {
  const pagados = pagos.filter(p => p.status === 'pagado')
  return pagados.length ? pagados.reduce((a, b) => (a.date > b.date ? a : b)) : null
}
