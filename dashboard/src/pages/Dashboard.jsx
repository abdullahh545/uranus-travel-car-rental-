import { useEffect, useState, useCallback } from 'react'
import { BookOpen, Clock, Users, Car, TrendingUp } from 'lucide-react'
import { getStats, getBookings } from '../api'
import { useSocket } from '../hooks/useSocket'

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon /></div>
      <div className="stat-body">
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    Promise.all([getStats(), getBookings()])
      .then(([s, b]) => {
        if (s.error) throw new Error(s.error)
        setStats(s)
        setRecent((b.bookings ?? []).slice(0, 6))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Real-time: patch status in recent bookings table
  const handleBookingUpdate = useCallback(({ booking_id, status }) => {
    setRecent(prev =>
      prev.map(b => b.id === booking_id ? { ...b, status } : b)
    )
  }, [])

  useSocket({ 'booking:status:update': handleBookingUpdate })

  if (loading) return <div className="state-box">Loading dashboard…</div>
  if (error)   return <div className="state-box error">Error: {error}</div>

  return (
    <>
      <div className="stats-grid">
        <StatCard icon={TrendingUp} value={stats.totalBookings}  label="Total Bookings"  color="blue"   />
        <StatCard icon={Clock}      value={stats.pendingRides}   label="Pending Rides"   color="yellow" />
        <StatCard icon={Users}      value={stats.activeDrivers}  label="Active Drivers"  color="green"  />
        <StatCard icon={Car}        value={stats.totalVehicles}  label="Total Vehicles"  color="purple" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Bookings</span>
          <span className="card-count">{recent.length} shown</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Pickup</th>
                <th>Drop-off</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={7} className="state-box">No bookings found.</td></tr>
              )}
              {recent.map((b) => (
                <tr key={b.id}>
                  <td style={{ color: '#94a3b8', fontWeight: 600 }}>#{b.id}</td>
                  <td>
                    <div className="td-main">{b.customer_name ?? '—'}</div>
                    <div className="td-sub">{b.customer_phone ?? ''}</div>
                  </td>
                  <td style={{ maxWidth: 180 }}>{b.pickup_location}</td>
                  <td style={{ maxWidth: 180 }}>{b.dropoff_location}</td>
                  <td>{b.driver_name ?? <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
