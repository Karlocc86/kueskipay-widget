import { describe, it, expect } from 'vitest'
import { buildNotifications, buildTestNotification, buildPagoRegistradoNotification } from './notifications'
import { buildPaymentSchedule } from './paymentSchedules'

describe('buildNotifications', () => {
  it('devuelve una nueva instancia cada vez (no comparte estado mutable)', () => {
    const a = buildNotifications()
    const b = buildNotifications()
    expect(a).not.toBe(b)
    a[0].leido = true
    expect(b[0].leido).toBe(false)
  })

  it('cada notificación tiene id único y un grupo conocido', () => {
    const notifs = buildNotifications(buildPaymentSchedule('karlo@gmail.com'))
    const ids = notifs.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
    notifs.forEach((n) => {
      expect(['Hoy', 'Esta semana']).toContain(n.grupo)
    })
  })

  it('incluye notificaciones no leídas para el badge', () => {
    const noLeidas = buildNotifications().filter((n) => !n.leido)
    expect(noLeidas.length).toBeGreaterThan(0)
  })

  it('deriva el aviso de pago del calendario (Karlo: vence pronto con datos reales)', () => {
    const pagos = buildPaymentSchedule('karlo@gmail.com')
    const aviso = buildNotifications(pagos).find((n) => n.tipo === 'pago')
    expect(aviso.titulo).toBe('Tu pago vence pronto')
    expect(aviso.texto).toContain('Amazon')
    expect(aviso.texto).toContain('1,450')
  })

  it('marca el pago vencido más antiguo con la agenda de Camila', () => {
    const pagos = buildPaymentSchedule('camila@gmail.com')
    const aviso = buildNotifications(pagos).find((n) => n.tipo === 'pago')
    expect(aviso.titulo).toBe('Tienes un pago vencido')
    expect(aviso.texto).toContain('Mercado Libre')
    expect(aviso.texto).toContain('780')
  })

  it('refleja el último pago liquidado del calendario (Karlo: Liverpool $899)', () => {
    const pagos = buildPaymentSchedule('karlo@gmail.com')
    const ok = buildNotifications(pagos).find((n) => n.titulo === 'Pago registrado')
    expect(ok.texto).toContain('Liverpool')
    expect(ok.texto).toContain('899')
  })

  it('sin agenda solo quedan las notificaciones genéricas', () => {
    const notifs = buildNotifications()
    expect(notifs.some((n) => n.tipo === 'pago')).toBe(false)
    expect(notifs.some((n) => n.titulo === 'Pago registrado')).toBe(false)
  })
})

describe('buildPagoRegistradoNotification', () => {
  it('arma la notificación con el monto y la tienda del pago', () => {
    const pagos = buildPaymentSchedule('karlo@gmail.com')
    const pago = pagos.find((p) => p.status !== 'pagado')
    const notif = buildPagoRegistradoNotification(pago)
    expect(notif.tipo).toBe('ok')
    expect(notif.grupo).toBe('Hoy')
    expect(notif.leido).toBe(false)
    expect(notif.texto).toContain(pago.tienda)
    expect(notif.texto).toContain(pago.monto.toLocaleString('es-MX'))
  })
})

describe('buildTestNotification', () => {
  it('crea una notificacion push no leida para el grupo de hoy', () => {
    const notif = buildTestNotification('push')

    expect(notif.id).toContain('test-push-')
    expect(notif.grupo).toBe('Hoy')
    expect(notif.leido).toBe(false)
    expect(notif.tiempo).toBe('Ahora')
  })

  it('crea una notificacion de correo con copia de email', () => {
    const notif = buildTestNotification('email')

    expect(notif.id).toContain('test-email-')
    expect(notif.titulo).toContain('Correo')
    expect(notif.texto).toContain('correo registrado')
  })
})
