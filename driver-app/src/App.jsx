import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import MyRides from './pages/MyRides'
import RideDetail from './pages/RideDetail'

function ProtectedRoute({ children }) {
  const { driver, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
  if (!driver) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { driver, loading } = useAuth()
  if (loading) return null
  if (driver) return <Navigate to="/home" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/home"  element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/rides" element={<ProtectedRoute><MyRides /></ProtectedRoute>} />
          <Route path="/rides/:id" element={<ProtectedRoute><RideDetail /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
