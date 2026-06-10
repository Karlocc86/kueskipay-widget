import { describe, it, expect } from 'vitest'
import { buildNotifications } from './notifications'

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
