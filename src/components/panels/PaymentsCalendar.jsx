import { useState, useEffect, useMemo, useRef } from 'react'
import { IconClose, IconBack, IconChevron, IconCheckSm } from '../icons'
import { PAY_LOGO } from '../../data/logos'
import { buildPaymentSchedule } from '../../data/paymentSchedules'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const STATUS_META = {
  vencido:   { label: 'Vencido',    color: '#EF4444', bg: '#FEE9E9' },
  proximo:   { label: 'Próximo',    color: '#F97316', bg: '#FFF3E6' },
  pendiente: { label: 'Programado', color: '#1A73E8', bg: '#EAF2FE' },
  pagado:    { label: 'Pagado',     color: '#10b981', bg: '#E7F8EF' },
}

// "hace 12 días" / "ayer" / "hoy" / "mañana" / "en 4 días"
function fechaRelativa(date, today) {
  const dias = Math.round((date - today) / 86400000)
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'mañana'
  if (dias === -1) return 'ayer'
  return dias > 0 ? `en ${dias} días` : `hace ${-dias} días`
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

export default function PaymentsCalendar({ usuario, onClose }) {
  const ref = useRef()
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc) }
  }, [onClose])

  const [pagos, setPagos] = useState(() => buildPaymentSchedule(usuario?.correo))
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])

  // Pago demo: marca el recordatorio como pagado y confirma con un toast.
  const [payOpenId, setPayOpenId] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const pagarPago = (id) => {
    setPagos(prev => prev.map(p => (p.id === id ? { ...p, status: 'pagado' } : p)))
    setPayOpenId(null)
    setToast('Pago aplicado')
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1800)
  }

  const togglePay = (p) => {
    setSelectedKey(p.key)
    setViewMonth(new Date(p.date.getFullYear(), p.date.getMonth(), 1))
    if (p.status !== 'pagado') setPayOpenId(prev => (prev === p.id ? null : p.id))
  }

  const pagosByDay = useMemo(() => {
    const m = {}
    pagos.forEach(p => { (m[p.key] = m[p.key] || []).push(p) })
    return m
  }, [pagos])

  // Próximo a atender: el vencido más antiguo primero; si no hay, el más cercano por venir.
  const proximo = useMemo(
    () => pagos.find(p => p.status === 'vencido') || pagos.find(p => p.status !== 'pagado' && p.date >= today) || null,
    [pagos, today]
  )

  const [viewMonth, setViewMonth] = useState(() => {
    const base = proximo ? proximo.date : today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
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

  // Indicadores de navegación: rojo en ‹ si quedan atrasos en meses anteriores,
  // azul en › si vienen pagos en meses posteriores al visible.
  const monthIndex = (d) => d.getFullYear() * 12 + d.getMonth()
  const viewIdx = monthIndex(viewMonth)
  const hayAtrasosAntes  = pagos.some(p => p.status === 'vencido' && monthIndex(p.date) < viewIdx)
  const hayPagosDespues  = pagos.some(p => p.status !== 'pagado' && monthIndex(p.date) > viewIdx)

  // Resumen de estados (solo los que existen, en orden de urgencia).
  const resumen = useMemo(() => {
    const counts = { vencido: 0, proximo: 0, pendiente: 0, pagado: 0 }
    pagos.forEach(p => { counts[p.status]++ })
    return ['vencido', 'proximo', 'pendiente', 'pagado']
      .filter(s => counts[s] > 0)
      .map(s => ({ status: s, n: counts[s], meta: STATUS_META[s] }))
  }, [pagos])

  const changeMonth = (delta) => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1))

  const diasRestantes = proximo ? Math.round((proximo.date - today) / 86400000) : 0
  const selectedPagos = pagosByDay[selectedKey] || []

  // Item de pago reutilizado por "día seleccionado" y "todos los programados".
  const renderItem = (p, { conFecha }) => {
    const meta = STATUS_META[p.status]
    const pagado = p.status === 'pagado'
    const abierto = payOpenId === p.id
    return (
      <div key={p.id} className={`paycal-entry ${abierto ? 'paycal-entry--open' : ''}`}>
        <button
          className={`paycal-item ${p.key === selectedKey ? 'paycal-item--active' : ''} ${pagado ? 'paycal-item--pagado' : ''}`}
          onClick={() => togglePay(p)}
          aria-expanded={pagado ? undefined : abierto}
        >
          {conFecha ? (
            <span className="paycal-item__date">
              <span className="paycal-item__date-day">{p.date.getDate()}</span>
              <span className="paycal-item__date-mon">{MESES_CORTO[p.date.getMonth()]}</span>
            </span>
          ) : (
            <PaymentStoreLogo tienda={p.tienda} />
          )}
          <div className="paycal-item__body">
            <span className="paycal-item__store">{p.tienda}</span>
            <span className="paycal-item__cuota">
              Cuota {p.cuota}/{p.totalCuotas}{pagado ? '' : ` · ${fechaRelativa(p.date, today)}`}
            </span>
          </div>
          <div className="paycal-item__right">
            <span className="paycal-item__amount">${fmt(p.monto)}</span>
            <span className="paycal-item__pill" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
          </div>
        </button>
        {!pagado && (
          <div className="paycal-payrow" aria-hidden={!abierto}>
            <div className="paycal-payrow__inner">
              <span className="paycal-payrow__concept">{p.concepto}</span>
              <div className="paycal-payrow__actions">
                <button className="paycal-payrow__cancel" onClick={() => setPayOpenId(null)} tabIndex={abierto ? 0 : -1}>
                  Cerrar
                </button>
                <button className="paycal-payrow__pay" onClick={() => pagarPago(p.id)} tabIndex={abierto ? 0 : -1}>
                  Pagar ${fmt(p.monto)} ahora
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="settings-panel paycal" ref={ref}>
      <div className={`copy-toast ${toast ? 'copy-toast--show' : ''}`} role="status" aria-live="polite">
        <IconCheckSm />
        <span>{toast}</span>
      </div>

      <header className="settings-panel__header">
        <h3 className="settings-panel__title">Calendario de pagos</h3>
        <button className="settings-panel__close" onClick={onClose} aria-label="Cerrar">
          <IconClose />
        </button>
      </header>

      <div className="settings-panel__body">
        {/* Next payment hero */}
        {proximo ? (
          <section className={`paycal-hero paycal-hero--${proximo.status}`}>
            <div className="paycal-hero__top">
              <span className="paycal-hero__eyebrow">
                {proximo.status === 'vencido' ? `Pago vencido · ${fechaRelativa(proximo.date, today)}` : diasRestantes === 0 ? 'Vence hoy' : `Tu próximo pago · en ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}`}
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
            <button className="paycal-hero__cta" onClick={() => pagarPago(proximo.id)}>Pagar ahora</button>
          </section>
        ) : (
          <section className="paycal-hero paycal-hero--aldia">
            <div className="paycal-hero__top">
              <span className="paycal-hero__eyebrow">Estás al día</span>
            </div>
            <div className="paycal-hero__amount">$0<span className="paycal-hero__mxn"> MXN</span></div>
            <span className="paycal-hero__cuota">Sin pagos pendientes. ¡Buen trabajo!</span>
          </section>
        )}

        {/* Calendar */}
        <section className="settings-section">
          <div className="paycal-cal__head">
            <button
              className="paycal-cal__nav"
              onClick={() => changeMonth(-1)}
              aria-label={hayAtrasosAntes ? 'Mes anterior · tienes pagos vencidos' : 'Mes anterior'}
            >
              <IconBack />
              {hayAtrasosAntes && <span className="paycal-cal__nav-dot paycal-cal__nav-dot--rojo" />}
            </button>
            <span className="paycal-cal__month">{MESES[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
            <button
              className="paycal-cal__nav"
              onClick={() => changeMonth(1)}
              aria-label={hayPagosDespues ? 'Mes siguiente · vienen pagos programados' : 'Mes siguiente'}
            >
              <IconChevron />
              {hayPagosDespues && <span className="paycal-cal__nav-dot paycal-cal__nav-dot--azul" />}
            </button>
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
              const topStatus = dayPagos ? (dayPagos.some(p => p.status === 'vencido') ? 'vencido' : dayPagos.some(p => p.status === 'proximo') ? 'proximo' : dayPagos.some(p => p.status === 'pendiente') ? 'pendiente' : 'pagado') : null
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

          <div className="paycal-summary">
            {resumen.map(({ status, n, meta }) => (
              <span key={status} className="paycal-summary__chip" style={{ color: meta.color, background: meta.bg }}>
                <span className="paycal-summary__dot" style={{ background: meta.color }} />
                {n} {meta.label.toLowerCase()}{n > 1 && status !== 'pagado' ? 's' : ''}
              </span>
            ))}
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
              {selectedPagos.map((p) => renderItem(p, { conFecha: false }))}
            </div>
          </section>
        )}

        {/* All upcoming */}
        <section className="settings-section">
          <span className="hist-eyebrow">Todos los pagos programados</span>
          <div className="paycal-list">
            {pagos.map((p) => renderItem(p, { conFecha: true }))}
          </div>
        </section>
      </div>
    </div>
  )
}
