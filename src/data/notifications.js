// Feed de notificaciones demo. Las notificaciones de PAGO se derivan del
// calendario de pagos (fuente única): mismo monto, tienda y fecha que muestra
// PaymentsCalendar. Las de cupón/línea/tienda siguen siendo fijas.
import { proximoPago, ultimoPagado } from './paymentSchedules'
import { fechaRelativa } from '../lib/format'

const fmt = (n) => n.toLocaleString('es-MX')

function hoy() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Notificación de pago aplicado (la usa Dashboard al pagar desde el calendario).
export function buildPagoRegistradoNotification(pago) {
  return {
    id: `pago-ok-${pago.id}-${Date.now()}`,
    tipo: 'ok',
    grupo: 'Hoy',
    titulo: 'Pago registrado',
    texto: `Recibimos tu pago de $${fmt(pago.monto)} de ${pago.tienda}. ¡Gracias!`,
    tiempo: 'Ahora',
    leido: false,
  }
}

export function buildNotifications(pagos = []) {
  const today = hoy()
  const notifs = []

  // Aviso del pago a atender, calcado del hero del calendario.
  const proximo = proximoPago(pagos, today)
  if (proximo) {
    const vencido = proximo.status === 'vencido'
    notifs.push({
      id: `pago-${proximo.id}`,
      tipo: 'pago',
      grupo: 'Hoy',
      titulo: vencido ? 'Tienes un pago vencido' : 'Tu pago vence pronto',
      texto: vencido
        ? `La cuota ${proximo.cuota} de ${proximo.totalCuotas} de ${proximo.tienda} por $${fmt(proximo.monto)} venció ${fechaRelativa(proximo.date, today)}.`
        : `La cuota de ${proximo.tienda} por $${fmt(proximo.monto)} vence ${fechaRelativa(proximo.date, today)}.`,
      tiempo: 'Hace 2 h',
      leido: false,
    })
  }

  notifs.push(
    { id: 'n2', tipo: 'cupon', grupo: 'Hoy', titulo: 'Nuevo cupón para ti', texto: 'Tienes 10% de descuento en Amazon. Revísalo en Cupones.', tiempo: 'Hace 5 h', leido: false },
  )

  // Último pago liquidado del calendario.
  const pagado = ultimoPagado(pagos)
  if (pagado) {
    notifs.push({
      id: `pagado-${pagado.id}`,
      tipo: 'ok',
      grupo: 'Esta semana',
      titulo: 'Pago registrado',
      texto: `Recibimos tu pago de $${fmt(pagado.monto)} de ${pagado.tienda}. ¡Gracias!`,
      tiempo: capitalizar(fechaRelativa(pagado.date, today)),
      leido: true,
    })
  }

  notifs.push(
    { id: 'n5', tipo: 'tienda', grupo: 'Esta semana', titulo: 'Nueva tienda afiliada', texto: 'Ya puedes pagar en Liverpool a quincenas con KueskiPay.', tiempo: 'Hace 5 días', leido: true },
  )

  return notifs
}

export function buildTestNotification(channel = 'push') {
  const isEmail = channel === 'email'
  return {
    id: `test-${channel}-${Date.now()}`,
    tipo: isEmail ? 'ok' : 'pago',
    grupo: 'Hoy',
    titulo: isEmail ? 'Correo de prueba enviado' : 'Notificacion push de prueba',
    texto: isEmail
      ? 'Te enviamos un aviso de prueba a tu correo registrado.'
      : 'Tus recordatorios push estan activos para pagos y cupones.',
    tiempo: 'Ahora',
    leido: false,
  }
}
