import { useState } from 'react'
import { RATE, getQuincenasDisponibles, calcularDesglose, getRecomendacion } from '../../lib/finance'

export default function TabCalculadora({ usuario }) {
  const fmt = (n) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const score = usuario?.score_crediticio ?? 0

  const quincenasOpciones = getQuincenasDisponibles(score)

  const [monto, setMonto] = useState(513)
  const [rawInput, setRawInput] = useState('513')
  const [quincenas, setQuincenas] = useState(4)
  const [recordatorio, setRecordatorio] = useState(true)
  const [tipoRecordatorio, setTipoRecordatorio] = useState('Ocasional')

  const { total, intereses, cuota } = calcularDesglose(monto, quincenas)

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
