export default function TabHistorial({ historialCrediticio, historialCompras, tiendas, usuario }) {
  const score = historialCrediticio?.score_actual ?? 0
  const pagosTiempo = historialCrediticio?.pagos_a_tiempo ?? 0
  const pagosTardios = historialCrediticio?.pagos_tardios ?? 0
  const lineaTotal = (usuario?.credito_disponible ?? 0) + (usuario?.adeudo_proximo ?? 0)
  const porcentajeUso = lineaTotal > 0
    ? Math.round((usuario.adeudo_proximo / lineaTotal) * 100)
    : 0

  const getScoreInfo = (s) => {
    if (s >= 750) return { label: 'Excelente', color: '#16a34a' }
    if (s >= 650) return { label: 'Bueno',     color: '#1a73e8' }
    if (s >= 550) return { label: 'Regular',   color: '#d97706' }
    return         { label: 'Bajo',            color: '#ef4444' }
  }

  const getTip = (s) => {
    if (s >= 750) return 'Excelente historial. Eres candidato para aumentar tu línea de crédito.'
    if (s >= 650) return 'Buen ritmo. Paga a tiempo este mes para subir tu score.'
    if (s >= 550) return 'Evita usar más del 50% de tu crédito para mejorar tu score.'
    return 'Tienes pagos tardíos. Ponerte al corriente mejora tu score rápido.'
  }

  const { label: scoreLabel, color: scoreColor } = getScoreInfo(score)
  const tip = getTip(score)
  const scorePct = Math.min(score / 850, 1)

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return ''
    const d = new Date(fechaStr)
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getIniciales = (nombre = '') => {
    const palabras = nombre.trim().split(' ')
    if (palabras.length === 1) return nombre.slice(0, 2).toUpperCase()
    return (palabras[0][0] + (palabras[1]?.[0] ?? '')).toUpperCase()
  }

  const GAUGE_W = 132
  const GAUGE_H = 72
  const GAUGE_CX = GAUGE_W / 2
  const GAUGE_CY = GAUGE_H - 4
  const GAUGE_R = 58
  const arcLen = Math.PI * GAUGE_R

  return (
    <div className="historial">

      {/* ── Score hero ─────────────────────────────────────────────────── */}
      <section className="hist-score">
        <div className="hist-section__head">
          <span className="hist-eyebrow">Score crediticio</span>
          <span className="hist-section__meta">Actualizado hoy</span>
        </div>

        <div className="hist-score__main">
          <div className="hist-score__numblock">
            <div className="hist-score__num-row">
              <span className="hist-score__num" style={{ color: scoreColor }}>{score}</span>
              <span className="hist-score__denom">/850</span>
            </div>
            <span className="hist-score__pill" style={{ color: scoreColor, borderColor: scoreColor + '40' }}>
              {scoreLabel}
            </span>
          </div>

          <div className="hist-score__gauge">
            <svg width={GAUGE_W} height={GAUGE_H} viewBox={`0 0 ${GAUGE_W} ${GAUGE_H}`}>
              <path
                d={`M ${GAUGE_CX - GAUGE_R} ${GAUGE_CY} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${GAUGE_CX + GAUGE_R} ${GAUGE_CY}`}
                fill="none"
                stroke="#EEF1F5"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d={`M ${GAUGE_CX - GAUGE_R} ${GAUGE_CY} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${GAUGE_CX + GAUGE_R} ${GAUGE_CY}`}
                fill="none"
                stroke={scoreColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={arcLen}
                strokeDashoffset={arcLen * (1 - scorePct)}
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,.0,.2,1), stroke 0.4s ease' }}
              />
            </svg>
            <div className="hist-score__gauge-ends">
              <span>0</span><span>850</span>
            </div>
          </div>
        </div>

        <div className="hist-metrics">
          <div className="hist-metric">
            <span className="hist-metric__val">{pagosTiempo}</span>
            <span className="hist-metric__lbl">A tiempo</span>
          </div>
          <div className="hist-metric">
            <span className="hist-metric__val">{pagosTardios}</span>
            <span className="hist-metric__lbl">Tardíos</span>
          </div>
          <div className="hist-metric">
            <span className="hist-metric__val">{porcentajeUso}<span className="hist-metric__unit">%</span></span>
            <span className="hist-metric__lbl">Uso de crédito</span>
          </div>
        </div>
      </section>

      {/* ── Tip inline ─────────────────────────────────────────────────── */}
      <aside className="hist-tip">
        <span className="hist-tip__rule" style={{ background: scoreColor }} />
        <p className="hist-tip__text">{tip}</p>
      </aside>

      {/* ── Historial de pagos ────────────────────────────────────────── */}
      <section className="hist-pagos">
        <div className="hist-section__head">
          <span className="hist-eyebrow">Historial de pagos</span>
          <span className="hist-section__meta">
            {historialCompras.length} {historialCompras.length === 1 ? 'pago' : 'pagos'}
          </span>
        </div>

        {historialCompras.length > 0 ? (
          <ul className="hist-list">
            {historialCompras.map((compra, i) => {
              const tienda = tiendas.find(t => t.id_tienda === compra.id_tienda)
              return (
                <li key={compra.id ?? i} className="hist-row">
                  <div className="hist-row__logo">
                    {tienda?.logo ? (
                      <img
                        src={tienda.logo}
                        alt=""
                        className="hist-row__logo-img"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className="hist-row__logo-fallback" style={{ display: tienda?.logo ? 'none' : 'flex' }}>
                      {getIniciales(tienda?.nombre ?? '')}
                    </div>
                  </div>
                  <div className="hist-row__info">
                    <span className="hist-row__tienda">{tienda?.nombre ?? 'Tienda afiliada'}</span>
                    <span className="hist-row__meta">
                      {formatFecha(compra.fecha)} · {compra.quincenas} quincenas
                    </span>
                  </div>
                  <div className="hist-row__amount">
                    <span className="hist-row__monto">
                      ${(compra.monto ?? 0).toLocaleString('es-MX')}
                    </span>
                    <span className="hist-row__status" title="Pagado" />
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="hist-empty">Aún no tienes compras financiadas.</p>
        )}
      </section>
    </div>
  )
}
