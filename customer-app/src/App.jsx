import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Navbar     from './components/Navbar'
import Home       from './pages/Home'
import Login      from './pages/Login'
import Register   from './pages/Register'
import Booking    from './pages/Booking'
import MyBookings from './pages/MyBookings'

function PrivateRoute({ children, redirectTo = '/booking' }) {
  const { user } = useAuth()
  return user
    ? children
    : <Navigate to="/login" state={{ from: redirectTo }} replace />
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"           element={<Home />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/register"   element={<Register />} />
        <Route path="/booking"    element={<PrivateRoute redirectTo="/booking"><Booking /></PrivateRoute>} />
        <Route path="/my-bookings" element={<PrivateRoute redirectTo="/my-bookings"><MyBookings /></PrivateRoute>} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  )
}
