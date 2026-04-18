import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCustomerBookings } from '../api'

const STATUS_CONFIG = {
  pending:     { label: 'Pending',      color: '#fbbf24' },
  confirmed:   { label: 'Confirmed',    color: '#60a5fa' },
  in_progress: { label: 'On The Way',   color: '#a78bfa' },
  arrived:     { label: 'Arrived',      color: '#fb923c' },
  completed:   { label: 'Completed',    color: '#34d399' },
  cancelled:   { label: 'Cancelled',    color: '#f87171' },
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function MyBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!user) return
    getCustomerBookings(user.id)
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="bookings-list-page">
      <div className="bookings-list-inner">
        <div className="booking-header">
          <h1>My Bookings</h1>
          <p>Track all your rides in one place.</p>
        </div>

        {loading && (
          <div className="page-loading" style={{ minHeight: 'unset', padding: '60px 0' }}>
            Loading your bookings…
          </div>
        )}

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="bookings-empty">
            <div className="bookings-empty-icon">🚗</div>
            <p>No bookings yet. <a href="/booking">Book your first ride!</a></p>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="bookings-grid">
            {bookings.map((b) => {
              const status = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending
              return (
                <div key={b.id} className="booking-item">
                  <div className="booking-item-header">
                    <span className="booking-item-ref">Booking #{b.id}</span>
                    <span
                      className="booking-item-status"
                      style={{ color: status.color, borderColor: `${status.color}40`, background: `${status.color}12` }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="booking-item-route">
                    <div className="booking-route-row">
                      <span className="route-dot route-dot-green" />
                      <div>
                        <p className="route-label">Pickup</p>
                        <p className="route-value">{b.pickup_location}</p>
                      </div>
                    </div>
                    <div className="route-line" />
                    <div className="booking-route-row">
                      <span className="route-dot route-dot-red" />
                      <div>
                        <p className="route-label">Drop-off</p>
                        <p className="route-value">{b.dropoff_location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="booking-item-meta">
                    <div className="booking-meta-row">
                      <span className="meta-icon">🕐</span>
                      <span className="meta-label">Pickup Time</span>
                      <span className="meta-value">{formatDateTime(b.pickup_time)}</span>
                    </div>
                    <div className="booking-meta-row">
                      <span className="meta-icon">🚘</span>
                      <span className="meta-label">Driver</span>
                      <span className="meta-value">{b.driver_name || 'Pending assignment'}</span>
                    </div>
                    {b.vehicle_make && (
                      <div className="booking-meta-row">
                        <span className="meta-icon">🔢</span>
                        <span className="meta-label">Vehicle</span>
                        <span className="meta-value">{b.vehicle_make} {b.vehicle_model} · {b.plate_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
