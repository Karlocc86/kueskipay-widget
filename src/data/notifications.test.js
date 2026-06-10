import { describe, it, expect } from 'vitest'
import { buildNotifications, buildTestNotification } from './notifications'

describe('buildNotifications', () => {
  it('devuelve una nueva instancia cada vez (no comparte estado mutable)', () => {
    const a = buildNotifications()
    const b = buildNotifications()
    expect(a).not.toBe(b)
    a[0].leido = true
    expect(b[0].leido).toBe(false)
  })

  it('cada notificación tiene id único y un grupo conocido', () => {
    const notifs = buildNotifications()
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
