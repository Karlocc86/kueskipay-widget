import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import './Dashboard.css'

import { IconBell, IconCalendarHeader, IconSettings, IconHome, IconCalc, IconSearch, IconChart, IconTicket } from './icons'
import { COUPONS } from '../data/coupons'
import { buildNotifications } from '../data/notifications'
import NotificationsPanel from './panels/NotificationsPanel'
import CouponsPanel from './panels/CouponsPanel'
import PaymentsCalendar from './panels/PaymentsCalendar'
import SettingsDropdown from './panels/SettingsPanel'
import { TabInicio, TabInicioKueski } from './tabs/TabInicio'
import TabCalculadora from './tabs/TabCalculadora'
import TabBuscar from './tabs/TabBuscar'
import TabHistorial from './tabs/TabHistorial'

// ─── Brand Switcher ───────────────────────────────────────────────────────────
function BrandSwitcher({ brand, onChange }) {
  const next = brand === 'kueskipay' ? 'kueski' : 'kueskipay'
  return (
    <button
      type="button"
      className="brand-toggle"
      data-brand={brand}
      onClick={() => onChange(next)}
      aria-label={`Cambiar a ${next === 'kueski' ? 'Kueski' : 'KueskiPay'}`}
    >
      <img src="kueskipay.png" alt="KueskiPay" className="brand-toggle__img brand-toggle__img--kueskipay" draggable="false" />
      <img src="kueski.png"    alt="Kueski"    className="brand-toggle__img brand-toggle__img--kueski"    draggable="false" />
    </button>
  )
}

// ─── Dashboard Principal ──────────────────────────────────────────────────────
const NAV_TABS = [
  { id: 'inicio',      Icon: IconHome,   label: 'INICIO' },
  { id: 'calculadora', Icon: IconCalc,   label: 'CALCULADORA' },
  { id: 'buscar',      Icon: IconSearch, label: 'BUSCAR' },
  { id: 'historial',   Icon: IconChart,  label: 'HISTORIAL' },
]

function Dashboard({ usuario, onLogout }) {
  const [tab, setTab] = useState('inicio')
  const [brand, setBrand] = useState('kueski')
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showCoupons, setShowCoupons] = useState(false)
  const [notifs, setNotifs] = useState(buildNotifications)
  const unreadNotifs = notifs.filter((n) => !n.leido).length
  const [tiendas, setTiendas] = useState([])
  const [historialCrediticio, setHistorialCrediticio] = useState(null)
  const [historialCompras, setHistorialCompras] = useState([])
  // NOTE: el valor detectado no se consume aún (el tab usa isCompatible={true});
  // se conserva la detección para re-conectarla a la UI más adelante.
  const [, setTiendaCompatible] = useState(false)

  // Determine store compatibility from the active browser tab
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]?.url) return
      if (
        tabs[0].url.startsWith('chrome://') ||
        tabs[0].url.startsWith('chrome-extension://')
      ) {
        setTiendaCompatible(false)
        return
      }

      try {
        const hostname = new URL(tabs[0].url).hostname

        if (hostname.includes('amazon.com.mx') || hostname.includes('mercadolibre.com.mx')) {
          setTiendaCompatible(true)
          return
        }

        const { data } = await supabase
          .from('tiendas_afiliadas')
          .select('*')
          .ilike('url', `%${hostname}%`)

        setTiendaCompatible(data && data.length > 0)
      } catch {
        setTiendaCompatible(false)
      }
    })
  }, [])

  useEffect(() => {
    const descargarDatos = async () => {
      const { data: tiendasData } = await supabase.from('tiendas_afiliadas').select('*')
      if (tiendasData) setTiendas(tiendasData)

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

  return (
    <div className="dashboard" data-brand={brand}>
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <img src="kueskilogo.png" alt="Kueski" className="dashboard__plant-logo" />
          <BrandSwitcher brand={brand} onChange={setBrand} />
        </div>
        <div className="dashboard__header-icons" style={{ position: 'relative' }}>
          <div className="coupon-wrapper">
            <button
              className="icon-btn"
              aria-label="Cupones"
              onClick={() => { setShowCoupons(true); setShowNotifications(false); setShowSettings(false); setShowCalendar(false) }}
            >
              <IconTicket />
            </button>
            {COUPONS.length > 0 && <span className="coupon-badge">{COUPONS.length}</span>}
          </div>
          <button
            className="icon-btn"
            aria-label="Calendario de pagos"
            onClick={() => { setShowCalendar(true); setShowNotifications(false); setShowSettings(false); setShowCoupons(false) }}
          >
            <IconCalendarHeader />
          </button>
          <div className="bell-wrapper">
            <button
              className="icon-btn"
              aria-label="Notificaciones"
              onClick={() => { setShowNotifications(true); setShowSettings(false); setShowCalendar(false); setShowCoupons(false) }}
            >
              <IconBell />
            </button>
            {unreadNotifs > 0 && <span className="bell-badge">{unreadNotifs}</span>}
          </div>
          <button
            className="icon-btn"
            aria-label="Configuración"
            onClick={() => { setShowSettings((v) => !v); setShowNotifications(false); setShowCalendar(false); setShowCoupons(false) }}
          >
            <IconSettings />
          </button>
        </div>
      </header>

      {showNotifications && (
        <NotificationsPanel
          notifs={notifs}
          onMarkRead={(id) => setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, leido: true } : n)))}
          onMarkAllRead={() => setNotifs((prev) => prev.map((n) => ({ ...n, leido: true })))}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showCoupons && (
        <CouponsPanel onClose={() => setShowCoupons(false)} />
      )}

      {showSettings && (
        <SettingsDropdown
          usuario={usuario}
          onLogout={onLogout}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showCalendar && (
        <PaymentsCalendar
          onClose={() => setShowCalendar(false)}
        />
      )}

      <main className="dashboard__content">
        {tab === 'inicio' && brand === 'kueskipay'  && <TabInicioKueski usuario={usuario} />}
        {tab === 'inicio' && brand === 'kueski'     && <TabInicio usuario={usuario} isCompatible={true} onVerTiendas={() => setTab('buscar')} />}
        {tab === 'calculadora' && <TabCalculadora usuario={usuario} />}
        {tab === 'buscar'      && <TabBuscar tiendas={tiendas} />}
        {tab === 'historial'   && <TabHistorial historialCrediticio={historialCrediticio} historialCompras={historialCompras} tiendas={tiendas} usuario={usuario} />}
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
