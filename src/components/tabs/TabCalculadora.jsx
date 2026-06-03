import { useState } from 'react'

function getRecomendacion(quincenas, score, monto) {
  const cuota = (monto * (1 + 0.03 * quincenas)) / quincenas

  if (score >= 750) {
    return {
      2: `Con tu score excelente puedes pagar en 2 quincenas. Ahorras $${(monto * 0.03 * 2).toFixed(0)} en intereses.`,
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

export default function TabCalculadora({ usuario }) {
  const RATE = 0.03
  const fmt = (n) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const score = usuario?.score_crediticio ?? 0

  const getQuincenasDisponibles = (s) => {
    if (s >= 750) return [2, 4, 6, 8, 10, 12]
    if (s >= 650) return [2, 4, 6, 8]
    if (s >= 550) return [2, 4, 6]
    return [2, 4]
  }

  const quincenasOpciones = getQuincenasDisponibles(score)

  const [monto, setMonto] = useState(513)
  const [rawInput, setRawInput] = useState('513')
  const [quincenas, setQuincenas] = useState(4)
  const [recordatorio, setRecordatorio] = useState(true)
  const [tipoRecordatorio, setTipoRecordatorio] = useState('Ocasional')

  const total = monto * (1 + RATE * quincenas)
  const intereses = total - monto
  const cuota = total / quincenas

  const handleMontoChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setRawInput(raw)
    setMonto(Number(raw) || 0)
  }

  return (
    <div className="calc">
      <div className="calc__body">
        <h2 className="calc__title">Calculadora de Carrito</h2>

        {/* ── Card: Monto + Quincenas ─────────────────────────────── */}
        <section className="calc-card">
          <div className="hist-section__head">
            <span className="hist-eyebrow">Configura tu compra</span>
            <span className="hist-section__meta">{quincenas} {quincenas === 1 ? 'quincena' : 'quincenas'}</span>
          </div>

          <div className="calc__field">
            <label className="calc__field-label">Total a financiar</label>
            <div className="calc__input-wrapper">
              <span className="calc__currency">$</span>
              <input className="calc__input" type="text" inputMode="numeric" value={rawInput} onChange={handleMontoChange} />
              <span className="calc__unit">MXN</span>
            </div>
          </div>

          <div className="calc__selector" style={{ '--cols': quincenasOpciones.length }}>
            <span className="calc__selector-label">QUINCENAS</span>
            <div className="calc__dots-row">
              <div className="calc__line-bar" />
              {quincenasOpciones.map((q) => {
                const active = quincenas === q
                return (
                  <div key={q} className="calc__dot-col">
                    <span className={`calc__q-number ${active ? 'calc__q-number--active' : ''}`}>
                      {q}
                    </span>
                    <button
                      className={`calc__dot ${active ? 'calc__dot--active' : ''}`}
                      onClick={() => setQuincenas(q)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Tip: Recommendation ─────────────────────────────────── */}
        {monto > 0 && (
          <aside className="calc-tip">
            <span className="calc-tip__rule" />
            <p className="calc-tip__text">{getRecomendacion(quincenas, score, monto)}</p>
          </aside>
        )}

        {/* ── Card: Recordatorio de pago ──────────────────────────── */}
        <section className="calc-card">
          <div className="hist-section__head">
            <span className="hist-eyebrow">Recordatorio de pago</span>
            <button
              className={`calc__reminder-toggle ${recordatorio ? 'calc__reminder-toggle--on' : ''}`}
              onClick={() => setRecordatorio(v => !v)}
              aria-label={recordatorio ? 'Desactivar recordatorio' : 'Activar recordatorio'}
            >
              <div className="calc__reminder-toggle-dot" />
            </button>
          </div>
          {recordatorio && (
            <div>
              <span className="calc__reminder-sub">¿Cómo quieres que te avisemos?</span>
              <div className="calc__reminder-btns">
                {['Único', 'Ocasional', 'Frecuente'].map(op => (
                  <button
                    key={op}
                    className={`calc__reminder-btn ${tipoRecordatorio === op ? 'calc__reminder-btn--active' : ''}`}
                    onClick={() => setTipoRecordatorio(op)}
                  >
                    {op}
                  </button>
                ))}
              </div>
              <p className="calc__reminder-desc">
                {tipoRecordatorio === 'Único' && 'Te avisamos 1 día antes del vencimiento.'}
                {tipoRecordatorio === 'Ocasional' && 'Te avisamos 3 días antes, 1 día antes y el día del vencimiento.'}
                {tipoRecordatorio === 'Frecuente' && 'Te avisamos diario a partir de 1 semana antes del vencimiento.'}
              </p>
            </div>
          )}
        </section>

        {/* ── Card: Desglose ──────────────────────────────────────── */}
        <section className="calc-card">
          <div className="hist-section__head">
            <span className="hist-eyebrow">Desglose</span>
            <span className="hist-section__meta">{quincenas} {quincenas === 1 ? 'cuota' : 'cuotas'}</span>
          </div>
          <div className="calc__rows">
            <div className="calc__row"><span>Monto original</span><span>${fmt(monto)}</span></div>
            <hr className="calc__divider" />
            <div className="calc__row"><span>Intereses ({(RATE * 100).toFixed(0)}% / quincena)</span><span>${fmt(intereses)}</span></div>
            <hr className="calc__divider" />
            <div className="calc__row calc__row--bold"><span>Total a pagar</span><span>${fmt(total)}</span></div>
            <hr className="calc__divider" />
            <div className="calc__row calc__row--accent"><span>Cuota quincenal</span><span>${fmt(cuota)}</span></div>
          </div>
        </section>
      </div>
      <div className="calc__footer">
        <div className="calc__footer-info">
          <span className="calc__footer-label">Costo total</span>
          <strong className="calc__footer-amount">${fmt(total)} MXN</strong>
        </div>
        <button className="calc__cta">Continuar</button>
      </div>
    </div>
  )
}
