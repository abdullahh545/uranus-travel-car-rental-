import React, { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { emitBookingStatus } from '../services/socket'
import styles from './RideDetail.module.css'

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: '#f59e0b', bg: '#fffbeb' },
  confirmed:   { label: 'Confirmed',   color: '#3b82f6', bg: '#eff6ff' },
  in_progress: { label: 'In Progress', color: '#8b5cf6', bg: '#f5f3ff' },
  arrived:     { label: 'Arrived',     color: '#f97316', bg: '#fff7ed' },
  completed:   { label: 'Completed',   color: '#22c55e', bg: '#f0fdf4' },
  cancelled:   { label: 'Cancelled',   color: '#ef4444', bg: '#fef2f2' },
}

// What actions a driver can take per status
const NEXT_ACTIONS = {
  confirmed:   [{ status: 'in_progress', label: '▶ Start Ride' }],
  in_progress: [{ status: 'arrived',     label: '📍 Mark Arrived' }],
  arrived:     [{ status: 'completed',   label: '✅ Complete Ride' }],
}

export default function RideDetail() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(state?.booking || null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  if (!booking) {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <div className={styles.noData}>Ride not found.</div>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending
  const actions = NEXT_ACTIONS[booking.status] || []

  const pickupDate = booking.pickup_time
    ? new Date(booking.pickup_time).toLocaleString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—'

  const createdAt = booking.created_at
    ? new Date(booking.created_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    : '—'

  async function handleAction(newStatus) {
    setUpdating(true)
    setError('')
    try {
      const data = await api.updateBookingStatus(booking.id, newStatus)
      emitBookingStatus(booking.id, newStatus, booking.customer_id)
      setBooking({ ...data.booking, customer_name: booking.customer_name, customer_phone: booking.customer_phone })
    } catch (err) {
      setError(err.message || 'Could not update status.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>←</button>
        <h1 className={styles.title}>Ride #{booking.id}</h1>
        <div />
      </div>

      <div className={styles.body}>
        {/* Status banner */}
        <div className={styles.statusBanner} style={{ background: statusCfg.bg }}>
          <span className={styles.statusLabel} style={{ color: statusCfg.color }}>
            {statusCfg.label}
          </span>
          <span className={styles.statusDot} style={{ background: statusCfg.color }} />
        </div>

        {/* Customer */}
        <Section title="Customer">
          <Row icon="👤" label="Name" value={booking.customer_name || '—'} />
          <Row icon="📞" label="Phone" value={booking.customer_phone || '—'} />
        </Section>

        {/* Route */}
        <Section title="Route">
          <div className={styles.routeVisual}>
            <div className={styles.routePoint}>
              <span className={styles.routeIconGreen}>⬤</span>
              <div>
                <p className={styles.routePointLabel}>Pickup</p>
                <p className={styles.routePointValue}>{booking.pickup_location}</p>
              </div>
            </div>
            <div className={styles.routeDivider} />
            <div className={styles.routePoint}>
              <span className={styles.routeIconRed}>⬤</span>
              <div>
                <p className={styles.routePointLabel}>Drop-off</p>
                <p className={styles.routePointValue}>{booking.dropoff_location}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Schedule */}
        <Section title="Schedule">
          <Row icon="🕐" label="Pickup Time" value={pickupDate} />
          <Row icon="📅" label="Booked On" value={createdAt} />
        </Section>

        {/* Vehicle */}
        {(booking.vehicle_make || booking.plate_number) && (
          <Section title="Vehicle">
            {booking.vehicle_make && (
              <Row icon="🚗" label="Vehicle" value={`${booking.vehicle_make} ${booking.vehicle_model || ''}`} />
            )}
            {booking.plate_number && (
              <Row icon="🔢" label="Plate" value={booking.plate_number} />
            )}
          </Section>
        )}

        {/* Notes */}
        {booking.notes && (
          <Section title="Notes">
            <p className={styles.notes}>{booking.notes}</p>
          </Section>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className={styles.actions}>
            {error && <p className={styles.actionError}>{error}</p>}
            {actions.map(action => (
              <button
                key={action.status}
                className={styles.actionBtn}
                onClick={() => handleAction(action.status)}
                disabled={updating}
              >
                {updating ? 'Updating…' : action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

function Row({ icon, label, value }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowIcon}>{icon}</span>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  )
}
