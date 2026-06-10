import { useState, useEffect, useRef } from 'react'
import './Tutorial.css'

// ─── Tour guiado del popup ─────────────────────────────────────────────────────
// Cada paso ilumina un elemento (target) y puede preparar la UI (effect):
// cambiar de tab o girar la moneda de marca. El usuario navega libremente
// hacia adelante y atrás; el último paso indica dónde reencontrar el tour.

const CARD_W = 300
const CARD_H = 205 // estimación para colocar la tarjeta sin medirla

const STEPS = [
  {
    id: 'bienvenida',
    title: '¡Hola! Esto es Kueski',
    body: 'Tu crédito, tu tarjeta y tus pagos a quincenas en un solo lugar. Es un tour de un minuto y puedes avanzar o retroceder con total libertad.',
    effect: { tab: 'inicio', brand: 'kueski' },
  },
  {
    id: 'coin',
    target: '[data-tour="brand"]',
    round: true,
    title: 'La moneda cambia de interfaz',
    body: 'Toca el logo para girar la moneda y alternar entre Kueski (verde) y KueskiPay (azul). En el siguiente paso la giramos por ti.',
    effect: { tab: 'inicio', brand: 'kueski' },
  },
  {
    id: 'kueskipay',
    target: '[data-tour="content"]',
    title: 'KueskiPay: paga a quincenas',
    body: '¿Viste el giro? Esta es la cara azul: tu saldo para compras, tu próximo pago quincenal y accesos directos a la calculadora y las tiendas.',
    effect: { tab: 'inicio', brand: 'kueskipay' },
  },
  {
    id: 'tarjeta',
    target: '[data-tour="content"]',
    title: 'Kueski: tu tarjeta digital',
    body: 'De regreso a la cara verde. Toca la tarjeta para voltearla, y copia el número, el NIP dinámico o la vigencia con un solo toque.',
    effect: { tab: 'inicio', brand: 'kueski' },
  },
  {
    id: 'calculadora',
    target: '[data-tour="nav-calculadora"]',
    title: 'Calculadora de quincenas',
    body: 'Simula cualquier compra antes de hacerla: elige el número de quincenas y conoce tu pago exacto, con intereses incluidos.',
    effect: { tab: 'calculadora' },
  },
  {
    id: 'buscar',
    target: '[data-tour="nav-buscar"]',
    title: 'Tiendas afiliadas',
    body: 'Encuentra todas las tiendas donde puedes pagar con KueskiPay, con su logo y acceso directo a cada una.',
    effect: { tab: 'buscar' },
  },
  {
    id: 'historial',
    target: '[data-tour="nav-historial"]',
    title: 'Historial y score',
    body: 'Sigue tu score crediticio, tus compras y el estado de cada pago. Pagar a tiempo sube tu score.',
    effect: { tab: 'historial' },
  },
  {
    id: 'atajos',
    target: '[data-tour="quick"]',
    title: 'Atajos del día a día',
    body: 'Cupones, calendario de pagos, notificaciones y ajustes. Además, mientras navegas en tiendas, la burbuja flotante de KueskiPay te acompaña en la página.',
    effect: { tab: 'inicio', brand: 'kueski' },
  },
  {
    id: 'fin',
    target: '[data-tour="settings"]',
    round: true,
    title: 'Repite el tour cuando quieras',
    body: 'Si algo se te pasó, este tutorial vive en Ajustes → Ver tutorial. ¡Listo, todo tuyo!',
    effect: { tab: 'inicio', brand: 'kueski' },
  },
]

export default function Tutorial({ onStepEffect, onFinish }) {
  const [paso, setPaso] = useState(0)
  const [rect, setRect] = useState(null)
  const cardRef = useRef(null)
  const step = STEPS[paso]
  const ultimo = paso === STEPS.length - 1

  // Aplica el efecto del paso (tab/marca) y mide el target tras el re-render.
  useEffect(() => {
    onStepEffect?.(step.effect)
    const t = setTimeout(() => {
      const el = step.target ? document.querySelector(step.target) : null
      setRect(el ? el.getBoundingClientRect() : null)
      cardRef.current?.focus({ preventScroll: true })
    }, 90)
    return () => clearTimeout(t)
  }, [paso, step, onStepEffect])

  // Navegación con teclado: ← → avanzan/retroceden, Escape sale.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setPaso((p) => Math.min(p + 1, STEPS.length - 1))
      else if (e.key === 'ArrowLeft') setPaso((p) => Math.max(p - 1, 0))
      else if (e.key === 'Escape') onFinish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onFinish])

  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  const PAD = 6

  // Foco luminoso: sin target colapsa al centro (la sombra sigue oscureciendo todo).
  const spotStyle = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
        borderRadius: step.round ? 999 : 14,
      }
    : { top: vh / 2, left: vw / 2, width: 0, height: 0, borderRadius: 999 }

  // Tarjeta: debajo del target, arriba si no cabe, o dentro del área iluminada.
  let cardTop, cardLeft, caret = 'none', caretX = 0
  if (rect) {
    const centerX = rect.left + rect.width / 2
    cardLeft = Math.max(10, Math.min(centerX - CARD_W / 2, vw - CARD_W - 10))
    if (vh - rect.bottom >= CARD_H + 24) {
      cardTop = rect.bottom + 16
      caret = 'up'
    } else if (rect.top >= CARD_H + 24) {
      cardTop = rect.top - CARD_H - 16
      caret = 'down'
    } else {
      cardTop = Math.max(56, Math.min(rect.bottom - CARD_H - 16, vh - CARD_H - 16))
    }
    caretX = Math.max(18, Math.min(centerX - cardLeft - 7, CARD_W - 32))
  } else {
    cardTop = vh / 2 - CARD_H / 2
    cardLeft = vw / 2 - CARD_W / 2
  }

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Tutorial de Kueski">
      <div className="tour__spot" style={spotStyle} aria-hidden="true" />

      <div
        className="tour__card"
        style={{ top: cardTop, left: cardLeft, width: CARD_W }}
        ref={cardRef}
        tabIndex={-1}
      >
        {caret !== 'none' && (
          <span className={`tour__caret tour__caret--${caret}`} style={{ left: caretX }} aria-hidden="true" />
        )}

        <div className="tour__inner" key={paso}>
          <div className="tour__top">
            <span className="tour__eyebrow">Paso {paso + 1} de {STEPS.length}</span>
            <button className="tour__skip" onClick={onFinish}>Saltar</button>
          </div>
          <h4 className="tour__title">{step.title}</h4>
          <p className="tour__body">{step.body}</p>
        </div>

        <div className="tour__dots" role="tablist" aria-label="Pasos del tutorial">
          {STEPS.map((s, j) => (
            <button
              key={s.id}
              className={`tour__dot ${j === paso ? 'tour__dot--active' : ''}`}
              onClick={() => setPaso(j)}
              aria-label={`Ir al paso ${j + 1}`}
              aria-current={j === paso}
            />
          ))}
        </div>

        <div className="tour__nav">
          <button
            className="tour__btn tour__btn--ghost"
            onClick={() => setPaso((p) => Math.max(p - 1, 0))}
            disabled={paso === 0}
          >
            Anterior
          </button>
          <button
            className="tour__btn tour__btn--primary"
            onClick={() => (ultimo ? onFinish() : setPaso((p) => p + 1))}
          >
            {ultimo ? '¡Listo!' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}
