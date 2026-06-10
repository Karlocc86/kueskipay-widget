import { describe, it, expect } from 'vitest'
import { buildPaymentSchedule, proximoPago, adeudoPendiente, ultimoPagado } from './paymentSchedules'

// Pago mínimo con fecha relativa a hoy, como los que genera buildPaymentSchedule.
function pago(offsetDays, monto, status) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  return { id: `p${offsetDays}`, date: d, monto, status, tienda: 'Demo', cuota: 1, totalCuotas: 2 }
}

describe('buildPaymentSchedule', () => {
  it('regresa los pagos ordenados por fecha', () => {
    const pagos = buildPaymentSchedule('karlo@gmail.com')
    for (let i = 1; i < pagos.length; i++) {
      expect(pagos[i].date >= pagos[i - 1].date).toBe(true)
    }
  })
})

describe('proximoPago', () => {
  it('prioriza el vencido más antiguo', () => {
    const pagos = [pago(-10, 100, 'vencido'), pago(-2, 200, 'vencido'), pago(3, 300, 'proximo')]
    expect(proximoPago(pagos).monto).toBe(100)
  })

  it('sin vencidos toma el siguiente por venir no pagado', () => {
    const pagos = [pago(-5, 100, 'pagado'), pago(2, 200, 'proximo'), pago(9, 300, 'pendiente')]
    expect(proximoPago(pagos).monto).toBe(200)
  })

  it('regresa null cuando todo está pagado', () => {
    expect(proximoPago([pago(-5, 100, 'pagado')])).toBeNull()
  })
})

describe('adeudoPendiente', () => {
  it('suma solo las cuotas no pagadas', () => {
    const pagos = [pago(-5, 100, 'pagado'), pago(2, 200, 'proximo'), pago(9, 300, 'pendiente')]
    expect(adeudoPendiente(pagos)).toBe(500)
  })

  it('es cero sin pagos pendientes', () => {
    expect(adeudoPendiente([pago(-5, 100, 'pagado')])).toBe(0)
  })
})

describe('ultimoPagado', () => {
  it('regresa el pago liquidado más reciente', () => {
    const pagos = [pago(-20, 100, 'pagado'), pago(-3, 200, 'pagado'), pago(2, 300, 'proximo')]
    expect(ultimoPagado(pagos).monto).toBe(200)
  })

  it('regresa null cuando no hay pagados', () => {
    expect(ultimoPagado([pago(2, 300, 'proximo')])).toBeNull()
  })
})
