import { useState, useMemo, useEffect, useRef } from 'react'
import logo from '../assets/KueskiPay-Logo.png'
import { supabase } from '../supabaseClient'
import './Dashboard.css'

// ─── Icons ───────────────────────────────────────────────────────────────────
const IconBell = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
const IconSettings = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
const IconHome = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const IconCalc = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="8.01" y2="11" strokeWidth="3" /><line x1="12" y1="11" x2="12.01" y2="11" strokeWidth="3" /><line x1="16" y1="11" x2="16.01" y2="11" strokeWidth="3" /><line x1="8" y1="15" x2="8.01" y2="15" strokeWidth="3" /><line x1="12" y1="15" x2="12.01" y2="15" strokeWidth="3" /><line x1="16" y1="15" x2="16.01" y2="15" strokeWidth="3" /><line x1="8" y1="19" x2="12" y2="19" /><line x1="16" y1="19" x2="16.01" y2="19" strokeWidth="3" /></svg>
const IconSearch = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
const IconChart = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
const IconMoney = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="12" cy="12" r="3" /></svg>
const IconCalendar = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
const IconStore = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4" /><circle cx="9" cy="19" r="1" /><circle cx="20" cy="19" r="1" /></svg>

// ─── Helper ──────────────────────────────────────────────────────────────────
function formatVencimiento(fechaStr) {
  if (!fechaStr) return ''
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(fechaStr + 'T00:00:00')
  const diff = Math.round((fecha - hoy) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Pago vencido'
  if (diff === 0) return 'Vence hoy'
  return `Vence en ${diff} día${diff !== 1 ? 's' : ''}`
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function DonutChart({ disponible, total, isCompatible }) {
  const RADIUS = 38
  const STROKE = 11
  const SIZE = 110
  const C = SIZE / 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const pct = total > 0 ? (total - disponible) / total : 0
  const offset = CIRCUMFERENCE * (1 - pct)

  const arcColor = !isCompatible
    ? '#6b7280'
    : pct <= 0.30 ? '#00C46A'
    : pct <= 0.60 ? '#1A73E8'
    : pct <= 0.80 ? '#F97316'
    : '#EF4444'

  return (
    <div className="donut">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={C} cy={C} r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth={STROKE} />
        <circle
          cx={C} cy={C} r={RADIUS}
          fill="none"
          stroke={arcColor}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(90 ${C} ${C})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
        />
      </svg>
      <div className="donut__inner">
        <span className="donut__amount" style={{ color: '#1a1a2e' }}>
          ${disponible.toLocaleString('es-MX')}
        </span>
        <span className="donut__label">MXN DISPONIBLE</span>
      </div>
    </div>
  )
}

// ─── Credit Card ─────────────────────────────────────────────────────────────
function CreditCard({ usuario, isCompatible }) {
  return (
    <div className={`credit-card ${!isCompatible ? 'credit-card--disabled' : ''}`}>
      <div className="credit-card__top">
        <span className="credit-card__brand">KueskiPay</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
          <path d="M8 2a9 9 0 0 1 0 20" /><path d="M12 6a5 5 0 0 1 0 12" /><circle cx="16" cy="12" r="1.5" fill="rgba(255,255,255,0.8)" stroke="none" />
        </svg>
      </div>
      <div className="credit-card__name">{usuario?.nombre ?? '—'}</div>
      <div className="credit-card__number">{usuario?.numero_tarjeta ?? '**** **** **** ****'}</div>
      <div className="credit-card__bottom"><span className="credit-card__type">CRÉDITO KUESKIPAY</span></div>
    </div>
  )
}

// ─── Tab: Inicio ─────────────────────────────────────────────────────────────
function TabInicio({ isCompatible, usuario }) {
  const disponible = usuario?.credito_disponible ?? 0
  const adeudo = usuario?.adeudo_proximo ?? 0
  const lineaTotal = disponible + adeudo
  const textoVencimiento = formatVencimiento(usuario?.fecha_vencimiento)

  return (
    <div className="inicio">
      <div className={`badge ${isCompatible ? 'badge--green' : 'badge--red'}`}>
        <span className="badge__icon">{isCompatible ? '✓' : '✗'}</span>
        {isCompatible ? 'Este comercio es compatible con Kueski' : 'Este comercio no es compatible con Kueski'}
      </div>
      <CreditCard usuario={usuario} isCompatible={isCompatible} />
      <div className="inicio__credit-row">
        <DonutChart disponible={disponible} total={lineaTotal} isCompatible={isCompatible} />
        <div className="inicio__linea">
          <span className="inicio__linea-label">Línea Total</span>
          <span className="inicio__linea-amount">${lineaTotal.toLocaleString('es-MX')} MXN</span>
          <span className="inicio__linea-used" style={{ color: isCompatible ? '#6b7280' : '#9ca3af' }}>
            ${adeudo.toLocaleString('es-MX')} MXN usado
          </span>
        </div>
      </div>
      {isCompatible ? (
        <>
          <div className="inicio__actions">
            {[
              { Icon: IconMoney, label: 'Obtener dinero' },
              { Icon: IconCalendar, label: 'Abonar quincena' },
              { Icon: IconStore, label: 'Tiendas afiliadas' },
            ].map(({ Icon, label }) => (
              <button key={label} className="action-btn"><Icon /><span>{label}</span></button>
            ))}
          </div>
          {adeudo > 0 && (
            <div className="inicio__alert">
              <div className="inicio__alert-accent" />
              <div className="inicio__alert-body">
                <span className="inicio__alert-title">Próximo pago</span>
                <div className="inicio__alert-amount">${adeudo.toLocaleString('es-MX')} MXN</div>
                <div className="inicio__alert-due">⚠️ {textoVencimiento}</div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="inicio__incompatible">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <p className="inicio__incompatible-title">Crédito no disponible aquí</p>
          <p className="inicio__incompatible-sub">Navega a una tienda afiliada para realizar tus compras con KueskiPay.</p>
          <button className="inicio__incompatible-btn">Ver tiendas afiliadas</button>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Calculadora ─────────────────────────────────────────────────────────
function TabCalculadora({ usuario }) {
  const RATE = 0.03
  const QUINCENAS_OPTS = [2, 4, 6, 8]
  const SCORE_REQUERIDO_8 = 750
  const RECOMENDACIONES = {
    2: 'Pagas menos intereses pero cuotas más altas.',
    4: '✅ Mejor opción — equilibrio ideal.',
    6: 'Cuotas cómodas pero pagas más intereses.',
  }
  const fmt = (n) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const score = usuario?.score_crediticio ?? 0

  const [monto, setMonto] = useState(1500)
  const [rawInput, setRawInput] = useState('1500')
  const [quincenas, setQuincenas] = useState(4)

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
        <div className="calc__field">
          <label className="calc__field-label">Total a financiar</label>
          <div className="calc__input-wrapper">
            <span className="calc__currency">$</span>
            <input className="calc__input" type="text" inputMode="numeric" value={rawInput} onChange={handleMontoChange} />
            <span className="calc__unit">MXN</span>
          </div>
        </div>
        <div className="calc__selector">
          <div className="calc__dots-row">
            {QUINCENAS_OPTS.map((q) => {
              const locked = q === 8 && score < SCORE_REQUERIDO_8
              const active = quincenas === q
              return (
                <div key={q} className="calc__dot-col">
                  <button
                    className={`calc__dot ${active ? 'calc__dot--active' : ''} ${locked ? 'calc__dot--locked' : ''}`}
                    onClick={() => !locked && setQuincenas(q)}
                    disabled={locked}
                    title={locked ? 'Mejora tu score para desbloquear' : undefined}
                  >
                    {locked ? '🔒' : null}
                  </button>
                  <span className={`calc__q-label ${active ? 'calc__q-label--active' : ''} ${locked ? 'calc__q-label--locked' : ''}`}>
                    {q}<br />QUINCENAS
                  </span>
                  {locked && <span className="calc__tooltip">Mejora tu score para desbloquear</span>}
                </div>
              )
            })}
            <div className="calc__line-bar" />
          </div>
        </div>
        {quincenas !== 8 && monto > 0 && <div className="calc__rec">{RECOMENDACIONES[quincenas]}</div>}
        <div className="calc__desglose">
          <div className="calc__row"><span>Monto original</span><span>${fmt(monto)}</span></div>
          <hr className="calc__divider" />
          <div className="calc__row"><span>Intereses ({(RATE * 100).toFixed(0)}% / quincena)</span><span>${fmt(intereses)}</span></div>
          <hr className="calc__divider" />
          <div className="calc__row calc__row--bold"><span>Total a pagar</span><span>${fmt(total)}</span></div>
          <hr className="calc__divider" />
          <div className="calc__row calc__row--accent"><span>Cuota quincenal</span><span>${fmt(cuota)}</span></div>
        </div>
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

// ─── Tab: Buscar ─────────────────────────────────────────────────────────────
function TabBuscar({ tiendas }) {
  const [busqueda, setBusqueda] = useState('')

  const tiendasFiltradas = busqueda
    ? tiendas.filter(t => t.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : tiendas

  const getIniciales = (nombre) => {
    const palabras = nombre.trim().split(' ')
    if (palabras.length === 1) return nombre.slice(0, 2).toUpperCase()
    return (palabras[0][0] + palabras[1][0]).toUpperCase()
  }

  return (
    <div className="buscar">
      <div className="buscar__input-wrapper">
        <span className="buscar__icon"><IconSearch /></span>
        <input
          type="text"
          className="buscar__input"
          placeholder="Busca productos o tiendas..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {!busqueda && (
        <h3 className="buscar__seccion-titulo">Tiendas afiliadas</h3>
      )}

      {tiendasFiltradas.length > 0 ? (
        <div className="buscar__tiendas-grid">
          {tiendasFiltradas.map((tienda) => (
            <div key={tienda.id_tienda} className="tienda-card">
              <div className="tienda-card__logo-wrapper">
                <img
                  src={tienda.logo}
                  alt={tienda.nombre}
                  className="tienda-card__logo"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                <div className="tienda-card__iniciales" style={{ display: 'none' }}>
                  {getIniciales(tienda.nombre)}
                </div>
              </div>
              <span className="tienda-card__nombre">{tienda.nombre}</span>
              <a
                href={`https://${tienda.url}`}
                target="_blank"
                rel="noreferrer"
                className="tienda-card__link"
              >
                Ver tienda →
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="buscar__empty">No se encontraron tiendas</p>
      )}
    </div>
  )
}

// ─── Tab: Historial ──────────────────────────────────────────────────────────
function TabHistorial({ historialCrediticio, historialCompras, tiendas, usuario }) {
  const score = historialCrediticio?.score_actual ?? 0
  const pagosTiempo = historialCrediticio?.pagos_a_tiempo ?? 0
  const pagosTardios = historialCrediticio?.pagos_tardios ?? 0
  const lineaTotal = (usuario?.credito_disponible ?? 0) + (usuario?.adeudo_proximo ?? 0)
  const porcentajeUso = lineaTotal > 0
    ? Math.round((usuario.adeudo_proximo / lineaTotal) * 100)
    : 0

  const getScoreInfo = (s) => {
    if (s >= 750) return { label: 'Excelente', color: '#16a34a' }
    if (s >= 650) return { label: 'Bueno', color: '#1a73e8' }
    if (s >= 550) return { label: 'Regular', color: '#d97706' }
    return { label: 'Malo', color: '#ef4444' }
  }

  const getTip = (s) => {
    if (s >= 750) return '¡Excelente historial! Eres candidato para aumentar tu línea de crédito.'
    if (s >= 650) return 'Buen trabajo. Paga a tiempo este mes para subir tu score.'
    if (s >= 550) return 'Evita usar más del 50% de tu crédito para mejorar tu score.'
    return 'Atención: tienes pagos tardíos. Ponerse al corriente mejora tu score rápido.'
  }

  const { label: scoreLabel, color: scoreColor } = getScoreInfo(score)
  const tip = getTip(score)
  const scorePct = Math.min(score / 850, 1)

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return ''
    const d = new Date(fechaStr)
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="historial">
      <div className="historial__card">
        <div className="historial__card-header">
          <span className="historial__card-title">Mi Score Crediticio</span>
          <span className="historial__card-sub">Actualizado hoy</span>
        </div>
        <div className="historial__score-row">
          <span className="historial__score-num">{score}</span>
          <span className="historial__score-denom">/ 850</span>
          <span className="historial__score-badge" style={{ background: scoreColor + '1a', color: scoreColor }}>
            {scoreLabel}
          </span>
        </div>
        <div className="historial__bar-track">
          <div className="historial__bar-fill" style={{ width: `${scorePct * 100}%` }} />
        </div>
        <div className="historial__stats-row">
          <div className="historial__stat historial__stat--green">
            <span className="historial__stat-icon">✅</span>
            <span className="historial__stat-val">{pagosTiempo}</span>
            <span className="historial__stat-lbl">Pagos a tiempo</span>
          </div>
          <div className="historial__stat historial__stat--red">
            <span className="historial__stat-icon">⚠️</span>
            <span className="historial__stat-val">{pagosTardios}</span>
            <span className="historial__stat-lbl">Pagos tardíos</span>
          </div>
        </div>
        <div className="historial__uso">
          <span className="historial__uso-lbl">Uso de crédito</span>
          <span className="historial__uso-pct">{porcentajeUso}%</span>
        </div>
      </div>

      <div className="historial__tip">
        <span className="historial__tip-icon">💡</span>
        <p className="historial__tip-text">{tip}</p>
      </div>

      <div className="historial__card">
        <span className="historial__card-title">Historial de pagos</span>
        {historialCompras.length > 0 ? (
          <div className="historial__compras">
            {historialCompras.map((compra, i) => {
              const tienda = tiendas.find(t => t.id_tienda === compra.id_tienda)
              return (
                <div key={compra.id ?? i} className="historial__compra">
                  <div className="historial__compra-info">
                    <span className="historial__compra-tienda">{tienda?.nombre ?? 'Tienda Afiliada'}</span>
                    <span className="historial__compra-meta">
                      {compra.quincenas} quincenas · {formatFecha(compra.fecha)}
                    </span>
                  </div>
                  <div className="historial__compra-right">
                    <span className="historial__compra-monto">${(compra.monto ?? 0).toLocaleString('es-MX')}</span>
                    <span>✅</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="historial__empty">Aún no tienes compras financiadas</p>
        )}
      </div>
    </div>
  )
}

// ─── Settings Dropdown ────────────────────────────────────────────────────────
function SettingsDropdown({ usuario, onLogout, onClose }) {
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  return (
    <div className="settings-dropdown" ref={ref}>
      <div className="settings-dropdown__user">
        <span className="settings-dropdown__name">👤 {usuario?.nombre}</span>
        <span className="settings-dropdown__email">📧 {usuario?.correo}</span>
      </div>
      <hr className="settings-dropdown__divider" />
      <button className="settings-dropdown__logout" onClick={handleLogout}>
        🚪 Cerrar sesión
      </button>
    </div>
  )
}

// ─── Dashboard Principal ──────────────────────────────────────────────────────
const NAV_TABS = [
  { id: 'inicio', Icon: IconHome, label: 'INICIO' },
  { id: 'calculadora', Icon: IconCalc, label: 'CALCULADORA' },
  { id: 'buscar', Icon: IconSearch, label: 'BUSCAR' },
  { id: 'historial', Icon: IconChart, label: 'HISTORIAL' },
]

function Dashboard({ usuario, onLogout }) {
  const [tab, setTab] = useState('inicio')
  const [showSettings, setShowSettings] = useState(false)
  const [tiendas, setTiendas] = useState([])
  const [productos, setProductos] = useState([])
  const [historialCrediticio, setHistorialCrediticio] = useState(null)
  const [historialCompras, setHistorialCompras] = useState([])

  useEffect(() => {
    const descargarDatos = async () => {
      const { data: tiendasData } = await supabase.from('tiendas_afiliadas').select('*')
      if (tiendasData) setTiendas(tiendasData)
      const { data: productosData } = await supabase.from('productos').select('*')
      if (productosData) setProductos(productosData)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: hc } = await supabase
        .from('historial_crediticio')
        .select('*')
        .eq('id_usuario', user.id)
        .single()
      if (hc) setHistorialCrediticio(hc)

      const { data: compras } = await supabase
        .from('historial_compras')
        .select('*')
        .eq('id_usuario', user.id)
        .order('fecha', { ascending: false })
      if (compras) setHistorialCompras(compras)
    }
    descargarDatos()
  }, [])

  const isCompatible = useMemo(() => {
    if (tiendas.length === 0) return true
    try {
      const { hostname } = window.location
      if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') return true
      return tiendas.some((t) => hostname.includes(t.url.split('.')[0]))
    } catch { return true }
  }, [tiendas])

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <img src={logo} alt="KueskiPay" className="dashboard__logo" />
        <div className="dashboard__header-icons" style={{ position: 'relative' }}>
          <button className="icon-btn" aria-label="Notificaciones"><IconBell /></button>
          <button
            className="icon-btn"
            aria-label="Configuración"
            onClick={() => setShowSettings((v) => !v)}
          >
            <IconSettings />
          </button>
          {showSettings && (
            <SettingsDropdown
              usuario={usuario}
              onLogout={onLogout}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>
      </header>

      <main className="dashboard__content">
        {tab === 'inicio' && <TabInicio isCompatible={isCompatible} usuario={usuario} />}
        {tab === 'calculadora' && <TabCalculadora usuario={usuario} />}
        {tab === 'buscar' && <TabBuscar tiendas={tiendas} />}
        {tab === 'historial' && <TabHistorial historialCrediticio={historialCrediticio} historialCompras={historialCompras} tiendas={tiendas} usuario={usuario} />}
      </main>

      <nav className="dashboard__nav">
        {NAV_TABS.map(({ id, Icon, label }) => (
          <button
            key={id}
            className={`nav-btn ${tab === id ? 'nav-btn--active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default Dashboard
