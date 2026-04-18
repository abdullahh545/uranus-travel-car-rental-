import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register } from '../api'

export default function Register() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      return setError('Passwords do not match.')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    setLoading(true)
    try {
      const data = await register({
        name:     form.name,
        email:    form.email,
        phone:    form.phone || undefined,
        password: form.password,
      })
      signIn(data.user, data.token)
      navigate('/booking', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">U</div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name" type="text" className="form-input"
              placeholder="Ahmed Al-Mansoori"
              value={form.name} onChange={set('name')} required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email" type="email" className="form-input"
                placeholder="you@example.com"
                value={form.email} onChange={set('email')} required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone (optional)</label>
              <input
                id="phone" type="tel" className="form-input"
                placeholder="+973 xxxxxxxx"
                value={form.phone} onChange={set('phone')}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" type="password" className="form-input"
                placeholder="Min. 6 characters"
                value={form.password} onChange={set('password')} required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm">Confirm password</label>
              <input
                id="confirm" type="password" className="form-input"
                placeholder="Repeat password"
                value={form.confirm} onChange={set('confirm')} required
              />
            </div>
          </div>
          <button className="btn-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
