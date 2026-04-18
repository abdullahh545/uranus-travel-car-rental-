import React, { createContext, useContext, useState, useEffect } from 'react'
import { connectSocket, disconnectSocket } from '../services/socket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [driver, setDriver] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('driver_token')
    const storedDriver = localStorage.getItem('driver_data')
    if (storedToken && storedDriver) {
      const parsed = JSON.parse(storedDriver)
      setToken(storedToken)
      setDriver(parsed)
      // Re-connect socket after page reload
      connectSocket(parsed.id)
    }
    setLoading(false)
  }, [])

  function login(tokenValue, driverData) {
    localStorage.setItem('driver_token', tokenValue)
    localStorage.setItem('driver_data', JSON.stringify(driverData))
    setToken(tokenValue)
    setDriver(driverData)
    connectSocket(driverData.id)
  }

  function logout() {
    localStorage.removeItem('driver_token')
    localStorage.removeItem('driver_data')
    disconnectSocket()
    setToken(null)
    setDriver(null)
  }

  function updateDriverStatus(status) {
    const updated = { ...driver, status }
    setDriver(updated)
    localStorage.setItem('driver_data', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ driver, token, loading, login, logout, updateDriverStatus }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
