import { Routes, Route, Navigate } from 'react-router-dom'
import Layout    from './components/Layout'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'
import Bookings  from './pages/Bookings'
import Drivers   from './pages/Drivers'
import Vehicles  from './pages/Vehicles'

function PrivateRoute({ children }) {
  return localStorage.getItem('adminAuth') ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index        element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="drivers"  element={<Drivers />} />
        <Route path="vehicles" element={<Vehicles />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
