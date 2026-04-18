import { useEffect, useState, useCallback } from 'react'
import { getBookings, getAvailableDrivers, getVehicles, assignDriver } from '../api'
import { useSocket } from '../hooks/useSocket'

const FILTERS = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled']

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>
}

function AssignModal({ booking, onClose, onAssigned }) {
  const [drivers, setDrivers]         = useState([])
  const [vehicles, setVehicles]       = useState([])
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    Promise.all([getAvailableDrivers(), getVehicles()])
      .then(([d, v]) => {
        setDrivers(d.drivers ?? [])
        setVehicles(v.vehicles ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver)
    setSelectedVehicleId(driver.vehicle_id ? String(driver.vehicle_id) : '')
    setError('')
  }

  const handleConfirm = async () => {
    if (!selectedDriver) { setError('Please select a driver'); return }
    if (!selectedVehicleId) { setError('Please select a vehicle'); return }
    setSubmitting(true)
    setError('')
    try {
      await assignDriver({
        booking_id: booking.id,
        driver_id: selectedDriver.id,
        vehicle_id: parseInt(selectedVehicleId),
      })
      const v = vehicles.find(x => x.id === parseInt(selectedVehicleId))
      onAssigned({
        driver_name: selectedDriver.name,
        vehicle_make: v?.make ?? '',
        vehicle_model: v?.model ?? '',
        plate_number: v?.plate_number ?? '',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Assign Driver</div>
            <div className="modal-sub">Booking #{booking.id} — {booking.customer_name}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="booking-summary">
            <span className="booking-summary-item">
              <span className="booking-summary-label">Pickup</span>
              {booking.pickup_location}
            </span>
            <span className="booking-summary-arrow">→</span>
            <span className="booking-summary-item">
              <span className="booking-summary-label">Drop-off</span>
              {booking.dropoff_location}
            </span>
          </div>

          <div className="modal-section-label">Available Drivers</div>
          {loading && <div className="state-box" style={{ padding: 24 }}>Loading…</div>}
          {!loading && drivers.length === 0 && (
            <div className="state-box" style={{ padding: 24 }}>No available drivers at this time.</div>
          )}
          {!loading && drivers.length > 0 && (
            <div className="driver-list">
              {drivers.map((d) => (
                <div
                  key={d.id}
                  className={`driver-option${selectedDriver?.id === d.id ? ' selected' : ''}`}
                  onClick={() => handleSelectDriver(d)}
                >
                  <div className="driver-option-radio">
                    <div className={`radio-dot${selectedDriver?.id === d.id ? ' active' : ''}`} />
                  </div>
                  <div className="driver-option-info">
                    <div className="driver-option-name">{d.name}</div>
                    <div className="driver-option-meta">{d.phone} · {d.license_number}</div>
                  </div>
                  <div className="driver-option-vehicle">
                    {d.make
                      ? <><div className="td-main">{d.make} {d.model}</div><div className="td-sub">{d.plate_number}</div></>
                      : <span style={{ color: '#94a3b8', fontSize: 12 }}>No vehicle</span>}
                  </div>
                  <div style={{ color: '#f59e0b', fontSize: 13 }}>★ {parseFloat(d.rating || 0).toFixed(1)}</div>
                </div>
              ))}
            </div>
          )}

          {selectedDriver && (
            <div style={{ marginTop: 16 }}>
              <label className="modal-section-label" htmlFor="vehicle-select">Vehicle</label>
              <select
                id="vehicle-select"
                className="form-input"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
              >
                <option value="">— Select a vehicle —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.plate_number}) — {v.vehicle_type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="modal-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={submitting || loading || !selectedDriver}>
            {submitting ? 'Assigning…' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter]     = useState('all')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [flash, setFlash]       = useState(null)
  const [assigningBooking, setAssigningBooking] = useState(null)

  useEffect(() => {
    getBookings()
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setBookings(data.bookings ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleBookingUpdate = useCallback(({ booking_id, status }) => {
    setBookings(prev =>
      prev.map(b => b.id === booking_id ? { ...b, status } : b)
    )
    setFlash(booking_id)
    setTimeout(() => setFlash(null), 2500)
  }, [])

  useSocket({ 'booking:status:update': handleBookingUpdate })

  const handleAssigned = (booking, extra) => {
    setBookings(prev =>
      prev.map(b => b.id === booking.id ? { ...b, status: 'confirmed', ...extra } : b)
    )
    setFlash(booking.id)
    setTimeout(() => setFlash(null), 2500)
    setAssigningBooking(null)
  }

  const visible = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  if (loading) return <div className="state-box">Loading bookings…</div>
  if (error)   return <div className="state-box error">Error: {error}</div>

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Bookings</span>
          <span className="card-count">{visible.length} records</span>
        </div>

        <div className="filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Pickup location</th>
                <th>Drop-off location</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Fare</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={10}><div className="state-box">No bookings match this filter.</div></td></tr>
              )}
              {visible.map((b) => (
                <tr
                  key={b.id}
                  style={
                    flash === b.id
                      ? { background: '#f0fdf4', transition: 'background 0.4s' }
                      : { transition: 'background 1.5s' }
                  }
                >
                  <td style={{ color: '#94a3b8', fontWeight: 600 }}>#{b.id}</td>
                  <td>
                    <div className="td-main">{b.customer_name ?? '—'}</div>
                    <div className="td-sub">{b.customer_phone ?? ''}</div>
                  </td>
                  <td>{b.pickup_location}</td>
                  <td>{b.dropoff_location}</td>
                  <td>{b.driver_name ?? <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                  <td>
                    {b.vehicle_make
                      ? <><div className="td-main">{b.vehicle_make} {b.vehicle_model}</div>
                          <div className="td-sub">{b.plate_number}</div></>
                      : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td>{b.fare ? `${b.fare} BHD` : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {b.status === 'pending' && (
                      <button
                        className="btn-assign"
                        onClick={() => setAssigningBooking(b)}
                      >
                        Assign Driver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {assigningBooking && (
        <AssignModal
          booking={assigningBooking}
          onClose={() => setAssigningBooking(null)}
          onAssigned={(extra) => handleAssigned(assigningBooking, extra)}
        />
      )}
    </>
  )
}
