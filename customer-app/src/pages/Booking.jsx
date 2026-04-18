import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createBooking } from '../api'

const vehicles = [
  {
    id: 'sedan',
    emoji: '🚗',
    name: 'Standard',
    desc: 'Toyota Camry or similar — comfortable and affordable for everyday travel.',
    price: 'From 5.00 BHD',
  },
  {
    id: 'luxury',
    emoji: '🏎️',
    name: 'Premium',
    desc: 'Mercedes S-Class, BMW 7 Series, or Lexus LS — for business and special occasions.',
    price: 'From 15.00 BHD',
  },
]

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function Booking() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [form, setForm] = useState({
    pickup:       '',
    dropoff:      '',
    pickup_date:  '',
    pickup_time:  '',
    vehicle_type: 'sedan',
    notes:        '',
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [booking,  setBooking]  = useState(null)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  // Build datetime string from separate date + time inputs
  function buildPickupTime() {
    return `${form.pickup_date}T${form.pickup_time}:00`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!user) {
      navigate('/login', { state: { from: '/booking' } })
      return
    }

    if (!form.pickup || !form.dropoff || !form.pickup_date || !form.pickup_time) {
      setError('Please fill in all required fields.')
      return
    }

    // Validate pickup time is in the future
    if (new Date(buildPickupTime()) <= new Date()) {
      setError('Pickup date and time must be in the future.')
      return
    }

    setLoading(true)
    try {
      const data = await createBooking({
        customer_id:      user.id,
        pickup_location:  form.pickup,
        dropoff_location: form.dropoff,
        pickup_time:      buildPickupTime(),
        notes:            form.notes || undefined,
        vehicle_type:     form.vehicle_type,
      })
      setBooking(data.booking)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Min datetime = now (for the date/time inputs)
  const now    = new Date()
  const minDate = now.toISOString().split('T')[0]
  const minTime = now.toTimeString().slice(0, 5)

  /* ── Success screen ─────────────────────────────────── */
  if (booking) {
    const vType = vehicles.find((v) => v.id === form.vehicle_type)
    return (
      <div className="booking-page">
        <div className="booking-inner">
          <div className="confirm-card">
            <div className="confirm-icon">✅</div>
            <h2>Booking Confirmed!</h2>
            <p>
              Your ride has been submitted. A driver will be assigned shortly.<br />
              Booking reference: <strong style={{ color: '#a78bfa' }}>#{booking.id}</strong>
            </p>

            <div className="confirm-details">
              <div className="confirm-row">
                <span>Pickup</span>
                <span>{form.pickup}</span>
              </div>
              <div className="confirm-row">
                <span>Drop-off</span>
                <span>{form.dropoff}</span>
              </div>
              <div className="confirm-row">
                <span>Date & Time</span>
                <span>{new Date(buildPickupTime()).toLocaleString()}</span>
              </div>
              <div className="confirm-row">
                <span>Vehicle</span>
                <span>{vType?.emoji} {vType?.name}</span>
              </div>
              <div className="confirm-row">
                <span>Status</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>Pending</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => { setBooking(null); setForm({ pickup:'', dropoff:'', pickup_date:'', pickup_time:'', vehicle_type:'sedan', notes:'' }) }}
              >
                Book Another Ride
              </button>
              <button className="btn-outline" onClick={() => navigate('/')}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Booking form ───────────────────────────────────── */
  return (
    <div className="booking-page">
      <div className="booking-inner">
        <div className="booking-header">
          <h1>Book Your Ride</h1>
          <p>Fill in the details below and we'll get a driver to you.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="booking-card">

            {/* Locations */}
            <p className="form-section-title">Route Details</p>
            <div className="form-group">
              <label className="form-label" htmlFor="pickup">Pickup location *</label>
              <input
                id="pickup" type="text" className="form-input"
                placeholder="e.g. Manama City Centre, Bahrain"
                value={form.pickup} onChange={set('pickup')} required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label className="form-label" htmlFor="dropoff">Drop-off location *</label>
              <input
                id="dropoff" type="text" className="form-input"
                placeholder="e.g. Bahrain International Airport"
                value={form.dropoff} onChange={set('dropoff')} required
              />
            </div>

            {/* Date & Time */}
            <p className="form-section-title">Pickup Date & Time</p>
            <div className="form-row" style={{ marginBottom: 28 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="pickup_date">Date *</label>
                <input
                  id="pickup_date" type="date" className="form-input"
                  min={minDate}
                  value={form.pickup_date} onChange={set('pickup_date')} required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pickup_time">Time *</label>
                <input
                  id="pickup_time" type="time" className="form-input"
                  value={form.pickup_time} onChange={set('pickup_time')} required
                />
              </div>
            </div>

            {/* Vehicle type */}
            <p className="form-section-title">Vehicle Type</p>
            <div className="vehicle-grid" style={{ marginBottom: 28 }}>
              {vehicles.map((v) => (
                <label
                  key={v.id}
                  className={`vehicle-card${form.vehicle_type === v.id ? ' selected' : ''}`}
                  htmlFor={`vehicle-${v.id}`}
                >
                  <input
                    id={`vehicle-${v.id}`}
                    type="radio" name="vehicle_type"
                    value={v.id}
                    checked={form.vehicle_type === v.id}
                    onChange={set('vehicle_type')}
                  />
                  <div className="vehicle-check"><CheckIcon /></div>
                  <span className="vehicle-emoji">{v.emoji}</span>
                  <div className="vehicle-name">{v.name}</div>
                  <div className="vehicle-desc">{v.desc}</div>
                  <div className="vehicle-price">{v.price}</div>
                </label>
              ))}
            </div>

            {/* Notes */}
            <p className="form-section-title">Additional Notes</p>
            <div className="form-group">
              <label className="form-label" htmlFor="notes">Special requests (optional)</label>
              <textarea
                id="notes"
                className="form-input"
                placeholder="e.g. Need help with luggage, child seat required…"
                rows={3}
                style={{ resize: 'vertical' }}
                value={form.notes}
                onChange={set('notes')}
              />
            </div>

            <button className="btn-submit" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Submitting…' : user ? '🚀 Confirm Booking' : '🔐 Sign In to Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
