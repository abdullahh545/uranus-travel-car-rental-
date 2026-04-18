import { useEffect, useState, useCallback } from 'react'
import { getDrivers, addDriver, updateDriver, deleteDriver } from '../api'
import { useSocket } from '../hooks/useSocket'

const FILTERS = ['all', 'available', 'busy', 'offline']

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', license_number: '' }

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}

function Stars({ rating }) {
  const r = parseFloat(rating) || 0
  return (
    <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 13 }}>
      {'★'.repeat(Math.round(r))}{'☆'.repeat(5 - Math.round(r))}
      <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: 4 }}>{r.toFixed(2)}</span>
    </span>
  )
}

function AddDriverModal({ onClose, onAdded }) {
  const [form, setForm]         = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await addDriver(form)
      onAdded(data.driver)
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
          <div className="modal-title">Add New Driver</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} required placeholder="John Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="john@example.com" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+973 1234 5678" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">License Number</label>
              <input className="form-input" name="license_number" value={form.license_number} onChange={handleChange} required placeholder="DL-123456" />
            </div>
            {error && <div className="modal-error">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_OPTIONS = ['available', 'busy', 'offline']

function EditDriverModal({ driver, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:           driver.name           || '',
    email:          driver.email          || '',
    phone:          driver.phone          || '',
    license_number: driver.license_number || '',
    status:         driver.status         || 'offline',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await updateDriver(driver.id, form)
      onSaved(data.driver)
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
            <div className="modal-title">Edit Driver</div>
            <div className="modal-sub">#{driver.id}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+973 1234 5678" />
              </div>
              <div className="form-group">
                <label className="form-label">License Number</label>
                <input className="form-input" name="license_number" value={form.license_number} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
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

export default function Drivers() {
  const [drivers, setDrivers]       = useState([])
  const [filter, setFilter]         = useState('all')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [flash, setFlash]           = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    getDrivers()
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setDrivers(data.drivers ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleDriverUpdate = useCallback(({ driver_id, status }) => {
    setDrivers(prev =>
      prev.map(d => d.id === driver_id ? { ...d, status } : d)
    )
    setFlash(driver_id)
    setTimeout(() => setFlash(null), 2500)
  }, [])

  useSocket({ 'driver:status:update': handleDriverUpdate })

  const handleAdded = (driver) => {
    setDrivers(prev => [driver, ...prev])
    setShowAddModal(false)
  }

  const handleSaved = (driver) => {
    setDrivers(prev => prev.map(d => d.id === driver.id ? driver : d))
    setEditingDriver(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver? This action cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteDriver(id)
      setDrivers(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      alert('Failed to delete driver: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const visible = filter === 'all' ? drivers : drivers.filter((d) => d.status === filter)

  if (loading) return <div className="state-box">Loading drivers…</div>
  if (error)   return <div className="state-box error">Error: {error}</div>

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Driver Fleet</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="card-count">{visible.length} drivers</span>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add New Driver</button>
          </div>
        </div>

        <div className="filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Driver</th>
                <th>Phone</th>
                <th>License</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Total trips</th>
                <th>Vehicle</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={10}><div className="state-box">No drivers match this filter.</div></td></tr>
              )}
              {visible.map((d) => (
                <tr
                  key={d.id}
                  style={
                    flash === d.id
                      ? { background: '#fefce8', transition: 'background 0.4s' }
                      : { transition: 'background 1.5s' }
                  }
                >
                  <td style={{ color: '#94a3b8', fontWeight: 600 }}>#{d.id}</td>
                  <td>
                    <div className="td-main">{d.name}</div>
                    <div className="td-sub">{d.email}</div>
                  </td>
                  <td style={{ color: '#475569' }}>{d.phone}</td>
                  <td>
                    <code style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: 6, fontSize: 12, color: '#374151' }}>
                      {d.license_number}
                    </code>
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td><Stars rating={d.rating} /></td>
                  <td style={{ fontWeight: 600 }}>{d.total_trips}</td>
                  <td>
                    {d.make
                      ? <><div className="td-main">{d.make} {d.model}</div>
                          <div className="td-sub">{d.plate_number}</div></>
                      : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setEditingDriver(d)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(d.id)}
                      disabled={deletingId === d.id}
                    >
                      {deletingId === d.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddDriverModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}

      {editingDriver && (
        <EditDriverModal
          driver={editingDriver}
          onClose={() => setEditingDriver(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
