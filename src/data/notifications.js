// Demo notifications feed (no backend yet). Grouped by "Hoy" / "Esta semana".
export function buildNotifications() {
  return [
    { id: 'n1', tipo: 'pago',   grupo: 'Hoy',         titulo: 'Tu pago vence pronto',  texto: 'La cuota de Amazon por $1,200 vence en 3 días.',          tiempo: 'Hace 2 h',   leido: false },
    { id: 'n2', tipo: 'cupon',  grupo: 'Hoy',         titulo: 'Nuevo cupón para ti',   texto: 'Tienes 10% de descuento en Amazon. Revísalo en Cupones.', tiempo: 'Hace 5 h',   leido: false },
    { id: 'n3', tipo: 'linea',  grupo: 'Esta semana', titulo: '¡Tu línea subió!',      texto: 'Felicidades, tu línea de crédito aumentó a $6,000 MXN.',  tiempo: 'Ayer',       leido: false },
    { id: 'n4', tipo: 'ok',     grupo: 'Esta semana', titulo: 'Pago registrado',       texto: 'Recibimos tu pago de $540 de Walmart. ¡Gracias!',        tiempo: 'Hace 3 días', leido: true  },
    { id: 'n5', tipo: 'tienda', grupo: 'Esta semana', titulo: 'Nueva tienda afiliada', texto: 'Ya puedes pagar en Liverpool a quincenas con KueskiPay.', tiempo: 'Hace 5 días', leido: true  },
  ]
}
