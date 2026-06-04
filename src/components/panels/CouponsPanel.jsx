import { useState, useEffect, useRef } from 'react'
import { IconClose, IconCheck, IconCopyCoupon, IconClockSm, IconTicket } from '../icons'
import { PAY_LOGO } from '../../data/logos'
import { COUPONS } from '../../data/coupons'

function CouponLogo({ marca }) {
  const logo = PAY_LOGO[marca]
  const initials = marca.split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase()
  return (
    <span className="coupon__logo">
      {logo ? (
        <img src={logo} alt="" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
      ) : null}
      <span className="coupon__logo-fallback" style={{ display: logo ? 'none' : 'flex' }}>{initials}</span>
    </span>
  )
}

function CouponCard({ cupon, copied, onCopy }) {
  const isCopied = copied === cupon.id
  return (
    <article className="coupon" style={{ '--coupon-accent': cupon.color }}>
      <div className="coupon__top">
        <CouponLogo marca={cupon.marca} />
        <div className="coupon__info">
          <span className="coupon__brand">{cupon.marca}</span>
          <span className="coupon__desc">{cupon.desc}</span>
          <span className="coupon__terms">{cupon.terms}</span>
        </div>
        {cupon.nuevo && <span className="coupon__badge">Nuevo</span>}
      </div>

      <div className="coupon__perf" aria-hidden="true" />

      <div className="coupon__bottom">
        <span className="coupon__code">
          <span className="coupon__code-lbl">Código</span>
          <span className="coupon__code-val">{cupon.codigo}</span>
        </span>
        <button
          type="button"
          className={`coupon__copy ${isCopied ? 'coupon__copy--done' : ''}`}
          onClick={() => onCopy(cupon)}
        >
          {isCopied ? <IconCheck /> : <IconCopyCoupon />}
          <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
        </button>
      </div>

      <span className="coupon__expiry"><IconClockSm /> Vence el {cupon.vence}</span>
    </article>
  )
}

// Coupons Panel (sección propia, mismo patrón que Settings/Calendario)
export default function CouponsPanel({ onClose }) {
  const ref = useRef()
  const [copied, setCopied] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc) }
  }, [onClose])

  const copyCode = (cupon) => {
    try { if (navigator.clipboard) navigator.clipboard.writeText(cupon.codigo) } catch {}
    setCopied(cupon.id)
    setToast(`Código ${cupon.codigo} copiado`)
    setTimeout(() => setCopied(c => (c === cupon.id ? null : c)), 1400)
    setTimeout(() => setToast(t => (t && t.includes(cupon.codigo) ? null : t)), 1900)
  }

  return (
    <div className="settings-panel coupons-panel" ref={ref}>
      <header className="settings-panel__header">
        <h3 className="settings-panel__title">Cupones</h3>
        <button className="settings-panel__close" onClick={onClose} aria-label="Cerrar">
          <IconClose />
        </button>
      </header>

      <div className={`copy-toast notif-toast ${toast ? 'copy-toast--show' : ''}`} role="status" aria-live="polite">
        <IconCheck />
        <span>{toast}</span>
      </div>

      <div className="settings-panel__body">
        <section className="coupons-hero">
          <span className="coupons-hero__icon"><IconTicket /></span>
          <div className="coupons-hero__copy">
            <span className="coupons-hero__title">{COUPONS.length} cupones para ti</span>
            <span className="coupons-hero__sub">Úsalos al pagar con KueskiPay en tiendas afiliadas.</span>
          </div>
        </section>

        <section className="settings-section">
          <span className="hist-eyebrow">Cupones disponibles</span>
          <div className="coupon-list">
            {COUPONS.map(c => (
              <CouponCard key={c.id} cupon={c} copied={copied} onCopy={copyCode} />
            ))}
          </div>
          <p className="settings-section__hint">Aplica el código al pagar con KueskiPay en la tienda afiliada.</p>
        </section>
      </div>
    </div>
  )
}
