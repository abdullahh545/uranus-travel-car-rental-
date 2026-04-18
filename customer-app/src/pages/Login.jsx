import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login } from '../api'

function PlanetIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="14" cy="14" r="8" fill="#060f24" fillOpacity="0.9"/>
      <circle cx="14" cy="14" r="8" stroke="#060f24" strokeWidth="0.5"/>
      <ellipse cx="14" cy="14" rx="13" ry="4.5" stroke="#060f24" strokeWidth="2" fill="none"/>
      <circle cx="14" cy="14" r="7" fill="#0f2457"/>
      <circle cx="11" cy="11" r="2" fill="#1a3570" fillOpacity="0.8"/>
      <circle cx="16" cy="15" r="1.5" fill="#1a3570" fillOpacity="0.6"/>
    </svg>
  )
}

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const next       = location.state?.from ?? '/booking'

  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login({ email: form.email, password: form.password })
      signIn(data.user, data.token)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-stars" aria-hidden="true" />

      <div className="auth-card">
        {/* Brand lockup */}
        <div className="auth-brand">
          <div className="auth-logo-ring" aria-hidden="true">
            <PlanetIcon />
          </div>
          <div>
            <div className="auth-brand-name">Uranus Travel</div>
            <div className="auth-brand-tag">& Tourism</div>
          </div>
        </div>

        <div className="auth-divider" />

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">
          Don't have an account?{' '}
          <Link to="/register">Sign up free</Link>
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{flexShrink:0,marginTop:'1px'}}>
              <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className={`form-input${error ? ' err' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`form-input${error ? ' err' : ''}`}
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
