import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'
import regStyles from './Register.module.css'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', license_number: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.driverRegister(
        form.name, form.email, form.password, form.phone, form.license_number
      )
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
      <div className={styles.header}>
        <div className={styles.logo}>🪐</div>
        <h1 className={styles.brand}>Uranus Travel</h1>
        <p className={styles.subtitle}>Driver Portal</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Create account</h2>
        <p className={styles.hint}>Register as a new driver</p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label}>Full Name</label>
          <input
            className={styles.input}
            type="text"
            name="name"
            placeholder="Ahmed Al-Rashid"
            value={form.name}
            onChange={handleChange}
            required
            autoComplete="name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            name="email"
            placeholder="driver@example.com"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Phone</label>
          <input
            className={styles.input}
            type="tel"
            name="phone"
            placeholder="+973 3XXX XXXX"
            value={form.phone}
            onChange={handleChange}
            autoComplete="tel"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>License Number</label>
          <input
            className={styles.input}
            type="text"
            name="license_number"
            placeholder="BH-123456"
            value={form.license_number}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </div>

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p className={regStyles.loginLink}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
