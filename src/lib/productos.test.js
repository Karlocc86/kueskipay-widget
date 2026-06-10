import { describe, it, expect } from 'vitest'
import { agruparProductosPorNombre } from './productos'

describe('agruparProductosPorNombre', () => {
  it('agrupa por nombre y ordena cada grupo por precio ascendente', () => {
    const grupos = agruparProductosPorNombre([
      { id_producto: 1, nombre: 'iPhone 15', precio: 1500 },
      { id_producto: 2, nombre: 'iPhone 15', precio: 1200 },
      { id_producto: 3, nombre: 'Galaxy S24', precio: 1000 },
    ])

    expect(Object.keys(grupos)).toEqual(['iPhone 15', 'Galaxy S24'])
    expect(grupos['iPhone 15'].map((p) => p.precio)).toEqual([1200, 1500])
  })

  it('el primer elemento de cada grupo es el de mejor precio', () => {
    const grupos = agruparProductosPorNombre([
      { id_producto: 1, nombre: 'TV', precio: 900 },
      { id_producto: 2, nombre: 'TV', precio: 300 },
      { id_producto: 3, nombre: 'TV', precio: 600 },
    ])
    expect(grupos['TV'][0].precio).toBe(300)
  })

  it('devuelve un objeto vacío sin resultados', () => {
    expect(agruparProductosPorNombre([])).toEqual({})
    expect(agruparProductosPorNombre()).toEqual({})
  })
})
