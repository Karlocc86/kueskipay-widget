// Pure financing logic for the cart calculator.
// Extracted from TabCalculadora so it can be unit-tested in isolation.

/** Interés por quincena (3%). */
export const RATE = 0.03

/** Quincenas disponibles según el score crediticio del usuario. */
export function getQuincenasDisponibles(score) {
  if (score >= 750) return [2, 4, 6, 8, 10, 12]
  if (score >= 650) return [2, 4, 6, 8]
  if (score >= 550) return [2, 4, 6]
  return [2, 4]
}

/**
 * Desglose de la compra financiada.
 * @returns {{ total: number, intereses: number, cuota: number }}
 */
export function calcularDesglose(monto, quincenas, rate = RATE) {
  const total = monto * (1 + rate * quincenas)
  const intereses = total - monto
  const cuota = quincenas > 0 ? total / quincenas : 0
  return { total, intereses, cuota }
}

/**
 * Mensaje de recomendación según quincenas, score y monto.
 * Devuelve undefined si la combinación no tiene mensaje (p. ej. plazo bloqueado).
 */
export function getRecomendacion(quincenas, score, monto, rate = RATE) {
  const cuota = (monto * (1 + rate * quincenas)) / quincenas

  if (score >= 750) {
    return {
      2: `Con tu score excelente puedes pagar en 2 quincenas. Ahorras $${(monto * rate * 2).toFixed(0)} en intereses.`,
      4: `Opción equilibrada. Tu score te permite acceder a mejores tasas en el futuro.`,
      6: `Cuotas de $${cuota.toFixed(0)} MXN. Con tu historial podrías solicitar un aumento de línea.`,
      8: `Aunque puedes pagarlo, con tu score es mejor en menos quincenas para ahorrar intereses.`,
      10: `Cuotas muy cómodas de $${cuota.toFixed(0)} MXN. Considera que pagarás más intereses en total.`,
      12: `Máximo plazo disponible. Cuotas de $${cuota.toFixed(0)} MXN. Solo recomendado para montos grandes.`
    }[quincenas]
  } else if (score >= 650) {
    return {
      2: `Cuotas altas de $${cuota.toFixed(0)} MXN. Asegúrate de tener liquidez suficiente.`,
      4: `Mejor opción para tu score actual. Pagar a tiempo mejorará tu historial.`,
      6: `Cuotas cómodas de $${cuota.toFixed(0)} MXN. Cada pago puntual suma puntos a tu score.`,
      8: `Bloqueado — mejora tu score a 750+ para acceder a 8 quincenas.`,
    }[quincenas]
  } else if (score >= 550) {
    return {
      2: `Cuotas elevadas. Solo elige 2 quincenas si tienes el dinero asegurado.`,
      4: `Recomendado para tu score. Pagar puntual puede subir tu score hasta 30 puntos.`,
      6: `Cuotas de $${cuota.toFixed(0)} MXN. No uses más del 60% de tu crédito disponible.`,
      8: `Bloqueado — necesitas score 750+ para 8 quincenas.`,
    }[quincenas]
  } else {
    return {
      2: `Tu score es bajo. Pagar estas 2 quincenas a tiempo puede recuperar hasta 50 puntos.`,
      4: `Opción más segura con tu score actual. Activa recordatorios de pago.`,
      6: `No recomendado — con score bajo, más quincenas aumentan el riesgo de mora.`,
      8: `Bloqueado — necesitas score 750+ para 8 quincenas.`,
    }[quincenas]
  }
}
