import { useEffect, useMemo, useRef } from 'react'
import {
  IconClose, IconBellBig,
  NotifIconPago, NotifIconCheck, NotifIconUp, NotifIconStore, NotifIconTag,
} from '../icons'

const NOTIF_TYPE = {
  pago:   { Icon: NotifIconPago,  color: '#F97316', bg: '#FFF3E6' },
  ok:     { Icon: NotifIconCheck, color: '#10b981', bg: '#E7F8EF' },
  linea:  { Icon: NotifIconUp,    color: '#10b981', bg: '#E7F8EF' },
  tienda: { Icon: NotifIconStore, color: '#1A73E8', bg: '#EAF2FE' },
  cupon:  { Icon: NotifIconTag,   color: '#7C3AED', bg: '#F3EEFE' },
}

// Notifications Panel (mismo patrón que Settings/Calendario)
export default function NotificationsPanel({ notifs, onMarkRead, onMarkAllRead, onClose }) {
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc) }
  }, [onClose])

  const unread = notifs.filter(n => !n.leido).length

  const grupos = useMemo(() => {
    const out = {}
    notifs.forEach(n => { (out[n.grupo] = out[n.grupo] || []).push(n) })
    return out
  }, [notifs])

  return (
    <div className="settings-panel notif-panel" ref={ref}>
      <header className="settings-panel__header">
        <h3 className="settings-panel__title">Notificaciones</h3>
        {unread > 0 && (
          <button className="notif-markall" onClick={onMarkAllRead}>Marcar leídas</button>
        )}
        <button className="settings-panel__close" onClick={onClose} aria-label="Cerrar">
          <IconClose />
        </button>
      </header>

      <div className="settings-panel__body notif-panel__body">
        {notifs.length > 0 ? (
          Object.entries(grupos).map(([grupo, items]) => (
            <section key={grupo} className="settings-section">
              <span className="hist-eyebrow">{grupo}</span>
              <div className="notif-list">
                {items.map(n => {
                  const meta = NOTIF_TYPE[n.tipo] || NOTIF_TYPE.ok
                  const { Icon } = meta
                  return (
                    <button
                      key={n.id}
                      className={`notif-row ${n.leido ? '' : 'notif-row--unread'}`}
                      onClick={() => onMarkRead(n.id)}
                    >
                      <span className="notif-row__icon" style={{ color: meta.color, background: meta.bg }}>
                        <Icon />
                      </span>
                      <span className="notif-row__body">
                        <span className="notif-row__title">{n.titulo}</span>
                        <span className="notif-row__text">{n.texto}</span>
                        <span className="notif-row__time">{n.tiempo}</span>
                      </span>
                      {!n.leido && <span className="notif-row__dot" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="notif-empty-state">
            <IconBellBig />
            <p className="notif-empty-state__title">Estás al día</p>
            <p className="notif-empty-state__sub">No tienes notificaciones nuevas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
