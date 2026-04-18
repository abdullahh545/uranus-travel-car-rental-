import { io } from 'socket.io-client'

let socket = null

export function connectSocket(driverId) {
  if (socket?.connected) return socket

  socket = io('http://localhost:5000', {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => {
    console.log('[socket] connected:', socket.id)
    socket.emit('driver:join', driverId)
  })

  socket.on('disconnect', () => {
    console.log('[socket] disconnected')
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket() {
  return socket
}

export function emitBookingStatus(bookingId, status, customerId) {
  if (socket?.connected) {
    socket.emit('booking:status', { booking_id: bookingId, status, user_id: customerId })
  }
}
