import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const titles = {
  '/':         { title: 'Dashboard',  sub: 'Overview & statistics' },
  '/bookings': { title: 'Bookings',   sub: 'All rides and their statuses' },
  '/drivers':  { title: 'Drivers',    sub: 'Driver fleet and availability' },
  '/vehicles': { title: 'Vehicles',   sub: 'Registered vehicle fleet' },
}

export default function Layout() {
  const { pathname } = useLocation()
  const { title, sub } = titles[pathname] ?? { title: 'Dashboard', sub: '' }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <header className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
          </div>
          <span className="topbar-badge">{sub}</span>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
