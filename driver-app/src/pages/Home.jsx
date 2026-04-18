import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import BottomNav from '../components/BottomNav'
import styles from './Home.module.css'

const STATUS_CONFIG = {
  available: { label: 'Available', color: '#22c55e', bg: '#f0fdf4', icon: '✅' },
  busy:      { label: 'On a Ride', color: '#f59e0b', bg: '#fffbeb', icon: '🚗' },
  offline:   { label: 'Offline',   color: '#9ca3af', bg: '#f9fafb', icon: '⭕' },
}

const STATUS_ORDER = ['available', 'busy', 'offline']

export default function Home() {
  const { driver, logout, updateDriverStatus } = useAuth()
  const [changing, setChanging] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const current = driver?.status || 'offline'
  const config = STATUS_CONFIG[current] || STATUS_CONFIG.offline

  async function cycleStatus() {
    const idx = STATUS_ORDER.indexOf(current)
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
    setChanging(true)
    setError('')
    try {
      await api.updateDriverStatus(driver.id, next)
      updateDriverStatus(next)
    } catch (err) {
      setError('Could not update status. Try again.')
    } finally {
      setChanging(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.greeting}>Good {getTimeOfDay()},</p>
          <h1 className={styles.name}>{driver?.name || 'Driver'}</h1>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
      </header>

      <div className={styles.body}>
        {/* Status Card */}
        <div className={styles.statusCard} style={{ background: config.bg, borderColor: config.color + '40' }}>
          <div className={styles.statusTop}>
            <div>
              <p className={styles.statusLabel}>Current Status</p>
              <p className={styles.statusValue} style={{ color: config.color }}>
                {config.icon} {config.label}
              </p>
            </div>
            <div className={styles.statusDot} style={{ background: config.color }} />
          </div>

          {error && <p className={styles.statusError}>{error}</p>}

          <button
            className={styles.toggleBtn}
            onClick={cycleStatus}
            disabled={changing}
            style={{ borderColor: config.color, color: config.color }}
          >
            {changing ? 'Updating…' : 'Change Status'}
          </button>

          <div className={styles.statusOptions}>
            {STATUS_ORDER.map(s => (
              <div
                key={s}
                className={`${styles.statusPill} ${s === current ? styles.statusPillActive : ''}`}
                style={s === current ? { background: config.color, color: 'white' } : {}}
              >
                {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
              </div>
            ))}
          </div>
        </div>

        {/* Driver Info */}
        <div className={styles.infoCard}>
          <h3 className={styles.cardTitle}>Driver Info</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>License</span>
            <span className={styles.infoValue}>{driver?.license_number || '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Rating</span>
            <span className={styles.infoValue}>⭐ {driver?.rating ?? '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Total Trips</span>
            <span className={styles.infoValue}>{driver?.total_trips ?? 0}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Phone</span>
            <span className={styles.infoValue}>{driver?.phone || '—'}</span>
          </div>
        </div>

        {/* Quick action */}
        <button className={styles.ridesBtn} onClick={() => navigate('/rides')}>
          View My Rides →
        </button>
      </div>

      <BottomNav />
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
