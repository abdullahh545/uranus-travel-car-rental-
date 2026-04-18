const BASE = 'http://localhost:5000/api'

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON but got: ${contentType}. Is the backend running on port 5000?`)
  }
  return res.json()
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON but got: ${contentType}`)
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`)
  return data
}

async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON but got: ${contentType}`)
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`)
  return data
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' })
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON but got: ${contentType}`)
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`)
  return data
}

export const getStats            = () => get('/stats')
export const getBookings         = () => get('/bookings/all')
export const getDrivers          = () => get('/drivers/all')
export const getAvailableDrivers = () => get('/drivers/available')
export const getVehicles         = () => get('/vehicles/all')

export const assignDriver  = (data) => put('/bookings/assign', data)
export const addDriver     = (data) => post('/drivers', data)
export const updateDriver  = (id, data) => put(`/drivers/${id}`, data)
export const deleteDriver  = (id)   => del(`/drivers/${id}`)
export const addVehicle    = (data) => post('/vehicles', data)
export const updateVehicle = (id, data) => put(`/vehicles/${id}`, data)
export const deleteVehicle = (id)   => del(`/vehicles/${id}`)
