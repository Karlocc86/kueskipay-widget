import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import {
  IconBack, IconClose, IconChat, IconWhatsapp, IconChevron, IconPhone, IconMail,
  IconAlert, IconCheck, IconUser, IconCard, IconShield, IconBellSm, IconGlobe, IconHelp, IconLogout,
} from '../icons'

export default function SettingsDropdown({ usuario, onLogout, onClose }) {
  const ref = useRef()
  const bodyRef = useRef()
  const [view, setView] = useState('menu')
  const [pushNotifs, setPushNotifs] = useState(true)
  const [emailNotifs, setEmailNotifs] = useState(false)
  const [faqOpen, setFaqOpen] = useState(null)

  useEffect(() => { bodyRef.current?.scrollTo(0, 0) }, [view])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const nombre = usuario?.nombre || 'Usuario'
  const correo = usuario?.correo || ''
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || 'KP'

  const faqs = [
    { q: '¿Cómo pago mi próxima cuota?',
      a: 'El cobro es automático en la tarjeta o cuenta que registraste. También puedes adelantar el pago desde Historial → "Pagar ahora".' },
    { q: '¿Puedo cambiar mi método de pago?',
      a: 'Sí. Ve a Ajustes → Métodos de pago para agregar, editar o eliminar tu tarjeta o cuenta.' },
    { q: '¿Qué pasa si pago tarde?',
      a: 'Se aplica un cargo por pago tardío y afecta tu score interno. Te recomendamos activar recordatorios de pago.' },
    { q: '¿Cómo aumento mi línea de crédito?',
      a: 'Paga a tiempo durante 3 meses seguidos y mantén tu utilización por debajo del 60%. La línea se ajusta automáticamente.' },
  ]

  if (view === 'soporte') {
    return (
      <div className="settings-panel" ref={ref} data-view="soporte">
        <header className="settings-panel__header">
          <button className="settings-panel__back" onClick={() => setView('menu')} aria-label="Atrás">
            <IconBack />
          </button>
          <h3 className="settings-panel__title">Centro de Ayuda</h3>
          <button className="settings-panel__close" onClick={onClose} aria-label="Cerrar">
            <IconClose />
          </button>
        </header>

        <div className="settings-panel__body" ref={bodyRef}>
          <section className="support-hero">
            <div className="support-hero__pulse" aria-hidden="true">
              <span className="support-hero__pulse-dot" />
            </div>
            <div className="support-hero__copy">
              <h4 className="support-hero__title">Hablemos</h4>
              <p className="support-hero__sub">Lun–Dom · 8:00 a 22:00 hrs (CDMX)</p>
            </div>
            <button className="support-hero__cta">
              <IconChat />
              <span>Iniciar chat</span>
            </button>
          </section>

          <section className="settings-section">
            <span className="hist-eyebrow">Otros canales</span>
            <div className="support-channels">
              <a className="support-channel" href="https://wa.me/5215512345678" target="_blank" rel="noopener noreferrer">
                <span className="support-channel__icon support-channel__icon--wa"><IconWhatsapp /></span>
                <span className="support-channel__body">
                  <span className="support-channel__label">WhatsApp</span>
                  <span className="support-channel__value">55 1234 5678</span>
                </span>
                <span className="support-channel__chev"><IconChevron /></span>
              </a>
              <a className="support-channel" href="tel:+528001234567">
                <span className="support-channel__icon support-channel__icon--ph"><IconPhone /></span>
                <span className="support-channel__body">
                  <span className="support-channel__label">Llámanos</span>
                  <span className="support-channel__value">800 123 4567 · gratis</span>
                </span>
                <span className="support-channel__chev"><IconChevron /></span>
              </a>
              <a className="support-channel" href="mailto:ayuda@kueski.com">
                <span className="support-channel__icon support-channel__icon--ml"><IconMail /></span>
                <span className="support-channel__body">
                  <span className="support-channel__label">Correo</span>
                  <span className="support-channel__value">ayuda@kueski.com</span>
                </span>
                <span className="support-channel__chev"><IconChevron /></span>
              </a>
            </div>
          </section>

          <section className="settings-section">
            <span className="hist-eyebrow">Preguntas frecuentes</span>
            <div className="faq-list">
              {faqs.map((f, i) => (
                <div key={i} className={`faq-item ${faqOpen === i ? 'faq-item--open' : ''}`}>
                  <button className="faq-item__q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                    <span>{f.q}</span>
                    <span className="faq-item__chev" aria-hidden="true"><IconChevron /></span>
                  </button>
                  {faqOpen === i && <p className="faq-item__a">{f.a}</p>}
                </div>
              ))}
            </div>
          </section>

          <button className="support-report">
            <span className="support-report__icon"><IconAlert /></span>
            <span className="support-report__body">
              <span className="support-report__label">Reportar un problema</span>
              <span className="support-report__sub">Cargos no reconocidos, errores en la app, etc.</span>
            </span>
            <span className="support-channel__chev"><IconChevron /></span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-panel" ref={ref} data-view="menu">
      <header className="settings-panel__header">
        <h3 className="settings-panel__title">Ajustes</h3>
        <button className="settings-panel__close" onClick={onClose} aria-label="Cerrar">
          <IconClose />
        </button>
      </header>

      <div className="settings-panel__body" ref={bodyRef}>
        <section className="settings-profile">
          <div className="settings-profile__avatar">
            <span>{iniciales}</span>
            <span className="settings-profile__verified" title="Cuenta verificada">
              <IconCheck />
            </span>
          </div>
          <div className="settings-profile__info">
            <span className="settings-profile__name">{nombre}</span>
            <span className="settings-profile__email">{correo}</span>
            <span className="settings-profile__badge">Cuenta verificada</span>
          </div>
        </section>

        <section className="settings-section">
          <span className="hist-eyebrow">Cuenta</span>
          <ul className="settings-list">
            <li className="settings-item">
              <span className="settings-item__icon"><IconUser /></span>
              <span className="settings-item__label">Mis datos</span>
              <span className="settings-item__chev"><IconChevron /></span>
            </li>
            <li className="settings-item">
              <span className="settings-item__icon"><IconCard /></span>
              <span className="settings-item__label">Métodos de pago</span>
              <span className="settings-item__meta">2</span>
              <span className="settings-item__chev"><IconChevron /></span>
            </li>
            <li className="settings-item">
              <span className="settings-item__icon"><IconShield /></span>
              <span className="settings-item__label">Seguridad</span>
              <span className="settings-item__chev"><IconChevron /></span>
            </li>
          </ul>
        </section>

        <section className="settings-section">
          <span className="hist-eyebrow">Preferencias</span>
          <ul className="settings-list">
            <li className="settings-item settings-item--row">
              <span className="settings-item__icon"><IconBellSm /></span>
              <span className="settings-item__label">Notificaciones push</span>
              <button
                className={`calc__reminder-toggle ${pushNotifs ? 'calc__reminder-toggle--on' : ''}`}
                onClick={() => setPushNotifs(v => !v)}
                aria-label="Toggle push"
              >
                <div className="calc__reminder-toggle-dot" />
              </button>
            </li>
            <li className="settings-item settings-item--row">
              <span className="settings-item__icon"><IconMail /></span>
              <span className="settings-item__label">Avisos por correo</span>
              <button
                className={`calc__reminder-toggle ${emailNotifs ? 'calc__reminder-toggle--on' : ''}`}
                onClick={() => setEmailNotifs(v => !v)}
                aria-label="Toggle email"
              >
                <div className="calc__reminder-toggle-dot" />
              </button>
            </li>
            <li className="settings-item">
              <span className="settings-item__icon"><IconGlobe /></span>
              <span className="settings-item__label">Idioma</span>
              <span className="settings-item__meta">Español</span>
              <span className="settings-item__chev"><IconChevron /></span>
            </li>
          </ul>
        </section>

        <section className="settings-section">
          <span className="hist-eyebrow">Soporte</span>
          <ul className="settings-list">
            <li className="settings-item settings-item--accent" onClick={() => setView('soporte')} role="button">
              <span className="settings-item__icon settings-item__icon--accent"><IconHelp /></span>
              <span className="settings-item__label">Centro de Ayuda</span>
              <span className="settings-item__chev"><IconChevron /></span>
            </li>
          </ul>
          <p className="settings-section__hint">Chat, llamada, WhatsApp y preguntas frecuentes</p>
        </section>

        <button className="settings-logout" onClick={handleLogout}>
          <IconLogout />
          <span>Cerrar sesión</span>
        </button>

        <p className="settings-footer">KueskiPay · v2.4.1</p>
      </div>
    </div>
  )
}
