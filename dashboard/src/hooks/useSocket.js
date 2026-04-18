import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

let sharedSocket = null

function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })
  }
  return sharedSocket
}

/**
 * Subscribe to one or more socket events.
 * handlers: { 'event:name': callbackFn, ... }
 */
export function useSocket(handlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const socket = getSocket()

    const wrapped = {}
    Object.keys(handlersRef.current).forEach(event => {
      wrapped[event] = (...args) => handlersRef.current[event]?.(...args)
      socket.on(event, wrapped[event])
    })

    return () => {
      Object.keys(wrapped).forEach(event => {
        socket.off(event, wrapped[event])
      })
    }
  }, [])
}
