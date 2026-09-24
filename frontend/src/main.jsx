/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'

function Root() {
  const { user, loading, authEnabled } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2.5 bg-paper text-sm text-ink-soft">
        <span className="pulse-dot size-2 rounded-full bg-verified" />
        Preparing your desk…
      </div>
    )
  }
  if (authEnabled && !user) return <Login />
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
)
