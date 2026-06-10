import { describe, it, expect } from 'vitest'
import { RATE, getQuincenasDisponibles, calcularDesglose, getRecomendacion } from './finance'

describe('getQuincenasDisponibles', () => {
  it('desbloquea todos los plazos con score excelente (>= 750)', () => {
    expect(getQuincenasDisponibles(850)).toEqual([2, 4, 6, 8, 10, 12])
    expect(getQuincenasDisponibles(750)).toEqual([2, 4, 6, 8, 10, 12])
  })

  it('escala los plazos por tramo de score', () => {
    expect(getQuincenasDisponibles(700)).toEqual([2, 4, 6, 8])
    expect(getQuincenasDisponibles(600)).toEqual([2, 4, 6])
    expect(getQuincenasDisponibles(500)).toEqual([2, 4])
  })

  it('da el mínimo a score 0 / indefinido', () => {
    expect(getQuincenasDisponibles(0)).toEqual([2, 4])
  })
})

describe('calcularDesglose', () => {
  it('aplica el interés por quincena (3% por defecto)', () => {
    const { total, intereses, cuota } = calcularDesglose(1000, 4)
    // 1000 * (1 + 0.03*4) = 1120
    expect(total).toBeCloseTo(1120)
    expect(intereses).toBeCloseTo(120)
    expect(cuota).toBeCloseTo(280)
  })

  it('respeta una tasa personalizada', () => {
    const { total } = calcularDesglose(1000, 2, 0.05)
    expect(total).toBeCloseTo(1100)
  })

  it('no divide entre cero cuando quincenas = 0', () => {
    const { cuota } = calcularDesglose(1000, 0)
    expect(cuota).toBe(0)
  })

  it('expone RATE = 0.03', () => {
    expect(RATE).toBe(0.03)
  })
})

describe('getRecomendacion', () => {
  it('devuelve un mensaje para combinaciones válidas', () => {
    const msg = getRecomendacion(2, 850, 1000)
    expect(msg).toContain('score excelente')
    // Ahorro = monto * rate * 2 = 1000 * 0.03 * 2 = 60
    expect(msg).toContain('$60')
  })

  it('marca como bloqueado un plazo no permitido para el tramo', () => {
    expect(getRecomendacion(8, 700, 1000)).toContain('Bloqueado')
  })

  it('devuelve undefined si el plazo no existe en el tramo', () => {
    // score 700 (tramo 650) no define 10 quincenas
    expect(getRecomendacion(10, 700, 1000)).toBeUndefined()
  })
})
