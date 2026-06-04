import { useState, useEffect, useMemo, useRef } from 'react'
import { IconClose, IconBack, IconChevron } from '../icons'
import { PAY_LOGO } from '../../data/logos'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildPaymentSchedule() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const mk = (offsetDays, monto, tienda, concepto, cuota, totalCuotas) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offsetDays)
    d.setHours(0, 0, 0, 0)
    const status = offsetDays < 0 ? 'vencido' : offsetDays <= 5 ? 'proximo' : 'pendiente'
    return { date: d, key: dateKey(d), monto, tienda, concepto, cuota, totalCuotas, status }
  }
  return [
    mk(-2, 540,  'Walmart',        'Smart TV Samsung 55"',         2, 2),
    mk(3,  1200, 'Amazon',         'Audífonos Sony WH-1000XM5',    2, 4),
    mk(9,  649,  'Mercado Libre',  'Tenis Nike Air Max',           1, 2),
    mk(16, 999,  'Liverpool',      'iPhone 15 128GB',              3, 6),
    mk(24, 1200, 'Amazon',         'Audífonos Sony WH-1000XM5',    3, 4),
    mk(31, 649,  'Mercado Libre',  'Tenis Nike Air Max',           2, 2),
  ].sort((a, b) => a.date - b.date)
}

const STATUS_META = {
  vencido:   { label: 'Vencido',    color: '#EF4444', bg: '#FEE9E9' },
  proximo:   { label: 'Próximo',    color: '#F97316', bg: '#FFF3E6' },
  pendiente: { label: 'Programado', color: '#1A73E8', bg: '#EAF2FE' },
  pagado:    { label: 'Pagado',     color: '#10b981', bg: '#E7F8EF' },
}

function PaymentStoreLogo({ tienda }) {
  const logo = PAY_LOGO[tienda]
  const initials = tienda.split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase()
  return (
    <span className="paycal-item__logo">
      {logo ? (
        <img src={logo} alt="" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
      ) : null}
      <span className="paycal-item__initials" style={{ display: logo ? 'none' : 'flex' }}>{initials}</span>
    </span>
  )
}

export default function PaymentsCalendar({ onClose }) {
  const ref = useRef()
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc) }
  }, [onClose])

  const pagos = useMemo(() => buildPaymentSchedule(), [])
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])

  const pagosByDay = useMemo(() => {
    const m = {}
    pagos.forEach(p => { (m[p.key] = m[p.key] || []).push(p) })
    return m
  }, [pagos])

  const proximo = useMemo(
    () => pagos.find(p => p.status !== 'pagado' && p.date >= today) || pagos.find(p => p.status === 'vencido') || pagos[0],
    [pagos, today]
  )

  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedKey, setSelectedKey] = useState(proximo ? proximo.key : dateKey(today))

  const fmt = (n) => n.toLocaleString('es-MX')

  const grid = useMemo(() => {
    const y = viewMonth.getFullYear()
    const m = viewMonth.getMonth()
    const first = new Date(y, m, 1)
    const startDow = (first.getDay() + 6) % 7
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d))
    return cells
  }, [viewMonth])

  const monthTotal = useMemo(
    () => pagos
      .filter(p => p.date.getMonth() === viewMonth.getMonth() && p.date.getFullYear() === viewMonth.getFullYear() && p.status !== 'pagado')
      .reduce((s, p) => s + p.monto, 0),
    [pagos, viewMonth]
  )

  const changeMonth = (delta) => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1))

  const diasRestantes = proximo ? Math.round((proximo.date - today) / 86400000) : 0
  const selectedPagos = pagosByDay[selectedKey] || []

  return (
    <div className="settings-panel paycal" ref={ref}>
      <header className="settings-panel__header">
        <h3 className="settings-panel__title">Calendario de pagos</h3>
        <button className="settings-panel__close" onClick={onClose} aria-label="Cerrar">
          <IconClose />
        </button>
      </header>

      <div className="settings-panel__body">
        {/* Next payment hero */}
        {proximo && (
          <section className={`paycal-hero paycal-hero--${proximo.status}`}>
            <div className="paycal-hero__top">
              <span className="paycal-hero__eyebrow">
                {proximo.status === 'vencido' ? 'Pago vencido' : diasRestantes === 0 ? 'Vence hoy' : `Tu próximo pago · en ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}`}
              </span>
              <span className="paycal-hero__date">
                {proximo.date.getDate()} {MESES_CORTO[proximo.date.getMonth()]}
              </span>
            </div>
            <div className="paycal-hero__amount">${fmt(proximo.monto)}<span className="paycal-hero__mxn"> MXN</span></div>
            <div className="paycal-hero__row">
              <PaymentStoreLogo tienda={proximo.tienda} />
              <div className="paycal-hero__concept">
                <span className="paycal-hero__store">{proximo.tienda}</span>
                <span className="paycal-hero__cuota">Cuota {proximo.cuota} de {proximo.totalCuotas} · {proximo.concepto}</span>
              </div>
            </div>
            <button className="paycal-hero__cta">Pagar ahora</button>
          </section>
        )}

        {/* Calendar */}
        <section className="settings-section">
          <div className="paycal-cal__head">
            <button className="paycal-cal__nav" onClick={() => changeMonth(-1)} aria-label="Mes anterior"><IconBack /></button>
            <span className="paycal-cal__month">{MESES[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
            <button className="paycal-cal__nav" onClick={() => changeMonth(1)} aria-label="Mes siguiente"><IconChevron /></button>
          </div>

          <div className="paycal-cal__grid paycal-cal__grid--dow">
            {DIAS_SEMANA.map((d, i) => <span key={i} className="paycal-cal__dow">{d}</span>)}
          </div>
          <div className="paycal-cal__grid">
            {grid.map((d, i) => {
              if (!d) return <span key={i} className="paycal-cal__cell paycal-cal__cell--empty" />
              const k = dateKey(d)
              const dayPagos = pagosByDay[k]
              const isToday = k === dateKey(today)
              const isSelected = k === selectedKey
              const topStatus = dayPagos ? (dayPagos.some(p => p.status === 'vencido') ? 'vencido' : dayPagos.some(p => p.status === 'proximo') ? 'proximo' : 'pendiente') : null
              return (
                <button
                  key={i}
                  className={`paycal-cal__cell ${isSelected ? 'paycal-cal__cell--selected' : ''} ${isToday ? 'paycal-cal__cell--today' : ''} ${dayPagos ? 'paycal-cal__cell--has' : ''}`}
                  onClick={() => setSelectedKey(k)}
                  style={isSelected && topStatus ? { '--cell-accent': STATUS_META[topStatus].color } : undefined}
                >
                  <span className="paycal-cal__num">{d.getDate()}</span>
                  {dayPagos && (
                    <span className="paycal-cal__dots">
                      {dayPagos.slice(0, 3).map((p, j) => (
                        <span key={j} className="paycal-cal__dot" style={{ background: STATUS_META[p.status].color }} />
                      ))}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="paycal-cal__total">
            <span>Total de {MESES[viewMonth.getMonth()]}</span>
            <strong>${fmt(monthTotal)} MXN</strong>
          </div>
        </section>

        {/* Selected day detail */}
        {selectedPagos.length > 0 && (
          <section className="settings-section">
            <span className="hist-eyebrow">
              {(() => {
                const [, mm, dd] = selectedKey.split('-').map(Number)
                return `${dd} de ${MESES[mm - 1]}`
              })()}
            </span>
            <div className="paycal-list">
              {selectedPagos.map((p, i) => {
                const meta = STATUS_META[p.status]
                return (
                  <div key={i} className="paycal-item paycal-item--selected">
                    <PaymentStoreLogo tienda={p.tienda} />
                    <div className="paycal-item__body">
                      <span className="paycal-item__store">{p.tienda}</span>
                      <span className="paycal-item__cuota">Cuota {p.cuota}/{p.totalCuotas} · {p.concepto}</span>
                    </div>
                    <div className="paycal-item__right">
                      <span className="paycal-item__amount">${fmt(p.monto)}</span>
                      <span className="paycal-item__pill" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* All upcoming */}
        <section className="settings-section">
          <span className="hist-eyebrow">Todos los pagos programados</span>
          <div className="paycal-list">
            {pagos.map((p, i) => {
              const meta = STATUS_META[p.status]
              const isSel = p.key === selectedKey
              return (
                <button
                  key={i}
                  className={`paycal-item ${isSel ? 'paycal-item--active' : ''}`}
                  onClick={() => { setSelectedKey(p.key); setViewMonth(new Date(p.date.getFullYear(), p.date.getMonth(), 1)) }}
                >
                  <span className="paycal-item__date">
                    <span className="paycal-item__date-day">{p.date.getDate()}</span>
                    <span className="paycal-item__date-mon">{MESES_CORTO[p.date.getMonth()]}</span>
                  </span>
                  <div className="paycal-item__body">
                    <span className="paycal-item__store">{p.tienda}</span>
                    <span className="paycal-item__cuota">Cuota {p.cuota}/{p.totalCuotas}</span>
                  </div>
                  <div className="paycal-item__right">
                    <span className="paycal-item__amount">${fmt(p.monto)}</span>
                    <span className="paycal-item__pill" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
