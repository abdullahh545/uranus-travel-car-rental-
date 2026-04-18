const BASE = 'http://localhost:5000/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const register          = (body) => request('/auth/register',          { method: 'POST', body: JSON.stringify(body) })
export const login             = (body) => request('/auth/login',             { method: 'POST', body: JSON.stringify(body) })
export const createBooking     = (body) => request('/bookings/create',        { method: 'POST', body: JSON.stringify(body) })
export const getCustomerBookings = (id) => request(`/bookings/customer/${id}`)
