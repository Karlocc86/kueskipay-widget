import { describe, it, expect } from 'vitest'
import { getIniciales, fechaRelativa } from './format'

describe('getIniciales', () => {
  it('toma la inicial de las dos primeras palabras', () => {
    expect(getIniciales('Mercado Libre')).toBe('ML')
    expect(getIniciales('Palacio de Hierro')).toBe('PD')
  })

  it('usa las dos primeras letras cuando hay una sola palabra', () => {
    expect(getIniciales('Amazon')).toBe('AM')
  })

  it('normaliza espacios extra y mayúsculas', () => {
    expect(getIniciales('  mercado   libre ')).toBe('ML')
  })

  it('devuelve cadena vacía para entradas vacías', () => {
    expect(getIniciales('')).toBe('')
    expect(getIniciales('   ')).toBe('')
    expect(getIniciales()).toBe('')
  })
})

describe('fechaRelativa', () => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const dias = (n) => {
    const d = new Date(hoy)
    d.setDate(d.getDate() + n)
    return d
  }

  it('reconoce hoy, mañana y ayer', () => {
    expect(fechaRelativa(dias(0), hoy)).toBe('hoy')
    expect(fechaRelativa(dias(1), hoy)).toBe('mañana')
    expect(fechaRelativa(dias(-1), hoy)).toBe('ayer')
  })

  it('cuenta días hacia adelante y hacia atrás', () => {
    expect(fechaRelativa(dias(4), hoy)).toBe('en 4 días')
    expect(fechaRelativa(dias(-12), hoy)).toBe('hace 12 días')
  })
})
