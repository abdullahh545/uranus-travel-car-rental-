import { useEffect, useState } from 'react'
import { getVehicles, getDrivers, addVehicle, updateVehicle, deleteVehicle } from '../api'

const FILTERS = ['all', 'sedan', 'luxury', 'suv']

const EMPTY_FORM = { make: '', model: '', year: '', plate_number: '', vehicle_type: 'sedan', capacity: '', driver_id: '' }

function TypeBadge({ type }) {
  return <span className={`badge badge-${type}`}>{type}</span>
}

function DriverStatus({ status }) {
  if (!status) return <span style={{ color: '#94a3b8' }}>—</span>
  return <span className={`badge badge-${status}`}>{status}</span>
}

function AddVehicleModal({ onClose, onAdded }) {
  const [form, setForm]             = useState(EMPTY_FORM)
  const [drivers, setDrivers]       = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    getDrivers()
      .then((data) => setDrivers(data.drivers ?? []))
      .catch(() => {})
  }, [])

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await addVehicle({
        ...form,
        year: parseInt(form.year),
        capacity: parseInt(form.capacity),
        driver_id: form.driver_id ? parseInt(form.driver_id) : null,
      })
      onAdded(data.vehicle)
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
          <div className="modal-title">Add New Vehicle</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Make</label>
                <input className="form-input" name="make" value={form.make} onChange={handleChange} required placeholder="Toyota" />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input className="form-input" name="model" value={form.model} onChange={handleChange} required placeholder="Camry" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-input" name="year" type="number" min="2000" max="2030" value={form.year} onChange={handleChange} required placeholder="2023" />
              </div>
              <div className="form-group">
                <label className="form-label">Plate Number</label>
                <input className="form-input" name="plate_number" value={form.plate_number} onChange={handleChange} required placeholder="123 ABC" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="form-input" name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
                  <option value="sedan">Sedan</option>
                  <option value="luxury">Luxury</option>
                  <option value="suv">SUV</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (seats)</label>
                <input className="form-input" name="capacity" type="number" min="1" max="20" value={form.capacity} onChange={handleChange} required placeholder="4" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Assign to Driver <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
              <select className="form-input" name="driver_id" value={form.driver_id} onChange={handleChange}>
                <option value="">— No driver assigned —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.license_number})</option>
                ))}
              </select>
            </div>
            {error && <div className="modal-error">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditVehicleModal({ vehicle, onClose, onSaved }) {
  const [form, setForm] = useState({
    make:         vehicle.make         || '',
    model:        vehicle.model        || '',
    year:         vehicle.year         || '',
    plate_number: vehicle.plate_number || '',
    vehicle_type: vehicle.vehicle_type || 'sedan',
    capacity:     vehicle.capacity     || '',
    driver_id:    vehicle.driver_id    || '',
  })
  const [drivers, setDrivers]       = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    getDrivers()
      .then((data) => setDrivers(data.drivers ?? []))
      .catch(() => {})
  }, [])

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await updateVehicle(vehicle.id, {
        ...form,
        year:      parseInt(form.year),
        capacity:  parseInt(form.capacity),
        driver_id: form.driver_id ? parseInt(form.driver_id) : null,
      })
      onSaved(data.vehicle)
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
            <div className="modal-title">Edit Vehicle</div>
            <div className="modal-sub">#{vehicle.id}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Make</label>
                <input className="form-input" name="make" value={form.make} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input className="form-input" name="model" value={form.model} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-input" name="year" type="number" min="2000" max="2030" value={form.year} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Plate Number</label>
                <input className="form-input" name="plate_number" value={form.plate_number} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="form-input" name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
                  <option value="sedan">Sedan</option>
                  <option value="luxury">Luxury</option>
                  <option value="suv">SUV</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (seats)</label>
                <input className="form-input" name="capacity" type="number" min="1" max="20" value={form.capacity} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Assigned Driver <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
              <select className="form-input" name="driver_id" value={form.driver_id} onChange={handleChange}>
                <option value="">— No driver assigned —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.license_number})</option>
                ))}
              </select>
            </div>
            {error && <div className="modal-error">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Vehicles() {
  const [vehicles, setVehicles]     = useState([])
  const [filter, setFilter]         = useState('all')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    getVehicles()
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setVehicles(data.vehicles ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleAdded = (vehicle) => {
    setVehicles(prev => [...prev, vehicle])
    setShowAddModal(false)
  }

  const handleSaved = (vehicle) => {
    setVehicles(prev => prev.map(v => v.id === vehicle.id ? vehicle : v))
    setEditingVehicle(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? This action cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteVehicle(id)
      setVehicles(prev => prev.filter(v => v.id !== id))
    } catch (err) {
      alert('Failed to delete vehicle: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const visible = filter === 'all' ? vehicles : vehicles.filter((v) => v.vehicle_type === filter)

  if (loading) return <div className="state-box">Loading vehicles…</div>
  if (error)   return <div className="state-box error">Error: {error}</div>

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Vehicle Fleet</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="card-count">{visible.length} vehicles</span>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add New Vehicle</button>
          </div>
        </div>

        <div className="filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All types' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle</th>
                <th>Year</th>
                <th>Plate</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Assigned driver</th>
                <th>Driver status</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={10}><div className="state-box">No vehicles match this filter.</div></td></tr>
              )}
              {visible.map((v) => (
                <tr key={v.id}>
                  <td style={{ color: '#94a3b8', fontWeight: 600 }}>#{v.id}</td>
                  <td>
                    <div className="td-main">{v.make} {v.model}</div>
                  </td>
                  <td style={{ color: '#475569' }}>{v.year}</td>
                  <td>
                    <code style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: 6, fontSize: 12, color: '#374151' }}>
                      {v.plate_number}
                    </code>
                  </td>
                  <td><TypeBadge type={v.vehicle_type} /></td>
                  <td style={{ fontWeight: 600 }}>{v.capacity} seats</td>
                  <td>{v.driver_name ?? <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                  <td><DriverStatus status={v.driver_status} /></td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>
                    {new Date(v.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setEditingVehicle(v)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(v.id)}
                      disabled={deletingId === v.id}
                    >
                      {deletingId === v.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddVehicleModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}

      {editingVehicle && (
        <EditVehicleModal
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
