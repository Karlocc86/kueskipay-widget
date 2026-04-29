import { useState } from 'react'
import './App.css'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {
  const [screen, setScreen] = useState('login')

  return (
    <div className="widget">
      {screen === 'login' && (
        <Login onLogin={() => setScreen('dashboard')} />
      )}
      {screen === 'dashboard' && (
        <Dashboard onLogout={() => setScreen('login')} />
      )}
    </div>
  )
}

export default App
