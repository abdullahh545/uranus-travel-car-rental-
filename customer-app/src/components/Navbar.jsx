import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  function handleLogout() {
    signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo">U</div>
        <span>Uranus Travel</span>
      </Link>

      <div className="navbar-links">
        <Link to="/" className={`nav-link${pathname === '/' ? ' active' : ''}`}>Home</Link>

        {user ? (
          <>
            <Link to="/booking"     className={`nav-link${pathname === '/booking'     ? ' active' : ''}`}>Book a Ride</Link>
            <Link to="/my-bookings" className={`nav-link${pathname === '/my-bookings' ? ' active' : ''}`}>My Bookings</Link>
            <div className="nav-user">
              <strong>{user.name?.split(' ')[0]}</strong>
              <button className="nav-logout" onClick={handleLogout}>Logout</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login"    className={`nav-link${pathname === '/login'    ? ' active' : ''}`}>Login</Link>
            <Link to="/register" className="nav-btn">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  )
}
