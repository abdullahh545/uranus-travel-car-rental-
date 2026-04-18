import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMIN_EMAIL    = 'admin@uranus.com'
const ADMIN_PASSWORD = 'admin123'

function PlanetLogoSvg() {
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="14" cy="14" r="8" fill="#c9a227" fillOpacity="0.15"/>
      <circle cx="14" cy="14" r="7" fill="#0f2457"/>
      <circle cx="11" cy="11" r="2" fill="#1a3570"/>
      <circle cx="16" cy="15" r="1.5" fill="#1a3570" fillOpacity="0.8"/>
      <ellipse cx="14" cy="14" rx="13" ry="4.2" stroke="#c9a227" strokeWidth="1.8" fill="none"/>
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{flexShrink:0}}>
      <circle cx="8" cy="8" r="7" stroke="#b91c1c" strokeWidth="1.5"/>
      <path d="M8 5v3M8 10.5v.5" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6.5" fill="rgba(201,162,39,.15)" stroke="rgba(201,162,39,.4)"/>
      <path d="M4 7l2 2 4-4" stroke="#c9a227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuth', 'true')
      navigate('/')
    } else {
      setError('Invalid email or password.')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">

      {/* ── Left panel: branding ── */}
      <div className="login-panel-left">
        <div className="login-left-stars" aria-hidden="true" />

        <div className="login-left-brand">
          <div className="login-left-logo" aria-hidden="true">
            <PlanetLogoSvg />
          </div>
          <div className="login-left-brand-text">
            <strong>Uranus Travel</strong>
            <span>& Tourism</span>
          </div>
        </div>

        <div className="login-left-content">
          <span className="login-left-planet" role="img" aria-label="planet">🪐</span>
          <h2 className="login-left-headline">
            Admin <em>Control</em><br />Center
          </h2>
          <p className="login-left-sub">
            Manage bookings, drivers, and vehicles across the Uranus Travel platform.
          </p>
          <div className="login-left-pills">
            <span className="login-left-pill">
              <CheckIcon /> Bookings
            </span>
            <span className="login-left-pill">
              <CheckIcon /> Drivers
            </span>
            <span className="login-left-pill">
              <CheckIcon /> Vehicles
            </span>
            <span className="login-left-pill">
              <CheckIcon /> Live Stats
            </span>
          </div>
        </div>

        <p className="login-left-footer">© {new Date().getFullYear()} Uranus Travel & Tourism</p>
      </div>

      {/* ── Right panel: form ── */}
      <div className="login-panel-right">
        <div className="login-card">
          <div className="login-logo-wrap">
            <div className="login-logo" aria-hidden="true">
              <PlanetLogoSvg />
            </div>
          </div>
          <h1 className="login-heading">Admin Sign In</h1>
          <p className="login-sub">Sign in to the Uranus Travel admin panel</p>

          {error && (
            <div className="login-error" role="alert">
              <AlertIcon />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className={`form-input${error ? ' error' : ''}`}
                placeholder="admin@uranus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={`form-input${error ? ' error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="login-hint">admin@uranus.com · admin123</p>
        </div>
      </div>

    </div>
  )
}
