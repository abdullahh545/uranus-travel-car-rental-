import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SOCKET_URL = 'http://localhost:5000'

const STATUS_MESSAGES = {
  confirmed:   { title: 'Booking Confirmed',          icon: '✅', color: '#10b981' },
  in_progress: { title: 'Your Driver is On The Way',  icon: '🚗', color: '#7c5cfc' },
  arrived:     { title: 'Your Driver Has Arrived',    icon: '📍', color: '#f97316' },
  completed:   { title: 'Ride Completed',             icon: '🏁', color: '#22d3ee' },
}

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [notification, setNotification] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!user) return

    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] })

    socketRef.current.on('booking:status:update', (data) => {
      if (data.customer_id !== user.id) return
      const msg = STATUS_MESSAGES[data.status]
      if (!msg) return

      if (timerRef.current) clearTimeout(timerRef.current)
      setNotification({ ...msg, bookingId: data.booking_id })
      timerRef.current = setTimeout(() => setNotification(null), 5000)
    })

    return () => {
      socketRef.current?.disconnect()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [user])

  function dismissNotification() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setNotification(null)
  }

  return (
    <SocketContext.Provider value={{ notification }}>
      {children}
      {notification && (
        <div className="toast-notification" style={{ borderColor: notification.color }}>
          <span className="toast-icon">{notification.icon}</span>
          <div className="toast-body">
            <p className="toast-title">{notification.title}</p>
            <p className="toast-sub">Booking #{notification.bookingId}</p>
          </div>
          <button className="toast-close" onClick={dismissNotification}>✕</button>
        </div>
      )}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
