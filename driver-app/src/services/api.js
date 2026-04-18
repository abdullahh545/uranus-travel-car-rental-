const BASE_URL = 'http://127.0.0.1:5000/api'

function getToken() {
  return localStorage.getItem('driver_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const url = `${BASE_URL}${path}`
  console.log('[API] Calling:', url)
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  } catch (err) {
    console.error('[API] Error calling', url, '-', err.message)
    throw err
  }
}

export const api = {
  // Auth
  driverLogin: (email, password) =>
    request('/auth/driver-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  driverRegister: (name, email, password, phone, license_number) =>
    request('/auth/driver-register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone, license_number }),
    }),

  // Driver
  updateDriverStatus: (driverId, status) =>
    request(`/drivers/${driverId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Bookings
  getDriverBookings: (driverId) =>
    request(`/bookings/driver/${driverId}`),

  updateBookingStatus: (bookingId, status) =>
    request('/bookings/status', {
      method: 'PUT',
      body: JSON.stringify({ booking_id: bookingId, status }),
    }),
}
