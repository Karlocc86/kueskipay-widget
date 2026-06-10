import { useState, useEffect } from 'react'
import { IconMoney, IconCalendar, IconStore, IconCalc, IconCopySm, IconCheckSm, IconCalSm } from '../icons'

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function DonutChart({ disponible, total, isCompatible }) {
  const RADIUS = 46
  const STROKE = 12
  const SIZE = 130
  const C = SIZE / 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const pct = total > 0 ? (total - disponible) / total : 0
  const targetOffset = CIRCUMFERENCE * (1 - pct)

  const [animatedOffset, setAnimatedOffset] = useState(CIRCUMFERENCE)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicia la animación del donut al cambiar el valor
    setAnimatedOffset(CIRCUMFERENCE)
    const id = requestAnimationFrame(() => setAnimatedOffset(targetOffset))
    return () => cancelAnimationFrame(id)
  }, [targetOffset, CIRCUMFERENCE])

  const arcColor = !isCompatible
    ? '#6b7280'
    : pct <= 0.30 ? '#00C46A'
    : pct <= 0.60 ? '#1A73E8'
    : pct <= 0.80 ? '#F97316'
    : '#EF4444'

  const pctLabel = Math.round(pct * 100)

  return (
    <div className="donut">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={C} cy={C} r={RADIUS} fill="none" stroke="#eef1f5" strokeWidth={STROKE} />
        <circle
          cx={C} cy={C} r={RADIUS}
          fill="none"
          stroke={arcColor}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${C} ${C})`}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.4s ease' }}
        />
      </svg>
      <div className="donut__inner">
        <span className="donut__pct" style={{ color: arcColor }}>{pctLabel}%</span>
        <span className="donut__label">USADO</span>
      </div>
    </div>
  )
}

// ─── KueskiMark (wordmark on credit card) ────────────────────────────────────
function KueskiMark({ size = 'md', pay = false }) {
  return (
    <div className={`cc-brand cc-brand--${size}`}>
      <span className="cc-brand__kueski">kueski</span>
      {pay && <span className="cc-brand__pay">pay</span>}
    </div>
  )
}

// ─── Credit Card components ───────────────────────────────────────────────────
function CardChip() {
  return (
    <svg className="cc-chip" width="34" height="26" viewBox="0 0 40 30" aria-hidden="true">
      <defs>
        <linearGradient id="cc-chip-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2D58A" />
          <stop offset="0.5" stopColor="#C9A24B" />
          <stop offset="1" stopColor="#7E5E22" />
        </linearGradient>
      </defs>
      <rect width="40" height="30" rx="5" fill="url(#cc-chip-grad)" />
      <g stroke="rgba(0,0,0,0.28)" strokeWidth="0.7" fill="none">
        <line x1="0"  y1="10" x2="14" y2="10" />
        <line x1="26" y1="10" x2="40" y2="10" />
        <line x1="0"  y1="20" x2="14" y2="20" />
        <line x1="26" y1="20" x2="40" y2="20" />
        <line x1="14" y1="0"  x2="14" y2="30" />
        <line x1="26" y1="0"  x2="26" y2="30" />
      </g>
      <rect x="14.5" y="10.5" width="11" height="9" rx="1" fill="rgba(0,0,0,0.16)" />
    </svg>
  )
}

function ContactlessIcon() {
  return (
    <svg className="cc-contactless" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round">
        <path d="M7  8 a 6  6  0 0 1 0 8" />
        <path d="M11 5 a 10 10 0 0 1 0 14" />
        <path d="M15 2 a 14 14 0 0 1 0 20" />
      </g>
    </svg>
  )
}

// ─── Dynamic NIP (rotating 3-digit token) ────────────────────────────────────
function useDynamicNip(period = 30, active = true) {
  const gen = () => String(Math.floor(100 + Math.random() * 900))
  const [nip, setNip] = useState(gen)
  const [remaining, setRemaining] = useState(period)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { setNip(gen()); return period }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [period, active])
  return { nip, remaining, period }
}

function CardActions({ pan, last4, vigencia, nip, remaining, period, onActivate }) {
  const [copied, setCopied] = useState(null)
  const [toast, setToast] = useState(null)
  const [nipRevealed, setNipRevealed] = useState(false)

  const copy = (key, value, label) => {
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(value)
    } catch { /* clipboard blocked in sandbox */ }
    setCopied(key)
    setToast(label)
    setTimeout(() => setCopied(c => (c === key ? null : c)), 1200)
    setTimeout(() => setToast(t => (t === label ? null : t)), 1700)
  }

  const revealNip = () => {
    setNipRevealed(true)
    onActivate && onActivate()
    setTimeout(() => setNipRevealed(false), 5000)
    copy('nip', nip, 'NIP copiado')
  }

  const R = 9
  const CIRC = 2 * Math.PI * R
  const offset = CIRC * (1 - remaining / period)

  return (
    <div className="card-actions">
      <div className={`copy-toast ${toast ? 'copy-toast--show' : ''}`} role="status" aria-live="polite">
        <IconCheckSm />
        <span>{toast}</span>
      </div>

      <button type="button" className={`card-action ${copied === 'num' ? 'card-action--done' : ''}`} onClick={() => copy('num', pan, 'Número copiado')}>
        <span className="card-action__icon">{copied === 'num' ? <IconCheckSm /> : <IconCopySm />}</span>
        <span className="card-action__body">
          <span className="card-action__label">Número</span>
          <span className="card-action__value">{`••• ${last4}`}</span>
        </span>
      </button>

      <button type="button" className={`card-action card-action--nip ${copied === 'nip' ? 'card-action--done' : ''}`} onClick={revealNip}>
        <span className="card-action__ring" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r={R} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="2.5" />
            <circle
              cx="12" cy="12" r={R} fill="none"
              stroke="var(--brand-color)" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={offset}
              transform="rotate(-90 12 12)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
        </span>
        <span className="card-action__body">
          <span className="card-action__label">NIP</span>
          <span className="card-action__value card-action__value--nip">{nipRevealed ? nip : '•••'}</span>
        </span>
      </button>

      <button type="button" className={`card-action ${copied === 'exp' ? 'card-action--done' : ''}`} onClick={() => copy('exp', vigencia, 'Vigencia copiada')}>
        <span className="card-action__icon">{copied === 'exp' ? <IconCheckSm /> : <IconCalSm />}</span>
        <span className="card-action__body">
          <span className="card-action__label">Vigencia</span>
          <span className="card-action__value">{vigencia}</span>
        </span>
      </button>
    </div>
  )
}

// ─── Credit Card ─────────────────────────────────────────────────────────────
function CreditCard({ usuario, isCompatible }) {
  const [cardFlipped, setCardFlipped] = useState(false)
  const [nipVisible, setNipVisible] = useState(false)
  const [nipActive, setNipActive] = useState(false)
  const { nip, remaining, period } = useDynamicNip(30, nipActive)

  const last4 = usuario?.numero_tarjeta ?? '4821'
  const pan = `4815 6291 0473 ${last4}`
  const vigencia = '12/27'
  const nombre = (usuario?.nombre ?? '').toUpperCase()

  return (
    <div className="card-block">
      <div
        className={`credit-card-container ${!isCompatible ? 'credit-card--disabled' : ''}`}
        onClick={() => setCardFlipped(v => !v)}
      >
        <div className={`credit-card-inner ${cardFlipped ? 'credit-card-inner--flipped' : ''}`}>

          {/* ── FRENTE ── */}
          <div className="credit-card credit-card--front">
            <div className="credit-card__deco" aria-hidden="true">
              <svg width="100%" height="100%" viewBox="0 0 356 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cc-stroke-1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0"   stopColor="rgba(56,232,220,0)" />
                    <stop offset="0.5" stopColor="rgba(56,232,220,0.55)" />
                    <stop offset="1"   stopColor="rgba(56,232,220,0)" />
                  </linearGradient>
                  <linearGradient id="cc-stroke-2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0"   stopColor="rgba(0,196,106,0)" />
                    <stop offset="0.5" stopColor="rgba(0,196,106,0.55)" />
                    <stop offset="1"   stopColor="rgba(0,196,106,0)" />
                  </linearGradient>
                </defs>
                <path d="M -40 100 Q  90 30 200 60 T 420  40" fill="none" stroke="url(#cc-stroke-1)" strokeWidth="1.1" />
                <path d="M -40 118 Q 110 50 230 78 T 430  58" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
                <path d="M -40 140 Q 130 70 260 96 T 440  80" fill="none" stroke="url(#cc-stroke-2)" strokeWidth="1.2" />
                <path d="M -40 160 Q 150 90 280 116 T 450 100" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              </svg>
            </div>

            <div className="credit-card__row credit-card__row--top">
              <KueskiMark size="md" pay={false} />
              <span className="credit-card__type-tag">DÉBITO</span>
            </div>

            <div className="credit-card__row credit-card__row--chip">
              <CardChip />
              <ContactlessIcon />
            </div>

            <div className="credit-card__number">
              <span>••••</span>
              <span>••••</span>
              <span>••••</span>
              <span className="credit-card__number--last">{last4}</span>
            </div>

            <div className="credit-card__row credit-card__row--bottom">
              <div className="credit-card__col">
                <span className="credit-card__col-lbl">TITULAR</span>
                <span className="credit-card__col-val">{nombre || '—'}</span>
              </div>
              <div className="credit-card__col credit-card__col--right">
                <span className="credit-card__col-lbl">VÁLIDA</span>
                <span className="credit-card__col-val">12 / 27</span>
              </div>
            </div>
          </div>

          {/* ── REVERSO ── */}
          <div className="credit-card credit-card--back">
            <div className="credit-card__magstripe" />
            <div className="credit-card__back-body">
              <div className="credit-card__sig-row">
                <div className="credit-card__sig-box">
                  <span className="credit-card__sig-name">{nombre || '—'}</span>
                </div>
                <div className="credit-card__valid-box">
                  <span className="credit-card__col-lbl">VÁLIDA</span>
                  <span className="credit-card__valid-val">12/27</span>
                </div>
                <div
                  className="credit-card__cvv-box"
                  onClick={(e) => { e.stopPropagation(); setNipActive(true); setNipVisible(v => !v) }}
                  title={nipVisible ? 'Ocultar NIP' : 'Mostrar NIP'}
                >
                  <span className="credit-card__col-lbl">NIP</span>
                  <span className="credit-card__cvv-val">{nipVisible ? nip : '•••'}</span>
                </div>
              </div>
              <div className="credit-card__back-foot">
                <KueskiMark size="sm" />
                <span className="credit-card__back-hint">Toca para voltear</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {isCompatible && (
        <CardActions pan={pan} last4={last4} vigencia={vigencia} nip={nip} remaining={remaining} period={period} onActivate={() => setNipActive(true)} />
      )}
    </div>
  )
}

// ─── Tab: Inicio (KueskiPay) ──────────────────────────────────────────────────
export function TabInicio({ usuario, isCompatible, onVerTiendas }) {
  const disponible = usuario?.credito_disponible ?? 0
  const adeudo = usuario?.adeudo_proximo ?? 0
  const lineaTotal = disponible + adeudo
  const pct = lineaTotal > 0 ? adeudo / lineaTotal : 0
  const tier = !isCompatible
    ? { label: 'Sin disponibilidad', color: '#6b7280', bg: '#f3f4f6' }
    : pct <= 0.30 ? { label: 'Saludable',    color: '#00C46A', bg: '#E7F8EF' }
    : pct <= 0.60 ? { label: 'Moderado',     color: '#1A73E8', bg: '#EAF2FE' }
    : pct <= 0.80 ? { label: 'Alto uso',     color: '#F97316', bg: '#FFF3E6' }
    :               { label: 'Crítico',      color: '#EF4444', bg: '#FEE9E9' }

  return (
    <div className="inicio">
      <CreditCard usuario={usuario} isCompatible={isCompatible} />
      <div className="credit-summary">
        <DonutChart disponible={disponible} total={lineaTotal} isCompatible={isCompatible} />
        <div className="credit-summary__info">
          <span className="credit-summary__eyebrow">Crédito disponible</span>
          <span className="credit-summary__amount">${disponible.toLocaleString('es-MX')}<span className="credit-summary__currency"> MXN</span></span>
          <div className="credit-summary__meta">
            <span className="credit-summary__total">de ${lineaTotal.toLocaleString('es-MX')} total</span>
            <span className="credit-summary__sep" aria-hidden="true">·</span>
            <span className="credit-summary__used">${adeudo.toLocaleString('es-MX')} usado</span>
          </div>
          <span className="credit-summary__tier" style={{ color: tier.color, background: tier.bg }}>
            <span className="credit-summary__tier-dot" style={{ background: tier.color }} />
            {tier.label}
          </span>
        </div>
      </div>
      {isCompatible ? (
        <>
          <div className="inicio__actions">
            {[
              { Icon: IconMoney, label: 'Obtener dinero', onClick: undefined },
              { Icon: IconCalendar, label: 'Abonar quincena', onClick: undefined },
              { Icon: IconStore, label: 'Tiendas afiliadas', onClick: onVerTiendas },
            ].map(({ Icon, label, onClick }) => (
              <button key={label} className="action-btn" onClick={onClick}><Icon /><span>{label}</span></button>
            ))}
          </div>
        </>
      ) : (
        <div className="inicio__incompatible">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <p className="inicio__incompatible-title">Crédito no disponible aquí</p>
          <p className="inicio__incompatible-sub">Navega a una tienda afiliada para realizar tus compras con KueskiPay.</p>
          <button className="inicio__incompatible-btn" onClick={onVerTiendas}>Ver tiendas afiliadas</button>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Inicio (KueskiPay – compra ahora, paga a quincenas) ─────────────────
// Próxima fecha de pago quincenal: día 15 o último día del mes, lo que siga.
function proximaQuincena(hoy = new Date()) {
  return hoy.getDate() < 15
    ? new Date(hoy.getFullYear(), hoy.getMonth(), 15)
    : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
}

export function TabInicioKueski({ usuario, onCalcular, onVerTiendas }) {
  const nombre = (usuario?.nombre ?? '').split(' ')[0] || 'usuario'
  const disponible = usuario?.credito_disponible ?? 0
  const adeudo = usuario?.adeudo_proximo ?? 0
  const linea = disponible + adeudo
  const pctUso = linea > 0 ? Math.min(100, Math.round((adeudo / linea) * 100)) : 0
  const fechaPago = proximaQuincena().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })

  return (
    <div className="inicio inicio--kueski">
      <div className="inicio-k__hero">
        <span className="inicio-k__eyebrow">Compra ahora, paga a quincenas</span>
        <h2 className="inicio-k__title">Hola, {nombre} 👋</h2>
        <p className="inicio-k__sub">Tu saldo KueskiPay listo para usar en tiendas afiliadas.</p>
      </div>

      <div className="kpay-balance">
        <div className="kpay-balance__deco" aria-hidden="true" />
        <div className="kpay-balance__top">
          <span className="kpay-balance__lbl">Saldo para compras</span>
          <span className="kpay-balance__mark">kueski<strong>pay</strong></span>
        </div>
        <div className="kpay-balance__figure">
          <span className="kpay-balance__amount">${disponible.toLocaleString('es-MX')}</span>
          <span className="kpay-balance__cur">MXN</span>
        </div>
        <div className="kpay-balance__bar" role="img" aria-label={`${pctUso}% de tu línea en uso`}>
          <div className="kpay-balance__bar-fill" style={{ width: `${pctUso}%` }} />
        </div>
        <span className="kpay-balance__meta">
          ${adeudo.toLocaleString('es-MX')} en uso · línea de ${linea.toLocaleString('es-MX')}
        </span>
      </div>

      {adeudo > 0 ? (
        <div className="kpay-next">
          <span className="kpay-next__icon"><IconCalendar /></span>
          <span className="kpay-next__body">
            <span className="kpay-next__lbl">Próximo pago quincenal</span>
            <span className="kpay-next__date">{fechaPago}</span>
          </span>
          <span className="kpay-next__amount">${adeudo.toLocaleString('es-MX')}</span>
        </div>
      ) : (
        <div className="kpay-next kpay-next--clear">
          <span className="kpay-next__icon"><IconCalendar /></span>
          <span className="kpay-next__body">
            <span className="kpay-next__lbl">Estás al día</span>
            <span className="kpay-next__date">Sin pagos pendientes</span>
          </span>
        </div>
      )}

      <div className="kpay-actions">
        <button className="kpay-actions__primary" onClick={onCalcular}>
          <IconCalc />
          <span>Calcular una compra</span>
        </button>
        <button className="kpay-actions__ghost" onClick={onVerTiendas}>
          <IconStore />
          <span>Ver tiendas afiliadas</span>
        </button>
      </div>
    </div>
  )
}
