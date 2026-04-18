import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'
import regStyles from './Register.module.css'

function PlanetLogo() {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="18" cy="18" r="10" fill="#0f2457"/>
      <circle cx="14" cy="14" r="3" fill="#1a3570"/>
      <circle cx="20" cy="20" r="2" fill="#1a3570" fillOpacity="0.7"/>
      <ellipse cx="18" cy="18" rx="17" ry="5.5" stroke="#060f24" strokeWidth="2.5" fill="none"/>
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

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.driverLogin(email, password)
      login(data.token, data.driver)
      navigate('/home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.stars} aria-hidden="true" />

      {/* Header / brand */}
      <div className={styles.header}>
        <div className={styles.logoRing} aria-label="Uranus Travel logo">
          <PlanetLogo />
        </div>
        <div className={styles.brand}>Uranus Travel</div>
        <div className={styles.subtitle}>Driver Portal</div>
      </div>

      {/* Form card */}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.hint}>Sign in to your driver account</p>

        {error && (
          <div className={styles.error} role="alert">
            <AlertIcon />
            {error}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="driver-email">Email</label>
          <input
            id="driver-email"
            className={styles.input}
            type="email"
            placeholder="driver@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="driver-password">Password</label>
          <input
            id="driver-password"
            className={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <p className={regStyles.loginLink}>
          New driver? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  )
}
