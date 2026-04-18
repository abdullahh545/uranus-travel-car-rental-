import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { emitBookingStatus } from '../services/socket'
import BottomNav from '../components/BottomNav'
import styles from './MyRides.module.css'

const STATUS_BADGE = {
  pending:     { label: 'Pending',     color: '#f59e0b', bg: '#fffbeb' },
  confirmed:   { label: 'Confirmed',   color: '#3b82f6', bg: '#eff6ff' },
  in_progress: { label: 'In Progress', color: '#8b5cf6', bg: '#f5f3ff' },
  completed:   { label: 'Completed',   color: '#22c55e', bg: '#f0fdf4' },
  cancelled:   { label: 'Cancelled',   color: '#ef4444', bg: '#fef2f2' },
}

// Actions available per status (driver-facing)
const ACTIONS = {
  confirmed:   { label: 'Start Ride',    nextStatus: 'in_progress', style: 'primary' },
  in_progress: { label: 'Complete Ride', nextStatus: 'completed',   style: 'success' },
}

export default function MyRides() {
  const { driver } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    if (!driver?.id) return
    loadBookings()
  }, [driver])

  async function loadBookings() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getDriverBookings(driver.id)
      setBookings(data.bookings || [])
    } catch (err) {
      setError('Could not load rides.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = useCallback(async (booking, newStatus) => {
    // Optimistic update
    setBookings(prev =>
      prev.map(b => b.id === booking.id ? { ...b, status: newStatus, _updating: true } : b)
    )
    try {
      const data = await api.updateBookingStatus(booking.id, newStatus)
      // Emit socket event so dashboard updates instantly
      emitBookingStatus(booking.id, newStatus, booking.customer_id)
      setBookings(prev =>
        prev.map(b => b.id === booking.id ? { ...data.booking, customer_name: booking.customer_name, customer_phone: booking.customer_phone } : b)
      )
    } catch (err) {
      // Revert on failure
      setBookings(prev =>
        prev.map(b => b.id === booking.id ? { ...booking } : b)
      )
    }
  }, [])

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter)

  // Count active (confirmed + in_progress) for badge
  const activeCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Rides</h1>
          {activeCount > 0 && (
            <span className={styles.activeBadge}>{activeCount} active</span>
          )}
        </div>
        <button className={styles.refreshBtn} onClick={loadBookings}>↻</button>
      </header>

      {/* Filter tabs */}
      <div className={styles.filters}>
        {['all', 'confirmed', 'in_progress', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${bookings.length})` : STATUS_BADGE[f]?.label}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        {loading && (
          <div className={styles.center}>
            <div className={styles.spinner} />
            <p>Loading rides…</p>
          </div>
        )}
        {!loading && error && (
          <div className={styles.errorBox}>
            {error}
            <button className={styles.retryBtn} onClick={loadBookings}>Retry</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🚕</p>
            <p className={styles.emptyText}>No rides found</p>
            <p className={styles.emptyHint}>
              {filter !== 'all' ? 'Try switching to a different filter' : 'Rides assigned to you will appear here'}
            </p>
          </div>
        )}

        {!loading && filtered.map(booking => (
          <RideCard
            key={booking.id}
            booking={booking}
            onViewDetail={() => navigate(`/rides/${booking.id}`, { state: { booking } })}
            onStatusUpdate={handleStatusUpdate}
          />
        ))}
      </div>

      <BottomNav />
    </div>
  )
}

function RideCard({ booking, onViewDetail, onStatusUpdate }) {
  const badge = STATUS_BADGE[booking.status] || STATUS_BADGE.pending
  const action = ACTIONS[booking.status]

  const pickupDate = booking.pickup_time
    ? new Date(booking.pickup_time).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—'

  return (
    <div className={styles.card}>
      {/* Card header */}
      <div className={styles.cardTop}>
        <div className={styles.customerInfo}>
          <span className={styles.customerAvatar}>
            {(booking.customer_name || 'C')[0].toUpperCase()}
          </span>
          <div>
            <p className={styles.customerName}>{booking.customer_name || 'Customer'}</p>
            {booking.customer_phone && (
              <p className={styles.customerPhone}>{booking.customer_phone}</p>
            )}
          </div>
        </div>
        <span
          className={styles.badge}
          style={{ color: badge.color, background: badge.bg }}
        >
          {badge.label}
        </span>
      </div>

      {/* Route */}
      <div className={styles.route}>
        <div className={styles.routeRow}>
          <span className={`${styles.routeDot} ${styles.green}`} />
          <span className={styles.location}>{booking.pickup_location}</span>
        </div>
        <div className={styles.routeConnector}>
          <span className={styles.routeLine} />
        </div>
        <div className={styles.routeRow}>
          <span className={`${styles.routeDot} ${styles.red}`} />
          <span className={styles.location}>{booking.dropoff_location}</span>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <span className={styles.time}>🕐 {pickupDate}</span>
      </div>

      {/* Action row */}
      <div className={styles.cardActions}>
        <button className={styles.detailBtn} onClick={onViewDetail}>
          View Details
        </button>
        {action && (
          <button
            className={`${styles.actionBtn} ${styles[action.style]}`}
            onClick={() => onStatusUpdate(booking, action.nextStatus)}
            disabled={booking._updating}
          >
            {booking._updating ? '…' : action.label}
          </button>
        )}
      </div>
    </div>
  )
}
