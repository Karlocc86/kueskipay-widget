import { useState } from 'react'
import { supabase } from '../supabaseClient'
import './Login.css'
import logo from '../assets/KueskiPay-Logo.png'

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

// ─── Vista 1: Login ───────────────────────────────────────────────────────────
function ViewLogin({ onLogin, onRecuperar, onCrear }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const { data, error: supabaseError } = await supabase.auth.signInWithPassword({ email, password })
    setIsLoading(false)

    if (supabaseError || !data.user) {
      setError('Correo o contraseña incorrectos.')
    } else {
      onLogin(data.user)
    }
  }

  return (
    <div className="login">
      <img src={logo} alt="Kueski" width="120" />
      <h1 className="login__title">Inicia sesión</h1>
      <form className="login__form" onSubmit={handleSubmit} noValidate>
        <input
          className="login__input"
          type="email"
          placeholder="Correo electrónico*"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={isLoading}
        />
        <div className="login__password-wrapper">
          <input
            className="login__input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña*"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={isLoading}
          />
          <button
            type="button"
            className="login__eye"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        <a
          href="#"
          className="login__forgot"
          onClick={(e) => { e.preventDefault(); onRecuperar() }}
        >
          ¿Olvidaste tu contraseña?
        </a>
        {error && <p className="login__error">{error}</p>}
        <button type="submit" className="login__btn" disabled={isLoading}>
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>
      <p className="login__register">
        ¿Aún no tienes cuenta?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onCrear() }}>Crear una cuenta</a>
      </p>
    </div>
  )
}

// ─── Vista 2: Recuperar contraseña ───────────────────────────────────────────
function ViewRecuperar({ onVolver }) {
  const [correo, setCorreo] = useState('')
  const [enviado, setEnviado] = useState(false)

  return (
    <div className="login">
      <img src={logo} alt="Kueski" width="120" />
      <h1 className="login__title">Restablece tu contraseña</h1>
      <p className="login__subtitle">
        Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecerla.
      </p>
      <form
        className="login__form"
        onSubmit={(e) => { e.preventDefault(); setEnviado(true) }}
        noValidate
      >
        <input
          className="login__input"
          type="email"
          placeholder="Correo electrónico*"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          autoComplete="email"
        />
        {enviado && (
          <p className="login__success">✅ Correo enviado. Revisa tu bandeja de entrada.</p>
        )}
        <button type="submit" className="login__btn">Enviar correo</button>
      </form>
      <a
        href="#"
        className="login__cancel"
        onClick={(e) => { e.preventDefault(); onVolver() }}
      >
        Cancelar
      </a>
    </div>
  )
}

// ─── Vista 3: Crear cuenta ────────────────────────────────────────────────────
function ViewCrear({ onVolver }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="login login--crear">
      <img src={logo} alt="Kueski" width="120" />

      <div className="stepper">
        <div className="stepper__step">
          <div className="stepper__circle stepper__circle--active">1</div>
          <span className="stepper__label stepper__label--active">Cuenta</span>
        </div>
        <div className="stepper__line" />
        <div className="stepper__step">
          <div className="stepper__circle">2</div>
          <span className="stepper__label">Registro</span>
        </div>
        <div className="stepper__line" />
        <div className="stepper__step">
          <div className="stepper__circle">3</div>
          <span className="stepper__label">Verificación</span>
        </div>
      </div>

      <h1 className="login__title login__title--sm">Crear cuenta en Kueski</h1>
      <p className="login__subtitle">
        Te enviaremos un mensaje de verificación a tu correo.
      </p>

      <form className="login__form" onSubmit={(e) => e.preventDefault()} noValidate>
        <div className="login__field">
          <label className="login__label">Correo electrónico*</label>
          <input
            className="login__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="login__field">
          <label className="login__label">Contraseña*</label>
          <div className="login__password-wrapper">
            <input
              className="login__input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="login__eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>
        <button type="submit" className="login__btn">Crear cuenta</button>
      </form>

      <p className="login__legal">
        Confirmo que al crear mi cuenta, he leído y entendido los{' '}
        <a href="#">Términos y Condiciones</a> del servicio y aceptado el{' '}
        <a href="#">Aviso de privacidad</a> de Kueski.
      </p>

      <p className="login__register">
        ¿Ya tienes cuenta?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onVolver() }}>Iniciar sesión</a>
      </p>
    </div>
  )
}

// ─── Controlador de vistas ────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [vista, setVista] = useState('login')

  if (vista === 'recuperar') return <ViewRecuperar onVolver={() => setVista('login')} />
  if (vista === 'crear') return <ViewCrear onVolver={() => setVista('login')} />

  return (
    <ViewLogin
      onLogin={onLogin}
      onRecuperar={() => setVista('recuperar')}
      onCrear={() => setVista('crear')}
    />
  )
}

export default Login
