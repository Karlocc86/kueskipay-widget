import { describe, it, expect } from 'vitest'
import { getIniciales } from './format'

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
